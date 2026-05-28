/**
 * 两数之和 - Run 7
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
  const lookup = new Map();

  for (let pos = 0; pos < nums.length; pos++) {
    const currentVal = nums[pos];
    const want = target - currentVal;

    if (lookup.has(want)) {
      return [lookup.get(want), pos];
    }

    lookup.set(currentVal, pos);
  }

  return [];
}

module.exports = { twoSum };
