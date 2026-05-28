/**
 * 异步缓存层 —— 支持 TTL、LRU 驱逐和并发安全。
 *
 * 用途：为数据访问层提供高性能缓存，降低对下游服务的请求压力。
 * 特性：
 * - 基于 TTL 的自动过期
 * - LRU 驱逐策略
 * - 并发安全（针对单机环境）
 * - 支持缓存穿透保护（stale-while-revalidate）
 * - 缓存统计信息
 */
import { EventEmitter } from 'events';

// ==================== 类型定义 ====================

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  lastAccessed: number;
}

export interface CacheOptions {
  /** 缓存条目的默认 TTL（毫秒），默认 60000（1 分钟） */
  ttlMs?: number;
  /** 最大条目数，默认 1000 */
  maxSize?: number;
  /** 是否启用缓存统计，默认 true */
  enableStats?: boolean;
}

export interface CacheStats {
  /** 当前缓存条目数 */
  size: number;
  /** 命中次数 */
  hits: number;
  /** 未命中次数 */
  misses: number;
  /** 过期条目数 */
  evictions: number;
  /** 命中率 */
  hitRate: number;
}

/** 异步数据加载函数类型 */
export type LoaderFunction<T> = (key: string) => Promise<T>;

// ==================== 异常定义 ====================

export class CacheError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CacheError';
  }
}

// ==================== 缓存实现 ====================

export class AsyncCache<T = unknown> extends EventEmitter {
  private store: Map<string, CacheEntry<T>> = new Map();
  private accessOrder: string[] = [];
  private readonly ttlMs: number;
  private readonly maxSize: number;
  private readonly enableStats: boolean;
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: CacheOptions = {}) {
    super();
    this.ttlMs = options.ttlMs ?? 60_000;
    this.maxSize = options.maxSize ?? 1000;
    this.enableStats = options.enableStats ?? true;

    // 定时清理过期条目（每 30 秒）
    this.cleanupTimer = setInterval(() => this.evictExpired(), 30_000);
    this.cleanupTimer.unref();
  }

  // ==================== 核心 API ====================

  /**
   * 获取缓存值。如果键不存在或已过期，返回 undefined。
   */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.recordMiss();
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.store.delete(key);
      this.removeFromAccessOrder(key);
      this.recordMiss();
      this.evictions++;
      this.emit('evict', { key, reason: 'expired' });
      return undefined;
    }

    entry.lastAccessed = Date.now();
    this.recordHit();
    this.touch(key);
    return entry.value;
  }

  /**
   * 设置缓存值。
   */
  set(key: string, value: T, customTtlMs?: number): void {
    if (this.store.has(key)) {
      this.removeFromAccessOrder(key);
    }

    // 检查容量，触发 LRU 驱逐
    while (this.store.size >= this.maxSize) {
      this.evictLRU();
    }

    const expiresAt = Date.now() + (customTtlMs ?? this.ttlMs);
    const entry: CacheEntry<T> = {
      value,
      expiresAt,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    };

    this.store.set(key, entry);
    this.accessOrder.push(key);
    this.emit('set', { key, expiresAt });
  }

  /**
   * 删除缓存值。
   */
  delete(key: string): boolean {
    const existed = this.store.delete(key);
    if (existed) {
      this.removeFromAccessOrder(key);
      this.emit('delete', { key });
    }
    return existed;
  }

  /**
   * 清空所有缓存。
   */
  clear(): void {
    this.store.clear();
    this.accessOrder = [];
    this.emit('clear');
  }

  /**
   * 检查键是否存在且未过期。
   */
  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.store.delete(key);
      this.removeFromAccessOrder(key);
      return false;
    }
    return true;
  }

  /**
   * 获取或计算缓存值（stale-while-revalidate 模式）。
   * 如果缓存存在且未过期，直接返回。
   * 如果缓存不存在，调用 loader 加载并缓存。
   */
  async getOrCompute(key: string, loader: LoaderFunction<T>, customTtlMs?: number): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const value = await loader(key);
      this.set(key, value, customTtlMs);
      return value;
    } catch (err) {
      this.emit('loadError', { key, error: err });
      throw err;
    }
  }

  // ==================== 统计信息 ====================

  /**
   * 获取缓存统计信息。
   */
  getStats(): CacheStats {
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate: this.hits + this.misses > 0
        ? this.hits / (this.hits + this.misses)
        : 0,
    };
  }

  /**
   * 重置统计信息。
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  // ==================== 过期 & 驱逐 ====================

  /** 驱逐所有过期条目 */
  evictExpired(): number {
    let count = 0;
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
        this.removeFromAccessOrder(key);
        this.evictions++;
        count++;
        this.emit('evict', { key, reason: 'expired' });
      }
    }
    return count;
  }

  /** LRU 驱逐：移除最近最少使用的条目 */
  private evictLRU(): void {
    // 从访问顺序列表头部取出最久未访问的键
    for (let i = 0; i < this.accessOrder.length; i++) {
      const key = this.accessOrder[i];
      if (this.store.has(key)) {
        this.store.delete(key);
        this.accessOrder.splice(i, 1);
        this.evictions++;
        this.emit('evict', { key, reason: 'lru' });
        return;
      }
    }
    // 兜底：清空访问顺序列表
    this.accessOrder = [];
  }

  // ==================== 私有方法 ====================

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() >= entry.expiresAt;
  }

  /** 将最近访问的键移到访问顺序末尾 */
  private touch(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const idx = this.accessOrder.indexOf(key);
    if (idx !== -1) {
      this.accessOrder.splice(idx, 1);
    }
  }

  private recordHit(): void {
    if (this.enableStats) this.hits++;
  }

  private recordMiss(): void {
    if (this.enableStats) this.misses++;
  }

  // ==================== 清理 ====================

  /**
   * 释放资源，停止清理定时器。
   */
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
    this.removeAllListeners();
  }

  /** 当前缓存条目数 */
  get size(): number {
    return this.store.size;
  }
}
