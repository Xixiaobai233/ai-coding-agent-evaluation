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
    // TODO: 从最高层开始向前查找，逐层向下
    return false;
  }

  /**
   * 插入一个值（允许重复）
   * @param {number} num
   */
  add(num) {
    // TODO: 找到每层的前驱节点，随机生成层数，插入
  }

  /**
   * 删除一个值（只删除一个匹配项）
   * @param {number} num
   * @returns {boolean}
   */
  erase(num) {
    // TODO: 找到每层的前驱节点，如果存在则删除
    return false;
  }
}

module.exports = { Skiplist, SkipListNode, MAX_LEVEL, P };
