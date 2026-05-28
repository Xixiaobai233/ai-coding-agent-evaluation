/**
 * Command 侧 —— 处理所有数据修改操作。
 *
 * Command handlers 负责：
 * 1. 验证命令参数的合法性
 * 2. 执行领域逻辑
 * 3. 产生领域事件并保存到 EventStore
 * 4. 更新写模型
 *
 * 注意：Command 侧不直接服务于查询需求。
 */
import { randomUUID } from 'crypto';
import {
  PlaceOrderCommand,
  CancelOrderCommand,
  ShipOrderCommand,
  Order,
  OrderItem,
  OrderStatus,
  EventStore,
  createEvent,
} from './models';

export class OrderCommandHandler {
  private orders: Map<string, Order> = new Map();
  private eventStore: EventStore;

  constructor(eventStore: EventStore) {
    this.eventStore = eventStore;
  }

  /**
   * 处理 PlaceOrder 命令：创建新订单
   */
  async handlePlaceOrder(command: PlaceOrderCommand): Promise<Order> {
    this.validatePlaceOrder(command);

    const order: Order = {
      id: randomUUID(),
      customerId: command.customerId,
      items: command.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      status: 'pending',
      totalAmount: this.calculateTotal(command.items),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };

    // 保存订单
    this.orders.set(order.id, order);

    // 产生领域事件
    this.eventStore.save(createEvent('OrderPlaced', order.id, {
      orderId: order.id,
      customerId: order.customerId,
      items: order.items,
      totalAmount: order.totalAmount,
    } as Record<string, unknown>));

    return order;
  }

  /**
   * 处理 CancelOrder 命令：取消订单
   */
  async handleCancelOrder(command: CancelOrderCommand): Promise<Order> {
    const order = this.orders.get(command.orderId);
    if (!order) {
      throw new Error(`订单 ${command.orderId} 不存在`);
    }
    if (order.status === 'shipped' || order.status === 'delivered') {
      throw new Error(`订单已 ${order.status}，无法取消`);
    }
    if (order.status === 'cancelled') {
      throw new Error('订单已经取消');
    }

    order.status = 'cancelled';
    order.updatedAt = new Date();
    order.version++;

    this.eventStore.save(createEvent('OrderCancelled', order.id, {
      orderId: order.id,
      reason: command.reason,
    } as Record<string, unknown>));

    return order;
  }

  /**
   * 处理 ShipOrder 命令：发货
   */
  async handleShipOrder(command: ShipOrderCommand): Promise<Order> {
    const order = this.orders.get(command.orderId);
    if (!order) {
      throw new Error(`订单 ${command.orderId} 不存在`);
    }
    if (order.status !== 'confirmed') {
      throw new Error(`订单状态为 ${order.status}，不能发货`);
    }

    order.status = 'shipped';
    order.updatedAt = new Date();
    order.version++;

    this.eventStore.save(createEvent('OrderShipped', order.id, {
      orderId: order.id,
      trackingNumber: command.trackingNumber,
    } as Record<string, unknown>));

    return order;
  }

  /**
   * 模拟订单确认（常规流程：下单后自动确认）
   */
  async handleConfirmOrder(orderId: string): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`订单 ${orderId} 不存在`);
    }
    if (order.status !== 'pending') {
      throw new Error(`订单状态为 ${order.status}，无法确认`);
    }

    order.status = 'confirmed';
    order.updatedAt = new Date();
    order.version++;

    this.eventStore.save(createEvent('OrderConfirmed', order.id, {
      orderId: order.id,
    } as Record<string, unknown>));

    return order;
  }

  /** 获取订单（内部使用） */
  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  // ==================== 私有方法 ====================

  private validatePlaceOrder(command: PlaceOrderCommand): void {
    if (!command.customerId) throw new Error('客户 ID 不能为空');
    if (!command.items || command.items.length === 0) {
      throw new Error('订单必须包含至少一个商品');
    }
    for (const item of command.items) {
      if (item.quantity <= 0) throw new Error('商品数量必须为正数');
      if (item.unitPrice <= 0) throw new Error('商品单价必须为正数');
    }
  }

  private calculateTotal(
    items: Array<{ quantity: number; unitPrice: number }>
  ): number {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }
}
