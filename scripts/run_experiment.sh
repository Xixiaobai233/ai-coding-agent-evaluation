#!/usr/bin/env bash
# ============================================================
# run_experiment.sh — 单次实验运行脚本
# 用法: ./run_experiment.sh <任务ID> <重复次数>
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DATA_DIR="$PROJECT_ROOT/data"
TASKS_DIR="$PROJECT_ROOT/tasks"

# --- 参数解析 ---
if [ $# -lt 2 ]; then
    echo "用法: $0 <任务ID> <重复次数>" >&2
    exit 1
fi

TASK_ID="$1"
REPEAT_COUNT="$2"
TASK_FILE="$TASKS_DIR/${TASK_ID}.md"

if [ ! -f "$TASK_FILE" ]; then
    echo "错误: 任务文件不存在: $TASK_FILE" >&2
    exit 1
fi

# --- 环境探测 ---
SYSTEM_INFO="$(uname -a 2>/dev/null || echo 'N/A')"
CLAUDE_VERSION="$(claude --version 2>/dev/null || echo 'N/A')"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "[$(date)] 开始实验: $TASK_ID, 重复 $REPEAT_COUNT 次"
echo "  Claude Code 版本: $CLAUDE_VERSION"
echo "  系统信息: $SYSTEM_INFO"

# --- 逐次运行 ---
for (( i=1; i<=REPEAT_COUNT; i++ )); do
    RUN_DIR="$DATA_DIR/${TASK_ID}/run_${i}"
    mkdir -p "$RUN_DIR"

    # 创建临时项目目录
    TEMP_PROJECT=$(mktemp -d "$RUN_DIR/project_XXXXXX")
    echo "[$(date)] Run $i/$REPEAT_COUNT — 临时项目: $TEMP_PROJECT"

    # 复制任务定义到临时项目
    cp "$TASK_FILE" "$TEMP_PROJECT/task.md"

    START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S%z")
    START_EPOCH=$(date +%s)

    # 启动 Claude Code 执行任务，保存 stdout + stderr
    claude "$TEMP_PROJECT/task.md" \
        --output "$TEMP_PROJECT" \
        > "$RUN_DIR/stdout.log" 2> "$RUN_DIR/stderr.log" \
        || true

    END_EPOCH=$(date +%s)
    END_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S%z")
    DURATION=$(( END_EPOCH - START_EPOCH ))

    # 收集输出
    if [ -d "$TEMP_PROJECT" ]; then
        cp -r "$TEMP_PROJECT"/* "$RUN_DIR/" 2>/dev/null || true
    fi

    # --- 验收测试 ---
    ACCEPTANCE_PASS=true
    ACCEPTANCE_DETAIL=""
    if [ -f "$TASKS_DIR/${TASK_ID}_check.sh" ]; then
        echo "[$(date)] 运行验收测试..."
        if bash "$TASKS_DIR/${TASK_ID}_check.sh" "$RUN_DIR"; then
            ACCEPTANCE_PASS=true
            ACCEPTANCE_DETAIL="pass"
        else
            ACCEPTANCE_PASS=false
            ACCEPTANCE_DETAIL="fail"
        fi
    else
        ACCEPTANCE_DETAIL="no-check-script"
    fi

    # 清理临时项目目录
    rm -rf "$TEMP_PROJECT"

    # --- 输出结果 JSON ---
    RESULT_FILE="$RUN_DIR/result.json"
    cat > "$RESULT_FILE" <<EOF
{
    "task_id": "$TASK_ID",
    "run": $i,
    "total_runs": $REPEAT_COUNT,
    "start_time": "$START_TIME",
    "end_time": "$END_TIME",
    "duration_seconds": $DURATION,
    "acceptance": $ACCEPTANCE_PASS,
    "acceptance_detail": "$ACCEPTANCE_DETAIL",
    "environment": {
        "claude_version": "$CLAUDE_VERSION",
        "system": "$SYSTEM_INFO",
        "timestamp": "$TIMESTAMP"
    }
}
EOF
    echo "[$(date)] Run $i 完成, 耗时 ${DURATION}s, 验收: $ACCEPTANCE_DETAIL"
done

# --- 汇总本实验所有 runs 的 JSON ---
SUMMARY_FILE="$DATA_DIR/${TASK_ID}/_summary.json"
python3 "$SCRIPT_DIR/collect_results.py" --task "$TASK_ID" --summary "$SUMMARY_FILE" 2>/dev/null || true

echo "[$(date)] 实验 $TASK_ID 全部完成, 共 $REPEAT_COUNT 次运行"
