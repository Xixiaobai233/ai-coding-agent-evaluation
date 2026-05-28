/**
 * JS 实现的 Slice 引用传递测试，验证修复逻辑
 */

// 修复 1：AddItem 返回新 slice
function addItem(s, item) {
  return [...s, item];
}

// 修复 2：RemoveFirst
function removeFirst(s) {
  return s.slice(1);
}

// 修复 3：BatchProcess 创建副本
function batchProcess(data, batchSize) {
  if (batchSize <= 0) return null;
  const batches = [];
  for (let i = 0; i < data.length; i += batchSize) {
    const end = Math.min(i + batchSize, data.length);
    batches.push(data.slice(i, end)); // slice 创建副本
  }
  if (batches.length > 0) batches[0][0] = 999;
  return batches;
}

// 修复 4：GetData 返回副本
class DataStore {
  constructor() {
    this.data = [1, 2, 3, 4, 5];
  }
  getData() {
    return [...this.data];
  }
}

const assert = require('assert');
let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS: ${name}`); }
  catch (e) { failed++; console.error(`  FAIL: ${name} - ${e.message}`); }
}

test('AddItem 返回新数组', () => {
  const nums = [1, 2, 3];
  const result = addItem(nums, 4);
  assert.deepStrictEqual(result, [1, 2, 3, 4]);
  assert.strictEqual(nums.length, 3); // 原数据不变
});

test('RemoveFirst', () => {
  const nums = [1, 2, 3, 4];
  const result = removeFirst(nums);
  assert.deepStrictEqual(result, [2, 3, 4]);
  assert.strictEqual(nums[0], 1); // 原数据不变
});

test('BatchProcess 不影响原数组', () => {
  const data = [1, 2, 3, 4, 5, 6];
  const batches = batchProcess(data, 2);
  batches[0][0] = 999;
  assert.strictEqual(data[0], 1); // 原数据不受影响
  assert.deepStrictEqual(batches, [[999, 2], [3, 4], [5, 6]]);
});

test('BatchProcess 边界', () => {
  assert.deepStrictEqual(batchProcess([], 2), []);
  assert.strictEqual(batchProcess([1, 2], 0), null);
  const result = batchProcess([1, 2], 10);
  assert.deepStrictEqual(result, [[1, 2]]);
});

test('DataStore 封装', () => {
  const ds = new DataStore();
  const data = ds.getData();
  data[0] = 999;
  assert.strictEqual(ds.data[0], 1); // 内部数据不受影响
  assert.deepStrictEqual(ds.getData(), [1, 2, 3, 4, 5]); // 副本正确
});

console.log(`\nB-M4 测试完成: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
