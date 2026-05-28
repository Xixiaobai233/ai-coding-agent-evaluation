import json
import glob
import itertools
from datetime import datetime, timedelta


class LogProcessor:
    """基于生成器的日志处理器，惰性求值，低内存占用。"""

    def __init__(self, log_dir: str):
        self.log_dir = log_dir

    def iter_logs(self, file_pattern: str = None):
        """生成器：逐行读取日志文件，yield 解析后的 dict。"""
        if file_pattern is None:
            file_pattern = f"{self.log_dir}/**/*.log"
        for filepath in glob.glob(file_pattern, recursive=True):
            with open(filepath, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        yield json.loads(line)
                    except json.JSONDecodeError:
                        continue

    def filter_by_level(self, logs, level: str):
        """生成器：按日志级别过滤。"""
        for log in logs:
            if log.get("level") == level:
                yield log

    def filter_by_time_range(self, logs, start: datetime, end: datetime):
        """生成器：按时间范围过滤。"""
        for log in logs:
            ts_str = log.get("timestamp", "")
            if ts_str:
                try:
                    ts = datetime.fromisoformat(ts_str)
                    if start <= ts <= end:
                        yield log
                except (ValueError, TypeError):
                    continue

    def extract_errors(self, logs):
        """生成器：提取错误信息字段。"""
        for log in logs:
            if log.get("level") in ("ERROR", "CRITICAL"):
                yield {
                    "time": log.get("timestamp"),
                    "message": log.get("message"),
                    "stack": log.get("stack_trace", ""),
                    "source": log.get("logger", ""),
                }

    def analyze(self, level: str = "ERROR", days: int = 7):
        """
        分析最近 N 天的错误日志。
        返回生成器，串联 iter_logs → filter_by_level → filter_by_time_range → extract_errors。
        """
        now = datetime.now()
        start = datetime(now.year, now.month, now.day - days)
        logs = self.iter_logs()
        filtered = self.filter_by_level(logs, level)
        time_filtered = self.filter_by_time_range(filtered, start, now)
        return self.extract_errors(time_filtered)

    @staticmethod
    def peek(generator, count: int):
        """
        预览前 N 条记录，不消费原生成器。
        返回 (原生成器, 前 count 条列表)。
        """
        it1, it2 = itertools.tee(generator, 2)
        preview = list(itertools.islice(it1, count))
        return it2, preview

    # ---- 兼容接口：保留 list() 包装的快速方法 ----

    def load_all_logs(self) -> list:
        """兼容旧接口：一次性加载所有日志（不推荐大文件使用）。"""
        return list(self.iter_logs())

    def filter_by_level_list(self, logs, level: str) -> list:
        return list(self.filter_by_level(logs, level))

    def filter_by_time_range_list(self, logs, start, end) -> list:
        return list(self.filter_by_time_range(logs, start, end))

    def extract_errors_list(self, logs) -> list:
        return list(self.extract_errors(logs))
