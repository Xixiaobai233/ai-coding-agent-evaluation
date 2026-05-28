/**
 * 拓扑排序 - DFS 后序遍历 + 三色标记法
 *
 * 状态：0 = 未访问, 1 = 正在访问（在当前 DFS 路径中）, 2 = 已访问完成
 * 遇到状态 1 表示存在环
 *
 * @param {number} numNodes
 * @param {[number, number][]} edges
 * @returns {number[]}
 */
function topologicalSort(numNodes, edges) {
  // 构建邻接表
  const graph = Array.from({ length: numNodes }, () => []);
  for (const [from, to] of edges) {
    graph[from].push(to);
  }

  const state = new Array(numNodes).fill(0); // 0=未访问, 1=访问中, 2=已完成
  const result = [];
  let hasCycle = false;

  function dfs(node) {
    if (hasCycle) return;
    if (state[node] === 1) {
      // 遇到正在访问中的节点 => 存在环
      hasCycle = true;
      return;
    }
    if (state[node] === 2) return; // 已处理完毕

    state[node] = 1; // 标记为正在访问
    for (const neighbor of graph[node]) {
      dfs(neighbor);
    }
    state[node] = 2; // 标记为已完成
    result.unshift(node); // 后序加入结果
  }

  for (let i = 0; i < numNodes; i++) {
    if (state[i] === 0) {
      dfs(i);
    }
  }

  return hasCycle ? [] : result;
}

module.exports = { topologicalSort };
