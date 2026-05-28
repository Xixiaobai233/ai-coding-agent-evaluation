package taskqueue

import (
	"context"
	"sync"
	"sync/atomic"
)

type Task func()

type TaskQueue struct {
	tasks        chan Task
	quit         chan struct{}
	wg           sync.WaitGroup
	active       int32
	capacity     int
	shutdownOnce sync.Once
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
	tq.shutdownOnce.Do(func() {
		close(tq.quit)
	})
	tq.wg.Wait()
}

func (tq *TaskQueue) ActiveCount() int {
	return int(atomic.LoadInt32(&tq.active))
}

func (tq *TaskQueue) Capacity() int {
	return tq.capacity
}
