/**
 * 折扣计算器 — 策略模式重构版
 *
 * 每种折扣类型独立为一个策略类，实现统一的 calculate(order) 接口。
 * DiscountContext 负责根据折扣类型选择对应策略，支持运行时注册新策略。
 * 符合开闭原则：新增折扣类型无需修改已有代码。
 */

// ======================== 策略类 ========================

/**
 * 百分比折扣
 * 折扣金额 = 订单总额 × (折扣值 / 100)
 */
class PercentageDiscount {
  calculate(order) {
    return order.total * (order.discountValue / 100);
  }
}

/**
 * 固定金额折扣
 * 折扣金额 = min(折扣值, 订单总额)
 */
class FixedDiscount {
  calculate(order) {
    return Math.min(order.discountValue, order.total);
  }
}

/**
 * 买一送一
 * 免费获得订单中最便宜的商品
 */
class BuyOneGetOneDiscount {
  calculate(order) {
    if (!order.items || order.items.length < 2) return 0;
    const freeItem = order.items.reduce((min, item) =>
      item.price < min.price ? item : min
    );
    return freeItem.price;
  }
}

/**
 * 会员积分抵扣
 * 折扣金额 = min(积分 × 0.1, 订单总额 × 0.2)
 */
class LoyaltyDiscount {
  calculate(order) {
    const points = order.user?.loyaltyPoints || 0;
    return Math.min(points * 0.1, order.total * 0.2);
  }
}

/**
 * 季节性促销
 * 夏季(6-8月)：15% off
 * 冬季(12月)：20% off
 */
class SeasonalDiscount {
  calculate(order) {
    const now = new Date();
    const month = now.getMonth();
    if (month >= 5 && month <= 7) {
      return order.total * 0.15;
    }
    if (month === 11) {
      return order.total * 0.2;
    }
    return 0;
  }
}

/**
 * 优惠券
 * 支持百分比和固定金额两种类型
 */
class CouponDiscount {
  calculate(order) {
    const coupon = order.coupon;
    if (!coupon || coupon.expiresAt < Date.now()) return 0;
    if (order.total < coupon.minPurchase) return 0;
    return coupon.type === 'percentage'
      ? order.total * (coupon.value / 100)
      : Math.min(coupon.value, order.total);
  }
}

// ======================== 上下文 ========================

/**
 * 折扣上下文，维护策略注册表，对外提供统一的 calculate 接口
 */
class DiscountContext {
  constructor() {
    this._strategies = new Map();
    this._registerDefaults();
  }

  /** 注册默认的 6 种折扣策略 */
  _registerDefaults() {
    this.registerStrategy('percentage', new PercentageDiscount());
    this.registerStrategy('fixed', new FixedDiscount());
    this.registerStrategy('buyOneGetOne', new BuyOneGetOneDiscount());
    this.registerStrategy('loyalty', new LoyaltyDiscount());
    this.registerStrategy('seasonal', new SeasonalDiscount());
    this.registerStrategy('coupon', new CouponDiscount());
  }

  /**
   * 注册（或覆盖）一种折扣策略
   * @param {string} type - 折扣类型标识
   * @param {Object} strategy - 实现 calculate(order) 的策略对象
   */
  registerStrategy(type, strategy) {
    this._strategies.set(type, strategy);
  }

  /**
   * 计算折扣金额
   * @param {Object} order - 订单对象
   * @param {string} discountType - 折扣类型
   * @returns {number} 折扣金额
   */
  calculate(order, discountType) {
    const strategy = this._strategies.get(discountType);
    if (!strategy) {
      throw new Error(`未知折扣类型: ${discountType}`);
    }
    return strategy.calculate(order);
  }
}

module.exports = {
  DiscountContext,
  PercentageDiscount,
  FixedDiscount,
  BuyOneGetOneDiscount,
  LoyaltyDiscount,
  SeasonalDiscount,
  CouponDiscount,
};
