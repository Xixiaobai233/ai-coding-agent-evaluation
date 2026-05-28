package main

import (
	"reflect"
	"testing"
)

func TestAddItem(t *testing.T) {
	nums := []int{1, 2, 3}
	result := AddItem(nums, 4)
	expected := []int{1, 2, 3, 4}
	if !reflect.DeepEqual(result, expected) {
		t.Errorf("AddItem = %v, want %v", result, expected)
	}
}

func TestRemoveFirst(t *testing.T) {
	nums := []int{1, 2, 3, 4}
	result := RemoveFirst(nums)
	expected := []int{2, 3, 4}
	if !reflect.DeepEqual(result, expected) {
		t.Errorf("RemoveFirst = %v, want %v", result, expected)
	}
	// nums[0] 仍然为 1
	if nums[0] != 1 {
		t.Errorf("nums[0] 应保持为 1，实际 %d", nums[0])
	}
}

func TestBatchProcess(t *testing.T) {
	data := []int{1, 2, 3, 4, 5, 6}
	batches := BatchProcess(data, 2)

	// 修改批次不应影响原数据
	batches[0][0] = 999
	if data[0] != 1 {
		t.Errorf("data[0] 应保持为 1，实际 %d", data[0])
	}

	expected := [][]int{{1, 2}, {3, 4}, {5, 6}}
	if !reflect.DeepEqual(batches, expected) {
		t.Errorf("BatchProcess = %v, want %v", batches, expected)
	}
}

func TestDataStore(t *testing.T) {
	ds := NewDataStore()
	data := ds.GetData()
	data[0] = 999

	// 内部数据应不受影响
	if ds.data[0] != 1 {
		t.Errorf("ds.data[0] 应保持为 1，实际 %d", ds.data[0])
	}

	// GetData 应返回正确的副本
	data2 := ds.GetData()
	expected := []int{1, 2, 3, 4, 5}
	if !reflect.DeepEqual(data2, expected) {
		t.Errorf("GetData = %v, want %v", data2, expected)
	}
}

func TestBatchProcessBoundary(t *testing.T) {
	// 空数据
	data := []int{}
	batches := BatchProcess(data, 2)
	if len(batches) != 0 {
		t.Errorf("空数据应有 0 个 batch，实际 %d", len(batches))
	}

	// batchSize 为 0
	result := BatchProcess(data, 0)
	if result != nil {
		t.Errorf("batchSize 为 0 应返回 nil")
	}

	// batchSize 大于数据长度
	data2 := []int{1, 2}
	batches2 := BatchProcess(data2, 10)
	expected := [][]int{{1, 2}}
	if !reflect.DeepEqual(batches2, expected) {
		t.Errorf("大 batchSize = %v, want %v", batches2, expected)
	}
}
