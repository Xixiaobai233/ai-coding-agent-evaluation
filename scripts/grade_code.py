#!/usr/bin/env python3
"""
grade_code.py — 代码质量评分辅助工具

提供代码质量的客观度量:
  - 总行数 / 代码行数 / 注释行数 / 空白行数
  - 文件数
  - 圈复杂度 (cyclomatic complexity)
  - 测试覆盖率 (如存在覆盖率报告)
  - 圈复杂度分布直方摘要

输出 JSON 供评审者参考。

用法:
  python grade_code.py <项目目录>                    # 对项目进行评分
  python grade_code.py <项目目录> --coverage <coverage.xml>  # 合并覆盖率
  python grade_code.py <项目目录> --output result.json       # 指定输出路径
"""
import argparse
import json
import os
import re
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# 行数统计
# ---------------------------------------------------------------------------
def count_lines(paths: list[Path]) -> dict:
    """统计总行数、代码行、注释行、空白行。
    支持 .py, .js, .ts, .tsx, .jsx, .java, .c, .h, .cpp, .hpp, .go, .rs.
    """
    total = 0
    code = 0
    comment = 0
    blank = 0
    file_count = 0

    comment_re = re.compile(r"^\s*(#|//|/\*|\*|\*/|--)")

    for p in paths:
        if not p.is_file():
            continue
        file_count += 1
        try:
            text = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        lines = text.splitlines()
        total += len(lines)
        for line in lines:
            stripped = line.strip()
            if not stripped:
                blank += 1
            elif comment_re.match(stripped):
                comment += 1
            else:
                code += 1

    return {
        "file_count": file_count,
        "total_lines": total,
        "code_lines": code,
        "comment_lines": comment,
        "blank_lines": blank,
    }


# ---------------------------------------------------------------------------
# 圈复杂度 (简化版: 基于关键字统计)
# ---------------------------------------------------------------------------
COMPLEXITY_KEYWORDS = {
    ".py":   [r"\bif\b", r"\belif\b", r"\bfor\b", r"\bwhile\b", r"\band\b",
              r"\bor\b", r"\bexcept\b", r"\bwith\b", r"\bcase\b", r"\bassert\b"],
    ".js":   [r"\bif\b", r"\belse\b", r"\bfor\b", r"\bwhile\b", r"\bcase\b",
              r"\bcatch\b", r"\b\|\|\b", r"\b&&\b", r"\b\?\b"],
    ".ts":   [r"\bif\b", r"\belse\b", r"\bfor\b", r"\bwhile\b", r"\bcase\b",
              r"\bcatch\b", r"\b\|\|\b", r"\b&&\b", r"\b\?\b"],
    ".tsx":  [r"\bif\b", r"\belse\b", r"\bfor\b", r"\bwhile\b", r"\bcase\b",
              r"\bcatch\b", r"\b\|\|\b", r"\b&&\b", r"\b\?\b"],
    ".jsx":  [r"\bif\b", r"\belse\b", r"\bfor\b", r"\bwhile\b", r"\bcase\b",
              r"\bcatch\b", r"\b\|\|\b", r"\b&&\b", r"\b\?\b"],
    ".java": [r"\bif\b", r"\belse\b", r"\bfor\b", r"\bwhile\b", r"\bcase\b",
              r"\bcatch\b", r"\b\|\|\b", r"\b&&\b", r"\b\?\b"],
    ".go":   [r"\bif\b", r"\belse\b", r"\bfor\b", r"\bswitch\b", r"\bcase\b",
              r"\brange\b"],
    ".rs":   [r"\bif\b", r"\belse\b", r"\bfor\b", r"\bwhile\b", r"\bmatch\b",
              r"\bif let\b", r"\bwhile let\b"],
}


def compute_complexity(paths: list[Path]) -> dict:
    """计算文件数和复杂度分布。返回复杂度总和、平均复杂度、及分布。"""
    file_count = 0
    complexities: list[int] = []

    for p in paths:
        ext = p.suffix.lower()
        keywords = COMPLEXITY_KEYWORDS.get(ext)
        if not keywords:
            continue
        try:
            text = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        # 基础复杂度为 1
        cc = 1
        for kw in keywords:
            cc += len(re.findall(kw, text, re.MULTILINE))
        complexities.append(cc)
        file_count += 1

    if not complexities:
        return {"file_count": 0, "avg_complexity": 0.0, "max_complexity": 0,
                "total_complexity": 0, "distribution": {}}

    # 分布: low(1-5), moderate(6-10), high(11-20), very_high(21+)
    dist = {"low": 0, "moderate": 0, "high": 0, "very_high": 0}
    for cc in complexities:
        if cc <= 5:
            dist["low"] += 1
        elif cc <= 10:
            dist["moderate"] += 1
        elif cc <= 20:
            dist["high"] += 1
        else:
            dist["very_high"] += 1

    return {
        "file_count": file_count,
        "avg_complexity": round(sum(complexities) / len(complexities), 2),
        "max_complexity": max(complexities),
        "min_complexity": min(complexities),
        "total_complexity": sum(complexities),
        "distribution": dist,
    }


