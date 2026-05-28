#!/usr/bin/env python3
"""
collect_results.py — 实验结果收集与汇总

功能:
  - 扫描 ../data/ 目录下所有实验结果
  - 汇总为 CSV 文件
  - 计算每项任务的成功率、平均耗时等统计量

用法:
  python collect_results.py                          # 扫描全部任务
  python collect_results.py --task <TASK_ID>          # 仅扫描指定任务
  python collect_results.py --summary <OUTPUT_JSON>  # 输出汇总 JSON
"""
import argparse
import csv
import json
import os
import sys
from collections import defaultdict
from pathlib import Path
from datetime import datetime


def find_result_dirs(data_dir: Path) -> list[tuple[str, int, Path]]:
    """扫描 data_dir 下所有 run_N/result.json，返回 (task_id, run_num, path) 列表。"""
    results = []
    if not data_dir.exists():
        return results
    for task_dir in data_dir.iterdir():
        if not task_dir.is_dir():
            continue
        task_id = task_dir.name
        for run_dir in sorted(task_dir.iterdir()):
            if not run_dir.is_dir() or not run_dir.name.startswith("run_"):
                continue
            run_num_str = run_dir.name.removeprefix("run_")
            if not run_num_str.isdigit():
                continue
            run_num = int(run_num_str)
            result_file = run_dir / "result.json"
            if result_file.exists():
                results.append((task_id, run_num, result_file))
    return results


def load_result(path: Path) -> dict | None:
    """加载单条 result.json，返回 dict 或 None。"""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        print(f"[WARN] 无法解析 {path}: {e}", file=sys.stderr)
        return None


def compute_stats(records: list[dict]) -> dict:
    """计算一组实验记录的汇总统计量。"""
    n = len(records)
    if n == 0:
        return {
            "total_runs": 0,
            "success_count": 0,
            "success_rate": 0.0,
            "avg_duration": 0.0,
            "median_duration": 0.0,
            "min_duration": 0,
            "max_duration": 0,
            "total_duration": 0,
        }

    durations = sorted(r.get("duration_seconds", 0) or 0 for r in records)
    successes = sum(1 for r in records if r.get("acceptance") is True)

    n = len(durations)
    if n % 2 == 1:
        median = float(durations[n // 2])
    else:
        median = (durations[n // 2 - 1] + durations[n // 2]) / 2.0

    return {
        "total_runs": n,
        "success_count": successes,
        "success_rate": round(successes / n, 4),
        "avg_duration": round(sum(durations) / n, 2),
        "median_duration": round(median, 2),
        "min_duration": durations[0],
        "max_duration": durations[-1],
        "total_duration": sum(durations),
    }


def write_csv(records: list[dict], output_path: Path):
    """将记录写入 CSV 文件。"""
    if not records:
        print("[WARN] 无记录可写入 CSV", file=sys.stderr)
        return

    fieldnames = [
        "task_id", "run", "start_time", "end_time",
        "duration_seconds", "acceptance", "acceptance_detail",
    ]
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for rec in records:
            row = {k: rec.get(k, "") for k in fieldnames}
            row["acceptance"] = str(rec.get("acceptance", ""))
            writer.writerow(row)
    print(f"[INFO] CSV 已写入: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="实验结果收集与汇总")
    parser.add_argument("--task", type=str, default=None, help="限定任务 ID")
    parser.add_argument("--summary", type=str, default=None, help="任务级汇总 JSON 输出路径")
    parser.add_argument("--data-dir", type=str, default=None, help="data 目录路径 (默认 ../data)")
    args = parser.parse_args()

    # 确定 data 目录
    script_dir = Path(__file__).resolve().parent
    data_dir = Path(args.data_dir) if args.data_dir else (script_dir / ".." / "data")
    data_dir = data_dir.resolve()

    print(f"[INFO] 扫描目录: {data_dir}")

    raw_results = find_result_dirs(data_dir)
    print(f"[INFO] 发现 {len(raw_results)} 个结果文件")

    # 筛选指定任务
    if args.task:
        raw_results = [(tid, rn, p) for tid, rn, p in raw_results if tid == args.task]
        print(f"[INFO] 筛选后剩余 {len(raw_results)} 个 (task={args.task})")

    if not raw_results:
        print("[WARN] 没有找到任何实验结果", file=sys.stderr)
        return

    # 加载所有 JSON
    records: list[dict] = []
    for task_id, run_num, path in raw_results:
        rec = load_result(path)
        if rec:
            records.append(rec)

    if not records:
        print("[WARN] 没有有效记录", file=sys.stderr)
        return

    # 按任务分组
    grouped: dict[str, list[dict]] = defaultdict(list)
    for rec in records:
        grouped[rec.get("task_id", "unknown")].append(rec)

    # 写出完整 CSV
    csv_path = data_dir / "_all_results.csv"
    write_csv(records, csv_path)

    # 计算每项任务的统计量并打印
    print("\n=== 各任务统计 ===")
    overall_successes = 0
    overall_total = 0
    for task_id in sorted(grouped):
        stats = compute_stats(grouped[task_id])
        overall_successes += stats["success_count"]
        overall_total += stats["total_runs"]
        print(f"\n[任务: {task_id}]")
        print(f"  总运行次数: {stats['total_runs']}")
        print(f"  成功次数:   {stats['success_count']}")
        print(f"  成功率:     {stats['success_rate']:.2%}")
        print(f"  平均耗时:   {stats['avg_duration']}s")
        print(f"  中位耗时:   {stats['median_duration']}s")
        print(f"  最短耗时:   {stats['min_duration']}s")
        print(f"  最长耗时:   {stats['max_duration']}s")
        print(f"  总耗时:     {stats['total_duration']}s")

    # 总体统计
    if overall_total > 0:
        print(f"\n=== 总体统计 ===")
        print(f"  总运行次数: {overall_total}")
        print(f"  总成功次数: {overall_successes}")
        print(f"  总成功率:   {overall_successes/overall_total:.2%}")

    # 输出任务级汇总 JSON
    if args.summary:
        summary_path = Path(args.summary)
        summary_data = {}
        for task_id in sorted(grouped):
            stats = compute_stats(grouped[task_id])
            summary_data[task_id] = stats
        summary_path.parent.mkdir(parents=True, exist_ok=True)
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(summary_data, f, ensure_ascii=False, indent=2)
        print(f"\n[INFO] 汇总 JSON 已写入: {summary_path}")


if __name__ == "__main__":
    main()
