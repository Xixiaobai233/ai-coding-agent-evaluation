/**
 * 红黑树插入 - 完整实现
 *
 * 实现红黑树的插入操作，包括左旋、右旋和插入修复。
 */

const RED = 'RED';
const BLACK = 'BLACK';

class Node {
  constructor(key) {
    this.key = key;
    this.color = RED;
    this.left = null;
    this.right = null;
    this.parent = null;
  }
}

class RedBlackTree {
  constructor() {
    this.NIL = new Node(null);
    this.NIL.color = BLACK;
    this.NIL.left = this.NIL;
    this.NIL.right = this.NIL;
    this.NIL.parent = this.NIL;
    this.root = this.NIL;
  }

  insert(key) {
    const node = new Node(key);
    node.left = this.NIL;
    node.right = this.NIL;

    let parent = this.NIL;
    let current = this.root;

    while (current !== this.NIL) {
      parent = current;
      if (node.key < current.key) {
        current = current.left;
      } else if (node.key > current.key) {
        current = current.right;
      } else {
        // key 已存在，覆盖
        current.key = node.key;
        return;
      }
    }

    node.parent = parent;
    if (parent === this.NIL) {
      this.root = node;
    } else if (node.key < parent.key) {
      parent.left = node;
    } else {
      parent.right = node;
    }

    // 调用 insertFixup 恢复红黑树性质
    this.insertFixup(node);
  }

  /**
   * 左旋
   *
   *    x               y
   *   / \             / \
   *  a   y    -->    x   c
   *     / \         / \
   *    b   c       a   b
   */
  leftRotate(x) {
    const y = x.right;
    x.right = y.left;
    if (y.left !== this.NIL) {
      y.left.parent = x;
    }
    y.parent = x.parent;
    if (x.parent === this.NIL) {
      this.root = y;
    } else if (x === x.parent.left) {
      x.parent.left = y;
    } else {
      x.parent.right = y;
    }
    y.left = x;
    x.parent = y;
  }

  /**
   * 右旋
   *
   *      y           x
   *     / \         / \
   *    x   c  -->  a   y
   *   / \             / \
   *  a   b           b   c
   */
  rightRotate(y) {
    const x = y.left;
    y.left = x.right;
    if (x.right !== this.NIL) {
      x.right.parent = y;
    }
    x.parent = y.parent;
    if (y.parent === this.NIL) {
      this.root = x;
    } else if (y === y.parent.left) {
      y.parent.left = x;
    } else {
      y.parent.right = x;
    }
    x.right = y;
    y.parent = x;
  }

  /**
   * 插入修复：恢复红黑树性质
   *
   * 当插入红色节点 z 后，可能违反性质 4（不能有连续红色节点）。
   * 循环修复，直到 z 的父节点为黑色或 z 为根。
   */
  insertFixup(z) {
    while (z.parent.color === RED) {
      if (z.parent === z.parent.parent.left) {
        const y = z.parent.parent.right;
        if (y.color === RED) {
          z.parent.color = BLACK;
          y.color = BLACK;
          z.parent.parent.color = RED;
          z = z.parent.parent;
        } else {
          if (z === z.parent.right) {
            z = z.parent;
            this.leftRotate(z);
          }
          z.parent.color = BLACK;
          z.parent.parent.color = RED;
          this.rightRotate(z.parent.parent);
        }
      } else {
        const y = z.parent.parent.left;
        if (y.color === RED) {
          z.parent.color = BLACK;
          y.color = BLACK;
          z.parent.parent.color = RED;
          z = z.parent.parent;
        } else {
          if (z === z.parent.left) {
            z = z.parent;
            this.rightRotate(z);
          }
          z.parent.color = BLACK;
          z.parent.parent.color = RED;
          this.leftRotate(z.parent.parent);
        }
      }
    }
    this.root.color = BLACK;
  }

  search(key) {
    let current = this.root;
    while (current !== this.NIL) {
      if (key === current.key) return true;
      if (key < current.key) current = current.left;
      else current = current.right;
    }
    return false;
  }

  inorder() {
    const result = [];
    this._inorder(this.root, result);
    return result;
  }

  _inorder(node, result) {
    if (node !== this.NIL) {
      this._inorder(node.left, result);
      result.push(node.key);
      this._inorder(node.right, result);
    }
  }

  /**
   * 获取树的高度
   */
  height() {
    return this._height(this.root);
  }

  _height(node) {
    if (node === this.NIL) return 0;
    return 1 + Math.max(this._height(node.left), this._height(node.right));
  }

  validate() {
    if (this.root === this.NIL) return true;
    // 性质 2: 根是黑色
    if (this.root.color !== BLACK) return false;
    const blackCount = this._countBlackHeight(this.root);
    return blackCount !== -1;
  }

  _countBlackHeight(node) {
    if (node === this.NIL) return 1;
    // 性质 4: 没有连续红色
    if (node.color === RED) {
      if (node.left?.color === RED || node.right?.color === RED) return -1;
    }
    const left = this._countBlackHeight(node.left);
    const right = this._countBlackHeight(node.right);
    if (left === -1 || right === -1 || left !== right) return -1;
    return left + (node.color === BLACK ? 1 : 0);
  }
}

module.exports = { RedBlackTree, Node, RED, BLACK };
