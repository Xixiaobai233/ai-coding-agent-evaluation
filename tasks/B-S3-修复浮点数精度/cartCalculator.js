/**
 * 购物车金额计算器 —— 修复浮点数精度问题
 */

const EPSILON = 1e-10;

/**
 * 高精度加法，消除浮点误差
 */
function preciseAdd(a, b) {
  const factor = Math.pow(10, Math.max(decimalPlaces(a), decimalPlaces(b)));
  return Math.round(a * factor + b * factor) / factor;
}

/**
 * 高精度乘法，消除浮点误差
 */
function preciseMultiply(a, b) {
  const factor = Math.pow(10, Math.max(decimalPlaces(a), decimalPlaces(b)));
  const result = (Math.round(a * factor) * Math.round(b * factor)) / (factor * factor);
  return result;
}

function decimalPlaces(n) {
  const str = String(n);
  const idx = str.indexOf('.');
  return idx === -1 ? 0 : str.length - idx - 1;
}

class CartCalculator {
  constructor() {
    this.items = [];
  }

  addItem(price, quantity) {
    this.items.push({ price, quantity });
  }

  /**
   * 计算某项商品的小计
   * 修复：使用高精度乘法
   */
  getSubtotal(price, quantity) {
    // 将金额转为以分为单位避免浮点误差
    const priceCents = Math.round(price * 100);
    const subtotalCents = priceCents * quantity;
    return subtotalCents / 100;
  }

  /**
   * 计算购物车总金额
   * 修复：使用分（整数）累加，避免累积误差
   */
  getTotal() {
    let totalCents = 0;
    for (const item of this.items) {
      const priceCents = Math.round(item.price * 100);
      totalCents += priceCents * item.quantity;
    }
    return totalCents / 100;
  }

  /**
   * 检查金额是否相等
   * 修复：使用误差容忍（epsilon）比较
   */
  isEqual(a, b) {
    return Math.abs(a - b) < EPSILON;
  }

  /**
   * 应用折扣：满 100 减 20
   * 修复：使用 isEqual 配合 epsilon 比较
   */
  applyDiscount() {
    const total = this.getTotal();
    if (total >= 100 || this.isEqual(total, 100)) {
      return Math.round((total - 20) * 100) / 100;
    }
    return total;
  }

  /**
   * 获取格式化后的总额（保留两位小数）
   */
  getFormattedTotal() {
    return this.getTotal().toFixed(2);
  }
}

module.exports = CartCalculator;
