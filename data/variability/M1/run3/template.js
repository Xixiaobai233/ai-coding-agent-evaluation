class ListNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.hash = new Map();
    this.dummyHead = new ListNode(0, 0);
    this.dummyTail = new ListNode(0, 0);
    this.dummyHead.next = this.dummyTail;
    this.dummyTail.prev = this.dummyHead;
  }

  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _insert(node) {
    const headNext = this.dummyHead.next;
    this.dummyHead.next = node;
    node.prev = this.dummyHead;
    node.next = headNext;
    headNext.prev = node;
  }

  get(key) {
    const node = this.hash.get(key);
    if (!node) return -1;
    this._remove(node);
    this._insert(node);
    return node.value;
  }

  put(key, value) {
    const node = this.hash.get(key);
    if (node) {
      node.value = value;
      this._remove(node);
      this._insert(node);
      return;
    }
    if (this.hash.size >= this.capacity) {
      const last = this.dummyTail.prev;
      this._remove(last);
      this.hash.delete(last.key);
    }
    const newNode = new ListNode(key, value);
    this.hash.set(key, newNode);
    this._insert(newNode);
  }
}

module.exports = { LRUCache };
