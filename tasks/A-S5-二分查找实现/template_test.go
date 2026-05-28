package main

import (
	"testing"
)

func TestSearch(t *testing.T) {
	tests := []struct {
		nums     []int
		target   int
		expected int
	}{
		{[]int{1, 2, 3, 4, 5}, 3, 2},
		{[]int{1, 2, 3, 4, 5}, 1, 0},
		{[]int{1, 2, 3, 4, 5}, 5, 4},
		{[]int{1, 2, 3, 4, 5}, 0, -1},
		{[]int{1, 2, 3, 4, 5}, 6, -1},
		{[]int{}, 1, -1},
		{[]int{1}, 1, 0},
		{[]int{1, 2, 3, 4, 5, 6}, 4, 3},
	}

	for _, tt := range tests {
		result := search(tt.nums, tt.target)
		if result != tt.expected {
			t.Errorf("search(%v, %d) = %d, want %d", tt.nums, tt.target, result, tt.expected)
		}
	}
}

func TestSearchLeftBound(t *testing.T) {
	tests := []struct {
		nums     []int
		target   int
		expected int
	}{
		{[]int{1, 2, 2, 2, 3}, 2, 1},
		{[]int{1, 2, 2, 2, 3}, 1, 0},
		{[]int{1, 2, 2, 2, 3}, 3, 4},
		{[]int{1, 2, 2, 2, 3}, 0, -1},
		{[]int{1, 2, 2, 2, 3}, 4, -1},
		{[]int{}, 0, -1},
		{[]int{1, 1, 1}, 1, 0},
	}

	for _, tt := range tests {
		result := searchLeftBound(tt.nums, tt.target)
		if result != tt.expected {
			t.Errorf("searchLeftBound(%v, %d) = %d, want %d", tt.nums, tt.target, result, tt.expected)
		}
	}
}

func TestSearchRightBound(t *testing.T) {
	tests := []struct {
		nums     []int
		target   int
		expected int
	}{
		{[]int{1, 2, 2, 2, 3}, 2, 3},
		{[]int{1, 2, 2, 2, 3}, 1, 0},
		{[]int{1, 2, 2, 2, 3}, 3, 4},
		{[]int{1, 2, 2, 2, 3}, 0, -1},
		{[]int{1, 2, 2, 2, 3}, 4, -1},
		{[]int{}, 0, -1},
		{[]int{1, 1, 1}, 1, 2},
	}

	for _, tt := range tests {
		result := searchRightBound(tt.nums, tt.target)
		if result != tt.expected {
			t.Errorf("searchRightBound(%v, %d) = %d, want %d", tt.nums, tt.target, result, tt.expected)
		}
	}
}
