/**
 * 二分查找 - 修正死循环和越界问题
 */
function binarySearch(arr, target) {
  let start = 0;
  let end = arr.length - 1;

  while (start <= end) {
    const pivot = start + Math.trunc((end - start) / 2);
    const pivotVal = arr[pivot];

    if (pivotVal === target) {
      return pivot;
    }
    if (pivotVal < target) {
      start = pivot + 1;
    } else {
      end = pivot - 1;
    }
  }

  return -1;
}

module.exports = binarySearch;
