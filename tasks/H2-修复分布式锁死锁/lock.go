package main

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
)

const renewIntervalFactor = 3

// Lua 脚本：只删除 value 匹配的锁（身份校验）
var unlockScript = redis.NewScript(`
	if redis.call("GET", KEYS[1]) == ARGV[1] then
		return redis.call("DEL", KEYS[1])
	end
	return 0
`)

// Lua 脚本：只续期 value 匹配的锁（身份校验）
var renewScript = redis.NewScript(`
	if redis.call("GET", KEYS[1]) == ARGV[1] then
		return redis.call("PEXPIRE", KEYS[1], ARGV[2])
	end
	return 0
`)

// DistributedLock 基于 Redis 的分布式锁，支持身份校验与自动续期（看门狗模式）
type DistributedLock struct {
	client  *redis.Client
	key     string
	value   string
	ttl     time.Duration
	stopCh  chan struct{}
	stopped bool
	mu      sync.Mutex
}

// NewDistributedLock 创建分布式锁实例。
// 每个实例生成唯一的 value 用于身份标识。
func NewDistributedLock(client *redis.Client, key string, ttl time.Duration) *DistributedLock {
	return &DistributedLock{
		client: client,
		key:    key,
		value:  fmt.Sprintf("%d-%d", time.Now().UnixNano(), time.Now().UnixMicro()),
		ttl:    ttl,
		stopCh: make(chan struct{}),
	}
}

// Lock 尝试获取锁。
// 成功时启动看门狗 goroutine 自动续期，防止业务超时导致锁提前过期。
func (l *DistributedLock) Lock(ctx context.Context) bool {
	ok, err := l.client.SetNX(ctx, l.key, l.value, l.ttl).Result()
	if err != nil {
		return false
	}
	if ok {
		go l.watchdog()
	}
	return ok
}

// Unlock 使用 Lua 脚本原子地释放锁。
// 只有当前实例持有的锁（value 匹配）才会被删除，防止误删其他实例的锁。
// 幂等安全：多次调用不会 panic；对已释放/已过期的锁调用也是安全的。
func (l *DistributedLock) Unlock(ctx context.Context) {
	l.mu.Lock()
	if !l.stopped {
		close(l.stopCh)
		l.stopped = true
	}
	l.mu.Unlock()

	// Lua 脚本保证 GET + DEL 的原子性
	_ = unlockScript.Run(ctx, l.client, []string{l.key}, l.value)
}

// watchdog 看门狗 goroutine：定期续期，确保业务未完成时锁不过期。
// 每 TTL/3 时间续期一次，续期时校验 value 身份。
// 收到 stopCh 信号后退出。
func (l *DistributedLock) watchdog() {
	ticker := time.NewTicker(l.ttl / renewIntervalFactor)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			_ = renewScript.Run(context.Background(), l.client, []string{l.key}, l.value, fmt.Sprintf("%d", l.ttl.Milliseconds()))
		case <-l.stopCh:
			return
		}
	}
}
