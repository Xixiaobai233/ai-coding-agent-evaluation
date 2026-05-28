/**
 * 购物车金额计算器 —— 当前版本存在浮点数精度问题
 */
class CartCalculator {
  constructor() {
    this.items = [];
  }

  addItem(price, quantity) {
    this.items.push({ price, quantity });
  }

  /**
   * 计算某项商品的小计
   * BUG: price * quantity 可能产生浮点数精度误差
   */
  getSubtotal(price, quantity) {
    return price * quantity;
  }

  /**
   * 计算购物车总金额
   * BUG: 多次累加产生累积误差
   */
  getTotal() {
    let total = 0;
    for (const item of this.items) {
      total += this.getSubtotal(item.price, item.quantity);
    }
    return total;
  }

  /**
   * 检查金额是否相等
   * BUG: 直接使用 === 比较浮点数
   */
  isEqual(a, b) {
    return a === b;
  }

  /**
   * 应用折扣：满 100 减 20
   * BUG: 由于浮点数精度问题，总金额可能错误地触发或不触发折扣
   */
  applyDiscount() {
    const total = this.getTotal();
    // BUG: isEqual(100) 可能因为精度问题永远不成立
    if (this.isEqual(total, 100) || total > 100) {
      return total - 20;
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
