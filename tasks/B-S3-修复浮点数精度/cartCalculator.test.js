const CartCalculator = require('./cartCalculator');

// 手动测试框架
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (e) {
    failed++;
    console.error(`  FAIL: ${name} - ${e.message}`);
  }
}

// 1. 简单加法
test('简单加法: 0.1 + 0.2 = 0.3', () => {
  const cart = new CartCalculator();
  cart.addItem(0.1, 1);
  cart.addItem(0.2, 1);
  const total = cart.getTotal();
  // 使用 epsilon 检查
  if (Math.abs(total - 0.3) > 1e-10) {
    throw new Error(`预期 0.3，实际 ${total}`);
  }
});

// 2. 多项累计
test('多项累计: 0.1+0.2+0.3 = 0.6', () => {
  const cart = new CartCalculator();
  [0.1, 0.2, 0.3].forEach(p => cart.addItem(p, 1));
  const total = cart.getTotal();
  if (Math.abs(total - 0.6) > 1e-10) {
    throw new Error(`预期 0.6，实际 ${total}`);
  }
});

// 3. 金额比较
test('金额比较: isEqual(0.1+0.2, 0.3) === true', () => {
  const cart = new CartCalculator();
  if (!cart.isEqual(0.1 + 0.2, 0.3)) {
    throw new Error('0.1+0.2 应等于 0.3');
  }
});

// 4. 折扣判断
test('折扣判断: 恰好 100 时触发', () => {
  const cart = new CartCalculator();
  cart.addItem(100, 1);
  const afterDiscount = cart.applyDiscount();
  if (Math.abs(afterDiscount - 80) > 1e-10) {
    throw new Error(`折扣后应为 80，实际 ${afterDiscount}`);
  }
});

// 5. 整数金额
test('整数金额不受影响', () => {
  const cart = new CartCalculator();
  cart.addItem(10, 3);
  const total = cart.getTotal();
  if (total !== 30) {
    throw new Error(`预期 30，实际 ${total}`);
  }
});

// 6. 保留两位小数
test('保留两位小数', () => {
  const cart = new CartCalculator();
  cart.addItem(0.1, 1);
  const formatted = cart.getFormattedTotal();
  if (formatted !== '0.10') {
    throw new Error(`预期 '0.10'，实际 '${formatted}'`);
  }
});

// 7. 大量商品
test('1000 件 0.99 商品总额 990.00', () => {
  const cart = new CartCalculator();
  for (let i = 0; i < 1000; i++) cart.addItem(0.99, 1);
  const total = cart.getTotal();
  if (Math.abs(total - 990.00) > 1e-10) {
    throw new Error(`预期 990.00，实际 ${total}`);
  }
});

// 8. 浮点数比较: isEqual 小误差
test('isEqual 容忍小误差', () => {
  const cart = new CartCalculator();
  if (!cart.isEqual(0.3, 0.30000000000000004)) {
    throw new Error('应容忍小误差');
  }
  if (cart.isEqual(0.3, 0.31)) {
    throw new Error('不应容忍大误差');
  }
});

// 9. 折扣大于 100 也触发
test('大于 100 也触发折扣', () => {
  const cart = new CartCalculator();
  cart.addItem(120, 1);
  const afterDiscount = cart.applyDiscount();
  if (Math.abs(afterDiscount - 100) > 1e-10) {
    throw new Error(`折扣后应为 100，实际 ${afterDiscount}`);
  }
});

// 10. 小金额不触发折扣
test('小于 100 不触发折扣', () => {
  const cart = new CartCalculator();
  cart.addItem(50, 1);
  const afterDiscount = cart.applyDiscount();
  if (Math.abs(afterDiscount - 50) > 1e-10) {
    throw new Error(`折扣前应为 50，实际 ${afterDiscount}`);
  }
});

console.log(`\nB-S3 测试完成: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
