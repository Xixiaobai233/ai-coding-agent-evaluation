/**
 * Binary search - fixed implementation
 */
function binarySearch(arr, target) {
  let lo = 0;
  let hi = arr.length - 1;

  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    const v = arr[mid];

    if (v === target) return mid;
    if (v < target) lo = mid + 1;
    else hi = mid - 1;
  }

  return -1;
}

module.exports = binarySearch;
