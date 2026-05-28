package main

import (
	"sync"
	"testing"
)

func TestBasic(t *testing.T) {
	c := NewDistributedCounter()
	c.Inc()
	if c.Value() != 1 { t.Fatal("basic inc failed") }
}

func TestConcurrentInc(t *testing.T) {
	c := NewDistributedCounter()
	var wg sync.WaitGroup
	n := 100
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func() { defer wg.Done(); c.Inc() }()
	}
	wg.Wait()
	if c.Value() != int64(n) { t.Fatalf("got %d, want %d", c.Value(), n) }
}

func TestLargeAdd(t *testing.T) {
	c := NewDistributedCounter()
	c.Add(1000)
	if c.Value() != 1000 { t.Fatal("large add failed") }
}
