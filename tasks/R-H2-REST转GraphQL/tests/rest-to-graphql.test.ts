import { RestAPI } from '../src/rest';
import { GraphQLSchema } from '../src/graphql';

describe('REST to GraphQL Migration', () => {
  let rest: RestAPI;
  let graphql: GraphQLSchema;

  beforeEach(() => {
    rest = new RestAPI();
    graphql = new GraphQLSchema();
  });

  describe('REST API', () => {
    it('should create and list users', async () => {
      const user = await rest.createUser({ name: 'Alice', email: 'alice@test.com', role: 'user' });
      expect(user.id).toBe(1);
      expect(user.name).toBe('Alice');

      const users = await rest.getUsers();
      expect(users).toHaveLength(1);
    });

    it('should get user by id', async () => {
      await rest.createUser({ name: 'Bob', email: 'bob@test.com', role: 'admin' });
      const found = await rest.getUser(1);
      expect(found).not.toBeNull();
      expect(found!.name).toBe('Bob');
    });

    it('should return null for non-existent user via REST', async () => {
      const user = await rest.getUser(999);
      expect(user).toBeNull();
    });

    it('should update an existing user', async () => {
      await rest.createUser({ name: 'Alice', email: 'alice@test.com', role: 'user' });
      const updated = await rest.updateUser(1, { name: 'Alice Updated' });
      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('Alice Updated');
    });

    it('should return null when updating non-existent user', async () => {
      const result = await rest.updateUser(999, { name: 'Ghost' });
      expect(result).toBeNull();
    });

    it('should delete a user', async () => {
      await rest.createUser({ name: 'Delete Me', email: 'del@test.com', role: 'user' });
      const result = await rest.deleteUser(1);
      expect(result).toBe(true);
      const users = await rest.getUsers();
      expect(users).toHaveLength(0);
    });

    it('should return false when deleting non-existent user', async () => {
      const result = await rest.deleteUser(999);
      expect(result).toBe(false);
    });
  });

  describe('GraphQL Schema', () => {
    it('should query all users via GraphQL', async () => {
      await rest.createUser({ name: 'Alice', email: 'alice@test.com', role: 'user' });

      const result = await graphql.executeQuery({ rest }, { field: 'users' });
      expect(result.data.users).toHaveLength(1);
      expect(result.data.users[0].name).toBe('Alice');
    });

    it('should query single user via GraphQL', async () => {
      await rest.createUser({ name: 'Bob', email: 'bob@test.com', role: 'admin' });

      const result = await graphql.executeQuery({ rest }, { field: 'user', args: { id: 1 } });
      expect(result.data.user).not.toBeNull();
      expect(result.data.user.name).toBe('Bob');
    });

    it('should handle empty user list via GraphQL', async () => {
      const result = await graphql.executeQuery({ rest }, { field: 'users' });
      expect(result.data.users).toHaveLength(0);
    });

    it('should create user via GraphQL mutation', async () => {
      const result = await graphql.executeMutation({ rest }, {
        field: 'createUser',
        args: { name: 'Charlie', email: 'charlie@test.com', role: 'user' },
      });
      expect(result.data.createUser.name).toBe('Charlie');
      expect(result.data.createUser.id).toBe(1);
    });

    it('should update user via GraphQL mutation', async () => {
      await rest.createUser({ name: 'Original', email: 'orig@test.com', role: 'user' });
      const result = await graphql.executeMutation({ rest }, {
        field: 'updateUser',
        args: { id: 1, name: 'Updated' },
      });
      expect(result.data.updateUser.name).toBe('Updated');
    });

    it('should delete user via GraphQL mutation', async () => {
      await rest.createUser({ name: 'ToDelete', email: 'del@test.com', role: 'user' });
      const result = await graphql.executeMutation({ rest }, {
        field: 'deleteUser',
        args: { id: 1 },
      });
      expect(result.data.deleteUser).toBe(true);
    });

    it('should return errors for unknown query fields', async () => {
      const result = await graphql.executeQuery({ rest }, { field: 'unknownField' });
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should return errors for unknown mutation fields', async () => {
      const result = await graphql.executeMutation({ rest }, { field: 'unknownMutation' });
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should produce equivalent results to REST for same data', async () => {
      await rest.createUser({ name: 'Equiv', email: 'equiv@test.com', role: 'admin' });

      const restUsers = await rest.getUsers();
      const gqlResult = await graphql.executeQuery({ rest }, { field: 'users' });

      expect(gqlResult.data.users).toEqual(restUsers);
    });
  });
});
