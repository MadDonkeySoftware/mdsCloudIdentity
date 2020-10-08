/* eslint-disable no-unused-expressions */
const _ = require('lodash');
const chai = require('chai');
const sinon = require('sinon');

const impl = require('./mongo-impl');

describe('src/repo/mongo-impl', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('initClient', () => {
    it('Returns configured client', () => {
      const client = impl.initClient('mongodb://localhost');
      chai.expect(client).is.not.null;
      chai.expect(client).is.not.undefined;
    });
  });

  describe('getNextCounterValue', () => {
    it('Gets next sequential value in database for provided key', () => {
      // Arrange
      const findOneAndUpdateStub = sinon.stub()
        .withArgs(
          { key: 'foo' },
          { $inc: { value: 1 } },
          { j: true, upsert: true, returnOriginal: false },
        )
        .resolves({ value: { value: 1001 } });
      const client = {
        isConnected: () => true,
        db: () => ({
          collection: sinon.stub().withArgs('mdsCounter').returns({
            findOneAndUpdate: findOneAndUpdateStub,
          }),
        }),
      };

      // Act
      return impl.getNextCounterValue(client, 'foo')
        .then((value) => {
          // Assert
          chai.expect(value).to.equal(1001);
        });
    });
  });

  describe('createUser', () => {
    describe('saves user data to database', () => {
      it('includes confirm code', () => {
        // Arrange
        const saveData = {
          userId: 1,
          email: 'no@no.com',
          name: 'friendly name',
          password: 'password',
          isActive: 'true',
          confirmCode: 'abcde',
        };
        const insertOneStub = sinon.stub()
          .withArgs(
            { key: 'foo' },
            { $inc: { value: 1 } },
            { j: true, upsert: true, returnOriginal: false },
          )
          .resolves({ value: { value: 1001 } });
        const client = {
          isConnected: () => true,
          db: () => ({
            collection: sinon.stub().withArgs('mdsUser').returns({
              insertOne: insertOneStub,
            }),
          }),
        };

        // Act
        return impl.createUser(client, saveData)
          .then((result) => {
            const now = new Date();
            chai.expect(now - result.created).to.be.lessThan(10);
            chai.expect(now - result.lastActivity).to.be.lessThan(10);

            const trimmedResult = _.omit(result, ['created', 'lastActivity']);
            chai.expect(trimmedResult).to.deep.equal({
              activationCode: 'abcde',
              email: 'no@no.com',
              friendlyName: 'friendly name',
              isActive: true,
              password: 'password',
              userId: 1,
            });
            chai.expect(insertOneStub.callCount).to.equal(1);
            chai.expect(insertOneStub.getCalls()[0].args.length).to.equal(2);
            const trimmedArgs = [
              _.omit(insertOneStub.getCalls()[0].args[0], ['created', 'lastActivity']),
              insertOneStub.getCalls()[0].args[1],
            ];
            chai.expect(trimmedArgs).to.deep.equal([
              {
                activationCode: 'abcde',
                email: 'no@no.com',
                friendlyName: 'friendly name',
                isActive: 'true',
                password: 'password',
                userId: 1,
              },
              {
                j: true,
              },
            ]);
          });
      });

      it('excludes confirm code', () => {
        // Arrange
        const saveData = {
          userId: 1,
          email: 'no@no.com',
          name: 'friendly name',
          password: 'password',
          isActive: 'true',
        };
        const insertOneStub = sinon.stub()
          .withArgs(
            { key: 'foo' },
            { $inc: { value: 1 } },
            { j: true, upsert: true, returnOriginal: false },
          )
          .resolves({ value: { value: 1001 } });
        const client = {
          isConnected: () => true,
          db: () => ({
            collection: sinon.stub().withArgs('mdsUser').returns({
              insertOne: insertOneStub,
            }),
          }),
        };

        // Act
        return impl.createUser(client, saveData)
          .then((result) => {
            const now = new Date();
            chai.expect(now - result.created).to.be.lessThan(10);
            chai.expect(now - result.lastActivity).to.be.lessThan(10);

            const trimmedResult = _.omit(result, ['created', 'lastActivity']);
            chai.expect(trimmedResult).to.deep.equal({
              activationCode: undefined,
              email: 'no@no.com',
              friendlyName: 'friendly name',
              isActive: true,
              password: 'password',
              userId: 1,
            });
            chai.expect(insertOneStub.callCount).to.equal(1);
            chai.expect(insertOneStub.getCalls()[0].args.length).to.equal(2);
            const trimmedArgs = [
              _.omit(insertOneStub.getCalls()[0].args[0], ['created', 'lastActivity']),
              insertOneStub.getCalls()[0].args[1],
            ];
            chai.expect(trimmedArgs).to.deep.equal([
              {
                email: 'no@no.com',
                friendlyName: 'friendly name',
                isActive: 'true',
                password: 'password',
                userId: 1,
              },
              {
                j: true,
              },
            ]);
          });
      });
    });
  });

  describe('getUserById', () => {
    it('returns the user when they exist in the database', () => {
      const findOneStub = sinon.stub()
        .withArgs(
          { userId: 'testUser' },
        )
        .resolves({
          activationCode: 'abcde',
          userId: 'testUser',
          email: 'no@no.com',
          friendlyName: 'friendly name',
          password: 'password',
          isActive: 'true',
          confirmCode: 'abcde',
        });
      const client = {
        isConnected: () => true,
        db: () => ({
          collection: sinon.stub().withArgs('mdsUser').returns({
            findOne: findOneStub,
          }),
        }),
      };

      // Act
      return impl.getUserByUserId(client, 'testUser')
        .then((result) => {
          const trimmedResult = _.omit(result, ['created', 'lastActivity']);
          chai.expect(trimmedResult).to.deep.equal({
            confirmCode: 'abcde',
            email: 'no@no.com',
            name: 'friendly name',
            isActive: true,
            password: 'password',
            userId: 'testUser',
          });
        });
    });

    // NOTE: mongo reconnect tested here too.
    it('returns null when they do not exit in the database', () => {
      const findOneStub = sinon.stub()
        .withArgs(
          { userId: 'testUser' },
        )
        .resolves();
      const client = {
        isConnected: () => false,
        connect: () => Promise.resolve(client),
        db: () => ({
          collection: sinon.stub().withArgs('mdsUser').returns({
            findOne: findOneStub,
          }),
        }),
      };

      // Act
      return impl.getUserByUserId(client, 'testUser')
        .then((result) => {
          chai.expect(result).to.equal(null);
        });
    });
  });

  describe('updateUser', () => {
    describe('Saves user data to the database', () => {
      it('when confirmCode is null', () => {
        // Arrange
        const lastActivityTS = new Date().toISOString();
        const saveData = {
          userId: 'testUser',
          email: 'no@no.com',
          name: 'friendly name',
          password: 'password',
          isActive: true,
          confirmCode: null,
          lastActivity: lastActivityTS,
        };
        const updateOneStub = sinon.stub()
          .resolves();
        const client = {
          isConnected: () => true,
          db: () => ({
            collection: sinon.stub().withArgs('mdsUser').returns({
              updateOne: updateOneStub,
            }),
          }),
        };

        // Act
        return impl.updateUser(client, saveData)
          .then((result) => {
            chai.expect(result).to.equal(null);
            chai.expect(updateOneStub.callCount).to.equal(1);
            chai.expect(updateOneStub.getCalls()[0].args).to.deep.equal([
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
                j: true,
              },
            ]);
          });
      });

      it('when confirmCode is value', () => {
        // Arrange
        const lastActivityTS = new Date().toISOString();
        const saveData = {
          userId: 'testUser',
          email: 'no@no.com',
          name: 'friendly name',
          password: 'password',
          isActive: true,
          confirmCode: 'abcde',
          lastActivity: lastActivityTS,
        };
        const updateOneStub = sinon.stub()
          .resolves();
        const client = {
          isConnected: () => true,
          db: () => ({
            collection: sinon.stub().withArgs('mdsUser').returns({
              updateOne: updateOneStub,
            }),
          }),
        };

        // Act
        return impl.updateUser(client, saveData)
          .then((result) => {
            chai.expect(result).to.equal(null);
            chai.expect(updateOneStub.callCount).to.equal(1);
            chai.expect(updateOneStub.getCalls()[0].args).to.deep.equal([
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
                j: true,
              },
            ]);
          });
      });

      it('when missing confirmCode on object', () => {
        // Arrange
        const lastActivityTS = new Date().toISOString();
        const saveData = {
          userId: 'testUser',
          email: 'no@no.com',
          name: 'friendly name',
          password: 'password',
          isActive: true,
          lastActivity: lastActivityTS,
        };
        const updateOneStub = sinon.stub()
          .resolves();
        const client = {
          isConnected: () => true,
          db: () => ({
            collection: sinon.stub().withArgs('mdsUser').returns({
              updateOne: updateOneStub,
            }),
          }),
        };

        // Act
        return impl.updateUser(client, saveData)
          .then((result) => {
            chai.expect(result).to.equal(null);
            chai.expect(updateOneStub.callCount).to.equal(1);
            chai.expect(updateOneStub.getCalls()[0].args).to.deep.equal([
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
                j: true,
              },
            ]);
          });
      });
    });
  });

  describe('createAccount', () => {
    it('Saves account data to the database', () => {
      // Arrange
      const saveData = {
        accountId: '1001',
        name: 'test account',
        ownerUserId: 'testUser',
        isActive: 'true',
      };
      const insertOneStub = sinon.stub()
        .withArgs(
          { key: 'foo' },
          { $inc: { value: 1 } },
          { j: true, upsert: true, returnOriginal: false },
        )
        .resolves({ value: { value: 1001 } });
      const client = {
        isConnected: () => true,
        db: () => ({
          collection: sinon.stub().withArgs('mdsAccount').returns({
            insertOne: insertOneStub,
          }),
        }),
      };

      // Act
      return impl.createAccount(client, saveData)
        .then((result) => {
          const now = new Date();
          chai.expect(now - result.created).to.be.lessThan(10);
          chai.expect(now - result.lastActivity).to.be.lessThan(10);

          const trimmedResult = _.omit(result, ['created', 'lastActivity']);
          chai.expect(trimmedResult).to.deep.equal({
            accountId: '1001',
            friendlyName: 'test account',
            ownerId: 'testUser',
            isActive: true,
          });
        });
    });
  });

  describe('getAccountById', () => {
    it('returns the user when they exist in the database', () => {
      const now = new Date().toISOString();
      const findOneStub = sinon.stub()
        .withArgs(
          { accountId: '1001' },
        )
        .resolves({
          accountId: '1001',
          friendlyName: 'test account',
          ownerId: 'testUser',
          isActive: 'true',
          created: now,
          lastActivity: now,
        });
      const client = {
        isConnected: () => true,
        db: () => ({
          collection: sinon.stub().withArgs('mdsAccount').returns({
            findOne: findOneStub,
          }),
        }),
      };

      // Act
      return impl.getAccountById(client, '1001')
        .then((result) => {
          const trimmedResult = _.omit(result, ['created', 'lastActivity']);
          chai.expect(trimmedResult).to.deep.equal({
            accountId: '1001',
            isActive: true,
            name: 'test account',
            ownerId: 'testUser',
          });
        });
    });

    it('returns null when they do not exit in the database', () => {
      const findOneStub = sinon.stub()
        .withArgs(
          { accountId: '1001' },
        )
        .resolves();
      const client = {
        isConnected: () => true,
        db: () => ({
          collection: sinon.stub().withArgs('mdsAccount').returns({
            findOne: findOneStub,
          }),
        }),
      };

      // Act
      return impl.getAccountById(client, '1001')
        .then((result) => {
          chai.expect(result).to.equal(null);
        });
    });
  });

  describe('getAccountByOwnerId', () => {
    it('returns the account when they exist in the database', () => {
      const now = new Date().toISOString();
      const findOneStub = sinon.stub()
        .withArgs(
          { ownerId: 'testUser' },
        )
        .resolves({
          accountId: '1001',
          friendlyName: 'test account',
          ownerId: 'testUser',
          isActive: 'true',
          created: now,
          lastActivity: now,
        });
      const client = {
        isConnected: () => true,
        db: () => ({
          collection: sinon.stub().withArgs('mdsAccount').returns({
            findOne: findOneStub,
          }),
        }),
      };

      // Act
      return impl.getAccountByOwnerId(client, 'testUser')
        .then((result) => {
          const trimmedResult = _.omit(result, ['created', 'lastActivity']);
          chai.expect(trimmedResult).to.deep.equal({
            accountId: '1001',
            isActive: true,
            name: 'test account',
            ownerId: 'testUser',
          });
        });
    });

    it('returns null when account does not exit in the database', () => {
      const findOneStub = sinon.stub()
        .withArgs(
          { ownerId: 'testUser' },
        )
        .resolves();
      const client = {
        isConnected: () => true,
        db: () => ({
          collection: sinon.stub().withArgs('mdsAccount').returns({
            findOne: findOneStub,
          }),
        }),
      };

      // Act
      return impl.getAccountByOwnerId(client, 'testUser')
        .then((result) => {
          chai.expect(result).to.equal(null);
        });
    });
  });

  describe('updateAccount', () => {
    it('Saves account data to the database', () => {
      // Arrange
      const lastActivityTS = new Date().toISOString();
      const saveData = {
        accountId: '1001',
        name: 'account name',
        ownerId: 'testUser',
        isActive: true,
        lastActivity: lastActivityTS,
      };
      const updateOneStub = sinon.stub()
        .resolves();
      const client = {
        isConnected: () => true,
        db: () => ({
          collection: sinon.stub().withArgs('mdsAccount').returns({
            updateOne: updateOneStub,
          }),
        }),
      };

      // Act
      return impl.updateAccount(client, saveData)
        .then((result) => {
          chai.expect(result).to.equal(null);
          chai.expect(updateOneStub.callCount).to.equal(1);
          chai.expect(updateOneStub.getCalls()[0].args).to.deep.equal([
            {
              accountId: '1001',
            },
            {
              $set: {
                ownerId: 'testUser',
                friendlyName: 'account name',
                isActive: 'true',
                lastActivity: lastActivityTS,
              },
            },
            {
              j: true,
            },
          ]);
        });
    });
  });
});
