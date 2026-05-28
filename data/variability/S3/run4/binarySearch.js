/**
 * Fixed binary search implementation
 * @param {number[]} arr - sorted array
 * @param {number} target - search target
 * @returns {number} index or -1
 */
function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    const mid = low + ((high - low) >>> 1);

    if (arr[mid] === target) {
      return mid;
    }
    if (arr[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return -1;
}

module.exports = binarySearch;
