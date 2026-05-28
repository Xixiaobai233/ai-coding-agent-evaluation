package main

import (
	"runtime"
	"sync"
	"testing"
	"time"
)

// 测试 DataProcessor 可停止
func TestDataProcessorClose(t *testing.T) {
	dp := NewDataProcessor()
	dp.Start()

	dp.Send(1)
	dp.Send(2)
	dp.Send(3)

	// 记录关闭前的 goroutine 数
	before := runtime.NumGoroutine()

	dp.Close()

	// 验证所有 data 被处理
	if len(dp.output) != 3 {
		t.Errorf("预期处理 3 个数据，实际 %d", len(dp.output))
	}

	// 等待 goroutine 退出
	time.Sleep(100 * time.Millisecond)
	after := runtime.NumGoroutine()

	// 关闭后 goroutine 数不应该增加
	if after > before {
		t.Errorf("goroutine 数不应增加：before=%d, after=%d", before, after)
	}
}

// 测试 HealthChecker 可停止
func TestHealthCheckerStop(t *testing.T) {
	hc := NewHealthChecker()
	hc.Start()

	time.Sleep(100 * time.Millisecond)

	before := runtime.NumGoroutine()
	hc.Stop()

	time.Sleep(100 * time.Millisecond)
	after := runtime.NumGoroutine()

	if after > before {
		t.Errorf("HealthChecker 停止后 goroutine 应退出：before=%d, after=%d", before, after)
	}
}

// 测试 FanOutService 可关闭
func TestFanOutServiceShutdown(t *testing.T) {
	fs := NewFanOutService(5)

	before := runtime.NumGoroutine()

	for i := 0; i < 10; i++ {
		fs.Dispatch(i)
	}

	fs.Shutdown()

	time.Sleep(200 * time.Millisecond)
	after := runtime.NumGoroutine()

	t.Logf("FanOutService: before=%d, after=%d", before, after)
}

// 测试 EventBroadcaster 非阻塞
func TestEventBroadcasterNonBlocking(t *testing.T) {
	eb := &EventBroadcaster{
		listeners: []chan string{
			make(chan string, 1), // 容量只有 1
		},
	}

	// 第一次发送成功
	eb.Broadcast("event1")
	// 第二次应非阻塞（listener 满）
	eb.Broadcast("event2")
	// 第三次应非阻塞
	eb.Broadcast("event3")

	// listener 中应有 1 个事件（容量 1，后面的被丢弃）
	select {
	case msg := <-eb.listeners[0]:
		if msg != "event1" {
			t.Errorf("预期 event1，实际 %s", msg)
		}
	default:
		t.Error("listener 应包含 event1")
	}

	// 不应有更多事件
	select {
	case <-eb.listeners[0]:
		t.Error("不应有更多事件")
	default:
		// OK
	}
}

// 测试 FanOutService Shutdown 等待所有 worker 完成
func TestFanOutServiceWaitGroup(t *testing.T) {
	wg := &sync.WaitGroup{}
	workers := make([]chan int, 3)

	for i := 0; i < 3; i++ {
		workers[i] = make(chan int, 10)
		wg.Add(1)
		go func(id int, ch chan int) {
			defer wg.Done()
			for range ch {
			}
		}(i, workers[i])
	}

	// 发送一些数据
	for i := 0; i < 10; i++ {
		workers[i%3] <- i
	}

	// 关闭所有 channel
	for _, ch := range workers {
		close(ch)
	}

	// 等待所有 worker 完成
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		// OK
	case <-time.After(2 * time.Second):
		t.Fatal("workers 未在 2 秒内退出")
	}
}
