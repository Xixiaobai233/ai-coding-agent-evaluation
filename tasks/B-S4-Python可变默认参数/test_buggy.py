"""验证可变默认参数 bug 存在，以及修复后行为正确"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from buggy import add_item, process_users, TaskManager, merge_config
from fixed import add_item as fixed_add_item
from fixed import process_users as fixed_process_users
from fixed import TaskManager as FixedTaskManager
from fixed import merge_config as fixed_merge_config


def test_buggy_mutable_default():
    """验证 BUG：可变默认参数导致累积"""
    # 多次调用 add_item 会共享同一个列表
    r1 = add_item(1)
    r2 = add_item(2)
    r3 = add_item(3)
    # 预期：每次返回应该只包含当前项，但因为共享，r3 包含 [1, 2, 3]
    assert r3 == [1, 2, 3], f"预期 [1, 2, 3]，实际 {r3}"
    # 验证 bug 确实存在：r1 引用和 r3 引用是同一个列表
    assert r1 is r3, "r1 和 r3 应该是同一个列表对象"
    print("[通过] Bug 验证：可变默认参数确实会导致累积")


def test_fixed_mutable_default():
    """验证修复：每次调用使用新的列表"""
    r1 = fixed_add_item(1)
    r2 = fixed_add_item(2)
    r3 = fixed_add_item(3)
    assert r1 == [1], f"预期 [1]，实际 {r1}"
    assert r2 == [2], f"预期 [2]，实际 {r2}"
    assert r3 == [3], f"预期 [3]，实际 {r3}"
    assert r1 is not r2, "每次调用应创建新列表"
    assert r2 is not r3, "每次调用应创建新列表"
    print("[通过] 修复验证：每次调用创建新列表")


def test_buggy_task_manager():
    """验证 BUG：TaskManager 实例共享默认 tasks"""
    t1 = TaskManager()
    t2 = TaskManager()
    t1.add_task("task1")
    # BUG：t2 也会看到 t1 添加的任务
    assert len(t2.tasks) == 1, f"t2.tasks 长度应为 1，实际 {len(t2.tasks)}"
    print("[通过] Bug 验证：TaskManager 实例共享默认 tasks")


def test_fixed_task_manager():
    """验证修复：每个 TaskManager 实例独立"""
    t1 = FixedTaskManager()
    t2 = FixedTaskManager()
    t1.add_task("task1")
    assert len(t2.tasks) == 0, f"t2.tasks 应不为空，实际 {len(t2.tasks)}"
    t2.add_task("task2")
    assert len(t1.tasks) == 1, f"t1.tasks 长度应为 1，实际 {len(t1.tasks)}"
    assert len(t2.tasks) == 1, f"t2.tasks 长度应为 1，实际 {len(t2.tasks)}"
    print("[通过] 修复验证：每个 TaskManager 实例独立")


def test_buggy_process_users():
    """验证 BUG：process_users 累积"""
    r1 = process_users()
    r2 = process_users()
    r3 = process_users()
    assert len(r3) == 3, f"BUG 导致累积：r3 应该包含 3 个用户，实际 {len(r3)}"
    print("[通过] Bug 验证：process_users 会累积")


def test_fixed_process_users():
    """验证修复：每次返回新字典"""
    r1 = fixed_process_users()
    r2 = fixed_process_users()
    r3 = fixed_process_users()
    assert len(r1) == 1
    assert len(r2) == 1
    assert len(r3) == 1
    print("[通过] 修复验证：每次创建新字典")


def test_buggy_merge_config():
    """验证 BUG：merge_config 修改默认值"""
    c1 = merge_config()
    c2 = merge_config()
    # 第二次调用时，defaults 已经包含 debug=False
    assert "debug" in c1
    assert "debug" in c2
    print("[通过] Bug 验证：merge_config 默认字典被修改")


def test_fixed_merge_config():
    """验证修复：每次创建新配置"""
    c1 = fixed_merge_config()
    c2 = fixed_merge_config()
    assert "debug" in c2
    print("[通过] 修复验证：merge_config 每次创建新字典")


def test_explicit_pass():
    """验证：显式传入列表时行为正确"""
    my_list = [1, 2]
    result = fixed_add_item(3, my_list)
    assert result == [1, 2, 3], f"预期 [1, 2, 3]，实际 {result}"
    assert result is my_list, "应使用传入的列表"
    print("[通过] 修复验证：显式传入列表时正常使用")


if __name__ == "__main__":
    test_buggy_mutable_default()
    test_fixed_mutable_default()
    test_buggy_task_manager()
    test_fixed_task_manager()
    test_buggy_process_users()
    test_fixed_process_users()
    test_buggy_merge_config()
    test_fixed_merge_config()
    test_explicit_pass()
    print("\n所有测试通过！")
