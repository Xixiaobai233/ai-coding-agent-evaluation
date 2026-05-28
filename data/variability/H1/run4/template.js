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
    this.sentinel = new Node(null);
    this.sentinel.color = BLACK;
    this.sentinel.left = this.sentinel;
    this.sentinel.right = this.sentinel;
    this.sentinel.parent = this.sentinel;
    this.root = this.sentinel;
  }

  insert(key) {
    const n = new Node(key);
    n.left = this.sentinel;
    n.right = this.sentinel;

    let p = this.sentinel;
    let c = this.root;

    while (c !== this.sentinel) {
      p = c;
      if (n.key < c.key) c = c.left;
      else if (n.key > c.key) c = c.right;
      else { c.key = n.key; return; }
    }

    n.parent = p;
    if (p === this.sentinel) { this.root = n; }
    else if (n.key < p.key) { p.left = n; }
    else { p.right = n; }

    this.fixup(n);
  }

  leftRotate(x) {
    const y = x.right;
    x.right = y.left;
    if (y.left !== this.sentinel) y.left.parent = x;
    y.parent = x.parent;
    if (x.parent === this.sentinel) this.root = y;
    else if (x === x.parent.left) x.parent.left = y;
    else x.parent.right = y;
    y.left = x;
    x.parent = y;
  }

  rightRotate(x) {
    const y = x.left;
    x.left = y.right;
    if (y.right !== this.sentinel) y.right.parent = x;
    y.parent = x.parent;
    if (x.parent === this.sentinel) this.root = y;
    else if (x === x.parent.right) x.parent.right = y;
    else x.parent.left = y;
    y.right = x;
    x.parent = y;
  }

  fixup(z) {
    while (z.parent.color === RED) {
      if (z.parent === z.parent.parent.left) {
        const u = z.parent.parent.right;
        if (u.color === RED) {
          z.parent.color = BLACK;
          u.color = BLACK;
          z.parent.parent.color = RED;
          z = z.parent.parent;
        } else {
          if (z === z.parent.right) { z = z.parent; this.leftRotate(z); }
          z.parent.color = BLACK;
          z.parent.parent.color = RED;
          this.rightRotate(z.parent.parent);
        }
      } else {
        const u = z.parent.parent.left;
        if (u.color === RED) {
          z.parent.color = BLACK;
          u.color = BLACK;
          z.parent.parent.color = RED;
          z = z.parent.parent;
        } else {
          if (z === z.parent.left) { z = z.parent; this.rightRotate(z); }
          z.parent.color = BLACK;
          z.parent.parent.color = RED;
          this.leftRotate(z.parent.parent);
        }
      }
    }
    this.root.color = BLACK;
  }

  search(key) {
    let c = this.root;
    while (c !== this.sentinel) {
      if (key === c.key) return true;
      c = key < c.key ? c.left : c.right;
    }
    return false;
  }

  inorder() {
    const arr = [];
    this._dfs(this.root, arr);
    return arr;
  }

  _dfs(node, arr) {
    if (node !== this.sentinel) {
      this._dfs(node.left, arr);
      arr.push(node.key);
      this._dfs(node.right, arr);
    }
  }

  height() {
    return this._ht(this.root);
  }

  _ht(node) {
    if (node === this.sentinel) return 0;
    return 1 + Math.max(this._ht(node.left), this._ht(node.right));
  }

  validate() {
    if (this.root === this.sentinel) return true;
    if (this.root.color !== BLACK) return false;
    const ok = this._bhc(this.root);
    return ok !== -1;
  }

  _bhc(node) {
    if (node === this.sentinel) return 1;
    if (node.color === RED) {
      if (node.left.color === RED || node.right.color === RED) return -1;
    }
    const lc = this._bhc(node.left);
    const rc = this._bhc(node.right);
    if (lc === -1 || rc === -1 || lc !== rc) return -1;
    return lc + (node.color === BLACK ? 1 : 0);
  }
}

module.exports = { RedBlackTree, Node, RED, BLACK };
