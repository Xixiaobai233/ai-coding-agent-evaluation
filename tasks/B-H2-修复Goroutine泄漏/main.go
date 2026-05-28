package main

import (
	"fmt"
	"math/rand"
	"time"
)

// ============ 问题 1：无退出条件的 Worker ============

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
		for {
			select {
			case <-ticker.C:
				fmt.Println("[健康检查] 服务运行正常")
			}
		}
	}()
}

// Stop 尝试停止健康检查
// BUG：发送到 stopChan，但没有 goroutine 在监听
func (hc *HealthChecker) Stop() {
	close(hc.stopChan)
}

// ============ 问题 3：多层 goroutine 启动不跟踪 ============

type FanOutService struct {
	workers []chan int
}

func NewFanOutService(workerCount int) *FanOutService {
	svc := &FanOutService{
		workers: make([]chan int, workerCount),
	}
	for i := 0; i < workerCount; i++ {
		svc.workers[i] = make(chan int, 10)
		go func(id int, ch chan int) {
			for data := range ch {
				time.Sleep(time.Duration(rand.Intn(100)) * time.Millisecond)
				fmt.Printf("[Worker %d] 处理数据: %d\n", id, data)
			}
		}(i, svc.workers[i])
	}
	return svc
}

func (fs *FanOutService) Dispatch(data int) {
	idx := rand.Intn(len(fs.workers))
	fs.workers[idx] <- data
}

// ============ 问题 4：select 遗漏 default 导致永久阻塞 ============

type EventBroadcaster struct {
	listeners []chan string
}

func (eb *EventBroadcaster) Broadcast(event string) {
	for _, listener := range eb.listeners {
		select {
		case listener <- event:
		// BUG：没有 default 分支，如果 listener 满了会阻塞
		}
	}
}

func main() {
	dp := NewDataProcessor()
	dp.Start()
	dp.Send(1)
	dp.Send(2)

	hc := NewHealthChecker()
	hc.Start()

	fs := NewFanOutService(5)
	fs.Dispatch(100)

	time.Sleep(2 * time.Second)
	fmt.Println("主程序退出，但还有很多 goroutine 在后台运行...")
}
