const { Trie } = require('./template');
const assert = require('assert');

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
  } catch (e) {
    console.error(`  FAIL: ${name} - ${e.message}`);
    process.exitCode = 1;
  }
}

// 1. 基本插入与搜索
test('基本插入与搜索', () => {
  const trie = new Trie();
  trie.insert('apple');
  assert.strictEqual(trie.search('apple'), true);
  assert.strictEqual(trie.search('app'), false);
});

// 2. 前缀匹配
test('前缀匹配', () => {
  const trie = new Trie();
  trie.insert('apple');
  assert.strictEqual(trie.startsWith('app'), true);
  assert.strictEqual(trie.startsWith('apl'), false);
});

// 3. 空字符串处理
test('空字符串处理', () => {
  const trie = new Trie();
  assert.strictEqual(trie.search(''), false);
  assert.strictEqual(trie.startsWith(''), true); // 空前缀匹配所有
});

// 4. 多个单词
test('多个单词', () => {
  const trie = new Trie();
  trie.insert('cat');
  trie.insert('car');
  trie.insert('dog');
  assert.strictEqual(trie.search('cat'), true);
  assert.strictEqual(trie.search('car'), true);
  assert.strictEqual(trie.search('dog'), true);
  assert.strictEqual(trie.search('c'), false);
  assert.strictEqual(trie.startsWith('ca'), true);
  assert.strictEqual(trie.startsWith('do'), true);
});

// 5. 不存在的单词
test('不存在的单词', () => {
  const trie = new Trie();
  trie.insert('hello');
  assert.strictEqual(trie.search('world'), false);
  assert.strictEqual(trie.search('hell'), false);
});

// 6. 删除单词
test('删除单词', () => {
  const trie = new Trie();
  trie.insert('apple');
  trie.insert('app');
  assert.strictEqual(trie.delete('apple'), true);
  assert.strictEqual(trie.search('apple'), false);
  assert.strictEqual(trie.search('app'), true);
});

// 7. 删除不存在的单词
test('删除不存在的单词', () => {
  const trie = new Trie();
  assert.strictEqual(trie.delete('nonexistent'), false);
});

// 8. listAll
test('列出所有单词', () => {
  const trie = new Trie();
  trie.insert('cat');
  trie.insert('car');
  trie.insert('dog');
  const words = trie.listAll().sort();
  assert.deepStrictEqual(words, ['car', 'cat', 'dog']);
});

console.log('\nA-M3 测试完成');
