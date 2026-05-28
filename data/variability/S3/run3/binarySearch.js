/**
 * 二分查找修复版
 *
 * 修复说明：
 * 1. left = mid → left = mid + 1，防止死循环
 * 2. right = mid → right = mid - 1，防止死循环
 * 3. (left+right)/2 → left+(right-left)/2，防止溢出
 * 4. 处理空数组边界情况（length-1 < 0 时直接返回 -1）
 */
function binarySearch(arr, target) {
  if (arr.length === 0) return -1;

  let l = 0;
  let r = arr.length - 1;

  while (l <= r) {
    const m = l + Math.floor((r - l) / 2);

    if (arr[m] === target) return m;
    if (arr[m] < target) l = m + 1;
    else r = m - 1;
  }

  return -1;
}

module.exports = binarySearch;
