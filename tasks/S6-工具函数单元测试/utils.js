/**
 * 工具函数集合 — 需要你编写单元测试
 */

function formatMoney(cents) {
  if (cents === undefined || cents === null || isNaN(cents)) {
    throw new Error('无效的金额');
  }
  const yuan = Math.abs(cents) / 100;
  return `${cents < 0 ? '-' : ''}${yuan.toFixed(2)}`;
}

function truncate(str, maxLength) {
  if (typeof str !== 'string') return '';
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    len += /[一-鿿]/.test(str[i]) ? 2 : 1;
    if (len > maxLength) return str.slice(0, i) + '...';
  }
  return str;
}

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
