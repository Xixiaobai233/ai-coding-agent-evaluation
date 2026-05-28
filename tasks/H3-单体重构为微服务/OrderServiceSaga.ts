import { IOrderService } from './IOrderService';
import { IPaymentService } from './IPaymentService';
import { IInventoryService } from './IInventoryService';
import { IShippingService } from './IShippingService';
import { INotificationService } from './INotificationService';
import {
  CreateOrderDTO,
  OrderVO,
  InventoryReservation,
  PaymentResult,
} from './types';
import {
  BusinessError,
  PaymentFailedError,
  ShippingFailedError,
} from './errors';

/**
 * 订单创建 Saga 编排器
 *
 * 正向流程:
 *   InventoryService.reserve
 *   → PaymentService.charge
 *   → OrderService.create
 *   → ShippingService.createShipment
 *   → NotificationService.send
 *
 * 补偿事务:
 *   - 库存预留失败 → 直接返回错误（无补偿）
 *   - 支付失败 → 释放库存预留
 *   - 订单创建失败 → 退款 + 释放库存
 *   - 物流创建失败 → 标记订单需人工干预（不撤销支付和库存）
 *   - 通知失败 → 仅记录日志，不影响主流程
 */
export class OrderServiceSaga {
  constructor(
    private readonly orderService: IOrderService,
    private readonly paymentService: IPaymentService,
    private readonly inventoryService: IInventoryService,
    private readonly shippingService: IShippingService,
    private readonly notificationService: INotificationService,
  ) {}

  private calculateTotal(items: CreateOrderDTO['items']): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  async createOrder(
    dto: CreateOrderDTO,
    idempotencyKey: string,
  ): Promise<OrderVO> {
    const total = this.calculateTotal(dto.items);

    // ========================================
    // Step 1: 库存预留
    // ========================================
    let reservation: InventoryReservation;
    try {
      reservation = await this.inventoryService.reserve(
        dto.items,
        `${idempotencyKey}:inventory`,
      );
    } catch (error) {
      // 库存预留失败 → 直接返回错误，无需补偿
      if (error instanceof BusinessError) throw error;
      throw error;
    }

    // ========================================
    // Step 2: 支付扣款
    // ========================================
    let paymentResult: PaymentResult;
    try {
      paymentResult = await this.paymentService.charge(
        dto.paymentInfo,
        total,
        `${idempotencyKey}:payment`,
      );
      if (!paymentResult.success) {
        throw new PaymentFailedError(
          paymentResult.errorMessage || '支付失败',
        );
      }
    } catch (error) {
      // 支付失败 → 补偿: 释放库存预留
      await this.safeReleaseInventory(
        reservation.reservationId,
        `${idempotencyKey}:release-inventory`,
      );
      throw error;
    }

    // ========================================
    // Step 3: 创建订单
    // ========================================
    let order: OrderVO;
    try {
      order = await this.orderService.create(dto);
    } catch (error) {
      // 订单创建失败 → 补偿: 退款 + 释放库存
      await this.safeRefund(
        paymentResult.transactionId!,
        total,
        `${idempotencyKey}:refund`,
      );
      await this.safeReleaseInventory(
        reservation.reservationId,
        `${idempotencyKey}:release-inventory`,
      );
      throw error;
    }

    // ========================================
    // Step 4: 创建物流
    // ========================================
    try {
      const shipmentResult = await this.shippingService.createShipment(
        order.orderId,
        dto.items,
        `${idempotencyKey}:shipping`,
      );
      if (!shipmentResult.success) {
        throw new ShippingFailedError(
          shipmentResult.errorMessage || '物流创建失败，需要人工干预',
          order.orderId,
        );
      }
    } catch (error) {
      // 物流创建失败 → 标记订单需人工干预（不撤销支付和库存）
      await this.safeMarkNeedsIntervention(order.orderId);
      throw error;
    }

    // ========================================
    // Step 5: 发送通知（尽力而为）
    // ========================================
    try {
      await this.notificationService.sendEmail(
        dto.userId,
        '订单创建成功',
        `订单 ${order.orderId} 已创建`,
        `${idempotencyKey}:email`,
      );
      await this.notificationService.sendSMS(
        dto.userId,
        `您的订单 ${order.orderId} 已创建`,
        `${idempotencyKey}:sms`,
      );
    } catch {
      // 通知发送失败，不影响订单流程
    }

    return order;
  }

  // ========================================
  // 安全补偿方法（补偿操作本身失败时不抛异常）
  // ========================================

  private async safeReleaseInventory(
    reservationId: string,
    idempotencyKey: string,
  ): Promise<void> {
    try {
      await this.inventoryService.release(reservationId, idempotencyKey);
    } catch (error) {
      console.error(
        `[Saga 补偿] 库存释放失败 (reservationId=${reservationId}):`,
        error,
      );
    }
  }

  private async safeRefund(
    transactionId: string,
    amount: number,
    idempotencyKey: string,
  ): Promise<void> {
    try {
      await this.paymentService.refund(transactionId, amount, idempotencyKey);
    } catch (error) {
      console.error(
        `[Saga 补偿] 退款失败 (transactionId=${transactionId}):`,
        error,
      );
    }
  }

  private async safeMarkNeedsIntervention(orderId: string): Promise<void> {
    try {
      await this.orderService.markNeedsIntervention(orderId);
    } catch (error) {
      console.error(
        `[Saga 补偿] 标记人工干预失败 (orderId=${orderId}):`,
        error,
      );
    }
  }
}
