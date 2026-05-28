# 修复 Go goroutine 泄漏

## 任务描述

我写了一个实时数据流处理服务，它从多个数据源接收消息，处理后分发到下游。但在生产环境中运行几小时后，程序的 goroutine 数量和内存持续增长，最终 OOM 被 kill 掉。

我怀疑有 goroutine 泄漏——有些 goroutine 启动了但永远不退出，不断累积。

帮我看看这段代码有什么问题并修复它。

当前代码的问题：
- 从 channel 读取时没有检测关闭状态，goroutine 可能永远阻塞
- 没有 context 或停止信号，goroutine 无法被通知退出
- 生产者-消费者模式中，消费者 goroutine 没有优雅退出机制

## 代码

```go
package main

import (
	"fmt"
	"math/rand"
	"time"
)

// ============ 问题 1：无退出条件的 Worker ============

// DataProcessor 数据处理器
type DataProcessor struct {
	inputChan chan int
	output    []int
}

func NewDataProcessor() *DataProcessor {
	return &DataProcessor{
		inputChan: make(chan int),
	}
}

// Start 启动处理 goroutine
// BUG：这个 goroutine 永远不退出，即使不会再有数据发送过来
func (dp *DataProcessor) Start() {
	go func() {
		for {
			// BUG：如果 inputChan 被关闭，这里会得到零值但无法区分
			data := <-dp.inputChan
			result := data * 2
			dp.output = append(dp.output, result)
			fmt.Printf("处理: %d -> %d\n", data, result)
		}
	}()
}

// Send 发送数据到处理器
func (dp *DataProcessor) Send(data int) {
	dp.inputChan <- data
}

// ============ 问题 2：永不停止的定时器 ============

// HealthChecker 健康检查器
type HealthChecker struct {
	stopChan chan struct{}
}

func NewHealthChecker() *HealthChecker {
	return &HealthChecker{
		stopChan: make(chan struct{}),
	}
}

// Start 启动定时健康检查
// BUG：time.Ticker 没有在不用时释放，且 goroutine 无法被停止
func (hc *HealthChecker) Start() {
	go func() {
		ticker := time.NewTicker(1 * time.Second)
		// BUG：ticker 永远不会被 stop，goroutine 永远不会退出
		for {
			select {
			case <-ticker.C:
				fmt.Println("[健康检查] 服务运行正常")
			}
		}
	}()
}

// Stop 尝试停止健康检查
func (hc *HealthChecker) Stop() {
	// BUG：发送到 stopChan，但没有 goroutine 在监听这个 channel
	close(hc.stopChan)
}

// ============ 问题 3：多层 goroutine 启动不跟踪 ============

// FanOutService 扇出服务：把一个数据分发到多个处理单元
type FanOutService struct {
	workers []chan int
}

func NewFanOutService(workerCount int) *FanOutService {
	svc := &FanOutService{
		workers: make([]chan int, workerCount),
	}
	for i := 0; i < workerCount; i++ {
		svc.workers[i] = make(chan int, 10)
		// BUG：启动的 worker goroutine 无法追踪，也无法安全停止
		go func(id int, ch chan int) {
			for data := range ch {
				time.Sleep(time.Duration(rand.Intn(100)) * time.Millisecond)
				fmt.Printf("[Worker %d] 处理数据: %d\n", id, data)
			}
			// BUG：ch 关闭后 goroutine 退出，但没有通知机制告诉调用方
		}(i, svc.workers[i])
	}
	return svc
}

func (fs *FanOutService) Dispatch(data int) {
	// 随机发到一个 worker
	idx := rand.Intn(len(fs.workers))
	fs.workers[idx] <- data
}

// ============ 问题 4：select 遗漏 default 导致永久阻塞 ============

// EventBroadcaster 事件广播器
type EventBroadcaster struct {
	listeners []chan string
}

func (eb *EventBroadcaster) Broadcast(event string) {
	for _, listener := range eb.listeners {
		select {
		case listener <- event:
		// BUG：没有 default 分支，如果 listener 满了会阻塞整个广播
		}
	}
}

func main() {
	// 场景 1：DataProcessor 泄漏
	dp := NewDataProcessor()
	dp.Start()
	dp.Send(1)
	dp.Send(2)
	// 即使不再 Send，dp 的 goroutine 永远不退出
	_ = dp

	// 场景 2：HealthChecker 泄漏
	hc := NewHealthChecker()
	hc.Start()
	// 即使 Stop 被调用，goroutine 也不退出
	// hc.Stop()  // 调了也没用

	// 场景 3：FanOutService 泄漏
	fs := NewFanOutService(5)
	fs.Dispatch(100)
	// 程序退出时，所有 worker goroutine 还在运行

	time.Sleep(2 * time.Second)
	fmt.Println("主程序退出，但还有很多 goroutine 在后台运行...")
}
```

## 语言要求

Go 语言。
