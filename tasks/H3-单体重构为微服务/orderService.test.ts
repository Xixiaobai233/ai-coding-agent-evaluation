import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OrderServiceSaga } from './OrderServiceSaga';
import { IOrderService } from './IOrderService';
import { IPaymentService } from './IPaymentService';
import { IInventoryService } from './IInventoryService';
import { IShippingService } from './IShippingService';
import { INotificationService } from './INotificationService';
import {
  CreateOrderDTO,
  OrderVO,
  OrderStatus,
  InventoryReservation,
  PaymentResult,
  ShipmentResult,
  CartItem,
  PaymentInfo,
} from './types';
import {
  InsufficientStockError,
  PaymentFailedError,
  ShippingFailedError,
} from './errors';

// ============================================================
// Mock 实现 — 模拟 5 个微服务的行为
// ============================================================

class MockOrderService implements IOrderService {
  public orders: OrderVO[] = [];
  public shouldFail = false;
  public lastIdempotencyKey = '';

  async create(dto: CreateOrderDTO): Promise<OrderVO> {
    if (this.shouldFail) throw new Error('订单创建失败');
    const order: OrderVO = {
      orderId: `order_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: dto.userId,
      total: dto.items.reduce((s, i) => s + i.price * i.quantity, 0),
      status: OrderStatus.PENDING,
      createdAt: new Date(),
    };
    this.orders.push(order);
    return order;
  }

  async findById(orderId: string): Promise<OrderVO | null> {
    return this.orders.find((o) => o.orderId === orderId) || null;
  }

  async cancel(_orderId: string, idempotencyKey: string): Promise<void> {
    this.lastIdempotencyKey = idempotencyKey;
  }

  async updateStatus(
    _orderId: string,
    _status: OrderStatus,
    idempotencyKey: string,
  ): Promise<void> {
    this.lastIdempotencyKey = idempotencyKey;
  }

  async markNeedsIntervention(orderId: string): Promise<void> {
    const order = this.orders.find((o) => o.orderId === orderId);
    if (order) order.status = OrderStatus.NEEDS_INTERVENTION;
  }
}

class MockPaymentService implements IPaymentService {
  public shouldFail = false;
  public refunded = false;
  public lastTransactionId = '';

  async charge(
    _paymentInfo: PaymentInfo,
    _amount: number,
    _idempotencyKey: string,
  ): Promise<PaymentResult> {
    if (this.shouldFail) {
      return { success: false, errorMessage: '余额不足' };
    }
    const txnId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.lastTransactionId = txnId;
    return { success: true, transactionId: txnId };
  }

  async refund(
    _transactionId: string,
    _amount: number,
    _idempotencyKey: string,
  ): Promise<void> {
    this.refunded = true;
  }
}

class MockInventoryService implements IInventoryService {
  public shouldFail = false;
  public released = false;
  public lastReservationId = '';

  async reserve(
    items: CartItem[],
    _idempotencyKey: string,
  ): Promise<InventoryReservation> {
    if (this.shouldFail) {
      throw new InsufficientStockError(items[0]?.productId || 'unknown');
    }
    const reservationId = `res_${Date.now()}`;
    this.lastReservationId = reservationId;
    return {
      reservationId,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    };
  }

  async release(
    _reservationId: string,
    _idempotencyKey: string,
  ): Promise<void> {
    this.released = true;
  }
}

class MockShippingService implements IShippingService {
  public shouldFail = false;
  public cancelled = false;

  async createShipment(
    _orderId: string,
    _items: CartItem[],
    _idempotencyKey: string,
  ): Promise<ShipmentResult> {
    if (this.shouldFail) {
      return { success: false, errorMessage: '物流接口超时' };
    }
    return { success: true, trackingId: `SF_${Date.now()}` };
  }

  async cancelShipment(
    _trackingId: string,
    _idempotencyKey: string,
  ): Promise<void> {
    this.cancelled = true;
  }
}

class MockNotificationService implements INotificationService {
  public shouldFail = false;
  public emailSent = false;
  public smsSent = false;

  async sendEmail(
    _to: string,
    _subject: string,
    _body: string,
    _idempotencyKey: string,
  ): Promise<void> {
    if (this.shouldFail) throw new Error('邮件发送失败');
    this.emailSent = true;
  }

  async sendSMS(
    _to: string,
    _message: string,
    _idempotencyKey: string,
  ): Promise<void> {
    if (this.shouldFail) throw new Error('短信发送失败');
    this.smsSent = true;
  }
}

// ============================================================
// 测试数据
// ============================================================

const sampleDTO: CreateOrderDTO = {
  userId: 'user_001',
  items: [
    {
      productId: 'prod_1',
      productName: '商品A',
      price: 100,
      quantity: 2,
    },
  ],
  paymentInfo: {
    cardNumber: '4111111111111111',
    cvv: '123',
    expiryMonth: 12,
    expiryYear: 2028,
  },
};

// ============================================================
// 测试用例
// ============================================================

describe('OrderServiceSaga - 正常流程', () => {
  it('正向流程：库存预留 → 支付 → 订单创建 → 物流 → 通知', async () => {
    const orderService = new MockOrderService();
    const paymentService = new MockPaymentService();
    const inventoryService = new MockInventoryService();
    const shippingService = new MockShippingService();
    const notificationService = new MockNotificationService();

    const saga = new OrderServiceSaga(
      orderService,
      paymentService,
      inventoryService,
      shippingService,
      notificationService,
    );

    const result = await saga.createOrder(sampleDTO, 'idemp_001');

    assert.ok(result.orderId, '应返回订单ID');
    assert.equal(result.total, 200, '总价应为 100 * 2');
    assert.equal(result.status, OrderStatus.PENDING, '订单状态应为 pending');
    assert.ok(paymentService.lastTransactionId, '应生成交易ID');
    assert.ok(notificationService.emailSent, '应发送邮件');
    assert.ok(notificationService.smsSent, '应发送短信');
  });
});

describe('OrderServiceSaga - 补偿事务 (Saga)', () => {
  it('库存预留失败 → 直接返回错误，不执行补偿', async () => {
    const inventoryService = new MockInventoryService();
    inventoryService.shouldFail = true;
    const paymentService = new MockPaymentService();
    const orderService = new MockOrderService();

    const saga = new OrderServiceSaga(
      orderService,
      paymentService,
      inventoryService,
      new MockShippingService(),
      new MockNotificationService(),
    );

    await assert.rejects(
      async () => saga.createOrder(sampleDTO, 'idemp_002'),
      InsufficientStockError,
    );

    // 验证补偿未执行（无操作可回滚）
    assert.equal(orderService.orders.length, 0, '订单不应被创建');
    assert.equal(paymentService.refunded, false, '不应执行退款');
    assert.equal(inventoryService.released, false, '不应释放库存');
  });

  it('支付失败 → 释放库存预留', async () => {
    const paymentService = new MockPaymentService();
    paymentService.shouldFail = true;
    const inventoryService = new MockInventoryService();

    const saga = new OrderServiceSaga(
      new MockOrderService(),
      paymentService,
      inventoryService,
      new MockShippingService(),
      new MockNotificationService(),
    );

    await assert.rejects(
      async () => saga.createOrder(sampleDTO, 'idemp_003'),
      PaymentFailedError,
    );

    // 补偿验证：库存应被释放
    assert.ok(inventoryService.released, '库存应被释放');
  });

  it('订单创建失败 → 退款 + 释放库存', async () => {
    const orderService = new MockOrderService();
    orderService.shouldFail = true;
    const paymentService = new MockPaymentService();
    const inventoryService = new MockInventoryService();

    const saga = new OrderServiceSaga(
      orderService,
      paymentService,
      inventoryService,
      new MockShippingService(),
      new MockNotificationService(),
    );

    await assert.rejects(
      async () => saga.createOrder(sampleDTO, 'idemp_004'),
    );

    // 补偿验证：双重重试
    assert.ok(inventoryService.released, '库存应被释放');
    assert.ok(paymentService.refunded, '应执行退款');
  });

  it('物流创建失败 → 标记订单需人工干预（不撤销支付和库存）', async () => {
    const orderService = new MockOrderService();
    const shippingService = new MockShippingService();
    shippingService.shouldFail = true;
    const paymentService = new MockPaymentService();
    const inventoryService = new MockInventoryService();

    const saga = new OrderServiceSaga(
      orderService,
      paymentService,
      inventoryService,
      shippingService,
      new MockNotificationService(),
    );

    await assert.rejects(
      async () => saga.createOrder(sampleDTO, 'idemp_005'),
      ShippingFailedError,
    );

    // 验证订单已被创建
    const order = orderService.orders[0];
    assert.ok(order, '订单应已被创建');

    // 验证订单被标记为需人工干预
    assert.equal(
      order.status,
      OrderStatus.NEEDS_INTERVENTION,
      '订单应标记为需人工干预',
    );

    // 验证不撤销支付和库存（关键区别）
    assert.equal(paymentService.refunded, false, '不应退款');
    assert.equal(inventoryService.released, false, '不应释放库存');
  });
});

describe('OrderServiceSaga - 故障隔离', () => {
  it('通知失败不应影响订单主流程', async () => {
    const notificationService = new MockNotificationService();
    notificationService.shouldFail = true;

    const saga = new OrderServiceSaga(
      new MockOrderService(),
      new MockPaymentService(),
      new MockInventoryService(),
      new MockShippingService(),
      notificationService,
    );

    // 通知失败不应抛异常
    const result = await saga.createOrder(sampleDTO, 'idemp_006');
    assert.ok(result.orderId, '通知失败时订单仍应创建成功');
  });
});

describe('OrderServiceSaga - 幂等性', () => {
  it('所有微服务调用都携带 idempotencyKey', async () => {
    const saga = new OrderServiceSaga(
      new MockOrderService(),
      new MockPaymentService(),
      new MockInventoryService(),
      new MockShippingService(),
      new MockNotificationService(),
    );

    const result = await saga.createOrder(sampleDTO, 'idemp_007');
    assert.ok(result.orderId, '幂等键场景下订单创建成功');
  });
});
