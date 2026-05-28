# 为工具函数写单元测试

## 任务描述

我这里有一些工具函数，但都没有单元测试。帮我为它们编写全面的单元测试，覆盖正常情况、边界情况、错误情况。

下面是需要测试的工具函数：

```javascript
// src/utils.js

/**
 * 格式化金额（分转元）
 * @param {number} cents - 金额（分），如 1990 表示 19.90 元
 * @returns {string} 格式化后的金额，如 "19.90"
 */
function formatMoney(cents) {
  if (cents === undefined || cents === null || isNaN(cents)) {
    throw new Error('无效的金额');
  }
  const yuan = Math.abs(cents) / 100;
  return `${cents < 0 ? '-' : ''}${yuan.toFixed(2)}`;
}

/**
 * 截断字符串，超出部分用省略号代替
 * @param {string} str - 原字符串
 * @param {number} maxLength - 最大长度（中文算 2 个字符）
 * @returns {string}
 */
function truncate(str, maxLength) {
  if (typeof str !== 'string') return '';
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    len += /[一-鿿]/.test(str[i]) ? 2 : 1;
    if (len > maxLength) return str.slice(0, i) + '...';
  }
  return str;
}

/**
 * 数组去重（支持对象数组，按指定 key 去重）
 * @param {T[]} arr - 原数组
 * @param {string} key - 去重依据的键名
 * @returns {T[]}
 */
function uniqueBy(arr, key) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  return arr.filter(item => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

module.exports = { formatMoney, truncate, uniqueBy };
```

## 要求

- 使用 Node.js 内置的 `node:test` 或 Jest
- 测试文件放在 `__tests__` 目录或与源文件同目录的 `.test.js` 文件
- 测试用例命名清晰，分组合理
- 覆盖率越高越好

## 语言要求

JavaScript。
