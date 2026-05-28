# 修复 Go slice 引用传递 bug

## 任务描述

我在写一个处理数据批量操作的程序时，发现 slice 的行为非常奇怪。我在一个函数里修改了 slice 的内容，回到调用方后修改不见了；或者我在函数里往 slice 追加元素，调用方看到的 slice 被改了（我明明传的是副本啊！）。

我理解 Go 的 slice 是引用类型，但这个程序的行为还是让我困惑。帮我看看这段代码有什么问题并修复它。

当前代码的问题：
- 函数内部 `append` 后，调用方看不到新元素（容量不足时的 slice 分离）
- 函数内部修改 slice 元素，调用方看到的被改了（共享底层数组）
- 多个 slice 共享底层数组时的数据竞争

## 代码

```go
package main

import (
	"fmt"
)

// ============ 问题 1：Append 不生效 ============

// AddItem 往切片末尾添加一个元素
// BUG：如果切片容量不足，append 会创建新底层数组，原切片不受影响
func AddItem(s []int, item int) {
	s = append(s, item)
}

// ============ 问题 2：意外修改原数据 ============

// RemoveFirst 移除切片第一个元素
// BUG：s = s[1:] 修改了调用方的 slice header？不完全是——但底层共享的问题在别处
func RemoveFirst(s []int) []int {
	return s[1:]
}

// UpdateAll 将切片中所有元素更新为新值
// BUG：修改元素会反映到调用方，有时是预期的，有时不是
func UpdateAll(s []int, newVal int) {
	for i := range s {
		s[i] = newVal
	}
}

// ============ 问题 3：子切片带来的混乱 ============

// BatchProcess 分批处理数据
// BUG：子切片与父切片共享底层数组，修改子切片可能影响父切片
func BatchProcess(data []int, batchSize int) [][]int {
	if batchSize <= 0 {
		return nil
	}

	var batches [][]int
	for i := 0; i < len(data); i += batchSize {
		end := i + batchSize
		if end > len(data) {
			end = len(data)
		}
		// BUG：直接切片创建子切片，共享底层数组
		batches = append(batches, data[i:end])
	}

	// 模拟：对第一批次做修改
	if len(batches) > 0 {
		// BUG：这个修改会影响 data 的对应位置
		batches[0][0] = 999
	}

	return batches
}

// ============ 问题 4：数据安全导出 ============

// SafeExport 导出数据，避免外部修改
// BUG：直接返回内部 slice，外部可以修改内部数据
type DataStore struct {
	data []int
}

func NewDataStore() *DataStore {
	return &DataStore{
		data: []int{1, 2, 3, 4, 5},
	}
}

func (ds *DataStore) GetData() []int {
	// BUG：直接返回内部 slice，调用方可以修改内部状态
	return ds.data
}

func main() {
	// 演示问题
	nums := []int{1, 2, 3}
	AddItem(nums, 4)
	fmt.Println("AddItem 后:", nums) // 期望 [1,2,3,4]，实际 [1,2,3]

	store := NewDataStore()
	data := store.GetData()
	data[0] = 100
	fmt.Println("修改导出数据后:", store.data) // [100,2,3,4,5]——内部数据被改了！
}
```

## 语言要求

Go 语言。
