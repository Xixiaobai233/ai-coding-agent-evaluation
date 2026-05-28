// Dijkstra 最短路径算法
//
// 使用最小堆优化的 Dijkstra 算法，计算从起点到所有节点的最短距离。

package main

import (
	"container/heap"
	"math"
)

// Item 是优先队列中的元素
type Item struct {
	node     int // 节点编号
	distance int // 从起点到该节点的当前最短距离
	index    int // 在堆中的索引（由 heap.Interface 维护）
}

// PriorityQueue 实现 heap.Interface 的最小堆
type PriorityQueue []*Item

func (pq PriorityQueue) Len() int { return len(pq) }

func (pq PriorityQueue) Less(i, j int) bool {
	return pq[i].distance < pq[j].distance
}

func (pq PriorityQueue) Swap(i, j int) {
	pq[i], pq[j] = pq[j], pq[i]
	pq[i].index = i
	pq[j].index = j
}

func (pq *PriorityQueue) Push(x interface{}) {
	n := len(*pq)
	item := x.(*Item)
	item.index = n
	*pq = append(*pq, item)
}

func (pq *PriorityQueue) Pop() interface{} {
	old := *pq
	n := len(old)
	item := old[n-1]
	old[n-1] = nil
	item.index = -1
	*pq = old[0 : n-1]
	return item
}

// dijkstra 计算从 start 到所有节点的最短距离
// graph[from] 的格式为 [][2]int{{to, weight}, ...}
// 返回 dist[]，dist[i] 为从 start 到 i 的最短距离，不可达为 -1
func dijkstra(graph [][][]int, start int) []int {
	n := len(graph)
	dist := make([]int, n)
	for i := range dist {
		dist[i] = math.MaxInt32
	}
	// TODO: 初始化起点距离，初始化最小堆，进行 Dijkstra 主循环
	return dist
}
