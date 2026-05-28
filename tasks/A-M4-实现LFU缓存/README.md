# 最近最少使用 LFU 缓存

## 任务描述

实现一个 LFU (Least Frequently Used) 缓存类。LFU 缓存淘汰策略：当缓存达到容量上限时，淘汰**使用频率最低**的条目；如果多个条目使用频率相同，则淘汰**最久未使用**的那个。

类需要实现以下方法：
- `get(key)` — 获取缓存中的值。如果 key 存在，返回对应的 value，并将该 key 的使用频率加 1；如果不存在返回 -1。
- `put(key, value)` — 写入缓存。如果 key 已存在，更新其 value 并增加频率；如果 key 不存在，写入新条目（频率为 1）。如果写入后超出容量，淘汰使用频率最低的条目（频率相同则淘汰最久未使用的）。

要求：
- get 和 put 的时间复杂度均为 O(1)
- 使用**哈希表 + 频率链表**实现

## 示例

```typescript
const cache = new LFUCache(2);

cache.put(1, 1);
cache.put(2, 2);
cache.get(1);      // 返回 1 (频率: key1=2, key2=1)

cache.put(3, 3);   // 淘汰 key2 (频率最低且最久)
cache.get(2);      // 返回 -1 (已被淘汰)
cache.get(3);      // 返回 3 (频率: key3=2)

cache.put(4, 4);   // 淘汰 key1 (频率: key1=2, key3=2, key4=1, 淘汰最久未用的 key1)
cache.get(1);      // 返回 -1
cache.get(3);      // 返回 3
cache.get(4);      // 返回 4
```

## 语言要求

使用 TypeScript 实现。
