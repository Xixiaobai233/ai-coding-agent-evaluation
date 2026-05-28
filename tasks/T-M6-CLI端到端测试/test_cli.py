"""CLI端到端测试"""
import subprocess, os, json, sys, tempfile

CLI = os.path.join(os.path.dirname(__file__), 'cli_todo.py')

def run(*args):
    result = subprocess.run([sys.executable, CLI] + list(args),
                          capture_output=True, text=True)
    return result.stdout.strip(), result.returncode

def setup_module():
    # 使用临时数据文件
    os.environ['TODO_FILE'] = '/tmp/test_todos.json'

class TestCLI:
    def test_add(self):
        out, rc = run('add', 'Buy milk')
        assert rc == 0
        assert 'Added' in out

    def test_list_empty(self):
        out, rc = run('list')
        assert rc == 0

    def test_add_and_list(self):
        run('add', 'Buy milk')
        run('add', 'Write paper')
        out, rc = run('list')
        assert rc == 0
        assert 'Buy milk' in out
        assert 'Write paper' in out

    def test_done(self):
        run('add', 'Test task')
        out, rc = run('done', '1')
        assert rc == 0

    def test_full_workflow(self):
        run('add', 'Task A')
        run('add', 'Task B')
        run('done', '1')
        out = run('list')[0]
        assert '[x]' in out
        assert 'Task A' in out
