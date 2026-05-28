"""
修复 Python 可变对象作为默认参数的问题

修复方案：使用 None 作为默认值，在函数内部创建新对象。
"""

def add_item(item, items=None):
    """修复：使用 None 作为默认值，内部创建新列表"""
    if items is None:
        items = []
    items.append(item)
    return items


def process_users(users=None):
    """修复：使用 None 作为默认值，内部创建新字典"""
    if users is None:
        users = {}
    user_id = len(users) + 1
    users[user_id] = f"user_{user_id}"
    return users


class TaskManager:
    def __init__(self, tasks=None):
        """修复：使用 None 作为默认值，内部创建新列表"""
        self.tasks = tasks if tasks is not None else []

    def add_task(self, task):
        self.tasks.append(task)


def merge_config(defaults=None):
    """修复：使用 None 作为默认值，内部拷贝"""
    config = defaults if defaults is not None else {}
    config["debug"] = False
    return config
