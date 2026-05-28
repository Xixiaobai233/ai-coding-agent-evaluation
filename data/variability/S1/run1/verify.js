const { twoSum } = require('./twoSum.js');

// 测试用例：格式 [nums, target, 期望结果]
const testCases = [
  { nums: [2, 7, 11, 15], target: 9, expected: [0, 1], name: '普通情况' },
  { nums: [3, 3], target: 6, expected: [0, 1], name: '元素重复' },
  { nums: [3, 2, 4], target: 6, expected: [1, 2], name: '乱序匹配' },
  { nums: [1, 2, 3], target: 7, expected: [], name: '无解情况' },
  { nums: [-1, -2, -3, -4, -5], target: -8, expected: [2, 4], name: '负数参与' },
  { nums: [], target: 0, expected: [], name: '空数组' },
  { nums: [1], target: 1, expected: [], name: '单元素' },
];

let passed = 0;
let failed = 0;

for (const { nums, target, expected, name } of testCases) {
  const result = twoSum(nums, target);
  const resultStr = JSON.stringify(result);
  const expectedStr = JSON.stringify(expected);

  if (resultStr === expectedStr) {
    console.log(`  [PASS] ${name}: twoSum(${JSON.stringify(nums)}, ${target}) => ${resultStr}`);
    passed++;
  } else {
    console.log(`  [FAIL] ${name}: twoSum(${JSON.stringify(nums)}, ${target}) => ${resultStr}, 期望 ${expectedStr}`);
    failed++;
  }
}

console.log('\n====================');
console.log(`总计: ${testCases.length}, 通过: ${passed}, 失败: ${failed}`);
console.log('====================');

if (failed > 0) {
  process.exit(1);
}
