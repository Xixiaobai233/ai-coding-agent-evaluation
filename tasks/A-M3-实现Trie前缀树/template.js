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
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) {
        node.children.set(ch, new TrieNode());
      }
      node = node.children.get(ch);
    }
    node.isEnd = true;
  }

  /**
   * 搜索单词是否在前缀树中（完全匹配）
   * @param {string} word
   * @returns {boolean}
   */
  search(word) {
    const node = this._traverse(word);
    return node !== null && node.isEnd;
  }

  /**
   * 判断是否存在以指定前缀开头的单词
   * @param {string} prefix
   * @returns {boolean}
   */
  startsWith(prefix) {
    return this._traverse(prefix) !== null;
  }

  /**
   * 从前缀树中删除一个单词（进阶）
   * @param {string} word
   * @returns {boolean} 是否成功删除
   */
  delete(word) {
    const path = [];
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) return false;
      path.push({ node, ch });
      node = node.children.get(ch);
    }
    if (!node.isEnd) return false;
    node.isEnd = false;
    if (node.children.size > 0) return true;
    for (let i = path.length - 1; i >= 0; i--) {
      const { node: parent, ch } = path[i];
      const child = parent.children.get(ch);
      if (child.children.size === 0 && !child.isEnd) {
        parent.children.delete(ch);
      } else {
        break;
      }
    }
    return true;
  }

  /**
   * 返回前缀树中所有单词的列表（进阶）
   * @returns {string[]}
   */
  listAll() {
    const result = [];
    this._dfs(this.root, '', result);
    return result;
  }

  /** 从根节点沿路径遍历 */
  _traverse(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) return null;
      node = node.children.get(ch);
    }
    return node;
  }

  /** DFS 收集所有单词 */
  _dfs(node, prefix, result) {
    if (node.isEnd) {
      result.push(prefix);
    }
    for (const [ch, child] of node.children) {
      this._dfs(child, prefix + ch, result);
    }
  }
}

module.exports = { Trie, TrieNode };
