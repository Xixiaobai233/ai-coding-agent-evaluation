class LLNode {
  constructor(k, v) {
    this.k = k;
    this.v = v;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(cap) {
    this.cap = cap;
    this.idx = new Map();
    this.sentinelHead = new LLNode(0, 0);
    this.sentinelTail = new LLNode(0, 0);
    this.sentinelHead.next = this.sentinelTail;
    this.sentinelTail.prev = this.sentinelHead;
  }

  _cut(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _stitch(node) {
    const oldFirst = this.sentinelHead.next;
    this.sentinelHead.next = node;
    node.prev = this.sentinelHead;
    node.next = oldFirst;
    oldFirst.prev = node;
  }

  get(key) {
    const n = this.idx.get(key);
    if (!n) return -1;
    this._cut(n);
    this._stitch(n);
    return n.v;
  }

  put(key, value) {
    const n = this.idx.get(key);
    if (n) {
      n.v = value;
      this._cut(n);
      this._stitch(n);
      return;
    }
    if (this.idx.size >= this.cap) {
      const last = this.sentinelTail.prev;
      this._cut(last);
      this.idx.delete(last.k);
    }
    const nn = new LLNode(key, value);
    this.idx.set(key, nn);
    this._stitch(nn);
  }
}

module.exports = { LRUCache };
