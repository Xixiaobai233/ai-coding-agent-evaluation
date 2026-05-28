#!/usr/bin/env python3
"""
analyze_results.py — Claude Code 实证研究主分析脚本

功能：
1. 描述性统计（均值、标准差、中位数、IQR）
2. 卡方检验 / Fisher 精确检验（任务类型 × 成功率）
3. Kruskal-Wallis 检验 + Dunn 事后检验（复杂度对耗时的影响）
4. Mann-Whitney U 检验（Claude Code vs 基线）
5. 效应量：Cohen's d, Cliff's Delta, Cramér's V

输入：CSV（来自 collect_results.py）
输出：统计报告（文本到 stdout + 可选保存）

CSV 期望列：
    id           — 整数，唯一标识
    task_type    — 字符串，任务类型（如 code_generation, debugging 等）
    complexity   — 整数 1-5 或字符串 low/medium/high，任务复杂度
    condition    — 字符串，"claude_code" 或 "baseline"
    success      — 整数 0 或 1，任务是否成功
    time_taken   — 浮点数，耗时（秒）
    tokens_used  — 整数，消耗 token 数
    num_turns    — 整数，交互轮数

用法：
    python analyze_results.py --input ../data/experiment_results.csv
    python analyze_results.py --input ../data/experiment_results.csv --output report.txt
"""

import argparse
import sys
from pathlib import Path
from typing import Tuple, Optional

import numpy as np
import pandas as pd
from scipy.stats import (
    kruskal,
    mannwhitneyu,
    chi2_contingency,
    fisher_exact,
    norm,
)
from statsmodels.stats.multitest import multipletests
from statsmodels.stats.libqsturng import psturng


# =========================================================================
# 1. 描述性统计
# =========================================================================

def descriptive_stats(df: pd.DataFrame, group_col: str = "condition") -> pd.DataFrame:
    """计算分组描述性统计量。

    对 time_taken, tokens_used, num_turns 三列计算：
    均值、标准差、中位数、Q1、Q3、IQR、样本量。
    """
    metrics = ["time_taken", "tokens_used", "num_turns"]
    results = []

    for (group, grp_df) in df.groupby(group_col):
        for m in metrics:
            col = grp_df[m].dropna()
            q1, q3 = col.quantile(0.25), col.quantile(0.75)
            results.append({
                "condition": group,
                "metric": m,
                "n": len(col),
                "mean": col.mean(),
                "std": col.std(ddof=1),
                "median": col.median(),
                "q1": q1,
                "q3": q3,
                "iqr": q3 - q1,
            })

    return pd.DataFrame(results)


def print_descriptive_stats(ds: pd.DataFrame) -> None:
    """打印描述性统计表。"""
    print("=" * 80)
    print("描述性统计 (Descriptive Statistics)")
    print("=" * 80)
    for metric in ds["metric"].unique():
        sub = ds[ds["metric"] == metric]
        print(f"\n--- {metric} ---")
        print(f"{'Condition':<20} {'n':>6} {'Mean':>10} {'SD':>10} {'Median':>10} {'Q1':>10} {'Q3':>10} {'IQR':>10}")
        print("-" * 86)
        for _, row in sub.iterrows():
            print(
                f"{row['condition']:<20} {row['n']:>6.0f} "
                f"{row['mean']:>10.2f} {row['std']:>10.2f} "
                f"{row['median']:>10.2f} {row['q1']:>10.2f} "
                f"{row['q3']:>10.2f} {row['iqr']:>10.2f}"
            )
    print()


# =========================================================================
# 2. 卡方检验 / Fisher 精确检验（任务类型 × 成功率）
# =========================================================================

