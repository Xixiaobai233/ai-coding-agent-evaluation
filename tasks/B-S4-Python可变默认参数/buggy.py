"""
修复 Python 可变对象作为默认参数的问题

演示问题：使用可变对象（list、dict 等）作为默认参数时，
多次调用会共享同一个对象，导致意外的累积行为。
"""

def add_item(item, items=[]):
    """BUG: 可变列表作为默认参数，多次调用会累积"""
    items.append(item)
    return items


def process_users(users={}):
    """BUG: 可变字典作为默认参数，多次调用会累积"""
    user_id = len(users) + 1
    users[user_id] = f"user_{user_id}"
    return users


class TaskManager:
    def __init__(self, tasks=[]):
        """BUG: 可变列表作为默认参数，所有实例共享"""
        self.tasks = tasks

    def add_task(self, task):
        self.tasks.append(task)


def merge_config(defaults={}):
    """BUG: 可变字典作为默认参数"""
    config = defaults
    config["debug"] = False
    return config
