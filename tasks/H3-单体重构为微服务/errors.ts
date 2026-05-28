/**
 * 自定义错误类型 — 区分业务错误和系统错误
 */

export class BusinessError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}

export class SystemError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'SystemError';
  }
}

/** 库存不足（业务错误，不可重试） */
export class InsufficientStockError extends BusinessError {
  constructor(productId: string) {
    super(`商品 ${productId} 库存不足`, 'INSUFFICIENT_STOCK');
    this.name = 'InsufficientStockError';
  }
}

/** 支付失败（业务错误，可触发 Saga 补偿） */
export class PaymentFailedError extends BusinessError {
  constructor(message: string = '支付失败') {
    super(message, 'PAYMENT_FAILED');
    this.name = 'PaymentFailedError';
  }
}

/** 订单不存在 */
export class OrderNotFoundError extends BusinessError {
  constructor(orderId: string) {
    super(`订单 ${orderId} 不存在`, 'ORDER_NOT_FOUND');
    this.name = 'OrderNotFoundError';
  }
}

/** 物流创建失败（需人工干预） */
export class ShippingFailedError extends BusinessError {
  public readonly orderId: string;

  constructor(message: string, orderId: string) {
    super(message, 'SHIPPING_FAILED');
    this.name = 'ShippingFailedError';
    this.orderId = orderId;
  }
}
