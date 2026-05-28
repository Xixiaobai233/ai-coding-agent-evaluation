class Node {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(limit) {
    this.limit = limit;
    this.items = new Map();
    this.mru = new Node(0, 0);
    this.lru = new Node(0, 0);
    this.mru.next = this.lru;
    this.lru.prev = this.mru;
  }

  _detach(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _attach(node) {
    node.next = this.mru.next;
    node.prev = this.mru;
    this.mru.next.prev = node;
    this.mru.next = node;
  }

  _evict() {
    const last = this.lru.prev;
    this._detach(last);
    return last;
  }

  get(key) {
    const node = this.items.get(key);
    if (!node) return -1;
    this._detach(node);
    this._attach(node);
    return node.value;
  }

  put(key, value) {
    const existing = this.items.get(key);
    if (existing) {
      existing.value = value;
      this._detach(existing);
      this._attach(existing);
      return;
    }
    if (this.items.size >= this.limit) {
      const victim = this._evict();
      this.items.delete(victim.key);
    }
    const node = new Node(key, value);
    this.items.set(key, node);
    this._attach(node);
  }
}

module.exports = { LRUCache };
