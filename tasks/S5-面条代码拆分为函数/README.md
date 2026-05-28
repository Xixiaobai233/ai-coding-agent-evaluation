# 将面条代码拆分为函数

## 任务描述

我有一个处理用户订单的函数，所有逻辑都揉在一个大函数里，又长又臭，根本无法维护。帮我把这段面条代码拆分成有意义的、可测试的小函数。

当前代码的问题：
- 单个函数超过 100 行
- 没有缩进、没有空行
- 多处重复逻辑
- 魔法数字和硬编码字符串
- 没有错误处理
- 没有注释

## 代码

```javascript
function processOrder(input) {
  const d = JSON.parse(input);
  let t = 0;
  for (let i = 0; i < d.items.length; i++) {
    const item = d.items[i];
    let p = item.price;
    if (item.category === 'electronics') {
      p = p * 0.95;
    } else if (item.category === 'clothing') {
      if (item.season === 'summer') {
        p = p * 0.8;
      } else if (item.season === 'winter') {
        p = p * 0.85;
      } else {
        p = p * 0.9;
      }
    } else if (item.category === 'food') {
      if (item.expiryDays < 3) {
        p = p * 0.5;
      } else if (item.expiryDays < 7) {
        p = p * 0.7;
      } else {
        p = p * 0.9;
      }
    } else {
      p = p * 0.98;
    }
    if (d.user.memberLevel === 'gold') {
      p = p * 0.9;
    } else if (d.user.memberLevel === 'silver') {
      p = p * 0.95;
    }
    if (d.couponCode === 'SAVE10' && t > 100) {
      p = p - 10;
    }
    t = t + p;
  }
  const shipping = t > 199 ? 0 : d.items.length * 5;
  t = t + shipping;
  const tax = t * 0.08;
  t = t + tax;
  if (d.user.memberLevel === 'gold' && d.items.length > 5) {
    t = t - 15;
  }
  return { total: Math.round(t * 100) / 100, shipping, tax, itemsCount: d.items.length };
}
```

## 语言要求

使用 JavaScript/TypeScript。
