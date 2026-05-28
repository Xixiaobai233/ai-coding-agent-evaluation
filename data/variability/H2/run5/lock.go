package main

import (
	"context"
	"fmt"
	"math/rand"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
)

const heartbeatFactor = 3

var deleteIfMatch = redis.NewScript(`
	if redis.call("GET", KEYS[1]) == ARGV[1] then
		return redis.call("DEL", KEYS[1])
	end
	return 0
`)

var extendIfMatch = redis.NewScript(`
	if redis.call("GET", KEYS[1]) == ARGV[1] then
		return redis.call("PEXPIRE", KEYS[1], ARGV[2])
	end
	return 0
`)

type DistributedLock struct {
	client   *redis.Client
	key      string
	lockID   string
	ttl      time.Duration
	stopChan chan struct{}
	isDead   bool
	mu       sync.Mutex
}

func NewDistributedLock(client *redis.Client, key string, ttl time.Duration) *DistributedLock {
	return &DistributedLock{
		client:   client,
		key:      key,
		lockID:   fmt.Sprintf("%x-%x", rand.Uint64(), time.Now().UnixNano()),
		ttl:      ttl,
		stopChan: make(chan struct{}),
	}
}

func (l *DistributedLock) Lock(ctx context.Context) bool {
	acquired, err := l.client.SetNX(ctx, l.key, l.lockID, l.ttl).Result()
	if err != nil {
		return false
	}
	if acquired {
		go l.heartbeat()
	}
	return acquired
}

func (l *DistributedLock) Unlock(ctx context.Context) {
	l.mu.Lock()
	if !l.isDead {
		close(l.stopChan)
		l.isDead = true
	}
	l.mu.Unlock()

	deleteIfMatch.Run(ctx, l.client, []string{l.key}, l.lockID)
}

func (l *DistributedLock) heartbeat() {
	t := time.NewTicker(l.ttl / heartbeatFactor)
	defer t.Stop()

	for {
		select {
		case <-t.C:
			extendIfMatch.Run(context.Background(), l.client, []string{l.key}, l.lockID, fmt.Sprintf("%d", l.ttl.Milliseconds()))
		case <-l.stopChan:
			return
		}
	}
}
