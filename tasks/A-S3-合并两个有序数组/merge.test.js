const { merge } = require('./template');
const assert = require('assert');

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
  } catch (e) {
    console.error(`  FAIL: ${name} - ${e.message}`);
    process.exitCode = 1;
  }
}

// 1. 正常合并
test('正常合并', () => {
  const nums1 = [1, 2, 3, 0, 0, 0];
  merge(nums1, 3, [2, 5, 6], 3);
  assert.ok(arraysEqual(nums1, [1, 2, 2, 3, 5, 6]));
});

// 2. nums2 为空
test('nums2 为空', () => {
  const nums1 = [1];
  merge(nums1, 1, [], 0);
  assert.ok(arraysEqual(nums1, [1]));
});

// 3. nums1 为空
test('nums1 为空', () => {
  const nums1 = [0];
  merge(nums1, 0, [1], 1);
  assert.ok(arraysEqual(nums1, [1]));
});

// 4. 全部逆序
test('全部逆序', () => {
  const nums1 = [4, 5, 6, 0, 0, 0];
  merge(nums1, 3, [1, 2, 3], 3);
  assert.ok(arraysEqual(nums1, [1, 2, 3, 4, 5, 6]));
});

// 5. 有重复元素
test('有重复元素', () => {
  const nums1 = [1, 1, 1, 0, 0];
  merge(nums1, 3, [1, 2], 2);
  assert.ok(arraysEqual(nums1, [1, 1, 1, 1, 2]));
});

// 6. 全部相同
test('全部相同', () => {
  const nums1 = [2, 2, 2, 0, 0, 0];
  merge(nums1, 3, [2, 2, 2], 3);
  assert.ok(arraysEqual(nums1, [2, 2, 2, 2, 2, 2]));
});

// 7. 负数处理
test('负数处理', () => {
  const nums1 = [-3, -1, 0, 0, 0, 0];
  merge(nums1, 3, [-2, 1, 2], 3);
  assert.ok(arraysEqual(nums1, [-3, -2, -1, 0, 1, 2]));
});

console.log('\nA-S3 测试完成');
