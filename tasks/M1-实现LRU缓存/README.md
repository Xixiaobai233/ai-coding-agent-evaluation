# 实现 LRU 缓存

## 任务描述

我需要一个 LRU (Least Recently Used) 缓存类。这个缓存有一个固定的容量，当缓存满时，最久未使用的条目会被淘汰。

类需要实现以下方法：
- `get(key)` — 获取缓存中的值。如果 key 存在，返回对应的 value，并将该 key 标记为最近使用；如果不存在返回 -1。
- `put(key, value)` — 写入缓存。如果 key 已存在，更新其 value 并标记为最近使用；如果 key 不存在，写入新条目。如果写入后超出容量，淘汰最久未使用的 key。

## 示例

```javascript
const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
cache.get(1);    // 返回 1
cache.put(3, 3); // 淘汰 key 2
cache.get(2);    // 返回 -1（已被淘汰）
cache.put(4, 4); // 淘汰 key 1
cache.get(1);    // 返回 -1
cache.get(3);    // 返回 3
cache.get(4);    // 返回 4
```

## 语言要求

使用 JavaScript/TypeScript 实现。

## 模板代码

```javascript
class LRUCache {
  constructor(capacity) {
    // TODO
  }

  get(key) {
    // TODO
  }

  put(key, value) {
    // TODO
  }
}

module.exports = { LRUCache };
```
