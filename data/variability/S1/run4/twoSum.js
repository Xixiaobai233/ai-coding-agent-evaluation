/**
 * Two Sum implementation O(n) using hash map
 * @param {number[]} nums
 * @param {number} target
 * @returns {number[]}
 */
function twoSum(nums, target) {
  const map = Object.create(null);

  for (let i = 0; i < nums.length; ++i) {
    const val = nums[i];
    const diff = target - val;

    if (map[diff] !== undefined) {
      return [map[diff], i];
    }

    map[val] = i;
  }

  return [];
}

module.exports = { twoSum };
