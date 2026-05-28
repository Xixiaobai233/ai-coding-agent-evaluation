package main

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
)

const ttlDiv = 3

var delIfOwner = redis.NewScript(`
	if redis.call("GET", KEYS[1]) == ARGV[1] then
		return redis.call("DEL", KEYS[1])
	end
	return 0
`)

var renewIfOwner = redis.NewScript(`
	if redis.call("GET", KEYS[1]) == ARGV[1] then
		return redis.call("PEXPIRE", KEYS[1], ARGV[2])
	end
	return 0
`)

type DistributedLock struct {
	client  *redis.Client
	key     string
	token   string
	ttl     time.Duration
	done    chan struct{}
	stopped bool
	mu      sync.Mutex
}

func NewDistributedLock(client *redis.Client, key string, ttl time.Duration) *DistributedLock {
	return &DistributedLock{
		client: client,
		key:    key,
		token:  fmt.Sprintf("%x", time.Now().UnixNano()),
		ttl:    ttl,
		done:   make(chan struct{}),
	}
}

func (l *DistributedLock) Lock(ctx context.Context) bool {
	acquired, err := l.client.SetNX(ctx, l.key, l.token, l.ttl).Result()
	if err != nil {
		return false
	}
	if acquired {
		go l.watch()
	}
	return acquired
}

func (l *DistributedLock) Unlock(ctx context.Context) {
	l.mu.Lock()
	if !l.stopped {
		close(l.done)
		l.stopped = true
	}
	l.mu.Unlock()

	_ = delIfOwner.Run(ctx, l.client, []string{l.key}, l.token)
}

func (l *DistributedLock) watch() {
	ticker := time.NewTicker(l.ttl / ttlDiv)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			_ = renewIfOwner.Run(context.Background(), l.client, []string{l.key}, l.token, fmt.Sprintf("%d", l.ttl.Milliseconds()))
		case <-l.done:
			return
		}
	}
}
