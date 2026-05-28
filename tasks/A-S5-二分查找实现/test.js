/**
 * JS 实现的二分查找测试，用于验证算法正确性（Go 未安装时的替代方案）
 */

function search(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] === target) return mid;
    else if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

function searchLeftBound(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] < target) left = mid + 1;
    else if (nums[mid] > target) right = mid - 1;
    else right = mid - 1;
  }
  if (left >= nums.length || nums[left] !== target) return -1;
  return left;
}

function searchRightBound(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] < target) left = mid + 1;
    else if (nums[mid] > target) right = mid - 1;
    else left = mid + 1;
  }
  if (right < 0 || nums[right] !== target) return -1;
  return right;
}

const assert = require('assert');
let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS: ${name}`); }
  catch (e) { failed++; console.error(`  FAIL: ${name} - ${e.message}`); }
}

// Test search
test('search 基本', () => assert.strictEqual(search([1,2,3,4,5], 3), 2));
test('search 第一个', () => assert.strictEqual(search([1,2,3,4,5], 1), 0));
test('search 最后一个', () => assert.strictEqual(search([1,2,3,4,5], 5), 4));
test('search 不存在', () => assert.strictEqual(search([1,2,3,4,5], 0), -1));
test('search 空数组', () => assert.strictEqual(search([], 1), -1));
test('search 单元素', () => assert.strictEqual(search([1], 1), 0));

// Test searchLeftBound
test('leftBound 重复元素', () => assert.strictEqual(searchLeftBound([1,2,2,2,3], 2), 1));
test('leftBound 第一个', () => assert.strictEqual(searchLeftBound([1,2,2,2,3], 1), 0));
test('leftBound 最后一个', () => assert.strictEqual(searchLeftBound([1,2,2,2,3], 3), 4));
test('leftBound 不存在', () => assert.strictEqual(searchLeftBound([1,2,2,2,3], 0), -1));
test('leftBound 全部相同', () => assert.strictEqual(searchLeftBound([1,1,1], 1), 0));

// Test searchRightBound
test('rightBound 重复元素', () => assert.strictEqual(searchRightBound([1,2,2,2,3], 2), 3));
test('rightBound 第一个', () => assert.strictEqual(searchRightBound([1,2,2,2,3], 1), 0));
test('rightBound 不存在', () => assert.strictEqual(searchRightBound([1,2,2,2,3], 4), -1));
test('rightBound 全部相同', () => assert.strictEqual(searchRightBound([1,1,1], 1), 2));

console.log(`\nA-S5 测试完成: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
