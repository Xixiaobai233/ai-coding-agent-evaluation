/**
 * Two Sum - Map-based O(n) solution with early exit
 * @param {number[]} nums
 * @param {number} target
 * @returns {number[]}
 */
function twoSum(nums, target) {
  const indexByValue = new Map();

  for (let i = 0, len = nums.length; i < len; i++) {
    const complement = target - nums[i];
    const cached = indexByValue.get(complement);

    if (cached !== undefined) {
      return [cached, i];
    }

    indexByValue.set(nums[i], i);
  }

  return [];
}

module.exports = { twoSum };
