/**
 * Todo API 集成测试
 * 使用 node --test + supertest
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('./server');

// ========== 辅助函数 ==========
let token;
let createdTodoId;

/** 注册 + 登录，获取 token */
async function loginAsTestUser() {
  const username = `testuser_${Date.now()}`;
  const password = 'pass123';
  await request(app).post('/api/auth/register').send({ username, password });
  const loginRes = await request(app).post('/api/auth/login').send({ username, password });
  token = loginRes.body.token;
}

// ========== 认证测试 ==========
describe('认证接口', () => {
  it('POST /api/auth/register — 成功注册', async () => {
    const username = `alice_${Date.now()}`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username, password: 'secret' });

    assert.equal(res.status, 201);
    assert.ok(res.body.id);
    assert.equal(res.body.username, username);
  });

  it('POST /api/auth/register — 缺少字段返回 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'onlyname' });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, '缺少必填字段');
  });

  it('POST /api/auth/register — 重复用户名返回 409', async () => {
    const username = `bob_${Date.now()}`;
    await request(app).post('/api/auth/register').send({ username, password: 'pw' });
    const res = await request(app).post('/api/auth/register').send({ username, password: 'pw' });

    assert.equal(res.status, 409);
    assert.equal(res.body.error, '用户名已存在');
  });

  it('POST /api/auth/login — 成功登录', async () => {
    const username = `carol_${Date.now()}`;
    await request(app).post('/api/auth/register').send({ username, password: 'mypw' });
    const res = await request(app).post('/api/auth/login').send({ username, password: 'mypw' });

    assert.equal(res.status, 200);
    assert.ok(res.body.token);
  });

  it('POST /api/auth/login — 错误密码返回 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nonexistent', password: 'wrong' });

    assert.equal(res.status, 401);
    assert.equal(res.body.error, '用户名或密码错误');
  });
});

// ========== 授权测试 ==========
describe('授权中间件', () => {
  it('无 token 返回 401', async () => {
    const res = await request(app).get('/api/todos');
    assert.equal(res.status, 401);
    assert.equal(res.body.error, '未认证');
  });

  it('无效 token 返回 401', async () => {
    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', 'Bearer invalidtoken123');
    assert.equal(res.status, 401);
    assert.equal(res.body.error, '无效 token');
  });
});

// ========== Todo CRUD 测试 ==========
describe('Todo CRUD', () => {
  before(async () => {
    await loginAsTestUser();
  });

  it('POST /api/todos — 创建任务', async () => {
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '测试任务', description: '单元测试', dueDate: '2026-06-01' });

    assert.equal(res.status, 201);
    assert.ok(res.body.id);
    assert.equal(res.body.title, '测试任务');
    assert.equal(res.body.description, '单元测试');
    assert.equal(res.body.status, 'pending');
    assert.equal(res.body.dueDate, '2026-06-01');
    createdTodoId = res.body.id;
  });

  it('POST /api/todos — 缺少标题返回 400', async () => {
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: '无标题' });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, '标题不能为空');
  });

  it('GET /api/todos — 获取任务列表', async () => {
    const res = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    assert.equal(res.body.total, res.body.data.length);
    assert.ok(res.body.page);
    assert.ok(res.body.limit);
  });

  it('GET /api/todos/:id — 获取单个任务', async () => {
    const res = await request(app)
      .get(`/api/todos/${createdTodoId}`)
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.id, createdTodoId);
    assert.equal(res.body.title, '测试任务');
  });

  it('GET /api/todos/:id — 不存在的任务返回 404', async () => {
    const res = await request(app)
      .get('/api/todos/99999')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 404);
    assert.equal(res.body.error, '任务不存在');
  });

  it('PUT /api/todos/:id — 更新任务', async () => {
    const res = await request(app)
      .put(`/api/todos/${createdTodoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '已更新', status: 'completed' });

    assert.equal(res.status, 200);
    assert.equal(res.body.title, '已更新');
    assert.equal(res.body.status, 'completed');
  });

  it('PUT /api/todos/:id — 不存在的任务返回 404', async () => {
    const res = await request(app)
      .put('/api/todos/99999')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'nope' });

    assert.equal(res.status, 404);
  });

  it('DELETE /api/todos/:id — 删除任务', async () => {
    const res = await request(app)
      .delete(`/api/todos/${createdTodoId}`)
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 204);
  });

  it('DELETE /api/todos/:id — 不存在的任务返回 404', async () => {
    const res = await request(app)
      .delete('/api/todos/99999')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 404);
  });
});

// ========== 筛选与分页 ==========
describe('筛选与分页', () => {
  before(async () => {
    await loginAsTestUser();
    // 创建 3 个不同状态的任务
    await request(app)
      .post('/api/todos').set('Authorization', `Bearer ${token}`)
      .send({ title: '待办A', status: 'pending' });
    await request(app)
      .post('/api/todos').set('Authorization', `Bearer ${token}`)
      .send({ title: '进行中B', status: 'in_progress' });
    await request(app)
      .post('/api/todos').set('Authorization', `Bearer ${token}`)
      .send({ title: '已完成C', status: 'completed' });
  });

  it('GET /api/todos?status=pending — 筛选状态', async () => {
    const res = await request(app)
      .get('/api/todos?status=pending')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    res.body.data.forEach(t => assert.equal(t.status, 'pending'));
  });

  it('GET /api/todos?page=1&limit=1 — 分页', async () => {
    const res = await request(app)
      .get('/api/todos?page=1&limit=1')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.page, 1);
    assert.equal(res.body.limit, 1);
  });
});
