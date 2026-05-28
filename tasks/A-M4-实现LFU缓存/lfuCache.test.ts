import { LFUCache } from './template';
import assert from 'assert';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
  } catch (e: any) {
    console.error(`  FAIL: ${name} - ${e.message}`);
    process.exitCode = 1;
  }
}

// 1. 基本 get/put
test('基本 get/put', () => {
  const cache = new LFUCache(3);
  cache.put(1, 1);
  assert.strictEqual(cache.get(1), 1);
});

// 2. 频率淘汰
test('频率淘汰', () => {
  const cache = new LFUCache(2);
  cache.put(1, 1);
  cache.put(2, 2);
  cache.get(1); // freq(1) = 2, freq(2) = 1
  cache.put(3, 3); // 淘汰 freq=1 的 key 2
  assert.strictEqual(cache.get(2), -1);
  assert.strictEqual(cache.get(1), 1);
  assert.strictEqual(cache.get(3), 3);
});

// 3. 频率相同淘汰最久未使用
test('同频率淘汰 LRU', () => {
  const cache = new LFUCache(2);
  cache.put(1, 1);
  cache.put(2, 2);
  // freq(1)=1, freq(2)=1, minFreq=1
  // 当 put(3) 时，淘汰同频率中 LRU 的 key（应为 key 1，因为 1 先插入）
  cache.put(3, 3);
  assert.strictEqual(cache.get(1), -1);
});

// 4. get 增加频率
test('get 增加频率', () => {
  const cache = new LFUCache(3);
  cache.put(1, 1);
  cache.put(2, 2);
  cache.put(3, 3);
  cache.get(1);
  cache.get(1); // freq(1) = 3
  cache.get(2); // freq(2) = 2
  cache.put(4, 4); // 淘汰 freq 最低的 key 3 (freq=1)
  assert.strictEqual(cache.get(3), -1);
  assert.strictEqual(cache.get(1), 1);
  assert.strictEqual(cache.get(2), 2);
  assert.strictEqual(cache.get(4), 4);
});

// 5. put 更新已有 key
test('put 更新已有 key', () => {
  const cache = new LFUCache(2);
  cache.put(1, 1);
  cache.put(1, 10);
  assert.strictEqual(cache.get(1), 10);
  assert.strictEqual(cache.get(1), 10);
  cache.put(2, 2);
  cache.put(3, 3); // 淘汰 key 1? 不，freq(1)=2, freq(2)=1, 淘汰 key 2
  assert.strictEqual(cache.get(1), 10);
  assert.strictEqual(cache.get(2), -1);
});

// 6. 容量为 1
test('容量为 1', () => {
  const cache = new LFUCache(1);
  cache.put(1, 1);
  assert.strictEqual(cache.get(1), 1);
  cache.put(2, 2); // 淘汰 key 1
  assert.strictEqual(cache.get(1), -1);
  assert.strictEqual(cache.get(2), 2);
});

// 7. 大规模操作
test('大规模操作', () => {
  const cache = new LFUCache(100);
  for (let i = 0; i < 500; i++) {
    cache.put(i, i);
  }
  for (let i = 0; i < 500; i++) {
    cache.get(i);
  }
  // 不应报错
  assert.ok(true);
});

// 8. 不存在的 key
test('不存在的 key', () => {
  const cache = new LFUCache(3);
  assert.strictEqual(cache.get(999), -1);
});

console.log('\nA-M4 测试完成');
