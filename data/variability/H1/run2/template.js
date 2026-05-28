const RED = 'RED';
const BLACK = 'BLACK';

class RBNode {
  constructor(key) {
    this.key = key;
    this.color = RED;
    this.L = null;
    this.R = null;
    this.P = null;
  }
}

class RedBlackTree {
  constructor() {
    this.leaf = new RBNode(null);
    this.leaf.color = BLACK;
    this.leaf.L = this.leaf;
    this.leaf.R = this.leaf;
    this.leaf.P = this.leaf;
    this.root = this.leaf;
  }

  insert(key) {
    const node = new RBNode(key);
    node.L = this.leaf;
    node.R = this.leaf;

    let p = this.leaf;
    let c = this.root;

    while (c !== this.leaf) {
      p = c;
      if (node.key < c.key) c = c.L;
      else if (node.key > c.key) c = c.R;
      else { c.key = node.key; return; }
    }

    node.P = p;
    if (p === this.leaf) this.root = node;
    else if (node.key < p.key) p.L = node;
    else p.R = node;

    this.fix(node);
  }

  rotateL(x) {
    const y = x.R;
    x.R = y.L;
    if (y.L !== this.leaf) y.L.P = x;
    y.P = x.P;
    if (x.P === this.leaf) this.root = y;
    else if (x === x.P.L) x.P.L = y;
    else x.P.R = y;
    y.L = x;
    x.P = y;
  }

  rotateR(x) {
    const y = x.L;
    x.L = y.R;
    if (y.R !== this.leaf) y.R.P = x;
    y.P = x.P;
    if (x.P === this.leaf) this.root = y;
    else if (x === x.P.R) x.P.R = y;
    else x.P.L = y;
    y.R = x;
    x.P = y;
  }

  fix(z) {
    while (z.P.color === RED) {
      if (z.P === z.P.P.L) {
        const u = z.P.P.R;
        if (u.color === RED) {
          z.P.color = BLACK;
          u.color = BLACK;
          z.P.P.color = RED;
          z = z.P.P;
        } else {
          if (z === z.P.R) { z = z.P; this.rotateL(z); }
          z.P.color = BLACK;
          z.P.P.color = RED;
          this.rotateR(z.P.P);
        }
      } else {
        const u = z.P.P.L;
        if (u.color === RED) {
          z.P.color = BLACK;
          u.color = BLACK;
          z.P.P.color = RED;
          z = z.P.P;
        } else {
          if (z === z.P.L) { z = z.P; this.rotateR(z); }
          z.P.color = BLACK;
          z.P.P.color = RED;
          this.rotateL(z.P.P);
        }
      }
    }
    this.root.color = BLACK;
  }

  search(key) {
    let c = this.root;
    while (c !== this.leaf) {
      if (key === c.key) return true;
      c = key < c.key ? c.L : c.R;
    }
    return false;
  }

  inorder() {
    const res = [];
    this._walk(this.root, res);
    return res;
  }

  _walk(n, res) {
    if (n !== this.leaf) {
      this._walk(n.L, res);
      res.push(n.key);
      this._walk(n.R, res);
    }
  }

  height() {
    return this._h(this.root);
  }

  _h(n) {
    if (n === this.leaf) return 0;
    return 1 + Math.max(this._h(n.L), this._h(n.R));
  }

  validate() {
    if (this.root === this.leaf) return true;
    if (this.root.color !== BLACK) return false;
    return this._bh(this.root) !== -1;
  }

  _bh(n) {
    if (n === this.leaf) return 1;
    if (n.color === RED) {
      if (n.L.color === RED || n.R.color === RED) return -1;
    }
    const l = this._bh(n.L);
    const r = this._bh(n.R);
    if (l === -1 || r === -1 || l !== r) return -1;
    return l + (n.color === BLACK ? 1 : 0);
  }
}

module.exports = { RedBlackTree, RBNode, RED, BLACK };
