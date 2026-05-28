#!/usr/bin/env python3
"""
generate_charts.py — Claude Code 实证研究图表生成脚本

功能：
1. 箱线图：各任务类型耗时分布（分组）
2. 条形图：成功率对比（Claude Code vs 基线）
3. 散点图：复杂度 vs 耗时（含回归线）

输出：paper/figures/ 下的 PNG 文件（300 DPI，出版级质量）

用法：
    python generate_charts.py --input ../data/experiment_results.csv
    python generate_charts.py --input ../data/experiment_results.csv --output-dir ../paper/figures
"""

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # 无头渲染（服务器环境）
import matplotlib.pyplot as plt
import seaborn as sns


# =========================================================================
# 全局样式设置
# =========================================================================

def setup_style():
    """设置出版级图表样式。"""
    plt.rcParams.update({
        "font.family": "sans-serif",
        "font.sans-serif": ["DejaVu Sans", "Arial", "Helvetica", "sans-serif"],
        "font.size": 11,
        "axes.titlesize": 13,
        "axes.labelsize": 12,
        "xtick.labelsize": 10,
        "ytick.labelsize": 10,
        "legend.fontsize": 10,
        "figure.dpi": 150,
        "savefig.dpi": 300,
        "savefig.bbox": "tight",
        "savefig.pad_inches": 0.1,
    })
    sns.set_style("whitegrid")


# =========================================================================
# 自定义调色板
# =========================================================================

CLAUDE_PALETTE = ["#6B4FA0", "#4A90D9"]  # 紫色 = Claude Code, 蓝色 = 基线
TASK_TYPE_PALETTE = sns.color_palette("husl", 5)
COMPLEXITY_PALETTE = sns.color_palette("YlOrRd", 5)


# =========================================================================
# 图表 1：箱线图 — 各任务类型耗时分布
# =========================================================================

def plot_time_by_task_type(
    df: pd.DataFrame,
    output_dir: Path,
    filename: str = "fig1_time_by_tasktype.png",
):
    """分组箱线图：x=任务类型, y=耗时(秒), hue=条件。

    重叠半透明散点（strip plot）展示数据分布。
    """
    fig, ax = plt.subplots(figsize=(10, 6))

    order = sorted(df["task_type"].unique())
    sns.boxplot(
        data=df,
        x="task_type",
        y="time_taken",
        hue="condition",
        palette=CLAUDE_PALETTE,
        order=order,
        width=0.6,
        linewidth=1.2,
        ax=ax,
    )
    sns.stripplot(
        data=df,
        x="task_type",
        y="time_taken",
        hue="condition",
        palette=CLAUDE_PALETTE,
        order=order,
        dodge=True,
        size=4,
        alpha=0.5,
        jitter=0.2,
        ax=ax,
    )

    # 去掉重复图例
    handles, labels = ax.get_legend_handles_labels()
    unique = dict(zip(labels, handles))
    ax.legend(
        unique.values(), unique.keys(),
        title="Condition", frameon=True,
    )

    ax.set_xlabel("Task Type")
    ax.set_ylabel("Time Taken (seconds)")
    ax.set_title("Distribution of Time Taken by Task Type and Condition")

    output_path = output_dir / filename
    fig.savefig(output_path)
    plt.close(fig)
    print(f"[信息] 已保存: {output_path.resolve()}")


# =========================================================================
# 图表 2：条形图 — 成功率对比
# =========================================================================

def plot_success_rate(
    df: pd.DataFrame,
    output_dir: Path,
    filename: str = "fig2_success_rate.png",
):
    """分组条形图：x=任务类型, y=成功率, hue=条件。

    在柱顶标注具体数值和样本量。
    """
    fig, ax = plt.subplots(figsize=(10, 6))

    # 计算成功率
    rate_df = (
        df.groupby(["task_type", "condition"])["success"]
        .agg(["mean", "count"])
        .reset_index()
    )
    rate_df["mean"] = rate_df["mean"] * 100  # 转为百分比
    rate_df.columns = ["task_type", "condition", "success_rate", "n"]

    order = sorted(df["task_type"].unique())
    bar = sns.barplot(
        data=rate_df,
        x="task_type",
        y="success_rate",
        hue="condition",
        palette=CLAUDE_PALETTE,
        order=order,
        ax=ax,
    )

    # 柱顶标注
    for i, patch in enumerate(bar.patches):
        height = patch.get_height()
        if height == 0:
            continue
        ax.text(
            patch.get_x() + patch.get_width() / 2.0,
            height + 1.5,
            f"{height:.0f}%",
            ha="center", va="bottom", fontsize=9, fontweight="bold",
        )

    ax.set_ylim(0, 110)
    ax.set_xlabel("Task Type")
    ax.set_ylabel("Success Rate (%)")
    ax.set_title("Success Rate by Task Type and Condition")
    ax.legend(title="Condition", frameon=True)

    output_path = output_dir / filename
    fig.savefig(output_path)
    plt.close(fig)
    print(f"[信息] 已保存: {output_path.resolve()}")


