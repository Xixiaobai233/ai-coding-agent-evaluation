package main

import "sync"

type MessageQueue struct {
	mu sync.Mutex
	q  []string
}

func NewMessageQueue() *MessageQueue { return &MessageQueue{q: make([]string, 0)} }

func (mq *MessageQueue) Publish(msg string) {
	mq.mu.Lock()
	defer mq.mu.Unlock()
	mq.q = append(mq.q, msg)
}

func (mq *MessageQueue) Consume() (string, bool) {
	mq.mu.Lock()
	defer mq.mu.Unlock()
	if len(mq.q) == 0 { return "", false }
	msg := mq.q[0]
	mq.q = mq.q[1:]
	return msg, true
}

func (mq *MessageQueue) Len() int {
	mq.mu.Lock()
	defer mq.mu.Unlock()
	return len(mq.q)
}
