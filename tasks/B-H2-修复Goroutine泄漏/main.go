package main

import (
	"context"
	"fmt"
	"math/rand"
	"sync"
	"time"
)

// ============ 问题 1：无退出条件的 Worker ============

type DataProcessor struct {
	inputChan chan int
	output    []int
	closeOnce sync.Once
	wg        sync.WaitGroup
}

func NewDataProcessor() *DataProcessor {
	return &DataProcessor{
		inputChan: make(chan int),
	}
}

// Start 启动处理 goroutine
// 修复：使用 range 读取，inputChan 关闭时自动退出
func (dp *DataProcessor) Start() {
	dp.wg.Add(1)
	go func() {
		defer dp.wg.Done()
		for data := range dp.inputChan {
			result := data * 2
			dp.output = append(dp.output, result)
			fmt.Printf("处理: %d -> %d\n", data, result)
		}
		fmt.Println("DataProcessor: inputChan 已关闭，goroutine 退出")
	}()
}

// Send 发送数据到处理器
func (dp *DataProcessor) Send(data int) {
	dp.inputChan <- data
}

// Close 关闭处理器，等待 goroutine 退出
func (dp *DataProcessor) Close() {
	dp.closeOnce.Do(func() {
		close(dp.inputChan)
		dp.wg.Wait()
	})
}

// ============ 问题 2：永不停止的定时器 ============

type HealthChecker struct {
	cancel context.CancelFunc
	wg     sync.WaitGroup
}

func NewHealthChecker() *HealthChecker {
	return &HealthChecker{}
}

// Start 启动定时健康检查
// 修复：使用 context 控制 goroutine 生命周期，释放 ticker
func (hc *HealthChecker) Start() {
	ctx, cancel := context.WithCancel(context.Background())
	hc.cancel = cancel
	hc.wg.Add(1)
	go func() {
		defer hc.wg.Done()
		ticker := time.NewTicker(1 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				fmt.Println("[健康检查] 服务运行正常")
			case <-ctx.Done():
				fmt.Println("HealthChecker: 收到停止信号，goroutine 退出")
				return
			}
		}
	}()
}

// Stop 尝试停止健康检查
// 修复：通过 context 通知 goroutine 退出
func (hc *HealthChecker) Stop() {
	if hc.cancel != nil {
		hc.cancel()
		hc.wg.Wait()
	}
}

// ============ 问题 3：多层 goroutine 启动不跟踪 ============

type FanOutService struct {
	workers     []chan int
	wg          sync.WaitGroup
	cancel      context.CancelFunc
}

func NewFanOutService(workerCount int) *FanOutService {
	ctx, cancel := context.WithCancel(context.Background())
	svc := &FanOutService{
		workers: make([]chan int, workerCount),
		cancel:  cancel,
	}
	for i := 0; i < workerCount; i++ {
		svc.workers[i] = make(chan int, 10)
		svc.wg.Add(1)
		go func(id int, ch chan int) {
			defer svc.wg.Done()
			for {
				select {
				case data, ok := <-ch:
					if !ok {
						fmt.Printf("[Worker %d] channel 已关闭，退出\n", id)
						return
					}
					time.Sleep(time.Duration(rand.Intn(100)) * time.Millisecond)
					fmt.Printf("[Worker %d] 处理数据: %d\n", id, data)
				case <-ctx.Done():
					fmt.Printf("[Worker %d] 收到取消信号，退出\n", id)
					return
				}
			}
		}(i, svc.workers[i])
	}
	return svc
}

func (fs *FanOutService) Dispatch(data int) {
	idx := rand.Intn(len(fs.workers))
	fs.workers[idx] <- data
}

// Shutdown 关闭所有 worker
func (fs *FanOutService) Shutdown() {
	fs.cancel()
	for _, ch := range fs.workers {
		close(ch)
	}
	fs.wg.Wait()
	fmt.Println("FanOutService: 所有 worker 已退出")
}

// ============ 问题 4：select 遗漏 default 导致永久阻塞 ============

type EventBroadcaster struct {
	listeners []chan string
}

func (eb *EventBroadcaster) Broadcast(event string) {
	for _, listener := range eb.listeners {
		select {
		case listener <- event:
		default:
			// 修复：添加 default 分支，listener 满时丢弃
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

	fs := NewFanOutService(3)
	fs.Dispatch(100)

	time.Sleep(1 * time.Second)

	// 优雅关闭
	dp.Close()
	hc.Stop()
	fs.Shutdown()

	fmt.Println("主程序退出，所有 goroutine 已清理")
}