# =========================================================================
# 图表 3：散点图 — 复杂度 vs 耗时（含回归线）
# =========================================================================

def plot_complexity_vs_time(
    df: pd.DataFrame,
    output_dir: Path,
    filename: str = "fig3_complexity_vs_time.png",
):
    """散点图 + 回归线：x=复杂度, y=耗时(秒), hue=条件。

    使用 seaborn lmplot 实现。
    """
    # 确保复杂度为数值
    complexity_map = {"low": 1, "medium": 2, "high": 3}
    if df["complexity"].dtype == object:
        df = df.copy()
        df["complexity_num"] = df["complexity"].map(complexity_map)
    else:
        df["complexity_num"] = df["complexity"]

    g = sns.lmplot(
        data=df,
        x="complexity_num",
        y="time_taken",
        hue="condition",
        palette=CLAUDE_PALETTE,
        ci=95,
        scatter_kws={"alpha": 0.6, "s": 50},
        line_kws={"linewidth": 2},
        height=6,
        aspect=1.5,
    )

    g.set_axis_labels("Complexity (1-5)", "Time Taken (seconds)")
    g.fig.suptitle("Complexity vs Time Taken by Condition", y=1.02)
    g._legend.set_title("Condition")

    output_path = output_dir / filename
    g.savefig(output_path)
    plt.close(g.fig)
    print(f"[信息] 已保存: {output_path.resolve()}")


# =========================================================================
# 可选的辅助图
# =========================================================================

def plot_tokens_boxplot(
    df: pd.DataFrame,
    output_dir: Path,
    filename: str = "fig4_tokens_by_tasktype.png",
):
    """附加图：各任务类型 token 消耗分布。"""
    fig, ax = plt.subplots(figsize=(10, 6))

    order = sorted(df["task_type"].unique())
    sns.boxplot(
        data=df,
        x="task_type",
        y="tokens_used",
        hue="condition",
        palette=CLAUDE_PALETTE,
        order=order,
        ax=ax,
    )

    ax.set_xlabel("Task Type")
    ax.set_ylabel("Tokens Used")
    ax.set_title("Token Consumption by Task Type and Condition")
    ax.legend(title="Condition", frameon=True)

    output_path = output_dir / filename
    fig.savefig(output_path)
    plt.close(fig)
    print(f"[信息] 已保存: {output_path.resolve()}")


def plot_turns_boxplot(
    df: pd.DataFrame,
    output_dir: Path,
    filename: str = "fig5_turns_by_tasktype.png",
):
    """附加图：各任务类型交互轮数分布。"""
    fig, ax = plt.subplots(figsize=(10, 6))

    order = sorted(df["task_type"].unique())
    sns.boxplot(
        data=df,
        x="task_type",
        y="num_turns",
        hue="condition",
        palette=CLAUDE_PALETTE,
        order=order,
        ax=ax,
    )

    ax.set_xlabel("Task Type")
    ax.set_ylabel("Number of Turns")
    ax.set_title("Interaction Turns by Task Type and Condition")
    ax.legend(title="Condition", frameon=True)

    output_path = output_dir / filename
    fig.savefig(output_path)
    plt.close(fig)
    print(f"[信息] 已保存: {output_path.resolve()}")


# =========================================================================
# 主入口
# =========================================================================

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Claude Code 实证研究图表生成脚本",
    )
    parser.add_argument(
        "--input", "-i",
        type=str,
        default="../data/experiment_results.csv",
        help="输入 CSV 文件路径",
    )
    parser.add_argument(
        "--output-dir", "-o",
        type=str,
        default="../paper/figures",
        help="图表输出目录",
    )
    parser.add_argument(
        "--all", "-a",
        action="store_true",
        default=True,
        help="生成所有图表（默认）",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"[错误] 输入文件不存在: {input_path.resolve()}", file=sys.stderr)
        sys.exit(1)

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(input_path)
    print(f"[信息] 已加载 {len(df)} 条记录 from {input_path.resolve()}")

    # 校验
    required_cols = {"task_type", "complexity", "condition", "success",
                     "time_taken"}
    missing = required_cols - set(df.columns)
    if missing:
        print(f"[错误] 缺少必要列: {missing}", file=sys.stderr)
        sys.exit(1)

    df["condition"] = df["condition"].str.lower()

    setup_style()

    print("\n[信息] 开始生成图表...\n")

    plot_time_by_task_type(df, output_dir)
    plot_success_rate(df, output_dir)
    plot_complexity_vs_time(df, output_dir)
    plot_tokens_boxplot(df, output_dir)
    plot_turns_boxplot(df, output_dir)

    print(f"\n[完成] 共生成 5 张图表到目录: {output_dir.resolve()}")


if __name__ == "__main__":
    main()
