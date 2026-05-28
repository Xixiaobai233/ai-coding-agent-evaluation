package main

import "fmt"

// ============ 问题 1：Append 不生效 ============

// AddItem 往切片末尾添加一个元素
// 修复：返回新 slice，调用方使用返回值更新原变量
func AddItem(s []int, item int) []int {
	return append(s, item)
}

// ============ 问题 2：切片操作的影响 ============

// RemoveFirst 移除切片第一个元素并返回新切片
// 注意：返回的子切片与原始切片共享底层数组
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

// UpdateAllCopy 如果不希望修改原数据，返回一个新 slice（副本）
func UpdateAllCopy(s []int, newVal int) []int {
	result := make([]int, len(s))
	for i := range s {
		result[i] = newVal
	}
	return result
}

// ============ 问题 3：子切片带来的混乱 ============

// BatchProcess 分批处理数据
// 修复：每个批次创建独立副本，不共享底层数组
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
		// 修复：创建副本
		batch := make([]int, end-i)
		copy(batch, data[i:end])
		batches = append(batches, batch)
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
// 修复：返回数据副本，防止外部修改内部状态
func (ds *DataStore) GetData() []int {
	result := make([]int, len(ds.data))
	copy(result, ds.data)
	return result
}

func main() {
	// 演示问题 1 — 修复后
	nums := []int{1, 2, 3}
	nums = AddItem(nums, 4)
	fmt.Println("问题1 - AddItem 后:", nums) // [1,2,3,4]

	// 演示问题 4 — 修复后
	store := NewDataStore()
	data := store.GetData()
	data[0] = 100
	fmt.Println("问题4 - 修改导出数据后:", store.data) // [1,2,3,4,5] — 内部数据不受影响

	// 演示问题 3 — 修复后
	original := []int{1, 2, 3, 4, 5, 6}
	batches := BatchProcess(original, 2)
	fmt.Println("问题3 - 批次修改后 original:", original) // [1,2,3,4,5,6] — 不受影响
	_ = batches
}
