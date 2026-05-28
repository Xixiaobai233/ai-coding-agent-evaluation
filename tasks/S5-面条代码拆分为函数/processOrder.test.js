/**
 * processOrder 重构版单元测试
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { processOrder } = require('./order');

/**
 * 浮点数近似断言（处理 JS 浮点精度问题）
 */
function approxEqual(actual, expected, tolerance = 1e-10) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new assert.AssertionError({
      message: `Expected ${expected}, got ${actual} (tolerance: ${tolerance})`,
      actual,
      expected,
      operator: 'approxEqual',
    });
  }
}

describe('processOrder', () => {
  it('应正确处理示例订单：electronics + clothing + gold + SAVE10', () => {
    const input = JSON.stringify({
      user: { memberLevel: 'gold' },
      items: [
        { name: 'iPhone', price: 6999, category: 'electronics' },
        { name: 'T-Shirt', price: 199, category: 'clothing', season: 'summer' },
      ],
      couponCode: 'SAVE10',
    });

    const result = processOrder(input);

    // 预期计算过程：
    // Item 1: iPhone $6999 x 0.95(electronics) x 0.9(gold) = 5984.145
    //   coupon: running total = 0, 不触发
    // Item 2: T-Shirt $199 x 0.8(summer) x 0.9(gold) - $10(coupon) = 133.28
    //   coupon: running total = 5984.145 > 100, 触发减免
    // 小计: 5984.145 + 133.28 = 6117.425
    // 运费: 6117.425 > 199, 免运费 = 0
    // 税: 6117.425 x 0.08 = 489.394 (浮点: 489.39399999999995)
    // 总计: 6117.425 + 489.39399999999995 + 0 = 6606.819
    // 金牌+>5件? 否 (2件)
    // 取整: Math.round(6606.819 x 100) / 100 = 6606.82

    assert.strictEqual(result.total, 6606.82);
    assert.strictEqual(result.shipping, 0);
    approxEqual(result.tax, 489.394, 0.001);
    assert.strictEqual(result.itemsCount, 2);
  });

  it('应正确处理日用商品 + 非会员 + 有运费场景', () => {
    const input = JSON.stringify({
      user: { memberLevel: 'normal' },
      items: [
        { name: 'Notebook', price: 50, category: 'stationery' },
        { name: 'Pen', price: 10, category: 'stationery' },
      ],
    });

    const result = processOrder(input);

    // Item 1: 50 x 0.98(other) = 49, 普通会员无折扣
    // Item 2: 10 x 0.98(other) = 9.8
    // 小计: 49 + 9.8 = 58.8
    // 运费: 58.8 <= 199, 2 x 5 = 10
    // 税: (58.8 + 10) x 0.08 = 5.504
    // 总计: 58.8 + 10 + 5.504 = 74.304
    // 取整: 74.30

    assert.strictEqual(result.total, 74.30);
    assert.strictEqual(result.shipping, 10);
    assert.strictEqual(result.tax, 5.504);
    assert.strictEqual(result.itemsCount, 2);
  });

  it('应正确处理食品临期折扣 + 银牌会员', () => {
    const input = JSON.stringify({
      user: { memberLevel: 'silver' },
      items: [
        { name: 'Milk', price: 30, category: 'food', expiryDays: 2 },
        { name: 'Bread', price: 20, category: 'food', expiryDays: 5 },
        { name: 'Candy', price: 10, category: 'food', expiryDays: 30 },
      ],
    });

    const result = processOrder(input);

    // Item 1: Milk 30 x 0.5(expiry<3) = 15, x 0.95(silver) = 14.25
    // Item 2: Bread 20 x 0.7(expiry<7) = 14, x 0.95(silver) = 13.3 (浮点: 13.300000000000001)
    // Item 3: Candy 10 x 0.9(other food) = 9, x 0.95(silver) = 8.55
    // 小计: 14.25 + 13.300000000000001 + 8.55 = 36.100000000000001
    // 运费: 36.100000000000001 <= 199, 3 x 5 = 15
    // 税前合计: 51.100000000000001
    // 税: 51.100000000000001 x 0.08 = 4.0880000000000001 (浮点: 4.087999999999999)
    // 总计: 51.100000000000001 + 4.087999999999999 = 55.188
    // 取整: 55.19

    assert.strictEqual(result.total, 55.19);
    assert.strictEqual(result.shipping, 15);
    approxEqual(result.tax, 4.088, 0.001);
    assert.strictEqual(result.itemsCount, 3);
  });

  it('应正确处理金牌会员 + 超过5件 + 额外减免', () => {
    const input = JSON.stringify({
      user: { memberLevel: 'gold' },
      items: [
        { name: 'A', price: 100, category: 'electronics' },
        { name: 'B', price: 100, category: 'electronics' },
        { name: 'C', price: 100, category: 'electronics' },
        { name: 'D', price: 100, category: 'electronics' },
        { name: 'E', price: 100, category: 'electronics' },
        { name: 'F', price: 100, category: 'electronics' },
      ],
    });

    const result = processOrder(input);

    // 每件: 100 x 0.95(electronics) x 0.9(gold) = 85.5
    // 6件小计: 85.5 x 6 = 513
    // 运费: 513 > 199, 免运费 = 0
    // 税: 513 x 0.08 = 41.04
    // 小计: 513 + 41.04 = 554.04
    // 金牌+>5件: 554.04 - 15 = 539.04
    // 取整: 539.04

    assert.strictEqual(result.total, 539.04);
    assert.strictEqual(result.shipping, 0);
    assert.strictEqual(result.tax, 41.04);
    assert.strictEqual(result.itemsCount, 6);
  });

  it('输入无效 JSON 时应抛出错误', () => {
    assert.throws(() => processOrder('{invalid json'), { message: /JSON/ });
  });

  it('缺少 items 数组时应抛出错误', () => {
    assert.throws(() => processOrder('{}'), { message: /items/ });
  });

  it('items 不是数组时应抛出错误', () => {
    assert.throws(() => processOrder('{"items":"notarray"}'), { message: /items/ });
  });
});
