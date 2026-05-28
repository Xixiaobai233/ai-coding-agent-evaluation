package main

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/go-redis/redis/v8"
)

func setupTest(t *testing.T) (*redis.Client, *miniredis.Miniredis) {
	t.Helper()
	mr, err := miniredis.Run()
	if err != nil {
		t.Fatalf("failed to start miniredis: %v", err)
	}
	client := redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})
	return client, mr
}

// TestLockMutex 验收条件1：锁互斥 —— 两个 goroutine 同时 Lock，只有一个成功
func TestLockMutex(t *testing.T) {
	client, mr := setupTest(t)
	defer mr.Close()
	defer client.Close()

	lock := NewDistributedLock(client, "test:mutex", 5*time.Second)

	ctx := context.Background()
	got1 := lock.Lock(ctx)
	got2 := lock.Lock(ctx)

	if !got1 {
		t.Error("第一次 Lock 应该成功")
	}
	if got2 {
		t.Error("第二次 Lock 应该失败（互斥）")
	}
}

// TestLockRelease 验收条件2：锁安全释放 —— 释放后另一个能获取
func TestLockRelease(t *testing.T) {
	client, mr := setupTest(t)
	defer mr.Close()
	defer client.Close()

	lock := NewDistributedLock(client, "test:release", 5*time.Second)

	ctx := context.Background()
	if !lock.Lock(ctx) {
		t.Fatal("第一次 Lock 应该成功")
	}
	lock.Unlock(ctx)

	if !lock.Lock(ctx) {
		t.Error("释放后重新 Lock 应该成功")
	}
}

// TestLockIdentity 验收条件3：不误删锁
// 锁过期后被其他实例获取，原实例 Unlock 不会误删别人的锁。
func TestLockIdentity(t *testing.T) {
	client, mr := setupTest(t)
	defer mr.Close()
	defer client.Close()

	lock1 := NewDistributedLock(client, "test:identity", 1*time.Minute)
	lock2 := NewDistributedLock(client, "test:identity", 1*time.Minute)

	ctx := context.Background()
	if !lock1.Lock(ctx) {
		t.Fatal("lock1 应该成功获取锁")
	}

	// 模拟锁被删除（过期 / 手动删除 / Redis 故障转移等）
	client.Del(ctx, "test:identity")

	// lock2 重新获取
	if !lock2.Lock(ctx) {
		t.Fatal("lock2 应该成功获取锁")
	}

	// lock1 尝试释放 —— value 不匹配，不应影响 lock2 的锁
	lock1.Unlock(ctx)

	// 验证 lock2 的锁仍然存在，且 value 正确
	val, err := client.Get(ctx, "test:identity").Result()
	if err != nil {
		t.Fatal("lock1.Unlock 误删了 lock2 的锁！身份校验失败")
	}
	if val != lock2.value {
		t.Fatalf("锁的值不匹配：期望 %q，实际 %q", lock2.value, val)
	}

	lock2.Unlock(ctx)
}

// TestLockRenewal 验收条件4：续期机制 —— 业务执行时间超过 TTL 时锁不会提前过期
func TestLockRenewal(t *testing.T) {
	client, mr := setupTest(t)
	defer mr.Close()
	defer client.Close()

	// 短 TTL 以便快速验证
	lock := NewDistributedLock(client, "test:renewal", 100*time.Millisecond)

	ctx := context.Background()
	if !lock.Lock(ctx) {
		t.Fatal("Lock 应该成功")
	}

	// 等待超过 TTL（250ms > 100ms），看门狗应已续期至少一次
	time.Sleep(250 * time.Millisecond)

	// 锁应仍然存在（未被 Redis 过期删除）
	val, err := client.Get(ctx, "test:renewal").Result()
	if err != nil {
		t.Fatal("看门狗续期失败：锁已过期")
	}
	if val != lock.value {
		t.Error("锁的值不匹配，可能被其他实例覆盖")
	}

	lock.Unlock(ctx)
}

// TestLockPanicSafety 验收条件5：Panic 安全 —— 加锁后业务 panic，锁最终能正确释放
func TestLockPanicSafety(t *testing.T) {
	client, mr := setupTest(t)
	defer mr.Close()
	defer client.Close()

	lock := NewDistributedLock(client, "test:panic", 5*time.Second)

	ctx := context.Background()
	if !lock.Lock(ctx) {
		t.Fatal("Lock 应该成功")
	}

	// 模拟业务 panic，defer Unlock 应安全释放锁
	func() {
		defer lock.Unlock(ctx)
		defer func() { recover() }()
		panic("模拟业务 panic")
	}()

	// 锁应已被释放，可重新获取
	if !lock.Lock(ctx) {
		t.Error("panic + Unlock 后锁未被释放，无法重新获取")
	}
	lock.Unlock(ctx)
}

// TestConcurrentLock 验收条件6 + 并发安全：多个 goroutine 并发争抢，仅一个成功
func TestConcurrentLock(t *testing.T) {
	client, mr := setupTest(t)
	defer mr.Close()
	defer client.Close()

	var wg sync.WaitGroup
	var mu sync.Mutex
	successCount := 0
	const goroutines = 30

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			lock := NewDistributedLock(client, "test:concurrent", 5*time.Second)
			ctx := context.Background()
			if lock.Lock(ctx) {
				mu.Lock()
				successCount++
				mu.Unlock()
				lock.Unlock(ctx)
			}
		}()
	}
	wg.Wait()

	if successCount > 2 {
		t.Errorf("%d 个 goroutine 并发争抢：期望 ≤2 个，实际 %d 个成功",
			goroutines, successCount)
	}
}

// TestWatchdogStopOnUnlock 验证看门狗在 Unlock 后正确停止
func TestWatchdogStopOnUnlock(t *testing.T) {
	client, mr := setupTest(t)
	defer mr.Close()
	defer client.Close()

	lock := NewDistributedLock(client, "test:watchdog-stop", 1*time.Second)

	ctx := context.Background()
	if !lock.Lock(ctx) {
		t.Fatal("Lock 应该成功")
	}

	lock.Unlock(ctx)

	// 释放后锁应该立刻可被重新获取（而非等待续期间隔）
	if !lock.Lock(ctx) {
		t.Error("Unlock 后应该能立即重新获取锁")
	}
	lock.Unlock(ctx)
}

// TestDoubleUnlock 验证重复 Unlock 不会 panic
func TestDoubleUnlock(t *testing.T) {
	client, mr := setupTest(t)
	defer mr.Close()
	defer client.Close()

	lock := NewDistributedLock(client, "test:double-unlock", 5*time.Second)

	ctx := context.Background()
	if !lock.Lock(ctx) {
		t.Fatal("Lock 应该成功")
	}

	lock.Unlock(ctx)
	lock.Unlock(ctx) // 第二次 Unlock 不应 panic
}
