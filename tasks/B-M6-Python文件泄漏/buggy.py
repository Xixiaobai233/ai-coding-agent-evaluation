"""
修复 Python 文件句柄未关闭导致的资源泄漏

演示问题：文件操作后未正确关闭文件句柄，导致资源泄漏。
"""


def read_file_buggy(filename):
    """BUG: 打开文件后未关闭"""
    f = open(filename, 'r', encoding='utf-8')
    data = f.read()
    # 忘记调用 f.close()
    return data


def write_file_buggy(filename, content):
    """BUG: 写入文件后未关闭"""
    f = open(filename, 'w', encoding='utf-8')
    f.write(content)
    # 忘记调用 f.close()


def append_multiple_buggy(filename, lines):
    """BUG: 多次写入，但中途异常时未关闭"""
    f = open(filename, 'a', encoding='utf-8')
    for line in lines:
        f.write(line + '\n')
        if 'error' in line:
            # 异常返回，文件未关闭
            return
    f.close()


def read_lines_buggy(filename):
    """BUG: 逐行读取后未关闭"""
    f = open(filename, 'r', encoding='utf-8')
    lines = f.readlines()
    f.close()  # 这个关闭了
    # 但如果在 readlines 和 close 之间抛异常，就会泄漏
    return [line.strip() for line in lines]


def copy_file_buggy(src, dst):
    """BUG: 打开多个文件，未全部关闭"""
    src_f = open(src, 'r', encoding='utf-8')
    dst_f = open(dst, 'w', encoding='utf-8')
    data = src_f.read()
    dst_f.write(data)
    src_f.close()
    dst_f.close()  # 如果 src_f.close() 失败，dst_f 不会关闭
