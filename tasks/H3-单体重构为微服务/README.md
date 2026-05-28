# 将单体重构为微服务接口

## 任务描述

我们有一个电商后台的单体应用，`OrderService` 类包含了订单、支付、库存、物流和通知的全部逻辑。现在要拆分为微服务架构，但我需要你先重构这个类的接口层，将它拆分为多个领域服务，并通过 HTTP API 通信。

当前 `OrderService` 做的事情：
- 创建订单并校验库存
- 处理支付扣款
- 扣减库存
- 安排物流发货
- 发送通知邮件/SMS

## 当前代码

```typescript
class OrderService {
  private db: Database;

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
      // 物流失败怎么办？都已经扣款扣库存了！
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

  // ... 还有 cancelOrder, refundOrder 等方法，同样臃肿
}
```

## 要求

将这个单体拆分为以下微服务的接口定义（interface / API 层）：

1. **OrderService** — 订单核心服务（创建、查询、取消订单）
2. **PaymentService** — 支付服务（处理支付、退款）
3. **InventoryService** — 库存服务（扣减、回滚库存）
4. **ShippingService** — 物流服务（创建运单、查询物流状态）
5. **NotificationService** — 通知服务（发送邮件、短信）

不需要实现真正的微服务通信（如 gRPC/消息队列），只需：
- 定义每个服务的 interface（TypeScript）
- 将 `createOrder` 方法改为调用这些微服务接口的编排模式
- 添加 Saga 模式的事务补偿逻辑（任一服务失败时回滚已执行的操作）

## 语言要求

TypeScript（必须使用 interface 和类型定义）。
