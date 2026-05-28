package main

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
)

const watchdogIntervalDivisor = 3

var safeUnlockScript = redis.NewScript(`
	local val = redis.call("GET", KEYS[1])
	if val and val == ARGV[1] then
		return redis.call("DEL", KEYS[1])
	end
	return 0
`)

var safeRenewScript = redis.NewScript(`
	local val = redis.call("GET", KEYS[1])
	if val and val == ARGV[1] then
		return redis.call("PEXPIRE", KEYS[1], ARGV[2])
	end
	return 0
`)

type DistributedLock struct {
	client   *redis.Client
	key      string
	id       string
	ttl      time.Duration
	quit     chan struct{}
	unlocked bool
	mu       sync.Mutex
}

func NewDistributedLock(client *redis.Client, key string, ttl time.Duration) *DistributedLock {
	return &DistributedLock{
		client: client,
		key:    key,
		id:     fmt.Sprintf("%d-%d", time.Now().Unix(), time.Now().UnixMilli()),
		ttl:    ttl,
		quit:   make(chan struct{}),
	}
}

func (l *DistributedLock) Lock(ctx context.Context) bool {
	ok, err := l.client.SetNX(ctx, l.key, l.id, l.ttl).Result()
	if err != nil {
		return false
	}
	if ok {
		go l.keepAlive()
	}
	return ok
}

func (l *DistributedLock) Unlock(ctx context.Context) {
	l.mu.Lock()
	if !l.unlocked {
		close(l.quit)
		l.unlocked = true
	}
	l.mu.Unlock()

	_ = safeUnlockScript.Run(ctx, l.client, []string{l.key}, l.id)
}

func (l *DistributedLock) keepAlive() {
	t := time.NewTicker(l.ttl / watchdogIntervalDivisor)
	defer t.Stop()

	for {
		select {
		case <-t.C:
			_ = safeRenewScript.Run(context.Background(), l.client, []string{l.key}, l.id, fmt.Sprintf("%d", l.ttl.Milliseconds()))
		case <-l.quit:
			return
		}
	}
}
