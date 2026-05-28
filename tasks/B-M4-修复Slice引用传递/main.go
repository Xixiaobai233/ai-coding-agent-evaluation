package main

import "fmt"

// ============ 问题 1：Append 不生效 ============

// AddItem 往切片末尾添加一个元素
// BUG：append 可能导致重新分配底层数组，但 s 是值传递，
// 调用方的 slice header 不会被更新
func AddItem(s []int, item int) {
	s = append(s, item)
}

// ============ 问题 2：切片操作的影响 ============

// RemoveFirst 移除切片第一个元素并返回新切片
func RemoveFirst(s []int) []int {
	return s[1:]
}

// UpdateAll 将切片中所有元素更新为新值
// 注意：此操作会修改底层数组，调用方会看到变化
func UpdateAll(s []int, newVal int) {
	for i := range s {
		s[i] = newVal
	}
}

// ============ 问题 3：子切片带来的混乱 ============

// BatchProcess 分批处理数据
// BUG：data[i:end] 创建的子切片与 data 共享底层数组
// 修改批次元素会影响原始数据
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
		// BUG：直接切片，共享底层数组
		batches = append(batches, data[i:end])
	}

	if len(batches) > 0 {
		batches[0][0] = 999
	}

	return batches
}

// ============ 问题 4：数据安全导出 ============

type DataStore struct {
	data []int
}

func NewDataStore() *DataStore {
	return &DataStore{
		data: []int{1, 2, 3, 4, 5},
	}
}

// GetData 获取数据
// BUG：直接返回内部 slice，调用方可以修改内部状态
func (ds *DataStore) GetData() []int {
	return ds.data
}

func main() {
	// 演示问题 1
	nums := []int{1, 2, 3}
	AddItem(nums, 4)
	fmt.Println("问题1 - AddItem 后:", nums) // [1,2,3] — 没变化！

	// 演示问题 4
	store := NewDataStore()
	data := store.GetData()
	data[0] = 100
	fmt.Println("问题4 - 修改导出数据后:", store.data) // [100,2,3,4,5] — 内部数据被改了！

	// 演示问题 3
	original := []int{1, 2, 3, 4, 5, 6}
	batches := BatchProcess(original, 2)
	fmt.Println("问题3 - 批次修改后 original:", original) // [999,2,3,4,5,6] — 被影响了！
	_ = batches
}