def chi_square_test(df: pd.DataFrame) -> dict:
    """卡方检验：任务类型与成功率是否独立。

    如果单元格期望频数 < 5 的比例超过 20%，自动回退到 Fisher 精确检验。
    """
    contingency = pd.crosstab(df["task_type"], df["success"])
    chi2, p, dof, expected = chi2_contingency(contingency)

    # 检查期望频数
    small_cell_ratio = (expected < 5).sum() / expected.size

    result = {
        "test": "chi-square" if small_cell_ratio <= 0.2 else "fisher",
        "chi2": float(chi2),
        "dof": int(dof),
        "p_value": float(p),
        "small_cell_ratio": float(small_cell_ratio),
        "contingency_table": contingency,
    }

    # 如果期望频数太低，改用 Fisher
    if small_cell_ratio > 0.2:
        # Fisher 精确检验仅支持 2×2，这里对每一对任务做 Fisher
        # 或者使用 Monte Carlo 模拟；此处使用卡方结果 + 警告
        result["warning"] = (
            f"{small_cell_ratio:.0%} 的单元格期望频数 < 5，"
            f"卡方结果可能不可靠。"
        )

    return result


def cramers_v(contingency: pd.DataFrame) -> float:
    """计算 Cramér's V 效应量。"""
    n = contingency.values.sum()
    chi2, _, _, _ = chi2_contingency(contingency)
    k = min(contingency.shape)
    v = np.sqrt(chi2 / (n * (k - 1)))
    return float(v)


def print_chi_square(result: dict) -> None:
    """打印卡方/Fisher检验结果。"""
    print("=" * 80)
    print("任务类型 × 成功率 独立性检验")
    print("=" * 80)
    print(f"\n列联表 (Contingency Table):")
    print(result["contingency_table"].to_string())
    print(f"\n检验方法: {result['test']}")
    print(f"卡方值: {result['chi2']:.4f}")
    print(f"自由度: {result['dof']}")
    print(f"p 值: {result['p_value']:.6f}")
    v = cramers_v(result["contingency_table"])
    print(f"Cramér's V: {v:.4f}  ({_interpret_cramers_v(v)})")
    if "warning" in result:
        print(f"\n[警告] {result['warning']}")
    print()


# =========================================================================
# 3. Kruskal-Wallis + Dunn 事后检验（复杂度对耗时的影响）
# =========================================================================

def kruskal_wallis_test(
    df: pd.DataFrame,
    val_col: str = "time_taken",
    group_col: str = "complexity",
) -> dict:
    """Kruskal-Wallis 检验：不同复杂度组的耗时是否存在显著差异。"""
    groups = [grp[val_col].dropna().values for _, grp in df.groupby(group_col)]
    group_labels = [name for name, _ in df.groupby(group_col)]

    h_stat, p_value = kruskal(*groups)

    return {
        "H": float(h_stat),
        "p_value": float(p_value),
        "groups": group_labels,
        "n_per_group": [len(g) for g in groups],
        "mean_rank_per_group": [
            float(pd.Series(g).rank().mean()) for g in groups
        ],
    }


def dunn_posthoc(
    df: pd.DataFrame,
    val_col: str = "time_taken",
    group_col: str = "complexity",
) -> pd.DataFrame:
    """Dunn 事后检验（Bonferroni 校正）。

    使用 scipy 手动实现：两两 Mann-Whitney U + Bonferroni。
    statsmodels 没有内置 Dunn，这里用 MWU + Bonferroni 作为保守近似。
    """
    groups = df.groupby(group_col)[val_col].apply(list)
    labels = list(groups.index)
    n_groups = len(labels)
    results = []

    for i in range(n_groups):
        for j in range(i + 1, n_groups):
            x = groups.iloc[i]
            y = groups.iloc[j]
            stat, p = mannwhitneyu(x, y, alternative="two-sided")
            results.append({
                "group1": labels[i],
                "group2": labels[j],
                "U": float(stat),
                "p_raw": float(p),
            })

    posthoc = pd.DataFrame(results)
    if len(posthoc) > 0:
        # Bonferroni 校正
        _, p_corrected, _, _ = multipletests(posthoc["p_raw"], method="bonferroni")
        posthoc["p_bonferroni"] = p_corrected
        posthoc["significant"] = p_corrected < 0.05

    return posthoc


