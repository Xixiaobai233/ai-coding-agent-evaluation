# 修复并发 map 读写 panic

## 任务描述

我有一个 Go 程序，它在并发环境下读写 map 时会 panic，报错 `fatal error: concurrent map writes` 或 `concurrent map read and map write`。

帮我修复这个并发安全问题。要求：
- 不能简单把整个操作包在 `sync.Mutex` 里（性能太差）
- 需要支持高并发的读写场景
- 读多写少的场景

## 代码

```go
package main

import (
	"fmt"
	"sync"
)

type Cache struct {
	data map[string]string
}

func NewCache() *Cache {
	return &Cache{
		data: make(map[string]string),
	}
}

func (c *Cache) Get(key string) string {
	return c.data[key]
}

func (c *Cache) Set(key, value string) {
	c.data[key] = value
}

func (c *Cache) Delete(key string) {
	delete(c.data, key)
}

func main() {
	cache := NewCache()
	var wg sync.WaitGroup

	// 模拟并发读写
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
```

## 语言要求

Go 语言。
