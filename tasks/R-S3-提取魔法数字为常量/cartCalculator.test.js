const { describe, it } = require('node:test');
const assert = require('node:assert').strict;
const { calculateCartTotal } = require('./refactor.js');

describe('calculateCartTotal', () => {
  it('should return zeros for empty cart', () => {
    const result = calculateCartTotal(null);
    assert.deepStrictEqual(result, { subtotal: 0, shipping: 0, tax: 0, total: 0 });
  });

  it('should return zeros for cart with no items', () => {
    const result = calculateCartTotal({ items: [] });
    assert.deepStrictEqual(result, { subtotal: 0, shipping: 0, tax: 0, total: 0 });
  });

  it('should calculate basic subtotal', () => {
    const cart = {
      items: [{ price: 1000, quantity: 2 }]
    };
    const result = calculateCartTotal(cart);
    assert.strictEqual(result.subtotal, 2000);
  });

  it('should apply shipping when subtotal under threshold', () => {
    const cart = {
      items: [{ price: 1000, quantity: 1 }]
    };
    const result = calculateCartTotal(cart);
    assert.strictEqual(result.shipping, 150);
  });

  it('should apply free shipping when subtotal >= 5000', () => {
    const cart = {
      items: [{ price: 2500, quantity: 2 }]
    };
    const result = calculateCartTotal(cart);
    assert.strictEqual(result.shipping, 0);
  });

  it('should add extra shipping for items beyond free limit', () => {
    const cart = {
      items: [
        { price: 100, quantity: 1 },
        { price: 100, quantity: 1 },
        { price: 100, quantity: 1 },
        { price: 100, quantity: 1 },
        { price: 100, quantity: 1 }
      ]
    };
    const result = calculateCartTotal(cart);
    // subtotal = 500 (< 5000), shipping = 150 + (5-3)*50 = 250
    assert.strictEqual(result.shipping, 250);
  });

  it('should add gift wrapping fee', () => {
    const cart = {
      items: [{ price: 1000, quantity: 1 }],
      giftWrapping: true
    };
    const result = calculateCartTotal(cart);
    assert.strictEqual(result.packaging, 30);
  });

  it('should add fragile packing fee for fragile items', () => {
    const cart = {
      items: [{ price: 1000, quantity: 1, fragile: true }],
      giftWrapping: true
    };
    const result = calculateCartTotal(cart);
    assert.strictEqual(result.packaging, 90); // 30 + 60
  });

  it('should use business tax rate for business customers', () => {
    const cart = {
      items: [{ price: 1000, quantity: 1 }],
      isBusiness: true
    };
    const result = calculateCartTotal(cart);
    // tax = (1000 + 150 + 0) * 0.05 = 57.5
    assert.strictEqual(result.tax, 57.5);
  });

  it('should use consumer tax rate for non-business customers', () => {
    const cart = {
      items: [{ price: 1000, quantity: 1 }],
      isBusiness: false
    };
    const result = calculateCartTotal(cart);
    // tax = (1000 + 150 + 0) * 0.13 = 149.5
    assert.strictEqual(result.tax, 149.5);
  });

  it('should calculate points correctly', () => {
    const cart = {
      items: [{ price: 5500, quantity: 1 }]
    };
    const result = calculateCartTotal(cart);
    // points = floor(5500 / 100) * 10 = 55 * 10 = 550
    assert.strictEqual(result.points, 550);
  });

  it('should apply bulk discount for large orders', () => {
    const cart = {
      items: [{ price: 25000, quantity: 1 }]
    };
    const result = calculateCartTotal(cart);
    // subtotal > 20000, discount = 25000 * 0.05 = 1250 (< 2000)
    // subtotal = 25000 - 1250 = 23750
    assert.strictEqual(result.subtotal, 23750);
    assert.strictEqual(result.shipping, 0);
  });

  it('should cap bulk discount at max', () => {
    const cart = {
      items: [{ price: 50000, quantity: 1 }]
    };
    const result = calculateCartTotal(cart);
    // discount = 50000 * 0.05 = 2500 > 2000, so capped at 2000
    // subtotal = 50000 - 2000 = 48000
    assert.strictEqual(result.subtotal, 48000);
  });

  it('should apply premium member discount (> 5 years)', () => {
    const cart = {
      items: [{ price: 1000, quantity: 1 }],
      memberYears: 6
    };
    const result = calculateCartTotal(cart);
    // subtotal = 1000 * 0.97 = 970
    assert.strictEqual(result.subtotal, 970);
  });

  it('should apply regular member discount (> 2 years)', () => {
    const cart = {
      items: [{ price: 1000, quantity: 1 }],
      memberYears: 3
    };
    const result = calculateCartTotal(cart);
    // subtotal = 1000 * 0.98 = 980
    assert.strictEqual(result.subtotal, 980);
  });

  it('should not apply member discount for <= 2 years', () => {
    const cart = {
      items: [{ price: 1000, quantity: 1 }],
      memberYears: 2
    };
    const result = calculateCartTotal(cart);
    assert.strictEqual(result.subtotal, 1000);
  });
});
