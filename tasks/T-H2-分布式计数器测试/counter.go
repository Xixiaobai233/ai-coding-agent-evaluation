package main

import (
	"sync"
	"sync/atomic"
)

type DistributedCounter struct {
	mu    sync.Mutex
	count int64
}

func NewDistributedCounter() *DistributedCounter {
	return &DistributedCounter{}
}

func (c *DistributedCounter) Inc() {
	atomic.AddInt64(&c.count, 1)
}

func (c *DistributedCounter) Value() int64 {
	return atomic.LoadInt64(&c.count)
}

func (c *DistributedCounter) Add(n int64) {
	for i := int64(0); i < n; i++ {
		c.Inc()
	}
}
