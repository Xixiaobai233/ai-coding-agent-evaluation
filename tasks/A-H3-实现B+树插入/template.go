// B+ 树插入实现
//
// 阶数为 M 的 B+ 树，所有关键字在叶子节点中，
// 内部节点仅存储路由关键字。

package main

// BPlusTreeNode 是 B+ 树节点的通用结构
type BPlusTreeNode struct {
	isLeaf   bool             // 是否为叶子节点
	keys     []int            // 关键字列表
	children []*BPlusTreeNode // 子节点指针（仅内部节点使用）
	next     *BPlusTreeNode   // 下一个叶子节点（仅叶子节点使用）
	parent   *BPlusTreeNode   // 父节点
}

// BPlusTree 是 B+ 树
type BPlusTree struct {
	root  *BPlusTreeNode // 根节点
	order int            // 阶数 M
}

// NewBPlusTree 创建一个新的 B+ 树
func NewBPlusTree(order int) *BPlusTree {
	// TODO: 初始化 B+ 树，创建空的根节点（叶子节点）
	return nil
}

// Insert 插入一个关键字
func (tree *BPlusTree) Insert(key int) {
	// TODO: 实现插入逻辑
	// 1. 从根节点向下查找应该插入的叶子节点
	// 2. 如果叶子节点未满，直接插入
	// 3. 如果叶子节点已满，分裂后插入
	// 4. 分裂时需要将中间关键字提升到父节点
	// 5. 父节点满则继续分裂
}

// Search 搜索关键字是否存在
func (tree *BPlusTree) Search(key int) bool {
	// TODO: 从根节点向下搜索到叶子节点
	return false
}

// Inorder 按顺序返回所有关键字
func (tree *BPlusTree) Inorder() []int {
	// TODO: 通过叶子节点链表遍历
	return nil
}

// RangeSearch 范围查询 [low, high]
func (tree *BPlusTree) RangeSearch(low, high int) []int {
	// TODO: 找到 low 所在的叶子节点，然后沿链表遍历到 high
	return nil
}
