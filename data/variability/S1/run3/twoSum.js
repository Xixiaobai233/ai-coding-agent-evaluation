/**
 * Two Sum - using Map with for...of iteration
 * @param {number[]} nums
 * @param {number} target
 * @returns {number[]}
 */
function twoSum(nums, target) {
  const seen = new Map();

  for (const [index, value] of nums.entries()) {
    const needed = target - value;
    if (seen.has(needed)) {
      return [seen.get(needed), index];
    }
    seen.set(value, index);
  }

  return [];
}

module.exports = { twoSum };
