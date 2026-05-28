/**
 * 通知微服务接口
 */
export interface INotificationService {
  /** 发送邮件（带幂等键） */
  sendEmail(
    to: string,
    subject: string,
    body: string,
    idempotencyKey: string,
  ): Promise<void>;

  /** 发送短信（带幂等键） */
  sendSMS(
    to: string,
    message: string,
    idempotencyKey: string,
  ): Promise<void>;
}
