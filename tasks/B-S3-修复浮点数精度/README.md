# 修复 JavaScript 浮点数精度问题

## 任务描述

我写了一个简单的购物车计算器，但在实际使用时发现某些金额加起来的结果不对。比如 `0.1 + 0.2` 竟然不等于 `0.3`，导致金额比较和总计出现奇怪的问题。

帮我看看这段代码有什么问题并修复它。

当前代码的问题：
- 浮点数运算结果不精确（如 `0.1 + 0.2 !== 0.3`）
- 金额比较时直接使用 `===` 会失败
- 累计金额会产生微小误差累积

## 代码

```javascript
/**
 * 购物车金额计算器
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
   */
  getSubtotal(price, quantity) {
    return price * quantity;
  }

  /**
   * 计算购物车总金额
   */
  getTotal() {
    let total = 0;
    for (const item of this.items) {
      total += this.getSubtotal(item.price, item.quantity);
    }
    return total;
  }

  /**
   * 检查金额是否相等（用于优惠券/折扣判断）
   */
  isEqual(a, b) {
    return a === b;
  }

  /**
   * 应用折扣：满 100 减 20
   */
  applyDiscount() {
    const total = this.getTotal();
    if (this.isEqual(total, 100) || total > 100) {
      return total - 20;
    }
    return total;
  }
}

// 使用示例
const cart = new CartCalculator();
cart.addItem(0.1, 3);    // 3 件单价 0.1 的商品
cart.addItem(0.2, 1);    // 1 件单价 0.2 的商品

console.log(cart.getTotal());       // 期望 0.5，但可能得到 0.5000000000000001
console.log(cart.applyDiscount());  // 可能因精度问题错误地应用了折扣
```

## 语言要求

使用 JavaScript/TypeScript 实现。
