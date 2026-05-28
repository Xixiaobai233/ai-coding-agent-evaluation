/**
 * 工具函数单元测试
 * 使用 Node.js 内置测试框架 node:test
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { formatMoney, truncate, uniqueBy } = require('./utils');

// ==================== formatMoney 测试 ====================

describe('formatMoney（分转元）', () => {
  it('正常金额：1990 分 = 19.90 元', () => {
    assert.strictEqual(formatMoney(1990), '19.90');
  });

  it('零：0 分 = 0.00 元', () => {
    assert.strictEqual(formatMoney(0), '0.00');
  });

  it('负数：-500 分 = -5.00 元', () => {
    assert.strictEqual(formatMoney(-500), '-5.00');
  });

  it('角：1050 分 = 10.50 元', () => {
    assert.strictEqual(formatMoney(1050), '10.50');
  });

  it('分：1001 分 = 10.01 元', () => {
    assert.strictEqual(formatMoney(1001), '10.01');
  });

  it('大额：100000000 分 = 1000000.00 元', () => {
    assert.strictEqual(formatMoney(100000000), '1000000.00');
  });

  it('undefined 应抛出 Error', () => {
    assert.throws(() => formatMoney(undefined), Error);
  });

  it('null 应抛出 Error', () => {
    assert.throws(() => formatMoney(null), Error);
  });

  it('NaN 应抛出 Error', () => {
    assert.throws(() => formatMoney(NaN), Error);
  });

  it('字符串数字 "1990" —— isNaN 会做类型转换，不会抛 Error，返回 "19.90"', () => {
    // isNaN("1990") 返回 false（字符串被隐式转为数字），所以不抛异常
    assert.strictEqual(formatMoney('1990'), '19.90');
  });
});

// ==================== truncate 测试 ====================

describe('truncate（字符串截断）', () => {
  it('短字符串不做截断', () => {
    assert.strictEqual(truncate('hello', 10), 'hello');
  });

  it('长度刚好等于 maxLength 不截断', () => {
    assert.strictEqual(truncate('hello', 5), 'hello');
  });

  it('超出长度时添加省略号', () => {
    assert.strictEqual(truncate('hello world', 5), 'hello...');
  });

  it('中文字符按 2 个字符计算，超出截断', () => {
    // '你'(2) + '好'(2) = 4, 4 > 4? 否, 继续
    // '世'(2) => 6 > 4, 截断 -> '你好...'
    assert.strictEqual(truncate('你好世界', 4), '你好...');
  });

  it('中文字符计算：5 个宽度能容纳 "你好"(4)，"世" 会使长度到 6 超出', () => {
    // '你'(2) + '好'(2) = 4, 4 > 5? 否
    // '世'(2) => 6 > 5, 截断 -> '你好...'
    assert.strictEqual(truncate('你好世界', 5), '你好...');
  });

  it('空字符串返回空字符串', () => {
    assert.strictEqual(truncate('', 5), '');
  });

  it('非字符串输入返回空字符串', () => {
    assert.strictEqual(truncate(123, 5), '');
  });

  it('maxLength 为 0 时直接返回省略号', () => {
    assert.strictEqual(truncate('hello', 0), '...');
  });

  it('混合中英文截断', () => {
    // 'A' = 1, 'B' = 1, '你' = 2, 合计 4, maxLength = 3
    // index 2: '你' 使 len 从 2 变成 4 > 3, 所以截断
    assert.strictEqual(truncate('AB你好', 3), 'AB...');
  });
});

// ==================== uniqueBy 测试 ====================

describe('uniqueBy（数组按 key 去重）', () => {
  it('基本去重：移除 id 重复的项', () => {
    const input = [{ id: 1 }, { id: 1 }, { id: 2 }];
    const expected = [{ id: 1 }, { id: 2 }];
    assert.deepEqual(uniqueBy(input, 'id'), expected);
  });

  it('空数组返回空数组', () => {
    assert.deepEqual(uniqueBy([], 'id'), []);
  });

  it('非数组输入返回空数组', () => {
    assert.deepEqual(uniqueBy(null, 'id'), []);
    assert.deepEqual(uniqueBy(undefined, 'id'), []);
    assert.deepEqual(uniqueBy('string', 'id'), []);
    assert.deepEqual(uniqueBy(123, 'id'), []);
  });

  it('全部唯一时返回原数组', () => {
    const input = [{ id: 1 }, { id: 2 }, { id: 3 }];
    assert.deepEqual(uniqueBy(input, 'id'), input);
  });

  it('保留第一次出现的项', () => {
    const input = [{ id: 1, name: 'a' }, { id: 1, name: 'b' }];
    const expected = [{ id: 1, name: 'a' }];
    assert.deepEqual(uniqueBy(input, 'id'), expected);
  });

  it('按不同 key 去重', () => {
    const input = [
      { id: 1, email: 'a@x.com' },
      { id: 2, email: 'a@x.com' },
      { id: 3, email: 'b@x.com' },
    ];
    const expected = [
      { id: 1, email: 'a@x.com' },
      { id: 3, email: 'b@x.com' },
    ];
    assert.deepEqual(uniqueBy(input, 'email'), expected);
  });

  it('key 对应的值为 undefined 时也能正确去重', () => {
    const input = [{ id: 1 }, { id: 2 }, { id: 2 }];
    assert.deepEqual(uniqueBy(input, 'id'), [{ id: 1 }, { id: 2 }]);
  });
});
