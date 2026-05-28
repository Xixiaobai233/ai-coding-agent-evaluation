class LinkNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.lookup = new Map();
    this.front = new LinkNode(0, 0);
    this.back = new LinkNode(0, 0);
    this.front.next = this.back;
    this.back.prev = this.front;
  }

  _unlink(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _prepend(node) {
    const second = this.front.next;
    this.front.next = node;
    node.prev = this.front;
    node.next = second;
    second.prev = node;
  }

  get(key) {
    const entry = this.lookup.get(key);
    if (!entry) return -1;
    this._unlink(entry);
    this._prepend(entry);
    return entry.value;
  }

  put(key, value) {
    const existing = this.lookup.get(key);
    if (existing) {
      existing.value = value;
      this._unlink(existing);
      this._prepend(existing);
      return;
    }
    if (this.lookup.size >= this.maxSize) {
      const last = this.back.prev;
      this._unlink(last);
      this.lookup.delete(last.key);
    }
    const newNode = new LinkNode(key, value);
    this.lookup.set(key, newNode);
    this._prepend(newNode);
  }
}

module.exports = { LRUCache };
