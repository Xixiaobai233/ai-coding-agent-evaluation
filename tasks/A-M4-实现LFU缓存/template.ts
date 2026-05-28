/**
 * LFU 缓存 - 哈希表 + 频率链表实现
 *
 * get 和 put 均为 O(1) 时间复杂度
 * 淘汰策略：频率最低 -> 最久未使用
 */

class ListNode {
  key: number;
  value: number;
  freq: number;
  prev: ListNode | null;
  next: ListNode | null;

  constructor(key: number, value: number) {
    this.key = key;
    this.value = value;
    this.freq = 1;
    this.prev = null;
    this.next = null;
  }
}

class DoublyLinkedList {
  head: ListNode;
  tail: ListNode;

  constructor() {
    this.head = new ListNode(0, 0);
    this.tail = new ListNode(0, 0);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /** 在链表头部插入节点 (MRU 端) */
  addToHead(node: ListNode): void {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  /** 移除指定节点 */
  removeNode(node: ListNode): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  /** 移除链表尾部节点 (LRU 端) */
  removeTail(): ListNode | null {
    if (this.isEmpty()) return null;
    const node = this.tail.prev!;
    this.removeNode(node);
    return node;
  }

  /** 链表是否为空 */
  isEmpty(): boolean {
    return this.head.next === this.tail;
  }
}

class LFUCache {
  private capacity: number;
  private keyToNode: Map<number, ListNode>;
  private freqToList: Map<number, DoublyLinkedList>;
  private minFreq: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.keyToNode = new Map();
    this.freqToList = new Map();
    this.minFreq = 0;
  }

  get(key: number): number {
    if (!this.keyToNode.has(key)) return -1;
    const node = this.keyToNode.get(key)!;
    this.increaseFreq(node);
    return node.value;
  }

  put(key: number, value: number): void {
    if (this.capacity <= 0) return;

    if (this.keyToNode.has(key)) {
      const node = this.keyToNode.get(key)!;
      node.value = value;
      this.increaseFreq(node);
      return;
    }

    if (this.keyToNode.size >= this.capacity) {
      const list = this.freqToList.get(this.minFreq)!;
      const toRemove = list.removeTail()!;
      this.keyToNode.delete(toRemove.key);
      if (list.isEmpty()) {
        this.freqToList.delete(this.minFreq);
      }
    }

    const node = new ListNode(key, value);
    this.keyToNode.set(key, node);
    this.minFreq = 1;
    if (!this.freqToList.has(1)) {
      this.freqToList.set(1, new DoublyLinkedList());
    }
    this.freqToList.get(1)!.addToHead(node);
  }

  /** 增加节点频率 */
  private increaseFreq(node: ListNode): void {
    const oldFreq = node.freq;
    const oldList = this.freqToList.get(oldFreq)!;
    oldList.removeNode(node);

    if (oldList.isEmpty()) {
      this.freqToList.delete(oldFreq);
      if (this.minFreq === oldFreq) {
        this.minFreq++;
      }
    }

    node.freq++;
    const newFreq = node.freq;
    if (!this.freqToList.has(newFreq)) {
      this.freqToList.set(newFreq, new DoublyLinkedList());
    }
    this.freqToList.get(newFreq)!.addToHead(node);
  }
}

export { LFUCache, ListNode, DoublyLinkedList };
