"""
修复 Python 文件句柄未关闭导致的资源泄漏

修复方案：使用 with 语句（上下文管理器）自动管理文件生命周期。
"""


def read_file_fixed(filename):
    """修复：使用 with 自动关闭"""
    with open(filename, 'r', encoding='utf-8') as f:
        data = f.read()
    return data


def write_file_fixed(filename, content):
    """修复：使用 with 自动关闭"""
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)


def append_multiple_fixed(filename, lines):
    """修复：使用 with 保证即使异常也能关闭"""
    with open(filename, 'a', encoding='utf-8') as f:
        for line in lines:
            f.write(line + '\n')
            if 'error' in line:
                return  # with 会自动关闭
    # 文件已自动关闭


def read_lines_fixed(filename):
    """修复：使用 with 自动关闭"""
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    return [line.strip() for line in lines]


def copy_file_fixed(src, dst):
    """修复：使用 with 自动关闭多个文件"""
    with open(src, 'r', encoding='utf-8') as src_f:
        data = src_f.read()
    with open(dst, 'w', encoding='utf-8') as dst_f:
        dst_f.write(data)
