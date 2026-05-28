/**
 * UserRepository 单元测试 — 使用 Jest mock
 * Mock database.ts 的 db.query / db.execute
 */

import { UserRepository } from './userRepository';
import { db } from './database';

// 对整个 database 模块进行 mock
jest.mock('./database', () => ({
  db: {
    query: jest.fn(),
    execute: jest.fn(),
  },
}));

const repo = new UserRepository();

// 辅助：清空所有 mock 调用记录
beforeEach(() => {
  jest.clearAllMocks();
});

// =======================================================
// createUser
// =======================================================
describe('createUser', () => {
  it('成功创建用户', async () => {
    (db.query as jest.Mock).mockResolvedValue([]);           // 无重复
    (db.execute as jest.Mock).mockResolvedValue({ insertId: 1, affectedRows: 1 });

    const user = await repo.createUser({ username: 'alice', email: 'alice@test.com' });

    expect(user).toEqual({
      id: 1,
      username: 'alice',
      email: 'alice@test.com',
      points: 0,
      createdAt: expect.any(String),
    });
    expect(db.query).toHaveBeenCalledWith(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      ['alice', 'alice@test.com']
    );
    expect(db.execute).toHaveBeenCalledWith(
      'INSERT INTO users (username, email, points, created_at) VALUES (?, ?, 0, NOW())',
      ['alice', 'alice@test.com']
    );
  });

  it('用户名或邮箱重复时抛出错误', async () => {
    (db.query as jest.Mock).mockResolvedValue([{ id: 99 }]);

    await expect(
      repo.createUser({ username: 'alice', email: 'alice@test.com' })
    ).rejects.toThrow('用户名或邮箱已存在');

    expect(db.execute).not.toHaveBeenCalled();
  });
});

// =======================================================
// getUserById
// =======================================================
describe('getUserById', () => {
  it('返回匹配的用户', async () => {
    (db.query as jest.Mock).mockResolvedValue([
      { id: 1, username: 'bob', email: 'bob@test.com', points: 50, created_at: '2026-01-01' },
    ]);

    const user = await repo.getUserById(1);

    expect(user).toEqual({
      id: 1,
      username: 'bob',
      email: 'bob@test.com',
      points: 50,
      createdAt: '2026-01-01',
    });
    expect(db.query).toHaveBeenCalledWith(
      'SELECT id, username, email, points, created_at FROM users WHERE id = ?',
      [1]
    );
  });

  it('用户不存在时返回 null', async () => {
    (db.query as jest.Mock).mockResolvedValue([]);

    const user = await repo.getUserById(999);
    expect(user).toBeNull();
  });
});

// =======================================================
// getUserByUsername
// =======================================================
describe('getUserByUsername', () => {
  it('返回匹配的用户', async () => {
    (db.query as jest.Mock).mockResolvedValue([
      { id: 2, username: 'charlie', email: 'charlie@test.com', points: 10, created_at: '2026-02-01' },
    ]);

    const user = await repo.getUserByUsername('charlie');

    expect(user).toEqual({
      id: 2,
      username: 'charlie',
      email: 'charlie@test.com',
      points: 10,
      createdAt: '2026-02-01',
    });
  });

  it('用户不存在时返回 null', async () => {
    (db.query as jest.Mock).mockResolvedValue([]);

    const user = await repo.getUserByUsername('nobody');
    expect(user).toBeNull();
  });
});

// =======================================================
// addPoints
// =======================================================
describe('addPoints', () => {
  it('成功增加积分', async () => {
    (db.execute as jest.Mock).mockResolvedValue({ affectedRows: 1 });
    (db.query as jest.Mock).mockResolvedValue([{ points: 150 }]);

    const newPoints = await repo.addPoints(1, 50);

    expect(newPoints).toBe(150);
    expect(db.execute).toHaveBeenCalledWith(
      'UPDATE users SET points = points + ? WHERE id = ?',
      [50, 1]
    );
  });

  it('点数 <= 0 时抛出错误', async () => {
    await expect(repo.addPoints(1, 0)).rejects.toThrow('增加的积分必须为正数');
    await expect(repo.addPoints(1, -5)).rejects.toThrow('增加的积分必须为正数');
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('用户不存在时抛出错误', async () => {
    (db.execute as jest.Mock).mockResolvedValue({ affectedRows: 0 });
    (db.query as jest.Mock).mockResolvedValue([]);

    await expect(repo.addPoints(999, 10)).rejects.toThrow('用户不存在');
  });
});

// =======================================================
// deductPoints
// =======================================================
describe('deductPoints', () => {
  it('成功扣除积分', async () => {
    // getUserById 内部调用
    (db.query as jest.Mock).mockResolvedValueOnce([
      { id: 1, username: 'dave', email: 'dave@test.com', points: 100, created_at: '2026-03-01' },
    ]);
    // 第二次 query = UPDATE 后的 SELECT
    (db.execute as jest.Mock).mockResolvedValue({ affectedRows: 1 });

    const remaining = await repo.deductPoints(1, 30);

    expect(remaining).toBe(70);
    expect(db.execute).toHaveBeenCalledWith(
      'UPDATE users SET points = points - ? WHERE id = ?',
      [30, 1]
    );
  });

  it('点数 <= 0 时抛出错误', async () => {
    await expect(repo.deductPoints(1, 0)).rejects.toThrow('扣除的积分必须为正数');
    await expect(repo.deductPoints(1, -1)).rejects.toThrow('扣除的积分必须为正数');
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('用户不存在时抛出错误', async () => {
    (db.query as jest.Mock).mockResolvedValue([]);

    await expect(repo.deductPoints(999, 10)).rejects.toThrow('用户不存在');
  });

  it('积分不足时抛出错误', async () => {
    (db.query as jest.Mock).mockResolvedValue([
      { id: 1, username: 'eve', email: 'eve@test.com', points: 5, created_at: '2026-04-01' },
    ]);

    await expect(repo.deductPoints(1, 10)).rejects.toThrow('积分不足');
    expect(db.execute).not.toHaveBeenCalled();
  });
});
