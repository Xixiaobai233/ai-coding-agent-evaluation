/**
 * Todo API 服务 — 需要你编写集成测试
 */

const express = require('express');
const app = express();

app.use(express.json());

// ========== 数据存储（内存） ==========
const users = [];
const todos = [];
let userIdCounter = 1;
let todoIdCounter = 1;

// ========== JWT 模拟 ==========
const jwt = {
  sign(payload) {
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  },
  verify(token) {
    try {
      return JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return null;
    }
  }
};

// ========== 中间件 ==========
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未认证' });
  }
  const token = auth.slice(7);
  const payload = jwt.verify(token);
  if (!payload) {
    return res.status(401).json({ error: '无效 token' });
  }
  req.user = payload;
  next();
}

// ========== 认证路由 ==========
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ error: '用户名已存在' });
  }
  const user = { id: userIdCounter++, username, password };
  users.push(user);
  res.status(201).json({ id: user.id, username: user.username });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const token = jwt.sign({ id: user.id, username: user.username });
  res.json({ token });
});

// ========== Todo 路由 ==========
app.get('/api/todos', authMiddleware, (req, res) => {
  let result = todos.filter(t => t.userId === req.user.id);

  if (req.query.status) {
    result = result.filter(t => t.status === req.query.status);
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const start = (page - 1) * limit;
  const paged = result.slice(start, start + limit);

  res.json({ data: paged, total: result.length, page, limit });
});

app.post('/api/todos', authMiddleware, (req, res) => {
  const { title, description, dueDate } = req.body;
  if (!title) {
    return res.status(400).json({ error: '标题不能为空' });
  }
  const todo = {
    id: todoIdCounter++,
    title,
    description: description || '',
    status: 'pending',
    dueDate: dueDate || null,
    userId: req.user.id,
    createdAt: new Date().toISOString()
  };
  todos.push(todo);
  res.status(201).json(todo);
});

app.get('/api/todos/:id', authMiddleware, (req, res) => {
  const todo = todos.find(t => t.id === parseInt(req.params.id) && t.userId === req.user.id);
  if (!todo) return res.status(404).json({ error: '任务不存在' });
  res.json(todo);
});

app.put('/api/todos/:id', authMiddleware, (req, res) => {
  const todo = todos.find(t => t.id === parseInt(req.params.id) && t.userId === req.user.id);
  if (!todo) return res.status(404).json({ error: '任务不存在' });
  if (req.body.title !== undefined) todo.title = req.body.title;
  if (req.body.description !== undefined) todo.description = req.body.description;
  if (req.body.status !== undefined) todo.status = req.body.status;
  if (req.body.dueDate !== undefined) todo.dueDate = req.body.dueDate;
  res.json(todo);
});

app.delete('/api/todos/:id', authMiddleware, (req, res) => {
  const idx = todos.findIndex(t => t.id === parseInt(req.params.id) && t.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: '任务不存在' });
  todos.splice(idx, 1);
  res.status(204).send();
});

// 导出 app 供测试使用
module.exports = app;

// 单独启动服务器
if (require.main === module) {
  app.listen(3000, () => console.log('Server running on port 3000'));
}
