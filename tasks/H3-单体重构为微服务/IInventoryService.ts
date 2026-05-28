import { CartItem, InventoryReservation } from './types';

/**
 * 库存微服务接口
 */
export interface IInventoryService {
  /** 预留库存（带幂等键） */
  reserve(
    items: CartItem[],
    idempotencyKey: string,
  ): Promise<InventoryReservation>;

  /** 释放库存预留（带幂等键），用于 Saga 补偿 */
  release(
    reservationId: string,
    idempotencyKey: string,
  ): Promise<void>;
}
