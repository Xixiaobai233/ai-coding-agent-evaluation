const fs = require('fs');
const path = require('path');

// 静态代码安全检查脚本（修复版）
function verifyLoginFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  let passed = 0;
  let total = 3;
  const results = [];

  // Test 1: 检查是否使用参数化查询
  // 应该检测到 .query() 或 .execute() 配合 ? 占位符
  const hasQueryCall = /\.(query|execute|prepare)\s*\(/.test(code);
  const hasPlaceholder = code.includes('?') && /['"`].*\?/.test(code);
  const hasConcatRisk = /\+\s*['"`]/.test(code) || /\$\{/.test(code);

  if (hasQueryCall && hasPlaceholder && !hasConcatRisk) {
    results.push({ name: '参数化查询', pass: true, detail: '使用了 ? 占位符，无字符串拼接' });
    passed++;
  } else if (hasConcatRisk) {
    results.push({ name: '参数化查询', pass: false, detail: '存在字符串拼接风险' });
  } else if (!hasPlaceholder) {
    results.push({ name: '参数化查询', pass: false, detail: '未检测到 ? 占位符' });
  } else {
    results.push({ name: '参数化查询', pass: false, detail: '未使用参数化查询' });
  }

  // Test 2: 检查是否使用 bcrypt
  if (code.includes('bcrypt') && (code.includes('compare') || code.includes('hash'))) {
    results.push({ name: '密码哈希', pass: true, detail: '使用了 bcrypt' });
    passed++;
  } else {
    results.push({ name: '密码哈希', pass: false, detail: '未使用 bcrypt' });
  }

  // Test 3: 检查输入验证
  if (/\btypeof\b/.test(code) || code.includes('isString') || code.includes('validate') || /\.type\b/.test(code)) {
    results.push({ name: '输入验证', pass: true, detail: '有类型检查' });
    passed++;
  } else {
    results.push({ name: '输入验证', pass: false, detail: '缺少输入验证' });
  }

  console.log('\n======== 安全检查结果 ========');
  for (const r of results) {
    const status = r.pass ? '[PASS]' : '[FAIL]';
    console.log(`  ${status} ${r.name}: ${r.detail}`);
  }
  console.log('\n-----------------------');
  console.log(`总计: ${total}, 通过: ${passed}, 失败: ${total - passed}`);
  console.log('==============================\n');

  return { passed, total };
}

// 如果直接运行
const args = process.argv.slice(2);
if (args.length > 0) {
  const result = verifyLoginFile(args[0]);
  process.exit(result.passed === result.total ? 0 : 1);
}

module.exports = { verifyLoginFile };
