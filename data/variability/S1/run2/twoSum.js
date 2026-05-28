/**
 * Two Sum - using object as hash table O(n)
 * @param {number[]} nums
 * @param {number} target
 * @returns {number[]}
 */
function twoSum(nums, target) {
  const hash = {};

  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (need in hash) {
      return [hash[need], i];
    }
    hash[nums[i]] = i;
  }

  return [];
}

module.exports = { twoSum };
