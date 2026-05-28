/**
 * 合并两个有序数组
 *
 * 将 nums2 合并到 nums1 中，使 nums1 按非递减顺序排列。
 * 必须原地修改 nums1。
 *
 * @param {number[]} nums1 - 目标数组，长度为 m + n
 * @param {number} m - nums1 中有效元素个数
 * @param {number[]} nums2 - 源数组，长度为 n
 * @param {number} n - nums2 中有效元素个数
 */
function merge(nums1, m, nums2, n) {
  let p1 = m - 1;
  let p2 = n - 1;
  let p = m + n - 1;

  while (p1 >= 0 && p2 >= 0) {
    if (nums1[p1] > nums2[p2]) {
      nums1[p] = nums1[p1];
      p1--;
    } else {
      nums1[p] = nums2[p2];
      p2--;
    }
    p--;
  }

  while (p2 >= 0) {
    nums1[p] = nums2[p2];
    p2--;
    p--;
  }
}

module.exports = { merge };
