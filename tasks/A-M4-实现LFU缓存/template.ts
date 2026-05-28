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
    // TODO
  }

  /** 移除指定节点 */
  removeNode(node: ListNode): void {
    // TODO
  }

  /** 移除链表尾部节点 (LRU 端) */
  removeTail(): ListNode | null {
    // TODO
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
    // TODO
    return -1;
  }

  put(key: number, value: number): void {
    // TODO
  }

  /** 增加节点频率 */
  private increaseFreq(node: ListNode): void {
    // TODO
  }
}

export { LFUCache, ListNode, DoublyLinkedList };
