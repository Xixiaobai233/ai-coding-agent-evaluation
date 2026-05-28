// @ts-nocheck
import { User, CreateUserInput } from './types';
import { RestAPI } from './rest';

interface GraphQLContext {
  rest: RestAPI;
}

interface GraphQLQuery {
  field: string;
  args?: Record<string, unknown>;
}

interface GraphQLMutation {
  field: string;
  args?: Record<string, unknown>;
}

interface GraphQLResponse<T = unknown> {
  data: T;
  errors?: Array<{ message: string }>;
}

/**
 * GraphQL schema wrapper around the REST API.
 * Translates GraphQL queries/mutations into REST calls,
 * allowing a migration path from REST to GraphQL.
 */
export class GraphQLSchema {
  async executeQuery(context: GraphQLContext, query: GraphQLQuery): Promise<GraphQLResponse> {
    switch (query.field) {
      case 'users': {
        const users = await context.rest.getUsers();
        return { data: { users } };
      }
      case 'user': {
        const { id } = query.args as { id: number };
        const user = await context.rest.getUser(id);
        return { data: { user } };
      }
      default:
        return {
          data: {},
          errors: [{ message: `Unknown query field: ${query.field}` }],
        };
    }
  }

  async executeMutation(context: GraphQLContext, mutation: GraphQLMutation): Promise<GraphQLResponse> {
    switch (mutation.field) {
      case 'createUser': {
        const input = mutation.args as CreateUserInput;
        const user = await context.rest.createUser(input);
        return { data: { createUser: user } };
      }
      case 'updateUser': {
        const { id, ...input } = mutation.args as { id: number; name?: string; email?: string; role?: 'admin' | 'user' };
        const user = await context.rest.updateUser(id, input);
        return { data: { updateUser: user } };
      }
      case 'deleteUser': {
        const { id } = mutation.args as { id: number };
        const success = await context.rest.deleteUser(id);
        return { data: { deleteUser: success } };
      }
      default:
        return {
          data: {},
          errors: [{ message: `Unknown mutation field: ${mutation.field}` }],
        };
    }
  }
}
