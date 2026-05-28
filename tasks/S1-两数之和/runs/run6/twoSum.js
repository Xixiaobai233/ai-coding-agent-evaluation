/**
 * 两数之和 - Run 6
 *
 * 给定一个整数数组 nums 和一个整数目标值 target，在该数组中找出和为目标值的两个整数，
 * 并返回它们的数组下标。
 *
 * 使用哈希表实现，时间复杂度 O(n)，空间复杂度 O(n)。
 *
 * @param {number[]} nums - 整数数组
 * @param {number} target - 目标值
 * @returns {number[]} 符合条件的两个下标，若不存在则返回空数组 []
 */
function twoSum(nums, target) {
  const indexMap = new Map();

  for (let i = 0; i < nums.length; i++) {
    const needed = target - nums[i];

    if (indexMap.has(needed)) {
      return [indexMap.get(needed), i];
    }

    indexMap.set(nums[i], i);
  }

  return [];
}

module.exports = { twoSum };
