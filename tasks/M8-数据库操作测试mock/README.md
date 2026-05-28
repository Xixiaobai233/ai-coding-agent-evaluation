# 为数据库操作写测试 + Mock

## 任务描述

我正在开发一个用户管理系统，包含用户注册、查询和积分增减功能。这些操作都依赖数据库。我想让你为这些数据库操作写单元测试，**但测试不能依赖真实的数据库**——需要用 mock 来模拟数据库调用。

## 代码

```typescript
// userRepository.ts
import { db } from './database';

export interface User {
  id: number;
  username: string;
  email: string;
  points: number;
  createdAt: string;
}

export interface CreateUserInput {
  username: string;
  email: string;
}

export class UserRepository {
  async createUser(input: CreateUserInput): Promise<User> {
    const existing = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [input.username, input.email]
    );
    if (existing.length > 0) {
      throw new Error('用户名或邮箱已存在');
    }

    const result = await db.execute(
      'INSERT INTO users (username, email, points, created_at) VALUES (?, ?, 0, NOW())',
      [input.username, input.email]
    );

    return {
      id: result.insertId,
      username: input.username,
      email: input.email,
      points: 0,
      createdAt: new Date().toISOString()
    };
  }

  async getUserById(id: number): Promise<User | null> {
    const rows = await db.query(
      'SELECT id, username, email, points, created_at FROM users WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const rows = await db.query(
      'SELECT id, username, email, points, created_at FROM users WHERE username = ?',
      [username]
    );
    if (rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  async addPoints(userId: number, points: number): Promise<number> {
    if (points <= 0) {
      throw new Error('增加的积分必须为正数');
    }
    await db.execute(
      'UPDATE users SET points = points + ? WHERE id = ?',
      [points, userId]
    );
    const rows = await db.query(
      'SELECT points FROM users WHERE id = ?', [userId]
    );
    if (rows.length === 0) throw new Error('用户不存在');
    return rows[0].points;
  }

  async deductPoints(userId: number, points: number): Promise<number> {
    if (points <= 0) {
      throw new Error('扣除的积分必须为正数');
    }

    const user = await this.getUserById(userId);
    if (!user) throw new Error('用户不存在');
    if (user.points < points) {
      throw new Error('积分不足');
    }

    await db.execute(
      'UPDATE users SET points = points - ? WHERE id = ?',
      [points, userId]
    );

    return user.points - points;
  }

  private mapRow(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      points: row.points,
      createdAt: row.created_at
    };
  }
}
```

## 要求

1. **不能连真实数据库**：使用 jest.mock 或其他方式 mock `db.query` 和 `db.execute`
2. **模拟各种数据库返回**：
   - 查询成功返回数据
   - 查询返回空结果
   - 数据库报错
3. 每个测试独立，用 `beforeEach` 重置 mock
4. 验证数据库调用次数和参数是否正确
5. 覆盖所有方法的所有分支

## 语言要求

TypeScript。
