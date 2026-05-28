/**
 * LRU 缓存 - 双向链表 + 哈希表实现
 *
 * get 和 put 均为 O(1) 时间复杂度
 */

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
    this.cache = new Map(); // key -> ListNode

    // 哨兵节点，简化边界处理
    this.head = new ListNode(0, 0); // 最近使用 (MRU 端)
    this.tail = new ListNode(0, 0); // 最久未使用 (LRU 端)
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  _removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _addToHead(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }

  _moveToHead(node) {
    this._removeNode(node);
    this._addToHead(node);
  }

  _removeTail() {
    const node = this.tail.prev;
    this._removeNode(node);
    return node;
  }

  get(key) {
    if (!this.cache.has(key)) return -1;

    const node = this.cache.get(key);
    this._moveToHead(node);
    return node.value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      const node = this.cache.get(key);
      node.value = value;
      this._moveToHead(node);
      return;
    }

    if (this.cache.size >= this.capacity) {
      const removed = this._removeTail();
      this.cache.delete(removed.key);
    }

    const newNode = new ListNode(key, value);
    this.cache.set(key, newNode);
    this._addToHead(newNode);
  }
}

module.exports = { LRUCache };
