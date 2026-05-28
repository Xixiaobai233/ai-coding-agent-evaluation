/**
 * 订单处理模块 — 重构版
 * 将面条代码拆分为有意义的、可测试的小函数
 */

// ==================== 常量定义（消除魔法数字） ====================

/** 电子产品折扣率 */
const DISCOUNT_ELECTRONICS = 0.95;
/** 服装-夏季折扣率 */
const DISCOUNT_CLOTHING_SUMMER = 0.80;
/** 服装-冬季折扣率 */
const DISCOUNT_CLOTHING_WINTER = 0.85;
/** 服装-其他季节折扣率 */
const DISCOUNT_CLOTHING_OTHER = 0.90;
/** 食品-临期（3天以内）折扣率 */
const DISCOUNT_FOOD_EXPIRY_SOON = 0.50;
/** 食品-接近过期（7天以内）折扣率 */
const DISCOUNT_FOOD_EXPIRY_WARN = 0.70;
/** 食品-其他折扣率 */
const DISCOUNT_FOOD_OTHER = 0.90;
/** 其他类别折扣率 */
const DISCOUNT_OTHER_CATEGORY = 0.98;

/** 金牌会员折扣率 */
const MEMBER_GOLD_DISCOUNT = 0.90;
/** 银牌会员折扣率 */
const MEMBER_SILVER_DISCOUNT = 0.95;

/** 优惠券 SAVE10 生效门槛（累计金额） */
const COUPON_SAVE10_THRESHOLD = 100;
/** 优惠券 SAVE10 减免金额 */
const COUPON_SAVE10_AMOUNT = 10;

/** 免运费门槛 */
const FREE_SHIPPING_THRESHOLD = 199;
/** 每件商品基础运费 */
const SHIPPING_PER_ITEM = 5;

/** 税率 */
const TAX_RATE = 0.08;

/** 金牌会员额外优惠的购买件数门槛 */
const GOLD_EXTRA_DISCOUNT_ITEM_THRESHOLD = 5;
/** 金牌会员额外优惠金额 */
const GOLD_EXTRA_DISCOUNT_AMOUNT = 15;

// ==================== 拆分后的函数 ====================

/**
 * 按商品类别计算折扣后的价格
 * @param {Object} item - 商品对象
 * @returns {number} 折扣后的价格
 */
function calculateItemDiscount(item) {
  const { category, price } = item;
  if (category === 'electronics') return price * DISCOUNT_ELECTRONICS;
  if (category === 'clothing') {
    const s = item.season;
    const rate = s === 'summer' ? DISCOUNT_CLOTHING_SUMMER
      : s === 'winter' ? DISCOUNT_CLOTHING_WINTER : DISCOUNT_CLOTHING_OTHER;
    return price * rate;
  }
  if (category === 'food') {
    const e = item.expiryDays;
    const rate = e < 3 ? DISCOUNT_FOOD_EXPIRY_SOON
      : e < 7 ? DISCOUNT_FOOD_EXPIRY_WARN : DISCOUNT_FOOD_OTHER;
    return price * rate;
  }
  return price * DISCOUNT_OTHER_CATEGORY;
}

/**
 * 按会员等级计算折扣
 * @param {number} price - 当前价格
 * @param {string} [memberLevel] - 会员等级（gold/silver/其他）
 * @returns {number} 折扣后的价格
 */
function calculateMemberDiscount(price, memberLevel) {
  if (memberLevel === 'gold') return price * MEMBER_GOLD_DISCOUNT;
  if (memberLevel === 'silver') return price * MEMBER_SILVER_DISCOUNT;
  return price;
}

/**
 * 应用优惠券折扣
 * @param {number} currentTotal - 当前累计金额
 * @param {string} [couponCode] - 优惠券代码
 * @returns {number} 优惠券减免金额
 */
function applyCoupon(currentTotal, couponCode) {
  if (couponCode === 'SAVE10' && currentTotal > COUPON_SAVE10_THRESHOLD) {
    return COUPON_SAVE10_AMOUNT;
  }
  return 0;
}

/**
 * 计算运费
 * @param {number} subtotal - 商品小计
 * @param {number} itemsCount - 商品数量
 * @returns {number} 运费金额
 */
function calculateShipping(subtotal, itemsCount) {
  return subtotal > FREE_SHIPPING_THRESHOLD ? 0 : itemsCount * SHIPPING_PER_ITEM;
}

/**
 * 计算税费
 * @param {number} amount - 计税基数
 * @returns {number} 税费金额
 */
function calculateTax(amount) {
  return amount * TAX_RATE;
}

/**
 * 应用金牌会员额外优惠
 * @param {number} total - 当前总价
 * @param {string} [memberLevel] - 会员等级
 * @param {number} itemsCount - 商品数量
 * @returns {number} 优惠后的总价
 */
function applyGoldMemberBenefit(total, memberLevel, itemsCount) {
  if (memberLevel === 'gold' && itemsCount > GOLD_EXTRA_DISCOUNT_ITEM_THRESHOLD) {
    return total - GOLD_EXTRA_DISCOUNT_AMOUNT;
  }
  return total;
}

/**
 * 处理用户订单
 * @param {string} input - JSON 格式的订单数据
 * @returns {{ total: number, shipping: number, tax: number, itemsCount: number }}
 * @throws {Error} 输入格式错误时抛出
 */
function processOrder(input) {
  let data;
  try { data = JSON.parse(input); } catch { throw new Error('无效的订单数据：JSON 格式错误'); }
  if (!Array.isArray(data.items)) throw new Error('无效的订单数据：缺少 items 数组');
  const memberLevel = data.user?.memberLevel;
  let total = 0;
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    total += calculateMemberDiscount(calculateItemDiscount(item), memberLevel)
      - applyCoupon(total, data.couponCode);
  }
  const shipping = calculateShipping(total, data.items.length);
  const tax = calculateTax(total + shipping);
  total = total + shipping + tax;
  total = applyGoldMemberBenefit(total, memberLevel, data.items.length);
  return { total: Math.round(total * 100) / 100, shipping, tax, itemsCount: data.items.length };
}

module.exports = { processOrder, calculateItemDiscount, calculateMemberDiscount, applyCoupon, calculateShipping, calculateTax, applyGoldMemberBenefit };
