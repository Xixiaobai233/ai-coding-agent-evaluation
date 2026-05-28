/**
 * 单体 OrderService — 包含所有领域逻辑
 * 需要拆分为微服务接口 + Saga 编排
 */

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

interface PaymentInfo {
  cardNumber: string;
  cvv: string;
  expiryMonth: number;
  expiryYear: number;
}

interface Database {
  query(sql: string, params: any[]): Promise<any[]>;
  execute(sql: string, params: any[]): Promise<{ insertId: number }>;
}

class PaymentGateway {
  static async charge(info: PaymentInfo, amount: number): Promise<{ success: boolean; transactionId?: string }> {
    // 模拟支付网关调用
    return { success: true, transactionId: `txn_${Date.now()}` };
  }
}

class LogisticsAPI {
  static async createShipment(orderId: string, items: CartItem[]): Promise<{ success: boolean; trackingId?: string }> {
    return { success: true, trackingId: `SF_${Date.now()}` };
  }
}

class EmailService {
  static async send(to: string, subject: string, body: string): Promise<void> {
    console.log(`发送邮件到 ${to}: ${subject}`);
  }
}

class SMSService {
  static async send(to: string, message: string): Promise<void> {
    console.log(`发送短信到 ${to}: ${message}`);
  }
}

class OrderService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async createOrder(userId: string, items: CartItem[], paymentInfo: PaymentInfo) {
    // 1. 校验库存
    for (const item of items) {
      const stock = await this.db.query(
        `SELECT stock FROM products WHERE id = ?`, [item.productId]
      );
      if (stock[0].stock < item.quantity) {
        throw new Error(`商品 ${item.productId} 库存不足`);
      }
    }

    // 2. 计算总价
    let total = 0;
    for (const item of items) {
      const product = await this.db.query(
        `SELECT price FROM products WHERE id = ?`, [item.productId]
      );
      total += product[0].price * item.quantity;
    }

    // 3. 创建订单
    const orderResult = await this.db.execute(
      `INSERT INTO orders (user_id, total, status) VALUES (?, ?, 'pending')`,
      [userId, total]
    );
    const orderId = orderResult.insertId;

    // 4. 处理支付
    const paymentResult = await PaymentGateway.charge(paymentInfo, total);
    if (!paymentResult.success) {
      await this.db.execute(
        `UPDATE orders SET status = 'payment_failed' WHERE id = ?`, [orderId]
      );
      throw new Error('支付失败');
    }

    // 5. 扣减库存
    for (const item of items) {
      await this.db.execute(
        `UPDATE products SET stock = stock - ? WHERE id = ?`,
        [item.quantity, item.productId]
      );
    }

    // 6. 安排物流
    const logisticsResult = await LogisticsAPI.createShipment(orderId, items);
    if (!logisticsResult.success) {
      console.error('物流创建失败，需要人工干预');
    }

    // 7. 发送通知
    const user = await this.db.query(
      `SELECT email, phone FROM users WHERE id = ?`, [userId]
    );
    await EmailService.send(user[0].email, '订单创建成功', `订单 ${orderId} 已创建`);
    await SMSService.send(user[0].phone, `您的订单 ${orderId} 已创建`);

    // 8. 更新订单状态
    await this.db.execute(
      `UPDATE orders SET status = 'completed' WHERE id = ?`, [orderId]
    );

    return { orderId, total, status: 'completed' };
  }
}

export { OrderService, CartItem, PaymentInfo, Database };
