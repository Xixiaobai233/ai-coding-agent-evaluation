/**
 * 红黑树插入 - 验收测试
 */
const { RedBlackTree } = require('./template.js');
const assert = require('assert');

// ---- 辅助：验证树的高度是否满足 2*log2(n+1) ----
function maxValidHeight(n) {
  return Math.floor(2 * Math.log2(n + 1));
}

// ---- Test 1: 基本插入 ----
{
  const tree = new RedBlackTree();
  const values = [7, 3, 18, 10, 22, 8, 11, 26];
  values.forEach(v => tree.insert(v));
  const inorder = tree.inorder();
  assert.deepStrictEqual(inorder, [3, 7, 8, 10, 11, 18, 22, 26],
    `基本插入失败: 期望 [3,7,8,10,11,18,22,26], 得到 ${JSON.stringify(inorder)}`);
  assert.strictEqual(tree.validate(), true, '基本插入后 validate() 失败');
  console.log('[PASS] Test 1: 基本插入');
}

// ---- Test 2: 重复插入 ----
{
  const tree = new RedBlackTree();
  tree.insert(5);
  tree.insert(3);
  tree.insert(7);
  tree.insert(5); // 重复
  tree.insert(3); // 重复
  const inorder = tree.inorder();
  assert.deepStrictEqual(inorder, [3, 5, 7],
    `重复插入失败: 期望 [3,5,7], 得到 ${JSON.stringify(inorder)}`);
  assert.strictEqual(tree.validate(), true, '重复插入后 validate() 失败');
  console.log('[PASS] Test 2: 重复插入');
}

// ---- Test 3: 顺序插入 1..100 ----
{
  const tree = new RedBlackTree();
  const n = 100;
  for (let i = 1; i <= n; i++) tree.insert(i);
  const inorder = tree.inorder();
  const expected = Array.from({ length: n }, (_, i) => i + 1);
  assert.deepStrictEqual(inorder, expected,
    `顺序插入失败: 前5个 ${JSON.stringify(inorder.slice(0, 5))}, 后5个 ${JSON.stringify(inorder.slice(-5))}`);
  assert.strictEqual(tree.validate(), true, '顺序插入后 validate() 失败');
  const h = tree.height();
  const maxH = maxValidHeight(n);
  assert.ok(h <= maxH,
    `顺序插入高度 ${h} 超过最大允许 ${maxH}`);
  console.log(`[PASS] Test 3: 顺序插入 1..100 (高度=${h}, 最大允许=${maxH})`);
}

// ---- Test 4: 逆序插入 100..1 ----
{
  const tree = new RedBlackTree();
  const n = 100;
  for (let i = n; i >= 1; i--) tree.insert(i);
  const inorder = tree.inorder();
  const expected = Array.from({ length: n }, (_, i) => i + 1);
  assert.deepStrictEqual(inorder, expected,
    `逆序插入失败: 前5个 ${JSON.stringify(inorder.slice(0, 5))}`);
  assert.strictEqual(tree.validate(), true, '逆序插入后 validate() 失败');
  const h = tree.height();
  const maxH = maxValidHeight(n);
  assert.ok(h <= maxH,
    `逆序插入高度 ${h} 超过最大允许 ${maxH}`);
  console.log(`[PASS] Test 4: 逆序插入 100..1 (高度=${h}, 最大允许=${maxH})`);
}

// ---- Test 5: 搜索功能 ----
{
  const tree = new RedBlackTree();
  [10, 5, 15, 3, 7, 12, 18].forEach(v => tree.insert(v));
  assert.strictEqual(tree.search(10), true, '搜索 10 应为 true');
  assert.strictEqual(tree.search(7), true, '搜索 7 应为 true');
  assert.strictEqual(tree.search(1), false, '搜索 1 应为 false');
  assert.strictEqual(tree.search(20), false, '搜索 20 应为 false');
  console.log('[PASS] Test 5: 搜索功能');
}

// ---- Test 6: 空树验证 ----
{
  const tree = new RedBlackTree();
  assert.strictEqual(tree.validate(), true, '空树 validate() 应为 true');
  assert.deepStrictEqual(tree.inorder(), [], '空树 inorder() 应为 []');
  assert.strictEqual(tree.search(42), false, '空树 search 应为 false');
  console.log('[PASS] Test 6: 空树');
}

// ---- Test 7: 大量数据 + 性能验证 ----
{
  const tree = new RedBlackTree();
  const n = 10000;
  // 随机插入
  const nums = Array.from({ length: n }, (_, i) => i + 1);
  // 打乱
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  const start = Date.now();
  nums.forEach(v => tree.insert(v));
  const elapsed = Date.now() - start;
  const inorder = tree.inorder();
  assert.strictEqual(inorder.length, n, `大量插入后节点数应为 ${n}, 得到 ${inorder.length}`);
  assert.strictEqual(tree.validate(), true, '大量插入后 validate() 失败');
  const h = tree.height();
  const maxH = maxValidHeight(n);
  assert.ok(h <= maxH,
    `大量插入高度 ${h} 超过最大允许 ${maxH}`);
  console.log(`[PASS] Test 7: 大量数据 10000 随机插入 (耗时=${elapsed}ms, 高度=${h}, 最大允许=${maxH})`);
}

console.log('\n=== 所有测试通过! ===');
