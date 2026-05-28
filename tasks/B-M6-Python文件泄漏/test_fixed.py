"""验证文件泄漏修复正确性"""

import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fixed import (
    read_file_fixed,
    write_file_fixed,
    append_multiple_fixed,
    read_lines_fixed,
    copy_file_fixed,
)


def test_write_and_read():
    """测试写入后读取"""
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', delete=False) as f:
        fname = f.name

    try:
        write_file_fixed(fname, "Hello, World!")
        content = read_file_fixed(fname)
        assert content == "Hello, World!", f"内容不匹配: {content}"
        print(f"[通过] 写入和读取正常")
    finally:
        os.unlink(fname)


def test_append_multiple():
    """测试追加多行"""
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', delete=False) as f:
        fname = f.name

    try:
        append_multiple_fixed(fname, ["line1", "line2", "line3"])
        content = read_file_fixed(fname)
        assert content == "line1\nline2\nline3\n", f"内容不匹配: {repr(content)}"
        print(f"[通过] 追加多行正常")
    finally:
        os.unlink(fname)


def test_append_with_error():
    """测试包含异常关键词时的行为"""
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', delete=False) as f:
        fname = f.name

    try:
        append_multiple_fixed(fname, ["good line", "this is an error", "after error"])
        content = read_file_fixed(fname)
        # 遇到 'error' 后提前返回，不会写入 "after error"
        assert "error" in content, f"应包含 error 行: {content}"
        assert "after error" not in content, "不应包含之后的 with"
        print(f"[通过] 含 error 关键词时提前返回并关闭文件")
    finally:
        os.unlink(fname)


def test_read_lines():
    """测试逐行读取"""
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', delete=False) as f:
        f.write("  a  \n  b  \n  c  \n")
        fname = f.name

    try:
        lines = read_lines_fixed(fname)
        assert lines == ["a", "b", "c"], f"行内容不匹配: {lines}"
        print(f"[通过] 逐行读取并 strip 正常")
    finally:
        os.unlink(fname)


def test_copy_file():
    """测试文件复制"""
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', delete=False) as f:
        f.write("copy test content")
        src = f.name

    dst = src + ".copy"
    try:
        copy_file_fixed(src, dst)
        content = read_file_fixed(dst)
        assert content == "copy test content", f"复制内容不匹配: {content}"
        print(f"[通过] 文件复制正常")
    finally:
        os.unlink(src)
        if os.path.exists(dst):
            os.unlink(dst)


def test_file_handle_closed():
    """验证文件句柄确实被关闭（尝试删除不报错）"""
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', delete=False) as f:
        f.write("test")
        fname = f.name

    write_file_fixed(fname, "updated")
    # 成功删除文件说明句柄已正确关闭
    os.unlink(fname)
    assert not os.path.exists(fname), "文件应已被删除"
    print(f"[通过] 文件句柄正确关闭")


def test_empty_file():
    """测试空文件"""
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', delete=False) as f:
        fname = f.name

    try:
        content = read_file_fixed(fname)
        assert content == "", f"空文件内容应为空: {repr(content)}"
        print(f"[通过] 空文件读取正常")
    finally:
        os.unlink(fname)


if __name__ == "__main__":
    test_write_and_read()
    test_append_multiple()
    test_append_with_error()
    test_read_lines()
    test_copy_file()
    test_file_handle_closed()
    test_empty_file()
    print("\n所有文件泄漏修复测试通过！")
