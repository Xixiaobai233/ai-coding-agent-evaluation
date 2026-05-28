/**
 * CQRS 模式 —— 领域模型与事件定义
 *
 * Command Query Responsibility Segregation (CQRS)：
 * - Command 侧（写）：处理修改数据的命令，产生领域事件
 * - Query 侧（读）：提供高效的、针对查询优化的只读模型
 * - 两侧通过事件进行异步同步
 */
import { randomUUID } from 'crypto';

// ==================== 领域事件 ====================

export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

export function createEvent(
  eventType: string,
  aggregateId: string,
  data: Record<string, unknown>
): DomainEvent {
  return {
    eventId: randomUUID(),
    eventType,
    aggregateId,
    timestamp: new Date(),
    data,
  };
}

// ==================== 写模型（Command 侧）====================

/** 订单状态 */
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

/** 订单项 */
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

/** 订单聚合根（写模型） */
export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

/** 商品库存写模型 */
export interface ProductInventory {
  productId: string;
  stock: number;
  reserved: number;
  version: number;
}

// ==================== 读模型（Query 侧）====================

/** 订单读模型（为展示优化） */
export interface OrderReadModel {
  id: string;
  customerId: string;
  customerName: string;
  itemCount: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** 客户订单汇总读模型 */
export interface CustomerOrderSummary {
  customerId: string;
  customerName: string;
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
}

/** 商品销售统计读模型 */
export interface ProductSalesStats {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
  stockRemaining: number;
}

// ==================== 命令 ====================

export interface PlaceOrderCommand {
  customerId: string;
  customerName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface CancelOrderCommand {
  orderId: string;
  reason: string;
}

export interface ShipOrderCommand {
  orderId: string;
  trackingNumber: string;
}
