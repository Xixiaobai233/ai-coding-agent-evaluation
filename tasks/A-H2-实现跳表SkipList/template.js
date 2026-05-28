/**
 * 跳表 (Skip List) 实现
 *
 * 基于多级链表的有序数据结构，期望时间复杂度 O(log n)。
 */

const MAX_LEVEL = 16;
const P = 0.5; // 抛硬币概率

/**
 * 跳表节点
 */
class SkipListNode {
  constructor(value, level) {
    this.value = value;
    // next[i] 指向当前节点在第 i 层的下一个节点
    this.next = new Array(level).fill(null);
  }
}

/**
 * 跳表
 */
class Skiplist {
  constructor() {
    // 头节点：哨兵，不存储实际值
    this.head = new SkipListNode(-Infinity, MAX_LEVEL);
    this.level = 1; // 当前实际使用的层数
  }

  /**
   * 随机生成节点层数
   * 使用抛硬币法，每层概率 p
   * @returns {number}
   */
  _randomLevel() {
    let lvl = 1;
    while (Math.random() < P && lvl < MAX_LEVEL) {
      lvl++;
    }
    return lvl;
  }

  /**
   * 搜索目标值是否存在
   * @param {number} target
   * @returns {boolean}
   */
  search(target) {
    let curr = this.head;
    for (let i = this.level - 1; i >= 0; i--) {
      while (curr.next[i] !== null && curr.next[i].value < target) {
        curr = curr.next[i];
      }
    }
    curr = curr.next[0];
    return curr !== null && curr.value === target;
  }

  /**
   * 插入一个值（允许重复）
   * @param {number} num
   */
  add(num) {
    const update = new Array(MAX_LEVEL);
    let curr = this.head;
    for (let i = this.level - 1; i >= 0; i--) {
      while (curr.next[i] !== null && curr.next[i].value < num) {
        curr = curr.next[i];
      }
      update[i] = curr;
    }
    const lvl = this._randomLevel();
    if (lvl > this.level) {
      for (let i = this.level; i < lvl; i++) {
        update[i] = this.head;
      }
      this.level = lvl;
    }
    const newNode = new SkipListNode(num, lvl);
    for (let i = 0; i < lvl; i++) {
      newNode.next[i] = update[i].next[i];
      update[i].next[i] = newNode;
    }
  }

  /**
   * 删除一个值（只删除一个匹配项）
   * @param {number} num
   * @returns {boolean}
   */
  erase(num) {
    const update = new Array(MAX_LEVEL);
    let curr = this.head;
    for (let i = this.level - 1; i >= 0; i--) {
      while (curr.next[i] !== null && curr.next[i].value < num) {
        curr = curr.next[i];
      }
      update[i] = curr;
    }
    curr = curr.next[0];
    if (curr === null || curr.value !== num) {
      return false;
    }
    for (let i = 0; i < this.level; i++) {
      if (update[i].next[i] !== curr) break;
      update[i].next[i] = curr.next[i];
    }
    while (this.level > 1 && this.head.next[this.level - 1] === null) {
      this.level--;
    }
    return true;
  }
}

module.exports = { Skiplist, SkipListNode, MAX_LEVEL, P };
