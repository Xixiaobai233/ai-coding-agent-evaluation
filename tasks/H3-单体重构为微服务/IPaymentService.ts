import { PaymentInfo, PaymentResult } from './types';

/**
 * 支付微服务接口
 */
export interface IPaymentService {
  /** 支付扣款（带幂等键） */
  charge(
    paymentInfo: PaymentInfo,
    amount: number,
    idempotencyKey: string,
  ): Promise<PaymentResult>;

  /** 退款（带幂等键） */
  refund(
    transactionId: string,
    amount: number,
    idempotencyKey: string,
  ): Promise<void>;
}
