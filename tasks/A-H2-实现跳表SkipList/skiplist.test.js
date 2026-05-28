const { Skiplist } = require('./template');
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
  const sl = new Skiplist();
  sl.add(1);
  assert.strictEqual(sl.search(1), true);
});

// 2. 不存在则返回 false
test('不存在则返回 false', () => {
  const sl = new Skiplist();
  assert.strictEqual(sl.search(0), false);
});

// 3. 删除已存在的元素
test('删除已存在的元素', () => {
  const sl = new Skiplist();
  sl.add(1);
  assert.strictEqual(sl.erase(1), true);
  assert.strictEqual(sl.search(1), false);
});

// 4. 删除不存在的元素
test('删除不存在的元素', () => {
  const sl = new Skiplist();
  assert.strictEqual(sl.erase(0), false);
});

// 5. 重复值处理
test('重复值处理', () => {
  const sl = new Skiplist();
  sl.add(1);
  sl.add(1);
  assert.strictEqual(sl.erase(1), true);
  assert.strictEqual(sl.search(1), true);
  assert.strictEqual(sl.erase(1), true);
  assert.strictEqual(sl.search(1), false);
});

// 6. 顺序插入
test('顺序插入 1..100', () => {
  const sl = new Skiplist();
  for (let i = 1; i <= 100; i++) sl.add(i);
  for (let i = 1; i <= 100; i++) assert.strictEqual(sl.search(i), true);
});

// 7. 逆序插入
test('逆序插入 100..1', () => {
  const sl = new Skiplist();
  for (let i = 100; i >= 1; i--) sl.add(i);
  for (let i = 1; i <= 100; i++) assert.strictEqual(sl.search(i), true);
});

// 8. 空跳表搜索与删除
test('空跳表搜索与删除', () => {
  const sl = new Skiplist();
  assert.strictEqual(sl.search(42), false);
  assert.strictEqual(sl.erase(42), false);
});

// 9. 大规模测试
test('大规模：10000 个元素', () => {
  const sl = new Skiplist();
  for (let i = 0; i < 10000; i++) sl.add(i);
  for (let i = 0; i < 10000; i++) assert.strictEqual(sl.search(i), true);
});

console.log('\nA-H2 测试完成');
