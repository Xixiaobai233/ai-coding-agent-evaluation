package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/go-redis/redis/v8"
)

func processTask(lock *DistributedLock, taskID string) {
	ctx := context.Background()

	if !lock.Lock(ctx) {
		fmt.Printf("[%s] 任务 %s 正在被其他实例处理，跳过\n", time.Now().Format("15:04:05"), taskID)
		return
	}
	defer lock.Unlock(ctx)

	fmt.Printf("[%s] 开始处理任务: %s\n", time.Now().Format("15:04:05"), taskID)

	// 模拟耗时业务 —— TTL 设为 1s，但业务耗时 3s，看门狗会自动续期
	time.Sleep(3 * time.Second)

	fmt.Printf("[%s] 任务处理完成: %s\n", time.Now().Format("15:04:05"), taskID)
}

func main() {
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	client := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})

	if _, err := client.Ping(context.Background()).Result(); err != nil {
		log.Fatalf("无法连接到 Redis (%s): %v\n请先启动 Redis 或设置 REDIS_ADDR 环境变量", redisAddr, err)
	}
	fmt.Printf("已连接到 Redis: %s\n\n", redisAddr)

	// === 演示1：锁互斥 + 续期 ===
	fmt.Println("=== 演示1：锁互斥与续期 ===")
	lock := NewDistributedLock(client, "demo:lock", 1*time.Second)

	// 同时启动两个任务，只有一个能获取到锁
	go processTask(lock, "task-1")
	go processTask(lock, "task-2")

	time.Sleep(5 * time.Second)
	fmt.Println()

	// === 演示2：身份校验 ===
	fmt.Println("=== 演示2：身份校验（不误删锁） ===")
	lockA := NewDistributedLock(client, "demo:identity", 1*time.Second)
	lockB := NewDistributedLock(client, "demo:identity", 1*time.Second)

	ctx := context.Background()
	lockA.Lock(ctx)
	fmt.Printf("lockA 获取锁，value=%q\n", lockA.value)

	// 模拟锁过期，lockB 获取到锁
	client.Del(ctx, "demo:identity")
	lockB.Lock(ctx)
	fmt.Printf("lockB 获取锁（原锁已删除），value=%q\n", lockB.value)

	// lockA 尝试释放 —— 不会影响 lockB 的锁
	lockA.Unlock(ctx)
	fmt.Println("lockA 调用 Unlock（应被 Lua 脚本拦截，不会删除 lockB 的锁）")

	val, _ := client.Get(ctx, "demo:identity").Result()
	fmt.Printf("验证锁仍在：value=%q (应为 lockB 的值)\n", val)
	lockB.Unlock(ctx)
	fmt.Println()

	// === 演示3：Panic 安全 ===
	fmt.Println("=== 演示3：Panic 安全 ===")
	func() {
		panicLock := NewDistributedLock(client, "demo:panic", 5*time.Second)
		pCtx := context.Background()
		if !panicLock.Lock(pCtx) {
			fmt.Println("获取 panic 演示锁失败")
			return
		}
		defer panicLock.Unlock(pCtx)

		fmt.Println("获取锁成功，即将 panic...")
		panic("模拟业务异常！")
	}()

	fmt.Println("Panic 已恢复，defer Unlock 应已执行")

	// 验证 panic 后锁被释放
	panicLock2 := NewDistributedLock(client, "demo:panic", 5*time.Second)
	if panicLock2.Lock(context.Background()) {
		fmt.Println("Panic 后锁被正确释放，可重新获取 ✓")
		panicLock2.Unlock(context.Background())
	} else {
		fmt.Println("锁未被释放！")
	}

	fmt.Println("\n所有演示完成。")
}
