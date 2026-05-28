/**
 * 领域实体和 DTO/VO 类型定义
 */

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface PaymentInfo {
  cardNumber: string;
  cvv: string;
  expiryMonth: number;
  expiryYear: number;
}

export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  PAYMENT_FAILED = 'payment_failed',
  CANCELLED = 'cancelled',
  NEEDS_INTERVENTION = 'needs_intervention',
}

export interface OrderVO {
  orderId: string;
  userId: string;
  total: number;
  status: OrderStatus;
  createdAt: Date;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
}

export interface InventoryReservation {
  reservationId: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface ShipmentResult {
  success: boolean;
  trackingId?: string;
  errorMessage?: string;
}

export interface CreateOrderDTO {
  userId: string;
  items: CartItem[];
  paymentInfo: PaymentInfo;
}
