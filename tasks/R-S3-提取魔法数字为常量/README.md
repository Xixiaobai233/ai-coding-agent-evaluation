# 提取魔法数字为常量

## 任务描述

我有一个计算购物车运费和税费的函数，里面散落着大量魔法数字。这些数字的含义完全不清楚，后续维护者看到代码一头雾水。帮我把所有魔法数字提取为有意义的常量。

## 当前代码

```javascript
function calculateCartTotal(cart) {
  if (!cart || !cart.items || cart.items.length === 0) {
    return { subtotal: 0, shipping: 0, tax: 0, total: 0 };
  }

  let subtotal = 0;
  for (const item of cart.items) {
    subtotal += item.price * item.quantity;
  }

  // 运费计算
  let shipping = 0;
  if (subtotal < 5000) {
    shipping = 150;
    if (cart.items.length > 3) {
      shipping = shipping + (cart.items.length - 3) * 50;
    }
  }

  // 包装费
  let packaging = 0;
  if (cart.giftWrapping) {
    packaging = 30;
    if (cart.items.some(i => i.fragile)) {
      packaging = packaging + 60;
    }
  }

  // 税费计算
  const taxRate = cart.isBusiness ? 0.05 : 0.13;
  let tax = (subtotal + shipping + packaging) * taxRate;

  // 积分
  let points = Math.floor(subtotal / 100) * 10;

  // 大额订单折扣
  if (subtotal > 20000) {
    const discount = subtotal * 0.05;
    if (discount < 2000) {
      subtotal = subtotal - discount;
    } else {
      subtotal = subtotal - 2000;
    }
  }

  // 会员额外折扣
  if (cart.memberYears > 5) {
    subtotal = subtotal * 0.97;
  } else if (cart.memberYears > 2) {
    subtotal = subtotal * 0.98;
  }

  const total = subtotal + shipping + packaging + tax;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    packaging: Math.round(packaging * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    points
  };
}
```

## 要求

1. 识别所有魔法数字（数值字面量和非枚举字符串）
2. 为每个魔法数字定义有语义的常量名，如 `FREE_SHIPPING_THRESHOLD = 5000`
3. 常量大写命名，分组注释
4. 功能逻辑完全不变

## 语言要求

JavaScript。
