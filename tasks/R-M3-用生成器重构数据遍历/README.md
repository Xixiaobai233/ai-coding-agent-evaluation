# 用生成器重构数据遍历

## 任务描述

我有一个处理大型日志文件的脚本，一次性把所有数据读到内存里，导致内存占用极高，经常 OOM。而且遍历逻辑分散在各处，重复代码很多。帮我用 Python 生成器（generator）重构它。

## 当前代码

```python
import json
import glob
from datetime import datetime


class LogProcessor:
    def __init__(self, log_dir: str):
        self.log_dir = log_dir

    def load_all_logs(self) -> list:
        """一次性加载所有日志到内存"""
        all_logs = []
        for filepath in glob.glob(f"{self.log_dir}/**/*.log", recursive=True):
            with open(filepath, "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        log = json.loads(line.strip())
                        all_logs.append(log)
                    except json.JSONDecodeError:
                        continue
        return all_logs

    def filter_by_level(self, logs: list, level: str) -> list:
        """按级别过滤"""
        result = []
        for log in logs:
            if log.get("level") == level:
                result.append(log)
        return result

    def filter_by_time_range(
        self, logs: list, start: datetime, end: datetime
    ) -> list:
        """按时间范围过滤"""
        result = []
        for log in logs:
            ts = datetime.fromisoformat(log.get("timestamp", ""))
            if start <= ts <= end:
                result.append(log)
        return result

    def extract_errors(self, logs: list) -> list:
        """提取错误信息"""
        result = []
        for log in logs:
            if log.get("level") in ("ERROR", "CRITICAL"):
                result.append({
                    "time": log.get("timestamp"),
                    "message": log.get("message"),
                    "stack": log.get("stack_trace", ""),
                    "source": log.get("logger", ""),
                })
        return result

    def analyze(self, level: str = "ERROR", days: int = 7) -> list:
        """分析最近N天的错误日志"""
        all_logs = self.load_all_logs()  # 这里就 OOM 了
        now = datetime.now()
        start = datetime(now.year, now.month, now.day - days)
        filtered = self.filter_by_level(all_logs, level)
        time_filtered = self.filter_by_time_range(filtered, start, now)
        return self.extract_errors(time_filtered)
```

## 要求

1. 将所有返回 `list` 的方法改为返回生成器（generator）
2. 消除 `load_all_logs` 这个一次性加载的大函数
3. 实现惰性求值管道：日志从文件流式读取，经过各级过滤后直接产出结果
4. 添加 `peek(count)` 方法：不消费生成器的情况下预览前 N 条
5. 保持接口兼容（可以保留 `list()` 包装的快速方法）

## 语言要求

Python 3.8+。
