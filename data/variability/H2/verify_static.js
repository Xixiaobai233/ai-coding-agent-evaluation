const fs = require('fs');

function verifyLockFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  let passed = 0;
  const total = 6;
  const results = [];

  // Test 1: Lua 脚本解锁（原子性）
  if (code.includes('redis.NewScript') && code.includes('DEL') && code.includes('GET') && code.includes('KEYS[1]') && code.includes('ARGV[1]')) {
    results.push({ name: 'Lua原子解锁', pass: true, detail: '使用 Lua 脚本实现原子 GET+DEL' });
    passed++;
  } else {
    results.push({ name: 'Lua原子解锁', pass: false, detail: '缺少 Lua 原子解锁脚本' });
  }

  // Test 2: Lua 脚本续期
  if (code.includes('redis.NewScript') && code.includes('PEXPIRE')) {
    results.push({ name: 'Lua原子续期', pass: true, detail: '使用 Lua 脚本实现原子续期' });
    passed++;
  } else {
    results.push({ name: 'Lua原子续期', pass: false, detail: '缺少 Lua 续期脚本' });
  }

  // Test 3: 看门狗 goroutine
  if (code.includes('go ') && code.includes('watchdog') || code.includes('keepAlive') || code.includes('heartbeat') || code.includes('watch()')) {
    results.push({ name: '看门狗 goroutine', pass: true, detail: '存在后台续期 goroutine' });
    passed++;
  } else {
    results.push({ name: '看门狗 goroutine', pass: false, detail: '缺少看门狗' });
  }

  // Test 4: 锁身份校验（唯一 value）
  const hasUniqueID = code.includes('UnixNano') ||
    (code.includes('rand.') && code.includes('Uint64')) ||
    code.includes('UnixMilli');
  if (hasUniqueID) {
    results.push({ name: '唯一身份标识', pass: true, detail: '锁 value 包含时间戳/随机数，每个实例唯一' });
    passed++;
  } else {
    results.push({ name: '唯一身份标识', pass: false, detail: '锁 value 可能不唯一' });
  }

  // Test 5: 停止通道（stopCh/quit/done/sig/stopChan）
  if (code.includes('make(chan') && (code.includes('close(') || code.includes('stopCh') || code.includes('quit') || code.includes('done') || code.includes('sig') || code.includes('stopChan'))) {
    results.push({ name: '看门狗停止机制', pass: true, detail: '有 channel 控制看门狗生命周期' });
    passed++;
  } else {
    results.push({ name: '看门狗停止机制', pass: false, detail: '缺少停止机制' });
  }

  // Test 6: 幂等安全（双重 Unlock 保护）
  if (code.includes('stopped') || code.includes('unlocked') || code.includes('dead') || code.includes('isDead')) {
    results.push({ name: '幂等安全', pass: true, detail: '有标志位防止重复关闭 channel' });
    passed++;
  } else {
    results.push({ name: '幂等安全', pass: false, detail: '缺少幂等保护' });
  }

  console.log('\n======== H2 静态安全检查结果 ========');
  for (const r of results) {
    const status = r.pass ? '[PASS]' : '[FAIL]';
    console.log(`  ${status} ${r.name}: ${r.detail}`);
  }
  console.log('\n-----------------------');
  console.log(`总计: ${total}, 通过: ${passed}, 失败: ${total - passed}`);
  console.log('====================================\n');

  return { passed, total };
}

const args = process.argv.slice(2);
if (args.length > 0) {
  const result = verifyLockFile(args[0]);
  process.exit(result.passed === result.total ? 0 : 1);
}

module.exports = { verifyLockFile };
