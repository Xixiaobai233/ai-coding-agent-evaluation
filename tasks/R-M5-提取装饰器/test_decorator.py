import logging
import time

logging.basicConfig(level=logging.DEBUG)

from decorator_refactor import timer, log_call, retry, fetch_data, process_item, batch_process


class TestDecorators:
    def test_timer_decorator(self, capsys):
        @timer
        def dummy():
            time.sleep(0.01)
            return 42

        result = dummy()
        assert result == 42
        captured = capsys.readouterr()
        assert "[timer] dummy:" in captured.out

    def test_log_call_decorator(self, caplog):
        import logging
        caplog.set_level(logging.INFO)
        @log_call
        def add(a, b):
            return a + b

        result = add(3, 4)
        assert result == 7
        assert "Calling add" in caplog.text
        assert "add returned: 7" in caplog.text

    def test_retry_success_on_third_attempt(self):
        """第 3 次调用成功，验证重试机制。"""
        call_count = [0]

        @retry(max_attempts=3, delay=0.01)
        def flaky():
            call_count[0] += 1
            if call_count[0] < 3:
                raise ValueError(f"Attempt {call_count[0]} failed")
            return "success"

        result = flaky()
        assert result == "success"
        assert call_count[0] == 3

    def test_retry_exhausted(self):
        """超过最大重试次数后抛出原始异常。"""
        call_count = [0]

        @retry(max_attempts=2, delay=0.01)
        def always_fails():
            call_count[0] += 1
            raise RuntimeError("always fails")

        import pytest
        with pytest.raises(RuntimeError, match="always fails"):
            always_fails()
        assert call_count[0] == 2

    def test_fetch_data(self):
        result = fetch_data("https://example.com/api")
        assert result["url"] == "https://example.com/api"
        assert result["status"] == "ok"

    def test_process_item_success(self):
        result = process_item(1)
        assert result["id"] == 1
        assert result["status"] == "processed"

    def test_process_item_failure(self):
        import pytest
        with pytest.raises(ConnectionError):
            process_item(3)

    def test_batch_process(self):
        results = batch_process([1, 2, 4, 5])
        assert len(results) == 4
        for r in results:
            assert r["status"] == "processed"

    def test_batch_process_with_failure(self):
        """包含会失败的 item（能被 retry 捕捉并处理）。"""
        # item_id=3 会失败，但由于 retry 最多重试 3 次后仍会抛出异常
        # 所以 batch_process 中遇到 item=3 时会传播异常
        import pytest
        with pytest.raises(ConnectionError):
            batch_process([1, 3])
