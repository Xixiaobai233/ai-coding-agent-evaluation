import { describe, it, expect } from '@jest/globals';
import {
  PaymentFactory,
  CreditCardPayment,
  PayPalPayment,
  CryptoPayment,
  CreditCardPaymentCreator,
  PayPalPaymentCreator,
  CryptoPaymentCreator,
} from '../src/payment';

describe('PaymentFactory', () => {
  it('should create CreditCardPayment', () => {
    const payment = PaymentFactory.createPayment('credit_card');
    expect(payment).toBeInstanceOf(CreditCardPayment);
  });

  it('should create PayPalPayment', () => {
    const payment = PaymentFactory.createPayment('paypal');
    expect(payment).toBeInstanceOf(PayPalPayment);
  });

  it('should create CryptoPayment', () => {
    const payment = PaymentFactory.createPayment('crypto');
    expect(payment).toBeInstanceOf(CryptoPayment);
  });

  it('should throw for unknown type', () => {
    expect(() => (PaymentFactory as any).createPayment('bitcoin')).toThrow();
  });
});

describe('Payment.pay', () => {
  it('CreditCardPayment should return valid transaction ID', async () => {
    const payment = new CreditCardPayment();
    const result = await payment.pay(100);
    expect(result.success).toBe(true);
    expect(result.transactionId).toMatch(/^CC-/);
  });

  it('PayPalPayment should return valid transaction ID', async () => {
    const payment = new PayPalPayment();
    const result = await payment.pay(200);
    expect(result.success).toBe(true);
    expect(result.transactionId).toMatch(/^PP-/);
  });

  it('CryptoPayment should return valid transaction ID', async () => {
    const payment = new CryptoPayment();
    const result = await payment.pay(300);
    expect(result.success).toBe(true);
    expect(result.transactionId).toMatch(/^CRYPTO-/);
  });
});

describe('PaymentCreator (Factory Method)', () => {
  it('CreditCardPaymentCreator should process payment', async () => {
    const creator = new CreditCardPaymentCreator();
    const result = await creator.processPayment(150);
    expect(result.success).toBe(true);
  });

  it('PayPalPaymentCreator should process payment', async () => {
    const creator = new PayPalPaymentCreator();
    const result = await creator.processPayment(250);
    expect(result.success).toBe(true);
  });

  it('CryptoPaymentCreator should process payment', async () => {
    const creator = new CryptoPaymentCreator();
    const result = await creator.processPayment(350);
    expect(result.success).toBe(true);
  });
});
