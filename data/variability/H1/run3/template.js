const RED = 'RED';
const BLACK = 'BLACK';

class TreeNode {
  constructor(val) {
    this.val = val;
    this.clr = RED;
    this.lft = null;
    this.rgt = null;
    this.prt = null;
  }
}

class RedBlackTree {
  constructor() {
    this.NIL = new TreeNode(null);
    this.NIL.clr = BLACK;
    this.NIL.lft = this.NIL;
    this.NIL.rgt = this.NIL;
    this.NIL.prt = this.NIL;
    this.root = this.NIL;
  }

  insert(val) {
    const node = new TreeNode(val);
    node.lft = this.NIL;
    node.rgt = this.NIL;

    let parent = this.NIL;
    let cur = this.root;

    while (cur !== this.NIL) {
      parent = cur;
      if (node.val < cur.val) cur = cur.lft;
      else if (node.val > cur.val) cur = cur.rgt;
      else { cur.val = node.val; return; }
    }

    node.prt = parent;
    if (parent === this.NIL) this.root = node;
    else if (node.val < parent.val) parent.lft = node;
    else parent.rgt = node;

    this._repair(node);
  }

  _rotateL(x) {
    const y = x.rgt;
    x.rgt = y.lft;
    if (y.lft !== this.NIL) y.lft.prt = x;
    y.prt = x.prt;
    if (x.prt === this.NIL) this.root = y;
    else if (x === x.prt.lft) x.prt.lft = y;
    else x.prt.rgt = y;
    y.lft = x;
    x.prt = y;
  }

  _rotateR(x) {
    const y = x.lft;
    x.lft = y.rgt;
    if (y.rgt !== this.NIL) y.rgt.prt = x;
    y.prt = x.prt;
    if (x.prt === this.NIL) this.root = y;
    else if (x === x.prt.rgt) x.prt.rgt = y;
    else x.prt.lft = y;
    y.rgt = x;
    x.prt = y;
  }

  _repair(z) {
    while (z.prt.clr === RED) {
      if (z.prt === z.prt.prt.lft) {
        const uncle = z.prt.prt.rgt;
        if (uncle.clr === RED) {
          z.prt.clr = BLACK;
          uncle.clr = BLACK;
          z.prt.prt.clr = RED;
          z = z.prt.prt;
        } else {
          if (z === z.prt.rgt) { z = z.prt; this._rotateL(z); }
          z.prt.clr = BLACK;
          z.prt.prt.clr = RED;
          this._rotateR(z.prt.prt);
        }
      } else {
        const uncle = z.prt.prt.lft;
        if (uncle.clr === RED) {
          z.prt.clr = BLACK;
          uncle.clr = BLACK;
          z.prt.prt.clr = RED;
          z = z.prt.prt;
        } else {
          if (z === z.prt.lft) { z = z.prt; this._rotateR(z); }
          z.prt.clr = BLACK;
          z.prt.prt.clr = RED;
          this._rotateL(z.prt.prt);
        }
      }
    }
    this.root.clr = BLACK;
  }

  search(val) {
    let cur = this.root;
    while (cur !== this.NIL) {
      if (val === cur.val) return true;
      cur = val < cur.val ? cur.lft : cur.rgt;
    }
    return false;
  }

  inorder() {
    const res = [];
    this._traverse(this.root, res);
    return res;
  }

  _traverse(n, res) {
    if (n !== this.NIL) {
      this._traverse(n.lft, res);
      res.push(n.val);
      this._traverse(n.rgt, res);
    }
  }

  height() {
    return this._depth(this.root);
  }

  _depth(n) {
    if (n === this.NIL) return 0;
    return 1 + Math.max(this._depth(n.lft), this._depth(n.rgt));
  }

  validate() {
    if (this.root === this.NIL) return true;
    if (this.root.clr !== BLACK) return false;
    return this._blackCheck(this.root) !== -1;
  }

  _blackCheck(n) {
    if (n === this.NIL) return 1;
    if (n.clr === RED) {
      if (n.lft.clr === RED || n.rgt.clr === RED) return -1;
    }
    const l = this._blackCheck(n.lft);
    const r = this._blackCheck(n.rgt);
    if (l === -1 || r === -1 || l !== r) return -1;
    return l + (n.clr === BLACK ? 1 : 0);
  }
}

module.exports = { RedBlackTree, TreeNode, RED, BLACK };
