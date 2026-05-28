# 实现跳表 Skip List

## 任务描述

实现一个跳表（Skip List）数据结构。跳表是一种基于多级链表的有序数据结构，通过维护多层索引实现了近似平衡树的查找效率，且实现比平衡树更简单。

跳表的期望时间复杂度：
- 搜索：O(log n)
- 插入：O(log n)
- 删除：O(log n)

要求实现以下方法：
- `search(target)` — 返回目标值是否存在
- `add(num)` — 插入一个值（允许重复）
- `erase(num)` — 删除一个值（只删除一个匹配项，如果存在返回 true，否则 false）

## 跳表结构说明

跳表由多层链表构成：
- 第 0 层（最底层）是包含所有元素的有序链表
- 上面的每一层都是下一层的"快速通道"，包含部分元素的索引
- 每个节点在插入时**随机决定**其层数（通常使用抛硬币法）
- 查找时从最高层开始，快速定位到目标区间

## 示例

```javascript
const skiplist = new Skiplist();

skiplist.add(1);
skiplist.add(2);
skiplist.add(3);
skiplist.search(0);   // 返回 false
skiplist.add(4);
skiplist.search(1);   // 返回 true
skiplist.erase(0);    // 返回 false（不存在）
skiplist.erase(1);    // 返回 true
skiplist.search(1);   // 返回 false（已被删除）

// 处理重复值
skiplist.add(1);
skiplist.add(1);
skiplist.erase(1);    // 返回 true（删除一个 1）
skiplist.search(1);   // 返回 true（还有一个 1）
skiplist.erase(1);    // 返回 true（删除最后一个 1）
skiplist.search(1);   // 返回 false
```

## 语言要求

使用 JavaScript 实现。
