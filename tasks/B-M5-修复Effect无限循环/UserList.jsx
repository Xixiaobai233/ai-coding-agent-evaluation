import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = 'https://api.example.com';

function UserList() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState({ role: 'all', status: 'active' });
  const [loading, setLoading] = useState(false);

  // BUG 1：每次渲染都创建新对象，导致依赖变化
  const queryParams = {
    role: filter.role,
    status: filter.status,
    page: 1,
    pageSize: 20
  };

  // BUG 2：依赖 queryParams（引用类型），每次渲染都不同，useCallback 无效
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams(queryParams);
    const response = await fetch(`${API_BASE}/users?${query}`);
    const data = await response.json();
    setUsers(data);
    setLoading(false);
  }, [queryParams]);

  // BUG 3：依赖 fetchUsers，而 fetchUsers 每次渲染都变 → 无限循环
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // BUG 4：settings 来自 useState（引用稳定），但此处依赖整个对象冗余
  const [settings, setSettings] = useState({ theme: 'light', compact: false });

  useEffect(() => {
    document.body.className = settings.theme;
  }, [settings]); // 只依赖 theme 即可，compact 变化不应触发

  // BUG 5：无请求取消机制，组件卸载后可能 setState 报错
  // 且 filter 变化时，旧请求仍在运行

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
