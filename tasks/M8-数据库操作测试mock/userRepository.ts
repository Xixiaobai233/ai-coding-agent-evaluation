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
