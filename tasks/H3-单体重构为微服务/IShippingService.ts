import { CartItem, ShipmentResult } from './types';

/**
 * 物流微服务接口
 */
export interface IShippingService {
  /** 创建运单（带幂等键） */
  createShipment(
    orderId: string,
    items: CartItem[],
    idempotencyKey: string,
  ): Promise<ShipmentResult>;

  /** 取消运单（带幂等键） */
  cancelShipment(
    trackingId: string,
    idempotencyKey: string,
  ): Promise<void>;
}
