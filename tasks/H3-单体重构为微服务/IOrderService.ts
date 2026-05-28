import { CreateOrderDTO, OrderVO, OrderStatus } from './types';

/**
 * 订单核心微服务接口
 */
export interface IOrderService {
  /** 创建订单 */
  create(dto: CreateOrderDTO): Promise<OrderVO>;

  /** 查询订单 */
  findById(orderId: string): Promise<OrderVO | null>;

  /** 取消订单（带幂等键） */
  cancel(orderId: string, idempotencyKey: string): Promise<void>;

  /** 更新订单状态 */
  updateStatus(
    orderId: string,
    status: OrderStatus,
    idempotencyKey: string,
  ): Promise<void>;

  /** 标记订单需要人工干预 */
  markNeedsIntervention(orderId: string): Promise<void>;
}
