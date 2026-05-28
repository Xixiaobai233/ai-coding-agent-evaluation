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
	if order < 3 {
		order = 3
	}
	root := &BPlusTreeNode{
		isLeaf: true,
		keys:   []int{},
	}
	return &BPlusTree{
		root:  root,
		order: order,
	}
}

// Insert 插入一个关键字
func (tree *BPlusTree) Insert(key int) {
	root := tree.root
	if len(root.keys) == tree.order-1 {
		// 根节点满，创建新根
		newRoot := &BPlusTreeNode{
			isLeaf:   false,
			keys:     []int{},
			children: []*BPlusTreeNode{root},
		}
		root.parent = newRoot
		tree.root = newRoot
		tree.splitChild(newRoot, 0)
	}
	tree.insertNonFull(tree.root, key)
}

func (tree *BPlusTree) insertNonFull(node *BPlusTreeNode, key int) {
	if node.isLeaf {
		// 插入到叶子节点
		pos := 0
		for pos < len(node.keys) && node.keys[pos] < key {
			pos++
		}
		node.keys = append(node.keys, 0)
		copy(node.keys[pos+1:], node.keys[pos:])
		node.keys[pos] = key
	} else {
		// 找到应插入的子节点
		pos := len(node.keys) - 1
		for pos >= 0 && key < node.keys[pos] {
			pos--
		}
		pos++
		if len(node.children[pos].keys) == tree.order-1 {
			tree.splitChild(node, pos)
			if key > node.keys[pos] {
				pos++
			}
		}
		tree.insertNonFull(node.children[pos], key)
	}
}

func (tree *BPlusTree) splitChild(parent *BPlusTreeNode, index int) {
	order := tree.order
	child := parent.children[index]
	mid := order / 2

	// 创建新节点
	newNode := &BPlusTreeNode{
		isLeaf: child.isLeaf,
		keys:   make([]int, order-mid-1),
		parent: parent,
	}
	copy(newNode.keys, child.keys[mid+1:])

	if !child.isLeaf {
		newNode.children = make([]*BPlusTreeNode, order-mid-1)
		copy(newNode.children, child.children[mid+1:])
		for i := mid + 1; i < order; i++ {
			if child.children[i] != nil {
				child.children[i].parent = newNode
			}
		}
	} else {
		newNode.next = child.next
		newNode.isLeaf = true
		child.next = newNode
	}

	// 缩减原节点
	child.keys = child.keys[:mid]

	if !child.isLeaf {
		child.children = child.children[:mid+1]
	}

	// 将中间关键字提升到父节点
	midKey := child.keys[mid]

	parent.keys = append(parent.keys, 0)
	copy(parent.keys[index+1:], parent.keys[index:])
	parent.keys[index] = midKey

	parent.children = append(parent.children, nil)
	copy(parent.children[index+2:], parent.children[index+1:])
	parent.children[index+1] = newNode
}

// Search 搜索关键字是否存在
func (tree *BPlusTree) Search(key int) bool {
	node := tree.root
	for !node.isLeaf {
		pos := 0
		for pos < len(node.keys) && key >= node.keys[pos] {
			pos++
		}
		node = node.children[pos]
	}
	for _, k := range node.keys {
		if k == key {
			return true
		}
	}
	return false
}

// Inorder 按顺序返回所有关键字
func (tree *BPlusTree) Inorder() []int {
	if tree.root == nil {
		return nil
	}
	node := tree.root
	for !node.isLeaf {
		node = node.children[0]
	}
	var result []int
	for node != nil {
		result = append(result, node.keys...)
		node = node.next
	}
	return result
}

// RangeSearch 范围查询 [low, high]
func (tree *BPlusTree) RangeSearch(low, high int) []int {
	var result []int
	if tree.root == nil {
		return result
	}

	// 找到 low 所在的叶子节点
	node := tree.root
	for !node.isLeaf {
		pos := 0
		for pos < len(node.keys) && low >= node.keys[pos] {
			pos++
		}
		node = node.children[pos]
	}

	// 沿链表遍历
	for node != nil {
		for _, k := range node.keys {
			if k >= low && k <= high {
				result = append(result, k)
			}
			if k > high {
				return result
			}
		}
		node = node.next
	}
	return result
}
