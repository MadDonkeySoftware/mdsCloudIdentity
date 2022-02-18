/* eslint-disable no-unused-expressions */
import { omit } from 'lodash';
import { MongoClient } from 'mongodb';
import { AccountData, ConfigurationData, UserData } from '../../types';
import { MongoRepo } from '../mongo-impl';

jest.mock('mongodb', () => ({
  MongoClient: jest.fn(),
}));
const mockMongoClient = jest.mocked(MongoClient);

describe('Mongo Repo Implementation Tests', () => {
  afterEach(() => {
    /* Initially blank */
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('getNextCounterValue', () => {
    it('Gets next sequential value in database for provided key', async () => {
      // Arrange
      const findOneAndUpdateStub = jest
        .fn()
        .mockResolvedValue({ value: { value: 1001 } });
      mockMongoClient.mockImplementation(
        () =>
          ({
            connect: jest.fn().mockResolvedValue(undefined),
            db: () => ({
              collection: jest.fn().mockReturnValue({
                findOneAndUpdate: findOneAndUpdateStub,
              }),
            }),
          } as unknown as MongoClient),
      );
      const client = new MongoRepo('mongodb://localhost');

      // Act
      const nextValue = await client.getNextCounterValue('foo');

      // Assert
      expect(nextValue).toBe(1001);
      expect(findOneAndUpdateStub).toHaveBeenCalledTimes(1);
      expect(findOneAndUpdateStub.mock.calls[0]).toEqual([
        { key: 'foo' },
        { $inc: { value: 1 } },
        { writeConcern: { j: true }, upsert: true, returnDocument: 'after' },
      ]);
    });
  });

  describe('createUser', () => {
    describe('saves user data to database', () => {
      it('includes activation code', async () => {
        // Arrange
        const saveData: UserData = {
          userId: 1,
          accountId: undefined,
          email: 'no@no.com',
          friendlyName: 'friendly name',
          password: 'password',
          isActive: true,
          activationCode: 'abcde',
        };
        const insertOneStub = jest
          .fn()
          .mockResolvedValue({ value: { value: 1001 } });
        mockMongoClient.mockImplementation(
          () =>
            ({
              connect: jest.fn().mockResolvedValue(undefined),
              db: () => ({
                collection: jest.fn().mockReturnValue({
                  insertOne: insertOneStub,
                }),
              }),
            } as unknown as MongoClient),
        );
        const client = new MongoRepo('mongodb://localhost');

        // Act
        const result = await client.createUser(saveData);
        const now = new Date();
        expect(now.getTime() - (result.created as Date).getTime()).toBeLessThan(
          10,
        );
        expect(
          now.getTime() - (result.lastActivity as Date).getTime(),
        ).toBeLessThan(10);

        const trimmedResult = omit(result, ['created', 'lastActivity']);
        expect(trimmedResult).toEqual({
          activationCode: 'abcde',
          email: 'no@no.com',
          friendlyName: 'friendly name',
          isActive: true,
          password: 'password',
          userId: 1,
        });
        expect(insertOneStub).toHaveBeenCalledTimes(1);
        expect(insertOneStub.mock.calls[0].length).toBe(2);
        const trimmedArgs = [
          omit(insertOneStub.mock.calls[0][0], ['created', 'lastActivity']),
          insertOneStub.mock.calls[0][1],
        ];
        expect(trimmedArgs).toEqual([
          {
            activationCode: 'abcde',
            email: 'no@no.com',
            friendlyName: 'friendly name',
            isActive: true,
            password: 'password',
            userId: 1,
          },
          {
            writeConcern: {
              j: true,
            },
          },
        ]);
      });

      it('excludes activation code', async () => {
        // Arrange
        const saveData: UserData = {
          userId: 1,
          accountId: undefined,
          email: 'no@no.com',
          friendlyName: 'friendly name',
          password: 'password',
          isActive: true,
        };
        const insertOneStub = jest
          .fn()
          .mockResolvedValue({ value: { value: 1001 } });
        mockMongoClient.mockImplementation(
          () =>
            ({
              connect: jest.fn().mockResolvedValue(undefined),
              db: () => ({
                collection: jest.fn().mockReturnValue({
                  insertOne: insertOneStub,
                }),
              }),
            } as unknown as MongoClient),
        );
        const client = new MongoRepo('mongodb://localhost');

        // Act
        const result = await client.createUser(saveData);
        const now = new Date();
        expect(now.getTime() - (result.created as Date).getTime()).toBeLessThan(
          10,
        );
        expect(
          now.getTime() - (result.lastActivity as Date).getTime(),
        ).toBeLessThan(10);

        const trimmedResult = omit(result, ['created', 'lastActivity']);
        expect(trimmedResult).toEqual({
          activationCode: undefined,
          email: 'no@no.com',
          friendlyName: 'friendly name',
          isActive: true,
          password: 'password',
          userId: 1,
        });
        expect(insertOneStub).toHaveBeenCalledTimes(1);
        expect(insertOneStub.mock.calls[0].length).toBe(2);
        const trimmedArgs = [
          omit(insertOneStub.mock.calls[0][0], ['created', 'lastActivity']),
          insertOneStub.mock.calls[0][1],
        ];
        expect(trimmedArgs).toEqual([
          {
            activationCode: undefined,
            email: 'no@no.com',
            friendlyName: 'friendly name',
            isActive: true,
            password: 'password',
            userId: 1,
          },
          {
            writeConcern: {
              j: true,
            },
          },
        ]);
      });
    });
  });

  describe('getUserById', () => {
    it('returns the user when they exist in the database', async () => {
      const findOneStub = jest.fn().mockResolvedValue({
        activationCode: 'abcde',
        userId: 'testUser',
        email: 'no@no.com',
        friendlyName: 'friendly name',
        password: 'password',
        isActive: 'true',
        confirmCode: 'abcde',
      });
      mockMongoClient.mockImplementation(
        () =>
          ({
            connect: jest.fn().mockResolvedValue(undefined),
            db: () => ({
              collection: jest.fn().mockReturnValue({
                findOne: findOneStub,
              }),
            }),
          } as unknown as MongoClient),
      );
      const client = new MongoRepo('mongodb://localhost');

      // Act
      const result = await client.getUserById('testUser');
      const trimmedResult = omit(result, ['created', 'lastActivity']);
      expect(trimmedResult).toEqual({
        confirmCode: 'abcde',
        email: 'no@no.com',
        friendlyName: 'friendly name',
        isActive: true,
        password: 'password',
        userId: 'testUser',
      });
      expect(findOneStub).toHaveBeenCalledTimes(1);
      expect(findOneStub.mock.calls[0]).toEqual([{ userId: 'testUser' }]);
    });

    // NOTE: mongo reconnect tested here too.
    it('returns null when they do not exit in the database', async () => {
      const findOneStub = jest.fn().mockResolvedValue(undefined);
      mockMongoClient.mockImplementation(
        () =>
          ({
            connect: jest.fn().mockResolvedValue(undefined),
            db: () => ({
              collection: jest.fn().mockReturnValue({
                findOne: findOneStub,
              }),
            }),
          } as unknown as MongoClient),
      );
      const client = new MongoRepo('mongodb://localhost');

      // Act
      const result = await client.getUserById('testUser');
      expect(result).toBeNull();
      expect(findOneStub).toHaveBeenCalledTimes(1);
      expect(findOneStub.mock.calls[0]).toEqual([{ userId: 'testUser' }]);
    });
  });

  describe('updateUser', () => {
    describe('Saves user data to the database', () => {
      it('when activationCode is null', async () => {
        // Arrange
        const lastActivityTS = new Date().toISOString();
        const saveData: UserData = {
          userId: 'testUser',
          accountId: undefined,
          email: 'no@no.com',
          friendlyName: 'friendly name',
          password: 'password',
          isActive: true,
          activationCode: null,
          lastActivity: lastActivityTS,
        };
        const updateOneStub = jest.fn().mockResolvedValue(undefined);
        mockMongoClient.mockImplementation(
          () =>
            ({
              connect: jest.fn().mockResolvedValue(undefined),
              db: () => ({
                collection: jest.fn().mockReturnValue({
                  updateOne: updateOneStub,
                }),
              }),
            } as unknown as MongoClient),
        );
        const client = new MongoRepo('mongodb://localhost');

        // Act
        await client.updateUser(saveData);
        expect(updateOneStub).toHaveBeenCalledTimes(1);
        expect(updateOneStub.mock.calls[0]).toEqual([
          {
            userId: 'testUser',
          },
          {
            $set: {
              email: 'no@no.com',
              friendlyName: 'friendly name',
              isActive: 'true',
              lastActivity: lastActivityTS,
              password: 'password',
            },
            $unset: {
              activationCode: '',
            },
          },
          {
            writeConcern: {
              j: true,
            },
          },
        ]);
      });

      it('when activationCode is value', async () => {
        // Arrange
        const lastActivityTS = new Date().toISOString();
        const saveData: UserData = {
          userId: 'testUser',
          accountId: undefined,
          email: 'no@no.com',
          friendlyName: 'friendly name',
          password: 'password',
          isActive: true,
          activationCode: 'abcde',
          lastActivity: lastActivityTS,
        };
        const updateOneStub = jest.fn().mockResolvedValue(undefined);
        mockMongoClient.mockImplementation(
          () =>
            ({
              connect: jest.fn().mockResolvedValue(undefined),
              db: () => ({
                collection: jest.fn().mockReturnValue({
                  updateOne: updateOneStub,
                }),
              }),
            } as unknown as MongoClient),
        );
        const client = new MongoRepo('mongodb://localhost');

        // Act
        await client.updateUser(saveData);
        expect(updateOneStub).toHaveBeenCalledTimes(1);
        expect(updateOneStub.mock.calls[0]).toEqual([
          {
            userId: 'testUser',
          },
          {
            $set: {
              activationCode: 'abcde',
              email: 'no@no.com',
              friendlyName: 'friendly name',
              isActive: 'true',
              lastActivity: lastActivityTS,
              password: 'password',
            },
          },
          {
            writeConcern: {
              j: true,
            },
          },
        ]);
      });

      it('when missing activationCode on object', async () => {
        // Arrange
        const lastActivityTS = new Date().toISOString();
        const saveData: UserData = {
          userId: 'testUser',
          accountId: undefined,
          email: 'no@no.com',
          friendlyName: 'friendly name',
          password: 'password',
          isActive: true,
          lastActivity: lastActivityTS,
        };
        const updateOneStub = jest.fn().mockResolvedValue(undefined);
        mockMongoClient.mockImplementation(
          () =>
            ({
              connect: jest.fn().mockResolvedValue(undefined),
              db: () => ({
                collection: jest.fn().mockReturnValue({
                  updateOne: updateOneStub,
                }),
              }),
            } as unknown as MongoClient),
        );
        const client = new MongoRepo('mongodb://localhost');

        // Act
        await client.updateUser(saveData);
        expect(updateOneStub).toHaveBeenCalledTimes(1);
        expect(updateOneStub.mock.calls[0]).toEqual([
          {
            userId: 'testUser',
          },
          {
            $set: {
              email: 'no@no.com',
              friendlyName: 'friendly name',
              isActive: 'true',
              lastActivity: lastActivityTS,
              password: 'password',
            },
          },
          {
            writeConcern: {
              j: true,
            },
          },
        ]);
      });
    });
  });

  describe('createAccount', () => {
    it('Saves account data to the database', async () => {
      // Arrange
      const saveData: AccountData = {
        accountId: '1001',
        name: 'test account',
        ownerId: 'testUser',
        isActive: true,
      };
      const insertOneStub = jest
        .fn()
        .mockResolvedValue({ value: { value: 1001 } });
      mockMongoClient.mockImplementation(
        () =>
          ({
            connect: jest.fn().mockResolvedValue(undefined),
            db: () => ({
              collection: jest.fn().mockReturnValue({
                insertOne: insertOneStub,
              }),
            }),
          } as unknown as MongoClient),
      );
      const client = new MongoRepo('mongodb://localhost');

      // Act
      const result = await client.createAccount(saveData);
      const now = new Date();
      expect(now.getTime() - (result.created as Date).getTime()).toBeLessThan(
        10,
      );
      expect(
        now.getTime() - (result.lastActivity as Date).getTime(),
      ).toBeLessThan(10);

      const trimmedResult = omit(result, ['created', 'lastActivity']);
      expect(trimmedResult).toEqual({
        accountId: '1001',
        name: 'test account',
        ownerId: 'testUser',
        isActive: true,
      });
      expect(insertOneStub).toHaveBeenCalledTimes(1);
      expect(insertOneStub.mock.calls[0].length).toBe(1);
      const trimmedArgs = [
        omit(insertOneStub.mock.calls[0][0], ['created', 'lastActivity']),
      ];
      expect(trimmedArgs).toEqual([
        {
          accountId: '1001',
          name: 'test account',
          isActive: true,
          ownerId: 'testUser',
        },
      ]);
    });
  });

  describe('getAccountById', () => {
    it('returns the user when they exist in the database', async () => {
      const now = new Date().toISOString();
      const findOneStub = jest.fn().mockResolvedValue({
        accountId: '1001',
        name: 'test account',
        ownerId: 'testUser',
        isActive: true,
        created: now,
        lastActivity: now,
      });
      mockMongoClient.mockImplementation(
        () =>
          ({
            connect: jest.fn().mockResolvedValue(undefined),
            db: () => ({
              collection: jest.fn().mockReturnValue({
                findOne: findOneStub,
              }),
            }),
          } as unknown as MongoClient),
      );
      const client = new MongoRepo('mongodb://localhost');

      // Act
      const result = await client.getAccountById('1001');
      const trimmedResult = omit(result, ['created', 'lastActivity']);
      expect(trimmedResult).toEqual({
        accountId: '1001',
        isActive: true,
        name: 'test account',
        ownerId: 'testUser',
      });
      expect(findOneStub).toHaveBeenCalledTimes(1);
      expect(findOneStub.mock.calls[0]).toEqual([{ accountId: '1001' }]);
    });

    it('returns null when they do not exit in the database', async () => {
      const findOneStub = jest.fn().mockResolvedValue(undefined);
      mockMongoClient.mockImplementation(
        () =>
          ({
            connect: jest.fn().mockResolvedValue(undefined),
            db: () => ({
              collection: jest.fn().mockReturnValue({
                findOne: findOneStub,
              }),
            }),
          } as unknown as MongoClient),
      );
      const client = new MongoRepo('mongodb://localhost');

      // Act
      const result = await client.getAccountById('1001');
      expect(result).toBeNull();
      expect(findOneStub).toHaveBeenCalledTimes(1);
      expect(findOneStub.mock.calls[0]).toEqual([{ accountId: '1001' }]);
    });
  });

  describe('getAccountByOwnerId', () => {
    it('returns the account when they exist in the database', async () => {
      const now = new Date().toISOString();
      const findOneStub = jest.fn().mockResolvedValue({
        accountId: '1001',
        friendlyName: 'test account',
        ownerId: 'testUser',
        isActive: true,
        created: now,
        lastActivity: now,
      });
      mockMongoClient.mockImplementation(
        () =>
          ({
            connect: jest.fn().mockResolvedValue(undefined),
            db: () => ({
              collection: jest.fn().mockReturnValue({
                findOne: findOneStub,
              }),
            }),
          } as unknown as MongoClient),
      );
      const client = new MongoRepo('mongodb://localhost');

      // Act
      const result = await client.getAccountByOwnerId('testUser');
      const trimmedResult = omit(result, ['created', 'lastActivity']);
      expect(trimmedResult).toEqual({
        accountId: '1001',
        isActive: true,
        name: 'test account',
        ownerId: 'testUser',
      });
      expect(findOneStub).toHaveBeenCalledTimes(1);
      expect(findOneStub.mock.calls[0]).toEqual([{ ownerId: 'testUser' }]);
    });

    it('returns null when account does not exist in the database', async () => {
      const findOneStub = jest.fn().mockResolvedValue(undefined);
      mockMongoClient.mockImplementation(
        () =>
          ({
            connect: jest.fn().mockResolvedValue(undefined),
            db: () => ({
              collection: jest.fn().mockReturnValue({
                findOne: findOneStub,
              }),
            }),
          } as unknown as MongoClient),
      );
      const client = new MongoRepo('mongodb://localhost');

      // Act
      const result = await client.getAccountByOwnerId('testUser');
      expect(result).toBeNull();
      expect(findOneStub).toHaveBeenCalledTimes(1);
      expect(findOneStub.mock.calls[0]).toEqual([{ ownerId: 'testUser' }]);
    });
  });

  describe('updateAccount', () => {
    it('Saves account data to the database', async () => {
      // Arrange
      const lastActivityTS = new Date().toISOString();
      const saveData = {
        accountId: '1001',
        name: 'account name',
        ownerId: 'testUser',
        isActive: true,
        lastActivity: lastActivityTS,
      };
      const updateOneStub = jest.fn().mockResolvedValue(undefined);
      mockMongoClient.mockImplementation(
        () =>
          ({
            connect: jest.fn().mockResolvedValue(undefined),
            db: () => ({
              collection: jest.fn().mockReturnValue({
                updateOne: updateOneStub,
              }),
            }),
          } as unknown as MongoClient),
      );
      const client = new MongoRepo('mongodb://localhost');

      // Act
      await client.updateAccount(saveData);
      expect(updateOneStub).toHaveBeenCalledTimes(1);
      expect(updateOneStub.mock.calls[0]).toEqual([
        {
          accountId: '1001',
        },
        {
          $set: {
            ownerId: 'testUser',
            friendlyName: 'account name',
            isActive: true,
            lastActivity: lastActivityTS,
          },
        },
        {
          writeConcern: {
            j: true,
          },
        },
      ]);
    });
  });

  describe('getConfiguration', () => {
    it('returns the configuration when it exist in the database', async () => {
      const findOneStub = jest.fn().mockResolvedValue({
        config: 'test',
      });
      mockMongoClient.mockImplementation(
        () =>
          ({
            connect: jest.fn().mockResolvedValue(undefined),
            db: () => ({
              collection: jest.fn().mockReturnValue({
                findOne: findOneStub,
              }),
            }),
          } as unknown as MongoClient),
      );
      const client = new MongoRepo('mongodb://localhost');

      // Act
      const result = await client.getConfiguration();
      expect(result).toEqual({ config: 'test' });
      expect(findOneStub).toHaveBeenCalledTimes(1);
      expect(findOneStub.mock.calls[0]).toEqual([{ v: 1 }]);
    });

    it('returns null when configuration does not exist in the database', async () => {
      const findOneStub = jest.fn().mockResolvedValue(undefined);
      mockMongoClient.mockImplementation(
        () =>
          ({
            connect: jest.fn().mockResolvedValue(undefined),
            db: () => ({
              collection: jest.fn().mockReturnValue({
                findOne: findOneStub,
              }),
            }),
          } as unknown as MongoClient),
      );
      const client = new MongoRepo('mongodb://localhost');

      // Act
      const result = await client.getConfiguration();
      expect(result).toBeNull();
      expect(findOneStub).toHaveBeenCalledTimes(1);
      expect(findOneStub.mock.calls[0]).toEqual([{ v: 1 }]);
    });
  });

  describe('updateConfiguration', () => {
    it('Saves config data to the database', async () => {
      // Arrange
      const saveData: ConfigurationData = {
        internal: {
          allowSelfSignCert: true,
          fsUrl: 'fsurl',
          identityUrl: 'identityUrl',
          nsUrl: 'nsurl',
          qsUrl: 'qsurl',
          sfUrl: 'sfurl',
          smUrl: 'smurl',
        },
        external: {
          allowSelfSignCert: false,
          fsUrl: 'fsurl2',
          identityUrl: 'identityUrl2',
          nsUrl: 'nsurl2',
          qsUrl: 'qsurl2',
          sfUrl: 'sfurl2',
          smUrl: 'smurl2',
        },
      };
      const updateOneStub = jest.fn().mockResolvedValue(undefined);
      mockMongoClient.mockImplementation(
        () =>
          ({
            connect: jest.fn().mockResolvedValue(undefined),
            db: () => ({
              collection: jest.fn().mockReturnValue({
                updateOne: updateOneStub,
              }),
            }),
          } as unknown as MongoClient),
      );
      const client = new MongoRepo('mongodb://localhost');

      // Act
      await client.updateConfiguration(saveData);
      expect(updateOneStub).toHaveBeenCalledTimes(1);
      expect(updateOneStub.mock.calls[0]).toEqual([
        {
          v: 1,
        },
        {
          $set: {
            ...saveData,
          },
        },
        {
          writeConcern: {
            j: true,
          },
          upsert: true,
        },
      ]);
    });
  });
});
