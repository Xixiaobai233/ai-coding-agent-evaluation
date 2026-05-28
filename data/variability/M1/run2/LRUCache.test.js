const { describe, it } = require('node:test');
const assert = require('node:assert');
const { LRUCache } = require('./template.js');

describe('LRUCache', () => {
  it('基本 get/set：put(1,1) 后 get(1) 返回 1', () => {
    const cache = new LRUCache(2);
    cache.put(1, 1);
    assert.strictEqual(cache.get(1), 1);
  });

  it('容量淘汰：容量 2，put 三个键后最早的被淘汰', () => {
    const cache = new LRUCache(2);
    cache.put(1, 1);
    cache.put(2, 2);
    cache.put(3, 3);
    assert.strictEqual(cache.get(1), -1);
    assert.strictEqual(cache.get(2), 2);
    assert.strictEqual(cache.get(3), 3);
  });

  it('get 更新使用顺序：get 过的 key 不会被淘汰', () => {
    const cache = new LRUCache(2);
    cache.put(1, 1);
    cache.put(2, 2);
    cache.get(1); // 1 变为最近使用
    cache.put(3, 3); // 淘汰 2
    assert.strictEqual(cache.get(1), 1);
    assert.strictEqual(cache.get(2), -1);
    assert.strictEqual(cache.get(3), 3);
  });

  it('put 更新已有 key：更新 value 后 get 返回新值，且不增加条目数', () => {
    const cache = new LRUCache(2);
    cache.put(1, 1);
    cache.put(2, 2);
    cache.put(1, 10); // 更新 key 1，现在顺序: 1 (MRU), 2 (LRU)
    assert.strictEqual(cache.get(1), 10);  // 验证更新
    // 注意: 不要在这里 get(2)，否则会改变 LRU 顺序
    // 再 put 一个，应该淘汰 2（因为 1 刚被更新）
    cache.put(3, 3);
    assert.strictEqual(cache.get(2), -1);  // 2 被淘汰
    assert.strictEqual(cache.get(1), 10);  // 1 还在
    assert.strictEqual(cache.get(3), 3);   // 3 已加入
  });

  it('容量为 1 的场景：每 put 新的就淘汰旧的', () => {
    const cache = new LRUCache(1);
    cache.put(1, 1);
    assert.strictEqual(cache.get(1), 1);
    cache.put(2, 2);
    assert.strictEqual(cache.get(1), -1);
    assert.strictEqual(cache.get(2), 2);
    cache.put(3, 3);
    assert.strictEqual(cache.get(2), -1);
    assert.strictEqual(cache.get(3), 3);
  });

  it('大量操作不报错：连续 1000 次 put + get 正常', () => {
    const cache = new LRUCache(100);
    for (let i = 0; i < 1000; i++) {
      cache.put(i, i * 2);
    }
    // 前 900 个应该被淘汰了（容量 100，放了 1000 个）
    for (let i = 0; i < 900; i++) {
      assert.strictEqual(cache.get(i), -1);
    }
    for (let i = 900; i < 1000; i++) {
      assert.strictEqual(cache.get(i), i * 2);
    }
  });

  it('示例场景', () => {
    const cache = new LRUCache(2);
    cache.put(1, 1);
    cache.put(2, 2);
    assert.strictEqual(cache.get(1), 1);
    cache.put(3, 3); // 淘汰 key 2
    assert.strictEqual(cache.get(2), -1);
    cache.put(4, 4); // 淘汰 key 1
    assert.strictEqual(cache.get(1), -1);
    assert.strictEqual(cache.get(3), 3);
    assert.strictEqual(cache.get(4), 4);
  });

  it('put 更新已有 key 后不增加条目且更新 MRU 顺序', () => {
    const cache = new LRUCache(3);
    cache.put(1, 1);
    cache.put(2, 2);
    cache.put(3, 3);
    cache.put(2, 22); // 更新 2
    cache.put(4, 4);  // 应淘汰 1（最久未使用）
    assert.strictEqual(cache.get(1), -1);
    assert.strictEqual(cache.get(2), 22);
    assert.strictEqual(cache.get(3), 3);
    assert.strictEqual(cache.get(4), 4);
  });
});
