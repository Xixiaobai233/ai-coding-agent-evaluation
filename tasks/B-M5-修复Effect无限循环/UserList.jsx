import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const API_BASE = 'https://api.example.com';

function UserList() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState({ role: 'all', status: 'active' });
  const [loading, setLoading] = useState(false);

  // 修复 BUG 1：使用 useMemo 稳定 queryParams 引用
  const queryParams = useMemo(() => ({
    role: filter.role,
    status: filter.status,
    page: 1,
    pageSize: 20
  }), [filter.role, filter.status]);

  // 使用 ref 跟踪 AbortController
  const abortRef = useRef(null);

  // 修复 BUG 2 & 3：fetchUsers 不放在 useCallback 中，直接在 effect 中调用
  // 修复 BUG 5：使用 AbortController 取消未完成的请求
  useEffect(() => {
    // 取消上一次请求
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams(queryParams);
        const response = await fetch(`${API_BASE}/users?${query}`, {
          signal: controller.signal
        });
        const data = await response.json();
        if (!controller.signal.aborted) {
          setUsers(data);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Fetch error:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      controller.abort();
    };
  }, [queryParams]);

  // 修复 BUG 4：只依赖 settings.theme，而非整个 settings 对象
  const [settings, setSettings] = useState({ theme: 'light', compact: false });

  useEffect(() => {
    document.body.className = settings.theme;
  }, [settings.theme]);

  return (
    <div className={settings.theme}>
      <select
        value={filter.role}
        onChange={e => setFilter(f => ({ ...f, role: e.target.value }))}
      >
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
