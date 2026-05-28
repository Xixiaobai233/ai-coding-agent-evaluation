// 验证闭包修复
const fs = require('fs');
const code = fs.readFileSync('./src/UserList.jsx', 'utf-8');

const checks = [
  ['useMemo', code.includes('useMemo')],
  ['useCallback missing', !code.includes('useCallback')],
  ['cleanup function', code.includes('return () =>') || code.includes('AbortController')],
  ['dependency array', code.includes('], [')],
];

let passed = 0;
checks.forEach(([name, ok]) => {
  if (ok) { passed++; console.log(`  PASS: ${name}`); }
  else { console.log(`  FAIL: ${name}`); }
});
console.log(`\n${passed}/${checks.length} checks passed`);
