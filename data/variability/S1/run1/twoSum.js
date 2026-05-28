/**
 * 两数之和 - 使用哈希表实现 O(n)
 *
 * @param {number[]} nums - 整数数组
 * @param {number} target - 目标值
 * @returns {number[]} 符合条件的两个下标，不存在则返回空数组
 */
function twoSum(nums, target) {
  const numMap = new Map();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (numMap.has(complement)) {
      return [numMap.get(complement), i];
    }
    numMap.set(nums[i], i);
  }

  return [];
}

module.exports = { twoSum };
