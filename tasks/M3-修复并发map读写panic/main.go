package main

import (
	"fmt"
	"sync"
)

// Cache 是一个并发安全的缓存实现，使用 RWMutex 优化读多写少场景
type Cache struct {
	data map[string]string
	mu   sync.RWMutex
}

func NewCache() *Cache {
	return &Cache{
		data: make(map[string]string),
	}
}

func (c *Cache) Get(key string) string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.data[key]
}

func (c *Cache) Set(key, value string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.data[key] = value
}

func (c *Cache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.data, key)
}

func main() {
	cache := NewCache()
	var wg sync.WaitGroup

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			key := fmt.Sprintf("key_%d", i%10)
			cache.Set(key, fmt.Sprintf("value_%d", i))
			val := cache.Get(key)
			_ = val
		}(i)
	}

	wg.Wait()
	fmt.Println("done")
}
