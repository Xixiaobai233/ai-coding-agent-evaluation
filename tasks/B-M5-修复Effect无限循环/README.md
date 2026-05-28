# 修复 React useEffect 无限循环

## 任务描述

我写了一个用户列表页面，每次从 API 获取数据然后展示。但页面一加载就卡死了，浏览器标签页一直在转圈圈，CPU 暴涨。我发现是 useEffect 导致了无限循环——组件渲染 -> effect 执行 -> 更新状态 -> 组件重新渲染 -> effect 又执行，周而复始。

帮我看看这段代码有什么问题并修复它。

当前代码的问题：
- `useEffect` 依赖数组中包含引用类型（对象/数组/函数），导致每次渲染都触发 effect
- 或者在 effect 中更新的状态是 effect 的依赖，形成闭环
- 缺少合理的防抖或取消机制

## 代码

```jsx
import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = 'https://api.example.com';

function UserList() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState({ role: 'all', status: 'active' });
  const [loading, setLoading] = useState(false);

  // BUG 1：每次渲染都创建新对象，导致 useEffect 无限循环
  const queryParams = {
    role: filter.role,
    status: filter.status,
    page: 1,
    pageSize: 20
  };

  // BUG 2：fetchUsers 的依赖是 queryParams（引用类型），每次渲染都变化
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams(queryParams);
    const response = await fetch(`${API_BASE}/users?${query}`);
    const data = await response.json();
    setUsers(data);
    setLoading(false);
  }, [queryParams]);  // ← 这里：queryParams 每次都是新对象

  // BUG 3：effect 依赖 fetchUsers，每次渲染它都变化，导致无限循环
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // BUG 4：这里也直接内联对象，触发重渲染
  const [settings, setSettings] = useState({ theme: 'light', compact: false });

  useEffect(() => {
    document.body.className = settings.theme;
  }, [settings]);  // ← settings 是每次渲染新建的初始值？不，useState 保留引用

  // BUG 5：内联函数作为依赖
  useEffect(() => {
    const interval = setInterval(() => {
      // 业务逻辑
    }, 5000);
    return () => clearInterval(interval);
  }, [filter]);  // ← filter 是引用类型，但来自 useState，引用稳定
  // 等一下，上面 filter 是稳定的（来自 useState），但 queryParams 不是

  return (
    <div>
      <select onChange={e => setFilter(f => ({ ...f, role: e.target.value }))}>
        <option value="all">全部</option>
        <option value="admin">管理员</option>
        <option value="user">普通用户</option>
      </select>
      {loading ? <p>加载中...</p> : (
        <ul>
          {users.map(user => <li key={user.id}>{user.name}</li>)}
        </ul>
      )}
    </div>
  );
}

export default UserList;
```

## 语言要求

使用 React + JavaScript/TypeScript。
