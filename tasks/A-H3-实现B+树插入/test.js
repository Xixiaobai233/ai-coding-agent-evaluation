/**
 * JS 实现的 B+ 树测试，用于验证算法正确性
 */

class BPlusTreeNode {
  constructor(isLeaf) {
    this.isLeaf = isLeaf;
    this.keys = [];
    this.children = [];
    this.next = null;
    this.parent = null;
  }
}

class BPlusTree {
  constructor(order) {
    this.order = Math.max(3, order);
    this.root = new BPlusTreeNode(true);
  }

  insert(key) {
    const root = this.root;
    if (root.keys.length === this.order - 1) {
      const newRoot = new BPlusTreeNode(false);
      newRoot.children.push(root);
      root.parent = newRoot;
      this.root = newRoot;
      this._splitChild(newRoot, 0);
    }
    this._insertNonFull(this.root, key);
  }

  _insertNonFull(node, key) {
    if (node.isLeaf) {
      let pos = 0;
      while (pos < node.keys.length && node.keys[pos] < key) pos++;
      node.keys.splice(pos, 0, key);
    } else {
      let pos = node.keys.length - 1;
      while (pos >= 0 && key < node.keys[pos]) pos--;
      pos++;
      if (node.children[pos].keys.length === this.order - 1) {
        this._splitChild(node, pos);
        if (key > node.keys[pos]) pos++;
      }
      this._insertNonFull(node.children[pos], key);
    }
  }

  _splitChild(parent, index) {
    const order = this.order;
    const child = parent.children[index];
    const mid = Math.floor(order / 2);

    if (child.isLeaf) {
      // Leaf split: copy mid key up, keep all keys in leaves
      const newNode = new BPlusTreeNode(true);
      newNode.keys = child.keys.splice(mid);
      newNode.next = child.next;
      child.next = newNode;
      newNode.parent = parent;

      const midKey = newNode.keys[0];
      parent.keys.splice(index, 0, midKey);
      parent.children.splice(index + 1, 0, newNode);
    } else {
      // Internal split: move mid key up
      const midKey = child.keys[mid];

      const newNode = new BPlusTreeNode(false);
      newNode.keys = child.keys.splice(mid + 1);
      child.keys = child.keys.slice(0, mid);

      newNode.children = child.children.splice(mid + 1);
      for (const c of newNode.children) {
        if (c) c.parent = newNode;
      }

      newNode.parent = parent;
      parent.keys.splice(index, 0, midKey);
      parent.children.splice(index + 1, 0, newNode);
    }
  }

  search(key) {
    let node = this.root;
    while (!node.isLeaf) {
      let pos = 0;
      while (pos < node.keys.length && key >= node.keys[pos]) pos++;
      node = node.children[pos];
    }
    return node.keys.includes(key);
  }

  inorder() {
    let node = this.root;
    while (!node.isLeaf) node = node.children[0];
    const result = [];
    while (node) {
      result.push(...node.keys);
      node = node.next;
    }
    return result;
  }

  rangeSearch(low, high) {
    const result = [];
    let node = this.root;
    while (!node.isLeaf) {
      let pos = 0;
      while (pos < node.keys.length && low >= node.keys[pos]) pos++;
      node = node.children[pos];
    }
    while (node) {
      for (const k of node.keys) {
        if (k >= low && k <= high) result.push(k);
        if (k > high) return result;
      }
      node = node.next;
    }
    return result;
  }
}

const assert = require('assert');
let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS: ${name}`); }
  catch (e) { failed++; console.error(`  FAIL: ${name} - ${e.message}`); process.exitCode = 1; }
}

test('基本插入与搜索', () => {
  const tree = new BPlusTree(3);
  tree.insert(10); tree.insert(20); tree.insert(5);
  assert.strictEqual(tree.search(10), true);
  assert.strictEqual(tree.search(20), true);
  assert.strictEqual(tree.search(5), true);
  assert.strictEqual(tree.search(15), false);
});

test('叶子分裂', () => {
  const tree = new BPlusTree(3);
  for (let i = 1; i <= 5; i++) tree.insert(i);
  for (let i = 1; i <= 5; i++) assert.strictEqual(tree.search(i), true);
});

test('中序遍历有序', () => {
  const tree = new BPlusTree(3);
  for (let i = 1; i <= 10; i++) tree.insert(i);
  assert.deepStrictEqual(tree.inorder(), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test('逆序插入', () => {
  const tree = new BPlusTree(3);
  for (let i = 10; i >= 1; i--) tree.insert(i);
  assert.deepStrictEqual(tree.inorder(), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test('范围查询', () => {
  const tree = new BPlusTree(3);
  for (let i = 1; i <= 20; i++) tree.insert(i);
  assert.deepStrictEqual(tree.rangeSearch(5, 10), [5, 6, 7, 8, 9, 10]);
});

test('顺序插入 100 个元素', () => {
  const tree = new BPlusTree(4);
  for (let i = 1; i <= 100; i++) tree.insert(i);
  const result = tree.inorder();
  assert.strictEqual(result.length, 100);
  for (let i = 1; i <= 100; i++) assert.strictEqual(result[i - 1], i);
});

console.log(`\nA-H3 测试完成: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
