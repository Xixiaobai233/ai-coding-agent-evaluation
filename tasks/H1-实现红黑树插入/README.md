# 实现红黑树插入

## 任务描述

我需要一个红黑树（Red-Black Tree）的插入实现。红黑树是一种自平衡二叉搜索树，它保证在最坏情况下基本操作的时间复杂度为 O(log n)。

请实现一个红黑树类，支持插入操作，并在插入后通过旋转和变色保持以下红黑树性质：

1. 每个节点是红色或黑色
2. 根节点是黑色
3. 每个叶子节点（NIL）是黑色
4. 如果一个节点是红色，则它的两个子节点都是黑色（即不能有连续的红色节点）
5. 对于每个节点，从该节点到其所有后代叶子节点的简单路径上，均包含相同数目的黑色节点

## 示例

```javascript
const tree = new RedBlackTree();
tree.insert(7);
tree.insert(3);
tree.insert(18);
tree.insert(10);
tree.insert(22);
tree.insert(8);
tree.insert(11);
tree.insert(26);

// 中序遍历应输出排序结果
console.log(tree.inorder()); // [3, 7, 8, 10, 11, 18, 22, 26]

// 树应满足红黑树所有性质
console.log(tree.validate()); // true
```

## 语言要求

使用 JavaScript/TypeScript 实现。

## 需要实现的方法

- `insert(key)` — 插入一个键值
- `search(key)` — 搜索键是否存在
- `inorder()` — 中序遍历，返回排序后的数组
- `validate()` — 验证红黑树性质是否满足
