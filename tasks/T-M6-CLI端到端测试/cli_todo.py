#!/usr/bin/env python3
"""CLI Todo Manager - простой TODO менеджер для CLI"""
import argparse, json, os, sys

DATA_FILE = os.path.join(os.path.dirname(__file__), 'todos.json')

def load():
    if not os.path.exists(DATA_FILE): return []
    with open(DATA_FILE, 'r') as f: return json.load(f)

def save(todos):
    with open(DATA_FILE, 'w') as f: json.dump(todos, f, indent=2)

def add(task):
    todos = load()
    todos.append({"id": len(todos)+1, "task": task, "done": False})
    save(todos)
    return f"Added: {task}"

def list_todos():
    todos = load()
    if not todos: return "No todos."
    return "\n".join(f"{'[x]' if t['done'] else '[ ]'} {t['id']}: {t['task']}" for t in todos)

def done(tid):
    todos = load()
    for t in todos:
        if t['id'] == tid: t['done'] = True; break
    save(todos)
    return f"Done: {tid}"

def main():
    parser = argparse.ArgumentParser(description='Todo Manager')
    parser.add_argument('action', choices=['add','list','done'])
    parser.add_argument('args', nargs='*')
    args = parser.parse_args()
    if args.action == 'add':
        print(add(' '.join(args.args)))
    elif args.action == 'list':
        print(list_todos())
    elif args.action == 'done':
        print(done(int(args.args[0])))

if __name__ == '__main__':
    main()
