"""
将重复代码提取为 Python 装饰器。

重构前，每个函数都手动编写了计时、日志和重试逻辑，导致大量重复代码。
重构后，这些横切关注点被提取为装饰器，函数只保留核心业务逻辑。
"""

import functools
import logging
import time

# ============================================================
#  装饰器定义
# ============================================================


def timer(func):
    """计时装饰器：记录函数执行耗时。"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"[timer] {func.__name__}: {elapsed:.4f}s")
        return result
    return wrapper


def log_call(func):
    """日志装饰器：记录函数调用参数与返回值。"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        logging.info("Calling %s(args=%s, kwargs=%s)", func.__name__, args, kwargs)
        result = func(*args, **kwargs)
        logging.info("%s returned: %s", func.__name__, result)
        return result
    return wrapper


def retry(max_attempts=3, delay=1.0):
    """
    重试装饰器：函数抛出异常时自动重试。
    最多重试 max_attempts 次，间隔 delay 秒。
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as exc:
                    last_exc = exc
                    logging.warning(
                        "%s failed (attempt %d/%d): %s",
                        func.__name__, attempt, max_attempts, exc,
                    )
                    if attempt < max_attempts:
                        time.sleep(delay)
            raise last_exc
        return wrapper
    return decorator


# ============================================================
#  使用装饰器重构后的业务代码
# ============================================================


@timer
@log_call
def fetch_data(url: str) -> dict:
    """模拟从远端获取数据。"""
    time.sleep(0.05)  # 模拟 I/O
    return {"url": url, "status": "ok", "payload": {"id": 42}}


@timer
@retry(max_attempts=3, delay=0.1)
def process_item(item_id: int) -> dict:
    """模拟处理单个数据项，可能因网络原因偶发失败。"""
    if item_id % 3 == 0:
        raise ConnectionError(f"模拟连接失败: item_id={item_id}")
    return {"id": item_id, "status": "processed"}


@timer
def batch_process(item_ids: list) -> list:
    """批量处理多个数据项。"""
    results = []
    for item_id in item_ids:
        result = process_item(item_id)
        results.append(result)
    return results
