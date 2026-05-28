# 将类重构为策略模式

## 任务描述

我开发了一个订单折扣计算系统，现在有 6 种不同的折扣策略，全部用 if-else 写在同一个类里。每次新增一种折扣都要修改这个类，违反了开闭原则。帮我用策略模式重构它。

## 当前代码

```javascript
class DiscountCalculator {
  calculate(order, discountType) {
    if (discountType === 'percentage') {
      return order.total * (order.discountValue / 100);
    } else if (discountType === 'fixed') {
      return Math.min(order.discountValue, order.total);
    } else if (discountType === 'buyOneGetOne') {
      if (!order.items || order.items.length < 2) return 0;
      const freeItem = order.items.reduce((min, item) =>
        item.price < min.price ? item : min
      );
      return freeItem.price;
    } else if (discountType === 'loyalty') {
      const points = order.user?.loyaltyPoints || 0;
      return Math.min(points * 0.1, order.total * 0.2);
    } else if (discountType === 'seasonal') {
      const now = new Date();
      const month = now.getMonth();
      // 夏季促销：6-8月 15% off
      if (month >= 5 && month <= 7) {
        return order.total * 0.15;
      }
      // 冬季促销：12月 20% off
      if (month === 11) {
        return order.total * 0.2;
      }
      return 0;
    } else if (discountType === 'coupon') {
      const coupon = order.coupon;
      if (!coupon || coupon.expiresAt < Date.now()) return 0;
      if (order.total < coupon.minPurchase) return 0;
      return coupon.type === 'percentage'
        ? order.total * (coupon.value / 100)
        : Math.min(coupon.value, order.total);
    } else {
      throw new Error(`未知折扣类型: ${discountType}`);
    }
  }
}
```

## 要求

1. 为每种折扣类型创建一个策略类，实现统一的 `calculate(order)` 接口
2. 创建一个 `DiscountContext` 类，根据折扣类型选择策略
3. 新增折扣类型时不需要修改已有代码
4. 如果 TypeScript 更好，可以用 interface 定义策略类型

## 语言要求

JavaScript 或 TypeScript（优先 TypeScript）。
