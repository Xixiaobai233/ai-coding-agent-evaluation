# 为并发组件写压力测试

## 任务描述

我开发了一个线程安全的任务队列（`TaskQueue`），支持高并发的任务生产和消费。但我不确定它在高负载下的表现。帮我为这个组件编写压力测试，验证它在下列条件下的表现：

1. **高吞吐**：大量 goroutine 同时生产消费
2. **稳定运行**：持续运行不 crash
3. **资源回收**：没有 goroutine 泄漏
4. **背压处理**：队列满时的行为
5. **优雅关闭**：关闭后不再接受新任务，已提交任务完成

## 组件代码

```go
package taskqueue

import (
	"context"
	"sync"
	"sync/atomic"
)

type Task func()

type TaskQueue struct {
	tasks    chan Task
	quit     chan struct{}
	wg       sync.WaitGroup
	active   int32
	capacity int
}

func NewTaskQueue(capacity int, workerCount int) *TaskQueue {
	tq := &TaskQueue{
		tasks:    make(chan Task, capacity),
		quit:     make(chan struct{}),
		capacity: capacity,
	}

	for i := 0; i < workerCount; i++ {
		tq.wg.Add(1)
		go tq.worker()
	}

	return tq
}

func (tq *TaskQueue) worker() {
	defer tq.wg.Done()
	for {
		select {
		case task := <-tq.tasks:
			atomic.AddInt32(&tq.active, 1)
			task()
			atomic.AddInt32(&tq.active, -1)
		case <-tq.quit:
			return
		}
	}
}

func (tq *TaskQueue) Submit(task Task) bool {
	select {
	case tq.tasks <- task:
		return true
	default:
		// 队列满，返回 false
		return false
	}
}

func (tq *TaskQueue) SubmitWithContext(ctx context.Context, task Task) error {
	select {
	case tq.tasks <- task:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (tq *TaskQueue) Shutdown() {
	close(tq.quit)
	tq.wg.Wait()
}

func (tq *TaskQueue) ActiveCount() int {
	return int(atomic.LoadInt32(&tq.active))
}

func (tq *TaskQueue) Capacity() int {
	return tq.capacity
}
```

## 语言要求

Go 语言。

## 要求

使用 `testing` 包编写压力测试，测试文件以 `_test.go` 结尾。

测试场景：
1. **高吞吐测试**：100 个 producer 同时提交 10000 个任务
2. **背压测试**：提交速度超过消费速度时，Submit 返回 false
3. **优雅关闭测试**：Shutdown 后所有任务执行完毕，没有泄漏
4. **并发安全测试**：用 race detector 验证无数据竞争