# ---------------------------------------------------------------------------
# 覆盖率解析 (cobertura XML)
# ---------------------------------------------------------------------------
def parse_coverage(xml_path: Path) -> dict | None:
    """解析 Cobertura 格式的覆盖率报告 (pytest-cov, gcovr, etc.)。"""
    if not xml_path.exists():
        return None

    try:
        import xml.etree.ElementTree as ET
        tree = ET.parse(xml_path)
        root = tree.getroot()
        coverage_attr = root.attrib
        line_rate = float(coverage_attr.get("line-rate", 0))
        branch_rate = float(coverage_attr.get("branch-rate", 0))
        lines_covered = 0
        lines_valid = 0
        for pkg in root.iter("package"):
            for cls in pkg.iter("class"):
                for lines in cls.iter("lines"):
                    for line in lines.iter("line"):
                        hits = int(line.attrib.get("hits", 0))
                        if hits > 0:
                            lines_covered += 1
                        lines_valid += 1
        return {
            "line_rate": round(line_rate, 4),
            "branch_rate": round(branch_rate, 4),
            "lines_covered": lines_covered,
            "lines_valid": lines_valid,
            "source_file": str(xml_path),
        }
    except Exception as e:
        print(f"[WARN] 解析覆盖率文件失败: {e}", file=sys.stderr)
        return None


# ---------------------------------------------------------------------------
# 主入口
# ---------------------------------------------------------------------------
def find_source_files(project_dir: Path, exclude_dirs: set[str] | None = None) -> list[Path]:
    """递归查找源代码文件 (排除常见非源码目录)。"""
    if exclude_dirs is None:
        exclude_dirs = {"node_modules", "__pycache__", ".git", ".venv",
                        "venv", "dist", "build", ".next", "target", "vendor"}

    source_exts = {".py", ".js", ".ts", ".tsx", ".jsx", ".java",
                   ".c", ".h", ".cpp", ".hpp", ".go", ".rs"}
    files = []
    for root, dirs, names in os.walk(project_dir):
        # 原地排除目录
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for name in names:
            ext = Path(name).suffix.lower()
            if ext in source_exts:
                files.append(Path(root) / name)
    return files


def main():
    parser = argparse.ArgumentParser(description="代码质量评分辅助工具")
    parser.add_argument("project_dir", type=str, help="待评分的项目目录")
    parser.add_argument("--coverage", type=str, default=None,
                        help="Cobertura XML 覆盖率报告路径")
    parser.add_argument("--output", type=str, default=None,
                        help="输出 JSON 路径 (默认 stdout)")
    args = parser.parse_args()

    project_dir = Path(args.project_dir).resolve()
    if not project_dir.is_dir():
        print(f"错误: 目录不存在: {project_dir}", file=sys.stderr)
        sys.exit(1)

    print(f"[INFO] 评分项目: {project_dir}")

    source_files = find_source_files(project_dir)
    print(f"[INFO] 发现 {len(source_files)} 个源文件")

    # 行数统计
    line_stats = count_lines(source_files)
    print(f"[INFO] 总行数: {line_stats['total_lines']}, "
          f"代码: {line_stats['code_lines']}, "
          f"注释: {line_stats['comment_lines']}")

    # 圈复杂度
    complexity = compute_complexity(source_files)
    print(f"[INFO] 平均圈复杂度: {complexity['avg_complexity']}, "
          f"最大: {complexity['max_complexity']}")

    # 覆盖率
    coverage = None
    if args.coverage:
        cov_path = Path(args.coverage)
        coverage = parse_coverage(cov_path)
        if coverage:
            print(f"[INFO] 行覆盖率: {coverage['line_rate']:.2%}")
        else:
            print(f"[WARN] 覆盖率报告解析失败: {cov_path}", file=sys.stderr)

    # 组装输出
    result = {
        "project_dir": str(project_dir),
        "lines": line_stats,
        "complexity": complexity,
        "coverage": coverage,
    }

    output_json = json.dumps(result, ensure_ascii=False, indent=2)

    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(output_json, encoding="utf-8")
        print(f"[INFO] 评分结果已写入: {out_path}")
    else:
        print("\n=== 评分结果 ===")
        print(output_json)


if __name__ == "__main__":
    main()
