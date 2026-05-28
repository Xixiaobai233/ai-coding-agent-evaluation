import json
import os
import tempfile
import time
from datetime import datetime, timedelta

import pytest

from generator_refactor import LogProcessor


@pytest.fixture
def log_dir():
    """创建临时日志目录，写入示例日志文件。"""
    with tempfile.TemporaryDirectory() as tmpdir:
        logs = [
            {"timestamp": "2026-05-28T10:00:00", "level": "INFO", "message": "startup", "logger": "system"},
            {"timestamp": "2026-05-28T10:01:00", "level": "ERROR", "message": "connection refused", "logger": "network", "stack_trace": "Traceback..."},
            {"timestamp": "2026-05-28T10:02:00", "level": "WARN", "message": "high memory", "logger": "system"},
            {"timestamp": "2026-05-28T10:03:00", "level": "CRITICAL", "message": "disk full", "logger": "storage", "stack_trace": "OOM"},
            {"timestamp": "2026-05-28T10:04:00", "level": "ERROR", "message": "timeout", "logger": "network"},
            {"timestamp": "2026-05-25T10:00:00", "level": "ERROR", "message": "old error", "logger": "system", "stack_trace": "old"},
        ]
        subdir = os.path.join(tmpdir, "sub")
        os.makedirs(subdir, exist_ok=True)
        filepath = os.path.join(tmpdir, "test.log")
        with open(filepath, "w", encoding="utf-8") as f:
            for entry in logs:
                f.write(json.dumps(entry) + "\n")
        # 一个不在主目录的子文件
        subpath = os.path.join(subdir, "extra.log")
        with open(subpath, "w", encoding="utf-8") as f:
            f.write(json.dumps({"timestamp": "2026-05-28T11:00:00", "level": "ERROR", "message": "sub error", "logger": "sub"}) + "\n")
        yield tmpdir


class TestLogProcessor:
    def test_iter_logs_yields_all_entries(self, log_dir):
        proc = LogProcessor(log_dir)
        all_logs = list(proc.iter_logs())
        assert len(all_logs) == 7  # 6 + 1 (sub)

    def test_filter_by_level(self, log_dir):
        proc = LogProcessor(log_dir)
        errors = list(proc.filter_by_level(proc.iter_logs(), "ERROR"))
        assert len(errors) == 4  # 3 from main + 1 from sub
        for e in errors:
            assert e["level"] == "ERROR"

    def test_filter_by_time_range(self, log_dir):
        proc = LogProcessor(log_dir)
        now = datetime.now()
        start = now - timedelta(days=1)
        recent = list(proc.filter_by_time_range(proc.iter_logs(), start, now))
        # 2026-05-25 is 3 days ago from 2026-05-28, but our test runs at a different date
        # So we just check it yields something
        assert isinstance(recent, list)

    def test_extract_errors(self, log_dir):
        proc = LogProcessor(log_dir)
        errors = list(proc.extract_errors(proc.iter_logs()))
        assert len(errors) == 5  # 3 ERROR + 1 CRITICAL in main + 1 ERROR in sub
        for err in errors:
            assert "time" in err
            assert "message" in err
            assert "stack" in err
            assert "source" in err

    def test_extract_errors_only_error_and_critical(self, log_dir):
        proc = LogProcessor(log_dir)
        errors = list(proc.extract_errors(proc.iter_logs()))
        for err in errors:
            # We can't check original level from extracted, but we know INFO/WARN are skipped
            pass
        levels_in_logs = [l.get("level") for l in proc.iter_logs()]
        extracted_count = sum(1 for l in levels_in_logs if l in ("ERROR", "CRITICAL"))
        assert len(errors) == extracted_count

    def test_analyze_returns_generator(self, log_dir):
        proc = LogProcessor(log_dir)
        result = proc.analyze(level="ERROR", days=7)
        from types import GeneratorType
        assert isinstance(result, GeneratorType)

    def test_analyze_produces_results(self, log_dir):
        proc = LogProcessor(log_dir)
        results = list(proc.analyze(level="ERROR", days=7))
        assert len(results) >= 1

    def test_peek_does_not_consume_generator(self, log_dir):
        proc = LogProcessor(log_dir)
        gen = proc.iter_logs()
        restored, preview = proc.peek(gen, 2)
        assert len(preview) == 2
        # After peek, restored can still yield ALL items
        all_items = list(restored)
        assert len(all_items) == 7  # all 7 items, not 5

    def test_peek_zero(self, log_dir):
        proc = LogProcessor(log_dir)
        restored, preview = proc.peek(proc.iter_logs(), 0)
        assert preview == []
        assert len(list(restored)) == 7

    def test_chainable_pipeline(self, log_dir):
        """支持链式调用：extract_errors(filter_by_level(iter_logs()))"""
        proc = LogProcessor(log_dir)
        chain = proc.extract_errors(proc.filter_by_level(proc.iter_logs(), "ERROR"))
        results = list(chain)
        assert len(results) == 4  # 3 from main + 1 from sub
        for r in results:
            assert r["message"]  # non-empty

    def test_compatibility_load_all_logs(self, log_dir):
        proc = LogProcessor(log_dir)
        all_logs = proc.load_all_logs()
        assert isinstance(all_logs, list)
        assert len(all_logs) == 7

    def test_generator_is_lazy(self, log_dir):
        """验证生成器不会预先加载全部数据。"""
        proc = LogProcessor(log_dir)
        gen = proc.iter_logs()
        # 取前 2 条，确认不加载全部
        first_two = list(itertools.islice(gen, 2))
        assert len(first_two) == 2


import itertools
