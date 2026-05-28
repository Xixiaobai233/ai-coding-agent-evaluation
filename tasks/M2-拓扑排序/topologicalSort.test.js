const { describe, it } = require('node:test');
const assert = require('node:assert');
const { topologicalSort } = require('./template.js');

describe('topologicalSort', () => {
  it('简单依赖链：0->1->2', () => {
    const result = topologicalSort(3, [[0, 1], [1, 2]]);
    assert.deepStrictEqual(result, [0, 1, 2]);
  });

  it('多分支：0->1, 0->2, 1->3, 2->3', () => {
    const result = topologicalSort(4, [[0, 1], [0, 2], [1, 3], [2, 3]]);
    // 0 必须在 1 和 2 之前，1 和 2 必须在 3 之前
    assert.strictEqual(result.length, 4);
    assert.ok(result.indexOf(0) < result.indexOf(1));
    assert.ok(result.indexOf(0) < result.indexOf(2));
    assert.ok(result.indexOf(1) < result.indexOf(3));
    assert.ok(result.indexOf(2) < result.indexOf(3));
  });

  it('有环检测：0->1, 1->2, 2->0', () => {
    const result = topologicalSort(3, [[0, 1], [1, 2], [2, 0]]);
    assert.deepStrictEqual(result, []);
  });

  it('自环：0->0', () => {
    const result = topologicalSort(2, [[0, 0]]);
    assert.deepStrictEqual(result, []);
  });

  it('无依赖：3 个孤立节点', () => {
    const result = topologicalSort(3, []);
    assert.strictEqual(result.length, 3);
    // 必须包含所有节点
    const sorted = [...result].sort((a, b) => a - b);
    assert.deepStrictEqual(sorted, [0, 1, 2]);
  });

  it('多个连通分量：0->1, 2->3', () => {
    const result = topologicalSort(5, [[0, 1], [2, 3]]);
    assert.strictEqual(result.length, 5);
    // 0 必须在 1 之前
    assert.ok(result.indexOf(0) < result.indexOf(1));
    // 2 必须在 3 之前
    assert.ok(result.indexOf(2) < result.indexOf(3));
  });

  it('大规模图：1000 节点线性链', () => {
    const edges = [];
    for (let i = 0; i < 999; i++) {
      edges.push([i, i + 1]);
    }
    const result = topologicalSort(1000, edges);
    assert.strictEqual(result.length, 1000);
    assert.deepStrictEqual(result, Array.from({ length: 1000 }, (_, i) => i));
  });

  it('间接环：0->1, 1->2, 2->3, 3->1', () => {
    const result = topologicalSort(4, [[0, 1], [1, 2], [2, 3], [3, 1]]);
    assert.deepStrictEqual(result, []);
  });

  it('完全无环的大 DAG', () => {
    const edges = [
      [0, 2], [0, 3], [1, 2], [1, 3], [2, 4], [3, 4], [3, 5], [4, 6], [5, 6]
    ];
    const result = topologicalSort(7, edges);
    assert.strictEqual(result.length, 7);
    // 验证所有依赖关系
    for (const [from, to] of edges) {
      assert.ok(result.indexOf(from) < result.indexOf(to),
        `${from} 应在 ${to} 之前`);
    }
  });

  it('空图：0 个节点', () => {
    const result = topologicalSort(0, []);
    assert.deepStrictEqual(result, []);
  });

  it('单节点自环', () => {
    const result = topologicalSort(1, [[0, 0]]);
    assert.deepStrictEqual(result, []);
  });
});
