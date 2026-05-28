package main

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
)

const renewalPeriodDiv = 3

var unlockScriptAtomic = redis.NewScript(`
	if redis.call("GET", KEYS[1]) == ARGV[1] then
		redis.call("DEL", KEYS[1])
		return 1
	end
	return 0
`)

var extendScriptAtomic = redis.NewScript(`
	if redis.call("GET", KEYS[1]) == ARGV[1] then
		redis.call("PEXPIRE", KEYS[1], ARGV[2])
		return 1
	end
	return 0
`)

type DistributedLock struct {
	client  *redis.Client
	key     string
	ownerID string
	ttl     time.Duration
	sig     chan struct{}
	dead    bool
	mu      sync.Mutex
}

func NewDistributedLock(client *redis.Client, key string, ttl time.Duration) *DistributedLock {
	return &DistributedLock{
		client:  client,
		key:     key,
		ownerID: fmt.Sprintf("%d-%d", time.Now().UnixNano(), time.Now().Unix()),
		ttl:     ttl,
		sig:     make(chan struct{}),
	}
}

func (l *DistributedLock) Lock(ctx context.Context) bool {
	got, err := l.client.SetNX(ctx, l.key, l.ownerID, l.ttl).Result()
	if err != nil {
		return false
	}
	if got {
		go l.watchdog()
	}
	return got
}

func (l *DistributedLock) Unlock(ctx context.Context) {
	l.mu.Lock()
	if !l.dead {
		close(l.sig)
		l.dead = true
	}
	l.mu.Unlock()

	unlockScriptAtomic.Run(ctx, l.client, []string{l.key}, l.ownerID)
}

func (l *DistributedLock) watchdog() {
	ticker := time.NewTicker(l.ttl / renewalPeriodDiv)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			extendScriptAtomic.Run(context.Background(), l.client, []string{l.key}, l.ownerID, fmt.Sprintf("%d", l.ttl.Milliseconds()))
		case <-l.sig:
			return
		}
	}
}
