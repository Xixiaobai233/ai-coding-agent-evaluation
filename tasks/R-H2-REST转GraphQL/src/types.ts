// @ts-nocheck
/** 共享类型定义 */

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
}

/**
 * GraphQL 风格的请求上下文。
 * 在实际 GraphQL 服务器中，context 包含请求信息、数据加载器等。
 */
export interface GraphQLContext {
  /** REST API 客户端 */
  api: RestApiClient;
}

export interface UserWithPosts extends User {
  posts: Post[];
}

/**
 * REST API 客户端接口。
 * 重构目标：调用方从直接调用 REST API 改为通过 GraphQL 层调用。
 */
export interface RestApiClient {
  getUsers(): Promise<User[]>;
  getUserById(id: number): Promise<User | null>;
  getPostsByUserId(userId: number): Promise<Post[]>;
  getAllPosts(): Promise<Post[]>;
  getPostById(id: number): Promise<Post | null>;
}
