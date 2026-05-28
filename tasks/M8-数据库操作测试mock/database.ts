/**
 * 模拟数据库模块
 * 在测试中需要 mock 这个模块的 db.query 和 db.execute
 */

export const db = {
  async query(sql: string, params: any[]): Promise<any[]> {
    // 真实实现会连接数据库
    throw new Error('未实现数据库连接');
  },

  async execute(sql: string, params: any[]): Promise<{ insertId: number; affectedRows: number }> {
    throw new Error('未实现数据库连接');
  }
};
