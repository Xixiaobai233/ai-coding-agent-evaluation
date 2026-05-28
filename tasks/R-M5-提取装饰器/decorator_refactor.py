import functools, time
def timer(func):
    @functools.wraps(func)
    def wrapper(*a, **kw):
        start = time.time(); r = func(*a, **kw); print(f'{func.__name__}: {time.time()-start:.2f}s'); return r
    return wrapper