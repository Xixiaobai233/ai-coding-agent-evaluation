package main

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
)

const renewFactor = 3

var unlockLua = redis.NewScript(`
	if redis.call("GET", KEYS[1]) == ARGV[1] then
		return redis.call("DEL", KEYS[1])
	end
	return 0
`)

var renewLua = redis.NewScript(`
	if redis.call("GET", KEYS[1]) == ARGV[1] then
		return redis.call("PEXPIRE", KEYS[1], ARGV[2])
	end
	return 0
`)

type DistributedLock struct {
	client  *redis.Client
	key     string
	value   string
	ttl     time.Duration
	stopCh  chan struct{}
	stopped bool
	mu      sync.Mutex
}

func NewDistributedLock(client *redis.Client, key string, ttl time.Duration) *DistributedLock {
	return &DistributedLock{
		client: client,
		key:    key,
		value:  fmt.Sprintf("%d", time.Now().UnixNano()),
		ttl:    ttl,
		stopCh: make(chan struct{}),
	}
}

func (l *DistributedLock) Lock(ctx context.Context) bool {
	ok, err := l.client.SetNX(ctx, l.key, l.value, l.ttl).Result()
	if err != nil {
		return false
	}
	if ok {
		go l.watchdog()
	}
	return ok
}

func (l *DistributedLock) Unlock(ctx context.Context) {
	l.mu.Lock()
	if !l.stopped {
		close(l.stopCh)
		l.stopped = true
	}
	l.mu.Unlock()

	_ = unlockLua.Run(ctx, l.client, []string{l.key}, l.value)
}

func (l *DistributedLock) watchdog() {
	ticker := time.NewTicker(l.ttl / renewFactor)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			_ = renewLua.Run(context.Background(), l.client, []string{l.key}, l.value, fmt.Sprintf("%d", l.ttl.Milliseconds()))
		case <-l.stopCh:
			return
		}
	}
}
