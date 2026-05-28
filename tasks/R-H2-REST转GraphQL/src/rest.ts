// @ts-nocheck
import { User, CreateUserInput } from './types';

/**
 * REST API implementation with CRUD operations on users.
 * This serves as the legacy REST layer to be wrapped by GraphQL.
 */
export class RestAPI {
  private users: User[] = [];
  private nextId = 1;

  async getUsers(): Promise<User[]> {
    return [...this.users];
  }

  async getUser(id: number): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const user: User = {
      id: this.nextId++,
      ...input,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async updateUser(id: number, input: Partial<CreateUserInput>): Promise<User | null> {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.users[idx] = { ...this.users[idx], ...input };
    return this.users[idx];
  }

  async deleteUser(id: number): Promise<boolean> {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    this.users.splice(idx, 1);
    return true;
  }
}
