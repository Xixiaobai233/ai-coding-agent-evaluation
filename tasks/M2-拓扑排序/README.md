# 拓扑排序

## 任务描述

帮我实现一个拓扑排序函数。给定一个有向图的节点数和依赖关系（边），返回一个拓扑排序结果。

如果图中存在环，则无法进行拓扑排序，应返回空数组或抛出异常。

## 示例

```javascript
// 4 个节点，依赖关系：0->1, 0->2, 1->3, 2->3
// 即 0 必须在 1,2 之前，1,2 必须在 3 之前
topologicalSort(4, [[0,1], [0,2], [1,3], [2,3]]);
// 返回: [0, 1, 2, 3] 或 [0, 2, 1, 3] 均可

// 有环: 0->1, 1->2, 2->0
topologicalSort(3, [[0,1], [1,2], [2,0]]);
// 返回: []（存在环）
```

## 语言要求

使用 JavaScript/TypeScript 实现。

## 函数签名

```typescript
function topologicalSort(
  numNodes: number,
  edges: [number, number][]
): number[]
```
