/**
 * Trie 前缀树节点
 */
class TrieNode {
  constructor() {
    this.children = new Map(); // 子节点映射: char -> TrieNode
    this.isEnd = false;        // 是否为单词结尾
  }
}

/**
 * Trie 前缀树
 *
 * 高效存储和检索字符串集合。
 */
class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  /**
   * 将单词插入前缀树
   * @param {string} word
   */
  insert(word) {
    // TODO: 从根节点开始，逐字符向下创建/复用节点
  }

  /**
   * 搜索单词是否在前缀树中（完全匹配）
   * @param {string} word
   * @returns {boolean}
   */
  search(word) {
    // TODO: 从根节点开始逐字符匹配，最后检查 isEnd
    return false;
  }

  /**
   * 判断是否存在以指定前缀开头的单词
   * @param {string} prefix
   * @returns {boolean}
   */
  startsWith(prefix) {
    // TODO: 从根节点开始逐字符匹配，只要能走完前缀就返回 true
    return false;
  }

  /**
   * 从前缀树中删除一个单词（进阶）
   * @param {string} word
   * @returns {boolean} 是否成功删除
   */
  delete(word) {
    // TODO: 可选 - 实现删除功能
    return false;
  }

  /**
   * 返回前缀树中所有单词的列表（进阶）
   * @returns {string[]}
   */
  listAll() {
    // TODO: 可选 - 使用 DFS 收集所有单词
    return [];
  }
}

module.exports = { Trie, TrieNode };
