# 合并两个有序数组

## 任务描述

给定两个按非递减顺序排列的整数数组 `nums1` 和 `nums2`，以及它们的有效元素数量 `m` 和 `n`。请将 `nums2` 合并到 `nums1` 中，使合并后的数组同样按非递减顺序排列。

**注意：** `nums1` 的长度为 `m + n`，其中前 `m` 个元素是有效元素，后 `n` 个元素被设置为 0 占位。请直接在 `nums1` 上原地修改，不要返回新数组。

要求：
- 时间复杂度 O(m + n)
- 必须原地修改 `nums1`，不能使用额外数组
- 不要使用 JavaScript 内置的 sort 方法

## 示例

```javascript
// 示例 1
let nums1 = [1, 2, 3, 0, 0, 0], m = 3;
let nums2 = [2, 5, 6], n = 3;
merge(nums1, m, nums2, n);
console.log(nums1); // [1, 2, 2, 3, 5, 6]

// 示例 2
nums1 = [1], m = 1;
nums2 = [], n = 0;
merge(nums1, m, nums2, n);
console.log(nums1); // [1]

// 示例 3
nums1 = [0], m = 0;
nums2 = [1], n = 1;
merge(nums1, m, nums2, n);
console.log(nums1); // [1]
```

## 语言要求

使用 JavaScript 实现。
