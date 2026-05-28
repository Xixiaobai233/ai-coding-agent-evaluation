package taskqueue

import (
	"context"
	"runtime"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestHighThroughput(t *testing.T) {
	tq := NewTaskQueue(500, 20)
	var counter atomic.Int64
	taskCount := 10000
	producerCount := 100
	tasksPerProducer := taskCount / producerCount

	var wg sync.WaitGroup
	for i := 0; i < producerCount; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for j := 0; j < tasksPerProducer; j++ {
				for {
					if tq.Submit(func() {
						counter.Add(1)
					}) {
						break
					}
					runtime.Gosched()
				}
			}
		}(i)
	}
	wg.Wait()
	tq.Shutdown()

	executed := counter.Load()
	t.Logf("高吞吐测试: 提交 %d, 执行 %d", taskCount, executed)
	if executed < int64(taskCount)*99/100 {
		t.Fatalf("任务执行率过低: 期望 ≥ %d, 实际 %d", taskCount*99/100, executed)
	}
}

func TestBackpressure(t *testing.T) {
	tq := NewTaskQueue(10, 1)
	submittedCount := 0
	rejectedCount := 0

	for i := 0; i < 100; i++ {
		if tq.Submit(func() {
			time.Sleep(10 * time.Millisecond)
		}) {
			submittedCount++
		} else {
			rejectedCount++
		}
	}
	t.Logf("背压测试: 提交成功 %d, 被拒绝 %d", submittedCount, rejectedCount)
	if submittedCount == 0 {
		t.Error("没有任何任务被成功提交，不合理")
	}
	if rejectedCount == 0 {
		t.Error("没有任务被拒绝，背压机制可能无效")
	}
	tq.Shutdown()

	// SubmitWithContext 超时
	tq2 := NewTaskQueue(10, 1)
	for i := 0; i < 10; i++ {
		tq2.Submit(func() {
			time.Sleep(1 * time.Second)
		})
	}
	time.Sleep(10 * time.Millisecond)
	for i := 0; i < 10; i++ {
		tq2.Submit(func() {
			time.Sleep(1 * time.Second)
		})
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Millisecond)
	defer cancel()
	err := tq2.SubmitWithContext(ctx, func() {})
	if err == nil {
		t.Error("SubmitWithContext 应该在队列满且超时时返回 error")
	}
	if err != context.DeadlineExceeded {
		t.Errorf("应该返回 DeadlineExceeded，实际: %v", err)
	}
	tq2.Shutdown()
}

func TestGracefulShutdown(t *testing.T) {
	tq := NewTaskQueue(50, 5)
	var counter atomic.Int64
	taskCount := 200

	for i := 0; i < taskCount; i++ {
		tq.Submit(func() {
			counter.Add(1)
		})
	}
	runtime.Gosched()

	beforeStats := runtime.NumGoroutine()
	tq.Shutdown()
	executed := counter.Load()
	afterStats := runtime.NumGoroutine()

	t.Logf("优雅关闭: 提交 %d, 执行 %d, goroutine %d→%d",
		taskCount, executed, beforeStats, afterStats)
	if executed == 0 {
		t.Error("没有任务被执行")
	}
	goroutineDiff := afterStats - beforeStats
	if goroutineDiff > 5 {
		t.Errorf("可能存在 goroutine 泄漏: 关闭前后差 = %d", goroutineDiff)
	}
}

func TestConcurrentSafety(t *testing.T) {
	tq := NewTaskQueue(100, 5)
	var wg sync.WaitGroup

	for k := 0; k < 20; k++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 100; j++ {
				tq.Submit(func() {
					time.Sleep(time.Microsecond)
				})
				_ = tq.ActiveCount()
				_ = tq.Capacity()
			}
		}()
	}
	wg.Wait()
	tq.Shutdown()
	t.Log("并发安全测试完成")
}

func TestActiveCountConcurrent(t *testing.T) {
	tq := NewTaskQueue(100, 10)
	var wg sync.WaitGroup

	for k := 0; k < 10; k++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 50; j++ {
				tq.Submit(func() {
					time.Sleep(time.Millisecond)
				})
			}
		}()
	}
	for k := 0; k < 5; k++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 100; j++ {
				count := tq.ActiveCount()
				if count < 0 {
					t.Errorf("ActiveCount 负数: %d", count)
				}
			}
		}()
	}
	wg.Wait()
	tq.Shutdown()
}

func BenchmarkTaskQueue(b *testing.B) {
	tq := NewTaskQueue(1000, 10)
	defer tq.Shutdown()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		tq.Submit(func() {})
	}
	tq.Shutdown()
}
