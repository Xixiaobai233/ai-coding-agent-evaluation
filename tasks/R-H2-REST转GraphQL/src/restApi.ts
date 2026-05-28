/**
 * 模拟 REST API 客户端。
 * 在真实场景中，这个模块会通过 fetch / axios 发起 HTTP 请求。
 * 本模块模拟了 REST API 的数据层，GraphQL 层将重构为通过此客户端查询。
 */
import { User, Post, RestApiClient } from './types';

// ==================== 模拟内存数据库 ====================

const users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com' },
];

const posts: Post[] = [
  { id: 1, title: 'GraphQL 入门', content: 'GraphQL 是一种查询语言...', userId: 1 },
  { id: 2, title: 'REST API 最佳实践', content: '设计 REST API 时需要考虑...', userId: 1 },
  { id: 3, title: 'TypeScript 高级类型', content: 'TypeScript 的类型系统非常强大...', userId: 2 },
  { id: 4, title: 'React 性能优化', content: '使用 React.memo 和 useMemo 优化...', userId: 3 },
];

// ==================== REST API 客户端 ====================

/**
 * REST API 的原始实现（重构前的代码）。
 * 每个方法模拟一次 HTTP 请求。
 */
export class RestApiClientImpl implements RestApiClient {
  async getUsers(): Promise<User[]> {
    // 模拟 REST: GET /api/users
    await this.delay(10);
    return [...users];
  }

  async getUserById(id: number): Promise<User | null> {
    // 模拟 REST: GET /api/users/:id
    await this.delay(5);
    return users.find(u => u.id === id) ?? null;
  }

  async getPostsByUserId(userId: number): Promise<Post[]> {
    // 模拟 REST: GET /api/users/:userId/posts
    await this.delay(5);
    return posts.filter(p => p.userId === userId);
  }

  async getAllPosts(): Promise<Post[]> {
    // 模拟 REST: GET /api/posts
    await this.delay(10);
    return [...posts];
  }

  async getPostById(id: number): Promise<Post | null> {
    // 模拟 REST: GET /api/posts/:id
    await this.delay(5);
    return posts.find(p => p.id === id) ?? null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
