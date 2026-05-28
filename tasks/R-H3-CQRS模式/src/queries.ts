/**
 * Query 侧 —— 提供高效的只读查询接口。
 *
 * 读模型是专门为展示/查询优化的数据结构，与写模型完全分离：
 * - 读模型可以包含冗余数据（反范式化）以加速查询
 * - 读模型通过订阅 EventStore 的事件来保持同步
 * - 读模型的变化不会影响写模型的领域逻辑
 */
import {
  OrderReadModel,
  CustomerOrderSummary,
  ProductSalesStats,
  DomainEvent,
  EventStore,
} from './models';

export class OrderQueryHandler {
  /** 读模型：订单列表 */
  private orderReadModels: Map<string, OrderReadModel> = new Map();

  /** 读模型：客户汇总 */
  private customerSummaries: Map<string, CustomerOrderSummary> = new Map();

  /** 读模型：商品销售统计 */
  private productStats: Map<string, ProductSalesStats> = new Map();

  constructor(eventStore?: EventStore) {
    if (eventStore) {
      this.rebuildFromEvents(eventStore);
    }
  }

  // ==================== 订阅事件并更新读模型 ====================

  /**
   * 从 EventStore 重建所有读模型（事件溯源）。
   */
  rebuildFromEvents(eventStore: EventStore): void {
    this.orderReadModels.clear();
    this.customerSummaries.clear();
    this.productStats.clear();

    const events = eventStore.getAllEvents();
    for (const event of events) {
      this.applyEvent(event);
    }
  }

  /**
   * 处理一个领域事件，更新读模型。
   */
  applyEvent(event: DomainEvent): void {
    switch (event.eventType) {
      case 'OrderPlaced':
        this.handleOrderPlaced(event);
        break;
      case 'OrderConfirmed':
        this.handleOrderConfirmed(event);
        break;
      case 'OrderShipped':
        this.handleOrderShipped(event);
        break;
      case 'OrderCancelled':
        this.handleOrderCancelled(event);
        break;
    }
  }

  private handleOrderPlaced(event: DomainEvent): void {
    const data = event.data as unknown as {
      orderId: string;
      customerId: string;
      items: Array<{ productId: string; productName: string; quantity: number; unitPrice: number }>;
      totalAmount: number;
    };

    // 更新订单读模型
    this.orderReadModels.set(data.orderId, {
      id: data.orderId,
      customerId: data.customerId,
      customerName: '', // 可以从客户服务获取
      itemCount: data.items.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: data.totalAmount,
      status: 'pending',
      createdAt: event.timestamp,
      updatedAt: event.timestamp,
    });

    // 更新客户汇总
    const summary = this.customerSummaries.get(data.customerId) || {
      customerId: data.customerId,
      customerName: '',
      totalOrders: 0,
      totalSpent: 0,
      pendingOrders: 0,
    };
    summary.totalOrders++;
    summary.totalSpent += data.totalAmount;
    summary.pendingOrders++;
    this.customerSummaries.set(data.customerId, summary);

    // 更新商品销售统计
    for (const item of data.items) {
      const stats = this.productStats.get(item.productId) || {
        productId: item.productId,
        productName: item.productName,
        totalSold: 0,
        revenue: 0,
        stockRemaining: 100,
      };
      stats.totalSold += item.quantity;
      stats.revenue += item.quantity * item.unitPrice;
      this.productStats.set(item.productId, stats);
    }
  }

  private handleOrderConfirmed(event: DomainEvent): void {
    const data = event.data as unknown as { orderId: string };
    const order = this.orderReadModels.get(data.orderId);
    if (order) {
      order.status = 'confirmed';
      order.updatedAt = event.timestamp;
    }
  }

  private handleOrderShipped(event: DomainEvent): void {
    const data = event.data as unknown as { orderId: string };
    const order = this.orderReadModels.get(data.orderId);
    if (order) {
      order.status = 'shipped';
      order.updatedAt = event.timestamp;
    }
  }

  private handleOrderCancelled(event: DomainEvent): void {
    const data = event.data as unknown as { orderId: string; reason: string };
    const order = this.orderReadModels.get(data.orderId);
    if (order) {
      order.status = 'cancelled';
      order.updatedAt = event.timestamp;

      // 更新客户汇总中的待处理订单数
      const summary = this.customerSummaries.get(order.customerId);
      if (summary) {
        summary.pendingOrders = Math.max(0, summary.pendingOrders - 1);
      }
    }
  }

  // ==================== 查询方法 ====================

  /** 获取所有订单（读模型） */
  getAllOrders(): OrderReadModel[] {
    return Array.from(this.orderReadModels.values());
  }

  /** 根据 ID 获取订单 */
  getOrderById(orderId: string): OrderReadModel | undefined {
    return this.orderReadModels.get(orderId);
  }

  /** 根据状态筛选订单 */
  getOrdersByStatus(status: string): OrderReadModel[] {
    return this.getAllOrders().filter(o => o.status === status);
  }

  /** 获取客户订单汇总 */
  getCustomerSummary(customerId: string): CustomerOrderSummary | undefined {
    return this.customerSummaries.get(customerId);
  }

  /** 获取所有客户汇总 */
  getAllCustomerSummaries(): CustomerOrderSummary[] {
    return Array.from(this.customerSummaries.values());
  }

  /** 获取商品销售统计 */
  getProductStats(productId: string): ProductSalesStats | undefined {
    return this.productStats.get(productId);
  }

  /** 获取所有商品销售统计 */
  getAllProductStats(): ProductSalesStats[] {
    return Array.from(this.productStats.values());
  }

  /** 获取畅销商品排行 */
  getTopSellingProducts(limit: number = 5): ProductSalesStats[] {
    return this.getAllProductStats()
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit);
  }

  /** 获取高价值客户排行 */
  getTopCustomers(limit: number = 5): CustomerOrderSummary[] {
    return this.getAllCustomerSummaries()
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  }
}
