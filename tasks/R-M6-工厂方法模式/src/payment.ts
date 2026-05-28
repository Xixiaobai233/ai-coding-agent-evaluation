/**
 * 工厂方法模式 —— 支付处理器
 *
 * 问题：客户端代码直接 new CreditCardPayment() / new PayPalPayment() / new CryptoPayment()
 *       导致与具体类紧耦合，新增支付方式需要修改多处调用点。
 *
 * 方案：PaymentFactory 提供 createPayment 工厂方法，客户端只需提供类型字符串，
 *       对象的创建逻辑集中管理，符合开闭原则。
 */

// ==================== 产品接口 ====================

export interface PaymentResult {
  success: boolean;
  transactionId: string;
}

export interface Payment {
  pay(amount: number): Promise<PaymentResult>;
}

// ==================== 具体产品 ====================

export class CreditCardPayment implements Payment {
  async pay(amount: number): Promise<PaymentResult> {
    // 模拟信用卡支付处理
    return {
      success: true,
      transactionId: `CC-${Date.now()}-${this.randomHex()}`,
    };
  }

  private randomHex(): string {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }
}

export class PayPalPayment implements Payment {
  async pay(amount: number): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: `PP-${Date.now()}-${this.randomHex()}`,
    };
  }

  private randomHex(): string {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }
}

export class CryptoPayment implements Payment {
  async pay(amount: number): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: `CRYPTO-${Date.now()}-${this.randomHex()}`,
    };
  }

  private randomHex(): string {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }
}

// ==================== 静态工厂 ====================

export type PaymentType = 'credit_card' | 'paypal' | 'crypto';

/**
 * 支付工厂 —— 集中管理支付对象的创建。
 * 新增支付方式只需在此添加 case，客户端代码无需修改。
 */
export class PaymentFactory {
  static createPayment(type: PaymentType): Payment {
    switch (type) {
      case 'credit_card':
        return new CreditCardPayment();
      case 'paypal':
        return new PayPalPayment();
      case 'crypto':
        return new CryptoPayment();
      default: {
        // TypeScript 穷举检查：如果 type 未被所有 case 覆盖，此处会编译错误
        const _exhaustive: never = type;
        throw new Error(`Unknown payment type: ${_exhaustive}`);
      }
    }
  }
}

// ==================== 工厂方法模式（完整版）====================

/**
 * 工厂方法模式的经典实现：Creator 定义抽象的 factory method，
 * 由 ConcreteCreator 决定实例化哪个 ConcreteProduct。
 */

export abstract class PaymentCreator {
  /** 工厂方法 —— 由子类实现 */
  abstract createPayment(): Payment;

  /** 在 Creator 中使用工厂方法 */
  async processPayment(amount: number): Promise<PaymentResult> {
    const payment = this.createPayment();
    // 可以在此添加公共逻辑（日志、验证等）
    return payment.pay(amount);
  }
}

export class CreditCardPaymentCreator extends PaymentCreator {
  createPayment(): Payment {
    return new CreditCardPayment();
  }
}

export class PayPalPaymentCreator extends PaymentCreator {
  createPayment(): Payment {
    return new PayPalPayment();
  }
}

export class CryptoPaymentCreator extends PaymentCreator {
  createPayment(): Payment {
    return new CryptoPayment();
  }
}
