# 实现 B+ 树插入

## 任务描述

实现一个 B+ 树的插入操作。B+ 树是一种多路平衡搜索树，广泛应用于数据库和文件系统的索引结构中。

B+ 树的关键特性：
1. 所有关键字都出现在叶子节点中（内部节点仅存储"路由"关键字）
2. 叶子节点之间通过指针连接形成有序链表（便于范围查询）
3. 内部节点可以有多个子节点（叉数由阶数 M 决定）
4. 所有叶子节点在同一层（树高平衡）

请实现一个**阶数为 M 的 B+ 树**，要求：
- 每个内部节点最多有 M 个子节点（即最多 M-1 个关键字）
- 每个内部节点至少有 ⌈M/2⌉ 个子节点（根节点除外）
- 每个叶子节点最多有 M-1 个关键字
- 每个叶子节点至少有 ⌈(M-1)/2⌉ 个关键字（根节点除外）
- 插入时从根节点向下查找，在满的叶子节点插入后分裂

## 示例

```go
// 阶数为 4 的 B+ 树
tree := NewBPlusTree(4)

tree.Insert(10)
tree.Insert(20)
tree.Insert(30)
tree.Insert(40) // 触发叶子节点分裂
tree.Insert(50)

// 搜索
fmt.Println(tree.Search(30)) // true
fmt.Println(tree.Search(25)) // false

// 范围查询
results := tree.RangeSearch(20, 40) // [20, 30, 40]

// 中序遍历叶子节点
fmt.Println(tree.Inorder()) // [10, 20, 30, 40, 50]
```

## 语言要求

使用 Go 实现。

## 需要实现的方法

- `NewBPlusTree(order int)` — 创建指定阶数的 B+ 树
- `Insert(key int)` — 插入一个关键字
- `Search(key int) bool` — 搜索关键字是否存在
- `Inorder() []int` — 按顺序返回所有关键字
- `RangeSearch(low, high int) []int` — 范围查询
