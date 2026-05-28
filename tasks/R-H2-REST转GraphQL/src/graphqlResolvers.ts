/**
 * GraphQL 解析器层。
 *
 * 重构目标：将原本分散调用 REST API 的客户端代码集中到 GraphQL 解析器中。
 * - 解决 N+1 查询问题：通过批量加载函数合并请求
 * - 客户端只需一次查询就能获取关联数据
 * - 后端可以自由优化数据加载策略
 *
 * 使用方式（等价 GraphQL 查询）：
 * ```graphql
 * query {
 *   users {
 *     id
 *     name
 *     posts {
 *       title
 *     }
 *   }
 * }
 * ```
 */
import { User, Post, UserWithPosts, GraphQLContext, RestApiClient } from './types';

/**
 * DataLoader 风格的批量加载器。
 * 在同一个事件循环 tick 中合并多次请求为一次批量请求。
 */
class DataLoader<K, V> {
  private batchQueue: Array<{ key: K; resolve: (value: V) => void }> = [];
  private timer: ReturnType<typeof process.nextTick> | null = null;

  constructor(private batchFn: (keys: K[]) => Promise<Map<K, V>>) {}

  load(key: K): Promise<V> {
    return new Promise(resolve => {
      this.batchQueue.push({ key, resolve });
      if (!this.timer) {
        this.timer = process.nextTick(() => this.flush());
      }
    });
  }

  private async flush(): Promise<void> {
    const queue = this.batchQueue;
    this.batchQueue = [];
    this.timer = null;

    const keys = queue.map(item => item.key);
    const resultMap = await this.batchFn(keys);

    for (const item of queue) {
      const value = resultMap.get(item.key);
      // @ts-ignore: our usage always returns a value
      item.resolve(value);
    }
  }
}

// ==================== 根查询解析器 ====================

/**
 * GraphQL 的 Query 类型解析器。
 */
export function createResolvers(api: RestApiClient) {
  // 使用 DataLoader 批量加载帖子，避免 N+1 问题
  const postsLoader = new DataLoader<number, Post[]>(async (userIds: number[]) => {
    const allPosts = await api.getAllPosts();
    const postsByUser = new Map<number, Post[]>();
    for (const userId of userIds) {
      postsByUser.set(userId, allPosts.filter(p => p.userId === userId));
    }
    return postsByUser;
  });

  return {
    /** Query.users: 获取所有用户 */
    async users(): Promise<User[]> {
      return api.getUsers();
    },

    /** Query.user(id): 根据 ID 获取单个用户 */
    async user(id: number): Promise<User | null> {
      return api.getUserById(id);
    },

    /** Query.posts: 获取所有帖子 */
    async posts(): Promise<Post[]> {
      return api.getAllPosts();
    },

    /** Query.post(id): 根据 ID 获取单个帖子 */
    async post(id: number): Promise<Post | null> {
      return api.getPostById(id);
    },

    /** User.posts: 用户的帖子（关联字段解析器） */
    async userPosts(userId: number): Promise<Post[]> {
      // 使用 DataLoader 批量加载
      return postsLoader.load(userId);
    },
  };
}

/**
 * 将用户列表和他们的帖子合并为 UserWithPosts 数组。
 * 等价于一次 GraphQL 查询：{ users { id name posts { title } } }
 */
export async function getUsersWithPosts(api: RestApiClient): Promise<UserWithPosts[]> {
  const resolvers = createResolvers(api);
  const users = await resolvers.users();
  const result: UserWithPosts[] = [];

  for (const user of users) {
    const posts = await resolvers.userPosts(user.id);
    result.push({ ...user, posts });
  }

  return result;
}

/**
 * 传统 REST 风格的实现（重构前）：为每个用户单独请求帖子。
 * 会造成 N+1 问题，性能差。
 */
export async function getUsersWithPostsREST(api: RestApiClient): Promise<UserWithPosts[]> {
  const users = await api.getUsers();
  const result: UserWithPosts[] = [];

  for (const user of users) {
    const posts = await api.getPostsByUserId(user.id);
    result.push({ ...user, posts });
  }

  return result;
}
