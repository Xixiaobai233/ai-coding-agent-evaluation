# 修复分布式锁死锁

## 任务描述

我们有一个基于 Redis 的分布式锁实现，用于保证多个服务实例不会同时处理同一个任务。但这个实现在生产环境中偶尔会出现死锁——锁永远不会释放，导致任务队列积压。

帮我看一下这段代码有什么问题并修复。

## 当前代码

```go
package main

import (
	"context"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
)

type DistributedLock struct {
	client *redis.Client
	key    string
	value  string
	ttl    time.Duration
}

func NewDistributedLock(client *redis.Client, key string, ttl time.Duration) *DistributedLock {
	return &DistributedLock{
		client: client,
		key:    key,
		value:  fmt.Sprintf("%d", time.Now().UnixNano()),
		ttl:    ttl,
	}
}

// Lock 尝试获取锁
func (l *DistributedLock) Lock(ctx context.Context) bool {
	ok, err := l.client.SetNX(ctx, l.key, l.value, l.ttl).Result()
	if err != nil {
		return false
	}
	return ok
}

// Unlock 释放锁
func (l *DistributedLock) Unlock(ctx context.Context) {
	l.client.Del(ctx, l.key)
}

// 使用示例
func processTask(lock *DistributedLock, taskID string) {
	ctx := context.Background()

	if !lock.Lock(ctx) {
		fmt.Printf("任务 %s 正在被其他实例处理\n", taskID)
		return
	}
	defer lock.Unlock(ctx)

	// 模拟业务处理
	fmt.Printf("开始处理任务: %s\n", taskID)
	time.Sleep(5 * time.Second)

	// 突发情况：如果这里 panic 了，锁能释放吗？
	// 如果业务处理超过 TTL，其他实例获取了锁，当前实例释放了别人的锁怎么办？
}
```

已知问题：
1. 如果获取锁后的业务处理时间超过 TTL，锁自动过期，其他实例获取锁后，原实例释放了别人的锁
2. 如果业务代码 panic，`Unlock` 虽然被 defer 了，但删除的不是自己的锁（还是上面的问题）
3. 没有锁续期机制
4. 锁的 value 没有用于验证身份

请修复所有问题。

## 语言要求

Go 语言。