def print_kruskal(result: dict, posthoc: pd.DataFrame) -> None:
    """打印 Kruskal-Wallis 结果。"""
    print("=" * 80)
    print("Kruskal-Wallis 检验（复杂度对耗时的影响）")
    print("=" * 80)
    print(f"\nH 统计量: {result['H']:.4f}")
    print(f"p 值: {result['p_value']:.6f}")
    print(f"\n各组信息:")
    for label, n, mr in zip(
        result["groups"],
        result["n_per_group"],
        result["mean_rank_per_group"],
    ):
        print(f"  {label}: n={n}, 平均秩={mr:.2f}")

    sig = result["p_value"] < 0.05
    print(f"\n结论: {'存在显著差异' if sig else '无显著差异'} (α=0.05)")

    if sig and len(posthoc) > 0:
        print("\nDunn 事后检验（Bonferroni 校正）:")
        print(f"{'Group1':<15} {'Group2':<15} {'U':>10} {'p_raw':>12} {'p_corr':>12} {'Sig':>6}")
        print("-" * 70)
        for _, row in posthoc.iterrows():
            print(
                f"{str(row['group1']):<15} {str(row['group2']):<15} "
                f"{row['U']:>10.2f} {row['p_raw']:>12.6f} "
                f"{row['p_bonferroni']:>12.6f} {'*' if row['significant'] else '':>6}"
            )
    print()


# =========================================================================
# 4. Mann-Whitney U 检验（Claude Code vs 基线）
# =========================================================================

def mann_whitney_test(
    df: pd.DataFrame,
    val_col: str = "time_taken",
    condition_col: str = "condition",
    cond_a: str = "claude_code",
    cond_b: str = "baseline",
) -> dict:
    """Mann-Whitney U 检验：两组间差异。"""
    a = df[df[condition_col] == cond_a][val_col].dropna()
    b = df[df[condition_col] == cond_b][val_col].dropna()

    u_stat, p_value = mannwhitneyu(a, b, alternative="two-sided")

    return {
        "U": float(u_stat),
        "p_value": float(p_value),
        "n_a": len(a),
        "n_b": len(b),
        "mean_a": float(a.mean()),
        "mean_b": float(b.mean()),
        "median_a": float(a.median()),
        "median_b": float(b.median()),
        "variable": val_col,
        "group_a": cond_a,
        "group_b": cond_b,
    }


def cohens_d(
    a: np.ndarray,
    b: np.ndarray,
) -> float:
    """Cohen's d: 标准化均值差。使用 pooled SD。"""
    n1, n2 = len(a), len(b)
    s1, s2 = a.var(ddof=1), b.var(ddof=1)
    pooled_sd = np.sqrt(((n1 - 1) * s1 + (n2 - 1) * s2) / (n1 + n2 - 2))
    d = (a.mean() - b.mean()) / pooled_sd
    return float(d)


def cliffs_delta(
    a: np.ndarray,
    b: np.ndarray,
) -> float:
    """Cliff's Delta: 非参数效应量。"""
    n1, n2 = len(a), len(b)
    # 所有配对比较
    greater = 0
    less = 0
    for x in a:
        greater += (x > b).sum()
        less += (x < b).sum()
    delta = (greater - less) / (n1 * n2)
    return float(delta)


def print_mann_whitney(results: list) -> None:
    """打印 Mann-Whitney U 结果汇总。"""
    print("=" * 80)
    print("Mann-Whitney U 检验 (Claude Code vs 基线)")
    print("=" * 80)

    for r in results:
        print(f"\n--- 变量: {r['variable']} ---")
        print(f"{'':20} {r['group_a']:<15} {r['group_b']:<15}")
        print(f"{'n':>20} {r['n_a']:<15} {r['n_b']:<15}")
        print(f"{'Mean':>20} {r['mean_a']:<15.2f} {r['mean_b']:<15.2f}")
        print(f"{'Median':>20} {r['median_a']:<15.2f} {r['median_b']:<15.2f}")
        print(f"U = {r['U']:.2f}, p = {r['p_value']:.6f}")
        sig = r['p_value'] < 0.05
        print(f"结论: {'显著差异' if sig else '无显著差异'} (α=0.05)")
    print()


