const RED = 'RED';
const BLACK = 'BLACK';

class RBTNode {
  constructor(k) {
    this.k = k;
    this.c = RED;
    this.l = null;
    this.r = null;
    this.p = null;
  }
}

class RedBlackTree {
  constructor() {
    this.TNULL = new RBTNode(null);
    this.TNULL.c = BLACK;
    this.TNULL.l = this.TNULL;
    this.TNULL.r = this.TNULL;
    this.TNULL.p = this.TNULL;
    this.root = this.TNULL;
  }

  insert(k) {
    const nd = new RBTNode(k);
    nd.l = this.TNULL;
    nd.r = this.TNULL;

    let par = this.TNULL;
    let cur = this.root;

    while (cur !== this.TNULL) {
      par = cur;
      if (nd.k < cur.k) cur = cur.l;
      else if (nd.k > cur.k) cur = cur.r;
      else { cur.k = nd.k; return; }
    }

    nd.p = par;
    if (par === this.TNULL) this.root = nd;
    else if (nd.k < par.k) par.l = nd;
    else par.r = nd;

    this._fix(nd);
  }

  _lr(x) {
    const y = x.r;
    x.r = y.l;
    if (y.l !== this.TNULL) y.l.p = x;
    y.p = x.p;
    if (x.p === this.TNULL) this.root = y;
    else if (x === x.p.l) x.p.l = y;
    else x.p.r = y;
    y.l = x;
    x.p = y;
  }

  _rr(x) {
    const y = x.l;
    x.l = y.r;
    if (y.r !== this.TNULL) y.r.p = x;
    y.p = x.p;
    if (x.p === this.TNULL) this.root = y;
    else if (x === x.p.r) x.p.r = y;
    else x.p.l = y;
    y.r = x;
    x.p = y;
  }

  _fix(z) {
    while (z.p.c === RED) {
      if (z.p === z.p.p.l) {
        const u = z.p.p.r;
        if (u.c === RED) {
          z.p.c = BLACK;
          u.c = BLACK;
          z.p.p.c = RED;
          z = z.p.p;
        } else {
          if (z === z.p.r) { z = z.p; this._lr(z); }
          z.p.c = BLACK;
          z.p.p.c = RED;
          this._rr(z.p.p);
        }
      } else {
        const u = z.p.p.l;
        if (u.c === RED) {
          z.p.c = BLACK;
          u.c = BLACK;
          z.p.p.c = RED;
          z = z.p.p;
        } else {
          if (z === z.p.l) { z = z.p; this._rr(z); }
          z.p.c = BLACK;
          z.p.p.c = RED;
          this._lr(z.p.p);
        }
      }
    }
    this.root.c = BLACK;
  }

  search(k) {
    let c = this.root;
    while (c !== this.TNULL) {
      if (k === c.k) return true;
      c = k < c.k ? c.l : c.r;
    }
    return false;
  }

  inorder() {
    const a = [];
    this._in(this.root, a);
    return a;
  }

  _in(n, a) {
    if (n !== this.TNULL) {
      this._in(n.l, a);
      a.push(n.k);
      this._in(n.r, a);
    }
  }

  height() {
    return this._h(this.root);
  }

  _h(n) {
    if (n === this.TNULL) return 0;
    return 1 + Math.max(this._h(n.l), this._h(n.r));
  }

  validate() {
    if (this.root === this.TNULL) return true;
    if (this.root.c !== BLACK) return false;
    return this._bct(this.root) !== -1;
  }

  _bct(n) {
    if (n === this.TNULL) return 1;
    if (n.c === RED) {
      if (n.l.c === RED || n.r.c === RED) return -1;
    }
    const lc = this._bct(n.l);
    const rc = this._bct(n.r);
    if (lc === -1 || rc === -1 || lc !== rc) return -1;
    return lc + (n.c === BLACK ? 1 : 0);
  }
}

module.exports = { RedBlackTree, RBTNode, RED, BLACK };
