const assert = require('node:assert');
const { describe, it } = require('node:test');
const binarySearch = require('./binarySearch');

describe('binarySearch', () => {
  it('中间元素: binarySearch([1,2,3,4,5], 3) => 2', () => {
    assert.strictEqual(binarySearch([1, 2, 3, 4, 5], 3), 2);
  });

  it('首元素: binarySearch([1,2,3,4,5], 1) => 0', () => {
    assert.strictEqual(binarySearch([1, 2, 3, 4, 5], 1), 0);
  });

  it('尾元素: binarySearch([1,2,3,4,5], 5) => 4', () => {
    assert.strictEqual(binarySearch([1, 2, 3, 4, 5], 5), 4);
  });

  it('不存在: binarySearch([1,2,3,4,5], 6) => -1', () => {
    assert.strictEqual(binarySearch([1, 2, 3, 4, 5], 6), -1);
  });

  it('空数组: binarySearch([], 1) => -1', () => {
    assert.strictEqual(binarySearch([], 1), -1);
  });

  it('单元素存在: binarySearch([1], 1) => 0', () => {
    assert.strictEqual(binarySearch([1], 1), 0);
  });

  it('单元素不存在: binarySearch([1], 2) => -1', () => {
    assert.strictEqual(binarySearch([1], 2), -1);
  });

  it('两个元素: binarySearch([1,3], 3) => 1', () => {
    assert.strictEqual(binarySearch([1, 3], 3), 1);
  });

  it('重复元素: 返回任意一个 2 的位置', () => {
    const result = binarySearch([1, 2, 2, 2, 3], 2);
    assert.ok(result === 1 || result === 2 || result === 3, `期望 1/2/3，实际 ${result}`);
  });

  it('大数组: 100000 元素搜索最后一个，应在 50ms 内返回', () => {
    const arr = Array.from({ length: 100000 }, (_, i) => i + 1);
    const start = Date.now();
    const result = binarySearch(arr, 100000);
    const elapsed = Date.now() - start;
    assert.strictEqual(result, 99999);
    assert.ok(elapsed < 50, `耗时 ${elapsed}ms，超过 50ms 限制`);
  });
});
