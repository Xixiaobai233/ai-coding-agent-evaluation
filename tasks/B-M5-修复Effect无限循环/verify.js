const fs = require('fs');
const code = fs.readFileSync('./UserList.jsx', 'utf-8');
const checks = [
  ['useMemo usage', code.includes('useMemo')],
  ['cleanup/AbortController', code.includes('return') && code.includes('abort')],
];
const p = checks.filter(c => c[1]).length;
console.log(`${p}/${checks.length} checks passed`);
