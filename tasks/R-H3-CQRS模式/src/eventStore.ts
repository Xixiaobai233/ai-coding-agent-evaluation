/**
 * 事件存储 —— 记录所有领域事件，供读模型同步使用。
 * 在 CQRS 中，事件存储是 Command 侧的持久化基础，
 * 也是 Command 侧与 Query 侧之间的通信桥梁。
 */
import { DomainEvent, createEvent } from './models';

export class EventStore {
  private events: DomainEvent[] = [];

  /** 保存事件 */
  save(event: DomainEvent): void {
    this.events.push(event);
  }

  /** 获取某个聚合的所有事件 */
  getEventsForAggregate(aggregateId: string): DomainEvent[] {
    return this.events.filter(e => e.aggregateId === aggregateId);
  }

  /** 获取所有事件 */
  getAllEvents(): DomainEvent[] {
    return [...this.events];
  }

  /** 获取自某个时间之后的所有事件 */
  getEventsSince(timestamp: Date): DomainEvent[] {
    return this.events.filter(e => e.timestamp >= timestamp);
  }

  /** 清空存储 */
  clear(): void {
    this.events = [];
  }

  /** 获取事件数量 */
  get count(): number {
    return this.events.length;
  }
}
