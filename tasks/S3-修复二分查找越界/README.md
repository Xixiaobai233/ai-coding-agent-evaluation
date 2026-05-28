# 修复二分查找越界

## 任务描述

我发现一个二分查找函数在某些输入下会报错或陷入死循环。帮我看看这段代码有什么问题并修复它。

当前代码的问题是：
- 在某些边界情况下会数组越界
- 在某些输入下会陷入死循环
- 整数溢出风险

## 代码

```javascript
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid;
    } else {
      right = mid;
    }
  }

  return -1;
}
```

## 语言要求

使用 JavaScript/TypeScript 实现。
