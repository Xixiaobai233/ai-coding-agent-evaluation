/**
 * JS 实现的 Dijkstra 测试，用于验证算法正确性
 */

/**
 * 最小堆
 */
class MinHeap {
  constructor() { this.heap = []; }
  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }
  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }
  get size() { return this.heap.length; }
  _bubbleUp(i) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.heap[p].distance <= this.heap[i].distance) break;
      [this.heap[p], this.heap[i]] = [this.heap[i], this.heap[p]];
      i = p;
    }
  }
  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.heap[l].distance < this.heap[smallest].distance) smallest = l;
      if (r < n && this.heap[r].distance < this.heap[smallest].distance) smallest = r;
      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }
}

function dijkstra(graph, start) {
  const n = graph.length;
  const dist = new Array(n).fill(Infinity);
  dist[start] = 0;

  const pq = new MinHeap();
  pq.push({ node: start, distance: 0 });

  while (pq.size > 0) {
    const { node: u, distance } = pq.pop();
    if (distance > dist[u]) continue;
    for (const [v, w] of graph[u]) {
      const nd = dist[u] + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        pq.push({ node: v, distance: nd });
      }
    }
  }

  return dist.map(d => d === Infinity ? -1 : d);
}

const assert = require('assert');
let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS: ${name}`); }
  catch (e) { failed++; console.error(`  FAIL: ${name} - ${e.message}`); }
}

test('简单图', () => {
  const graph = [
    [[1, 4], [2, 1]],
    [[3, 1]],
    [[1, 2], [3, 5]],
    []
  ];
  assert.deepStrictEqual(dijkstra(graph, 0), [0, 3, 1, 4]);
});

test('单个节点', () => {
  assert.deepStrictEqual(dijkstra([[]], 0), [0]);
});

test('不可达节点', () => {
  const graph = [
    [[1, 1]],
    [],
    []
  ];
  assert.deepStrictEqual(dijkstra(graph, 0), [0, 1, -1]);
});

test('多个路径', () => {
  const graph = [
    [[1, 5], [2, 2]],
    [[3, 1]],
    [[1, 1], [3, 5]],
    []
  ];
  assert.deepStrictEqual(dijkstra(graph, 0), [0, 3, 2, 4]);
});

test('更复杂的图', () => {
  const graph = [
    [[1, 2], [2, 6]],
    [[3, 1], [2, 3]],
    [[4, 1]],
    [[4, 4]],
    []
  ];
  const result = dijkstra(graph, 0);
  assert.strictEqual(result[0], 0);
  assert.strictEqual(result[1], 2);
  assert.strictEqual(result[4], 6); // 0->1->2->4 = 2+3+1=6
});

console.log(`\nA-M5 测试完成: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
