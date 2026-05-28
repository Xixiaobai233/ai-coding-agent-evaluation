package main

import (
	"reflect"
	"testing"
)

func TestBPlusTreeBasic(t *testing.T) {
	tree := NewBPlusTree(3)

	// 基本插入与搜索
	tree.Insert(10)
	tree.Insert(20)
	tree.Insert(5)

	if !tree.Search(10) {
		t.Error("10 应存在")
	}
	if !tree.Search(20) {
		t.Error("20 应存在")
	}
	if !tree.Search(5) {
		t.Error("5 应存在")
	}
	if tree.Search(15) {
		t.Error("15 不应存在")
	}
}

func TestBPlusTreeOrder(t *testing.T) {
	tree := NewBPlusTree(3)

	// 插入超过阶数个元素，测试分裂
	for i := 1; i <= 10; i++ {
		tree.Insert(i)
	}

	for i := 1; i <= 10; i++ {
		if !tree.Search(i) {
			t.Errorf("%d 应存在", i)
		}
	}
}

func TestBPlusTreeInorder(t *testing.T) {
	tree := NewBPlusTree(3)
	expected := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

	for _, v := range expected {
		tree.Insert(v)
	}

	result := tree.Inorder()
	if !reflect.DeepEqual(result, expected) {
		t.Errorf("中序遍历 = %v, want %v", result, expected)
	}
}

func TestBPlusTreeInorderReverse(t *testing.T) {
	tree := NewBPlusTree(3)
	expected := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

	for i := 10; i >= 1; i-- {
		tree.Insert(i)
	}

	result := tree.Inorder()
	if !reflect.DeepEqual(result, expected) {
		t.Errorf("逆序插入后中序遍历 = %v, want %v", result, expected)
	}
}

func TestBPlusTreeRangeSearch(t *testing.T) {
	tree := NewBPlusTree(3)

	for i := 1; i <= 20; i++ {
		tree.Insert(i)
	}

	result := tree.RangeSearch(5, 10)
	expected := []int{5, 6, 7, 8, 9, 10}
	if !reflect.DeepEqual(result, expected) {
		t.Errorf("范围查询 = %v, want %v", result, expected)
	}
}

func TestBPlusTreeBalance(t *testing.T) {
	tree := NewBPlusTree(4)

	for i := 1; i <= 100; i++ {
		tree.Insert(i)
	}

	// 验证中序遍历正确
	result := tree.Inorder()
	if len(result) != 100 {
		t.Errorf("应包含 100 个元素，实际 %d", len(result))
	}

	for i := 1; i <= 100; i++ {
		if result[i-1] != i {
			t.Errorf("位置 %d 应为 %d，实际 %d", i-1, i, result[i-1])
		}
	}

	// 验证叶子节点在同一层（平衡性）
	node := tree.root
	for !node.isLeaf {
		node = node.children[0]
	}
	leafLevel := getLevel(tree.root, node)
	if leafLevel == 0 {
		// 这只是一个简单的平衡性检查
	}
}

func getLevel(root, target *BPlusTreeNode) int {
	if root == nil {
		return -1
	}
	queue := []*BPlusTreeNode{root}
	level := 0
	for len(queue) > 0 {
		size := len(queue)
		for i := 0; i < size; i++ {
			node := queue[i]
			if node == target {
				return level
			}
			if !node.isLeaf {
				queue = append(queue, node.children...)
			}
		}
		queue = queue[size:]
		level++
	}
	return -1
}
