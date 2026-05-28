// @ts-nocheck
import { describe, it, expect, beforeEach } from '@jest/globals';
import { RestApiClientImpl } from '../src/restApi';
import {
  createResolvers,
  getUsersWithPosts,
  getUsersWithPostsREST,
} from '../src/graphqlResolvers';
import { RestApiClient, User, Post } from '../src/types';

describe('REST API Client', () => {
  let api: RestApiClient;

  beforeEach(() => {
    api = new RestApiClientImpl();
  });

  it('should get all users', async () => {
    const users = await api.getUsers();
    expect(users).toHaveLength(3);
    expect(users[0].name).toBe('Alice');
  });

  it('should get user by id', async () => {
    const user = await api.getUserById(1);
    expect(user).not.toBeNull();
    expect(user!.name).toBe('Alice');
  });

  it('should return null for non-existent user', async () => {
    const user = await api.getUserById(999);
    expect(user).toBeNull();
  });

  it('should get posts by user id', async () => {
    const posts = await api.getPostsByUserId(1);
    expect(posts).toHaveLength(2);
    expect(posts[0].title).toBe('GraphQL 入门');
  });

  it('should return empty array for user with no posts', async () => {
    const noPostUser = await api.getUserById(999);
    expect(noPostUser).toBeNull();
    // Non-existent user has no posts
    const posts = await api.getPostsByUserId(999);
    expect(posts).toHaveLength(0);
  });
});

describe('GraphQL Resolvers (重构后)', () => {
  let api: RestApiClient;
  let resolvers: ReturnType<typeof createResolvers>;

  beforeEach(() => {
    api = new RestApiClientImpl();
    resolvers = createResolvers(api);
  });

  it('Query.users should return all users', async () => {
    const users = await resolvers.users();
    expect(users).toHaveLength(3);
  });

  it('Query.user(id) should return a single user', async () => {
    const user = await resolvers.user(2);
    expect(user).not.toBeNull();
    expect(user!.name).toBe('Bob');
  });

  it('Query.user(id) should return null for non-existent', async () => {
    const user = await resolvers.user(999);
    expect(user).toBeNull();
  });

  it('Query.posts should return all posts', async () => {
    const posts = await resolvers.posts();
    expect(posts).toHaveLength(4);
  });

  it('Query.post(id) should return a single post', async () => {
    const post = await resolvers.post(3);
    expect(post).not.toBeNull();
    expect(post!.title).toBe('TypeScript 高级类型');
  });

  it('User.posts resolver should batch-load posts', async () => {
    const post1 = resolvers.userPosts(1);
    const post2 = resolvers.userPosts(2);
    const post3 = resolvers.userPosts(3);

    // 所有 load 在同一 tick 内触发，只会调用一次 getAllPosts
    const [p1, p2, p3] = await Promise.all([post1, post2, post3]);

    expect(p1).toHaveLength(2); // Alice 有 2 篇
    expect(p2).toHaveLength(1); // Bob 有 1 篇
    expect(p3).toHaveLength(1); // Charlie 有 1 篇
  });
});

describe('GraphQL: getUsersWithPosts (重构后 - 批量加载)', () => {
  it('should return users with their posts using DataLoader batching', async () => {
    const api = new RestApiClientImpl();
    const result = await getUsersWithPosts(api);

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Alice');
    expect(result[0].posts).toHaveLength(2);
    expect(result[1].name).toBe('Bob');
    expect(result[1].posts).toHaveLength(1);
    expect(result[2].name).toBe('Charlie');
    expect(result[2].posts).toHaveLength(1);
  });

  it('should produce the same data as REST N+1 approach', async () => {
    const api = new RestApiClientImpl();
    const [graphQLResult, restResult] = await Promise.all([
      getUsersWithPosts(api),
      getUsersWithPostsREST(api),
    ]);

    expect(graphQLResult).toEqual(restResult);
  });
});

describe('Performance: GraphQL vs REST N+1', () => {
  it('GraphQL batch approach should be faster than N+1', async () => {
    const api = new RestApiClientImpl();

    // 测量 REST N+1 方式的时间（3 次额外请求）
    const restStart = Date.now();
    await getUsersWithPostsREST(api);
    const restTime = Date.now() - restStart;

    // 测量 GraphQL 批量方式的时间（2 次请求：一次查用户，一次查所有帖子）
    const gqlStart = Date.now();
    await getUsersWithPosts(api);
    const gqlTime = Date.now() - gqlStart;

    // GraphQL 方式应该更快（更少的网络往返）
    expect(gqlTime).toBeLessThanOrEqual(restTime);
  });
});
