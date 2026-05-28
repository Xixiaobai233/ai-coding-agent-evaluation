package main

import (
	"reflect"
	"testing"
)

func TestDijkstra(t *testing.T) {
	tests := []struct {
		name   string
		graph  [][][]int
		start  int
		expect []int
	}{
		{
			name: "简单图",
			graph: [][][]int{
				{{1, 4}, {2, 1}},    // 0 -> 1(4), 0 -> 2(1)
				{{3, 1}},             // 1 -> 3(1)
				{{1, 2}, {3, 5}},     // 2 -> 1(2), 2 -> 3(5)
				{},                   // 3 -> 无
			},
			start:  0,
			expect: []int{0, 3, 1, 4},
		},
		{
			name:   "单个节点",
			graph:  [][][]int{{{}}},
			start:  0,
			expect: []int{0},
		},
		{
			name: "不可达节点",
			graph: [][][]int{
				{{1, 1}},
				{},
				{},
			},
			start:  0,
			expect: []int{0, 1, -1},
		},
		{
			name: "多个路径",
			graph: [][][]int{
				{{1, 5}, {2, 2}},    // 0 -> 1(5), 0 -> 2(2)
				{{3, 1}},             // 1 -> 3(1)
				{{1, 1}, {3, 5}},     // 2 -> 1(1), 2 -> 3(5)
				{},                   // 3
			},
			start:  0,
			expect: []int{0, 3, 2, 4},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := dijkstra(tt.graph, tt.start)
			if !reflect.DeepEqual(result, tt.expect) {
				t.Errorf("dijkstra() = %v, want %v", result, tt.expect)
			}
		})
	}
}
