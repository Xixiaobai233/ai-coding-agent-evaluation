// ==================== 运费相关常量 ====================
const FREE_SHIPPING_THRESHOLD = 5000;   // 免运费门槛（单位：分）
const BASE_SHIPPING_COST = 150;         // 基础运费
const FREE_ITEM_LIMIT = 3;              // 免运费商品数量上限
const EXTRA_ITEM_SHIPPING_COST = 50;    // 超出部分的单件运费

// ==================== 包装费相关常量 ====================
const GIFT_WRAPPING_FEE = 30;           // 礼品包装费
const FRAGILE_PACKING_FEE = 60;         // 易碎品附加包装费

// ==================== 税率相关常量 ====================
const BUSINESS_TAX_RATE = 0.05;         // 企业税率
const CONSUMER_TAX_RATE = 0.13;         // 个人税率

// ==================== 积分相关常量 ====================
const POINTS_PER_UNIT = 10;             // 每单位积分
const POINTS_DIVISOR = 100;             // 积分计算除数

// ==================== 大额订单折扣 ====================
const BULK_DISCOUNT_THRESHOLD = 20000;  // 大额订单门槛（单位：分）
const BULK_DISCOUNT_RATE = 0.05;        // 大额折扣比例
const MAX_BULK_DISCOUNT = 2000;         // 大额折扣上限

// ==================== 会员折扣 ====================
const PREMIUM_MEMBER_YEARS = 5;                    // 高级会员年限
const PREMIUM_MEMBER_DISCOUNT_RATE = 0.97;         // 高级会员折扣率
const REGULAR_MEMBER_YEARS = 2;                    // 普通会员年限门槛
const REGULAR_MEMBER_DISCOUNT_RATE = 0.98;         // 普通会员折扣率

// ==================== 金额舍入常量 ====================
const ROUNDING_FACTOR = 100;            // 金额舍入因子

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
  if (subtotal < FREE_SHIPPING_THRESHOLD) {
    shipping = BASE_SHIPPING_COST;
    if (cart.items.length > FREE_ITEM_LIMIT) {
      shipping = shipping + (cart.items.length - FREE_ITEM_LIMIT) * EXTRA_ITEM_SHIPPING_COST;
    }
  }

  // 包装费
  let packaging = 0;
  if (cart.giftWrapping) {
    packaging = GIFT_WRAPPING_FEE;
    if (cart.items.some(i => i.fragile)) {
      packaging = packaging + FRAGILE_PACKING_FEE;
    }
  }

  // 税费计算
  const taxRate = cart.isBusiness ? BUSINESS_TAX_RATE : CONSUMER_TAX_RATE;
  let tax = (subtotal + shipping + packaging) * taxRate;

  // 积分
  let points = Math.floor(subtotal / POINTS_DIVISOR) * POINTS_PER_UNIT;

  // 大额订单折扣
  if (subtotal > BULK_DISCOUNT_THRESHOLD) {
    const discount = subtotal * BULK_DISCOUNT_RATE;
    if (discount < MAX_BULK_DISCOUNT) {
      subtotal = subtotal - discount;
    } else {
      subtotal = subtotal - MAX_BULK_DISCOUNT;
    }
  }

  // 会员额外折扣
  if (cart.memberYears > PREMIUM_MEMBER_YEARS) {
    subtotal = subtotal * PREMIUM_MEMBER_DISCOUNT_RATE;
  } else if (cart.memberYears > REGULAR_MEMBER_YEARS) {
    subtotal = subtotal * REGULAR_MEMBER_DISCOUNT_RATE;
  }

  const total = subtotal + shipping + packaging + tax;
  return {
    subtotal: Math.round(subtotal * ROUNDING_FACTOR) / ROUNDING_FACTOR,
    shipping: Math.round(shipping * ROUNDING_FACTOR) / ROUNDING_FACTOR,
    packaging: Math.round(packaging * ROUNDING_FACTOR) / ROUNDING_FACTOR,
    tax: Math.round(tax * ROUNDING_FACTOR) / ROUNDING_FACTOR,
    total: Math.round(total * ROUNDING_FACTOR) / ROUNDING_FACTOR,
    points
  };
}

module.exports = { calculateCartTotal };
