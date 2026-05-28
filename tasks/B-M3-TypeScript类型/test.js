/**
 * JavaScript 版本的测试，避免 ts-node 的模块问题
 */

const assert = require('assert');

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

// 修复 1：null 检查
function getLength2(value) {
  if (value === null) return 0;
  return value.length;
}

test('修复 1：null 检查 - null 返回 0', () => {
  assert.strictEqual(getLength2(null), 0);
  assert.strictEqual(getLength2('hello'), 5);
  assert.strictEqual(getLength2(''), 0);
});

// 修复 2：typeof 类型守卫完整
function doubleValue2(value) {
  if (typeof value === 'string') {
    return value + value;
  }
  if (typeof value === 'number') {
    return value * 2;
  }
  throw new Error('unknown type');
}

test('修复 2：typeof 类型守卫完整', () => {
  assert.strictEqual(doubleValue2('ab'), 'abab');
  assert.strictEqual(doubleValue2(5), 10);
  assert.strictEqual(doubleValue2(-3), -6);
});

// 修复 3：in 操作符类型守卫
function makeSound2(animal) {
  if ('bark' in animal) {
    animal.bark();
  } else {
    animal.swim();
  }
}

test('修复 3：in 操作符类型守卫正确', () => {
  let dogBarked = false;
  let fishSwam = false;
  makeSound2({ bark: () => { dogBarked = true; }, run: () => {} });
  makeSound2({ swim: () => { fishSwam = true; } });
  assert.strictEqual(dogBarked, true);
  assert.strictEqual(fishSwam, true);
});

// 修复 4：discriminated union 完整处理
function getArea2(shape) {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle':
      return shape.base * shape.height / 2;
    default:
      throw new Error(`unknown kind: ${shape.kind}`);
  }
}

test('修复 4：discriminated union 完整处理', () => {
  const circleArea = getArea2({ kind: 'circle', radius: 5 });
  assert.ok(Math.abs(circleArea - Math.PI * 25) < 0.001);
  assert.strictEqual(getArea2({ kind: 'rectangle', width: 3, height: 4 }), 12);
  assert.strictEqual(getArea2({ kind: 'triangle', base: 6, height: 8 }), 24);
});

// 修复 5：Array.isArray 类型守卫
function processData2(data) {
  if (Array.isArray(data)) return data;
  return [data];
}

test('修复 5：Array.isArray 类型守卫正确', () => {
  assert.deepStrictEqual(processData2([1, 2, 3]), [1, 2, 3]);
  assert.deepStrictEqual(processData2(42), [42]);
});

// 修复 6：可选链操作符 - 修复：使用 ?? 而非 ||
function getCity2(user) {
  // 修复：使用 ?? 替代 ||，保留空字符串
  if (user.address == null) return 'unknown';
  return user.address.city ?? 'unknown';
}

test('修复 6：可选链操作符处理 undefined', () => {
  assert.strictEqual(getCity2({ name: 'Alice', address: { city: 'Tokyo' } }), 'Tokyo');
  assert.strictEqual(getCity2({ name: 'Bob' }), 'unknown');
  assert.strictEqual(getCity2({ name: 'Charlie', address: { city: '' } }), '');
});

console.log(`\nB-M3 测试完成: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