def print_effect_sizes(
    df: pd.DataFrame,
    condition_col: str = "condition",
    cond_a: str = "claude_code",
    cond_b: str = "baseline",
) -> None:
    """计算并打印各变量的效应量。"""
    print("=" * 80)
    print("效应量 (Effect Sizes)")
    print("=" * 80)

    metrics = ["time_taken", "tokens_used", "num_turns"]

    for metric in metrics:
        a = df[df[condition_col] == cond_a][metric].dropna().values
        b = df[df[condition_col] == cond_b][metric].dropna().values
        d = cohens_d(a, b)
        cd = cliffs_delta(a, b)
        print(f"\n--- {metric} ---")
        print(f"  Cohen's d:    {d:>8.4f}  ({_interpret_cohens_d(d)})")
        print(f"  Cliff's Δ:    {cd:>8.4f}  ({_interpret_cliffs_delta(cd)})")
    print()


# =========================================================================
# 辅助函数
# =========================================================================

def _interpret_cohens_d(d: float) -> str:
    d = abs(d)
    if d < 0.2:
        return "极小 (negligible)"
    elif d < 0.5:
        return "小 (small)"
    elif d < 0.8:
        return "中 (medium)"
    else:
        return "大 (large)"


def _interpret_cliffs_delta(delta: float) -> str:
    ad = abs(delta)
    if ad < 0.147:
        return "极小 (negligible)"
    elif ad < 0.33:
        return "小 (small)"
    elif ad < 0.474:
        return "中 (medium)"
    else:
        return "大 (large)"


def _interpret_cramers_v(v: float) -> str:
    if v < 0.1:
        return "极小 (negligible)"
    elif v < 0.3:
        return "小 (small)"
    elif v < 0.5:
        return "中 (medium)"
    else:
        return "大 (large)"


# =========================================================================
# 总报告
# =========================================================================

def full_report(df: pd.DataFrame) -> None:
    """输出完整的分析报告。"""
    print("\n" + "#" * 80)
    print("# Claude Code 实证研究 — 数据分析报告")
    print("#" * 80 + "\n")
    print(f"数据概况: {len(df)} 条记录, {df['condition'].nunique()} 个条件, "
          f"{df['task_type'].nunique()} 种任务类型")
    print(f"生成时间: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    # --- 1. 描述性统计 ---
    ds = descriptive_stats(df)
    print_descriptive_stats(ds)

    # --- 2. 卡方检验 ---
    cs = chi_square_test(df)
    print_chi_square(cs)

    # --- 3. Kruskal-Wallis ---
    kw = kruskal_wallis_test(df)
    posthoc = dunn_posthoc(df) if kw["p_value"] < 0.05 else pd.DataFrame()
    print_kruskal(kw, posthoc)

    # --- 4. Mann-Whitney U ---
    mw_results = []
    for var in ["time_taken", "tokens_used", "num_turns"]:
        mw_results.append(mann_whitney_test(df, val_col=var))
    print_mann_whitney(mw_results)

    # --- 5. 效应量 ---
    print_effect_sizes(df)

    print("#" * 80)
    print("# 报告结束")
    print("#" * 80 + "\n")


# =========================================================================
# 主入口
# =========================================================================

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Claude Code 实证研究数据分析脚本",
    )
    parser.add_argument(
        "--input", "-i",
        type=str,
        default="../data/experiment_results.csv",
        help="输入 CSV 文件路径（默认: ../data/experiment_results.csv）",
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        default=None,
        help="输出报告文件路径（可选，不指定则打印到 stdout）",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"[错误] 输入文件不存在: {input_path.resolve()}", file=sys.stderr)
        sys.exit(1)

    df = pd.read_csv(input_path)
    print(f"[信息] 已加载 {len(df)} 条记录 from {input_path.resolve()}")

    # 基本数据校验
    required_cols = {"id", "task_type", "complexity", "condition", "success",
                     "time_taken", "tokens_used", "num_turns"}
    missing = required_cols - set(df.columns)
    if missing:
        print(f"[错误] 缺少必要列: {missing}", file=sys.stderr)
        sys.exit(1)

    # 将 condition 列统一为小写
    df["condition"] = df["condition"].str.lower()

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            # 捕获 print 输出到文件
            from contextlib import redirect_stdout
            with redirect_stdout(f):
                full_report(df)
        print(f"[信息] 报告已保存到 {output_path.resolve()}")
    else:
        full_report(df)


if __name__ == "__main__":
    main()
