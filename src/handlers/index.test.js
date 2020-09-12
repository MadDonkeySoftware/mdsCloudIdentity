/* eslint-disable no-unused-expressions */
const _ = require('lodash');
const supertest = require('supertest');
const chai = require('chai');
const sinon = require('sinon');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const src = require('..');
const repo = require('../repo');
const globals = require('../globals');

describe('src/handlers/index', () => {
  const app = src.buildApp();

  beforeEach(() => {
    sinon.stub(repo, 'getNextCounterValue').resolves(1001);
    sinon.stub(globals, 'delay').resolves();
    sinon.stub(globals, 'getLogger').returns({
      debug: sinon.stub(),
      error: sinon.stub(),
      info: sinon.stub(),
      trace: sinon.stub(),
      warn: sinon.stub(),
    });
    sinon.stub(bcryptjs, 'hash').resolves('hashedPassword');
  });

  afterEach(() => {
    sinon.restore();
    delete process.env.BYPASS_USER_ACTIVATION;
  });

  describe('register', () => {
    describe('Succeeds when userId not already in system and all details present', () => {
      it('bypassing user activation', () => {
        // Arrange
        sinon.stub(repo, 'getAccountByOwnerId').resolves(undefined);
        sinon.stub(repo, 'getUserByUserId').resolves(undefined);
        sinon.stub(repo, 'createAccount');
        sinon.stub(repo, 'createUser');
        process.env.BYPASS_USER_ACTIVATION = 'true';

        // Act / Assert
        return supertest(app)
          .post('/v1/register')
          .send({
            email: 'test@test.com',
            userId: 'testUser',
            accountName: 'Test Account',
            friendlyName: 'Test User',
            password: 'testPassword',
          })
          .expect('content-type', /application\/json/)
          .expect(200)
          .then((resp) => {
            const body = JSON.parse(resp.text);
            chai.expect(body).to.eql({
              accountId: '1001',
              status: 'Success',
            });
            chai.expect(repo.createAccount.callCount).to.be.equal(1);
            chai.expect(repo.createAccount.getCalls()[0].args).to.deep.equal([{
              accountId: '1001',
              name: 'Test Account',
              ownerUserId: 'testUser',
            }]);
            chai.expect(repo.createUser.callCount).to.be.equal(1);
            chai.expect(repo.createUser.getCalls()[0].args).to.deep.equal([{
              confirmCode: null,
              email: 'test@test.com',
              isActive: 'true',
              name: 'Test User',
              password: 'hashedPassword',
              userId: 'testUser',
            }]);
          });
      });

      it('Using user activation', () => {
        // Arrange
        sinon.stub(repo, 'getAccountByOwnerId').resolves(undefined);
        sinon.stub(repo, 'getUserByUserId').resolves(undefined);
        sinon.stub(repo, 'createAccount');
        sinon.stub(repo, 'createUser');
        sinon.stub(globals, 'generateRandomString').withArgs(32).returns('confirmCode');
        sinon.stub(globals, 'getMailer').returns({
          sendMail: sinon.stub(),
        });

        // Act / Assert
        return supertest(app)
          .post('/v1/register')
          .send({
            email: 'test@test.com',
            userId: 'testUser',
            accountName: 'Test Account',
            friendlyName: 'Test User',
            password: 'testPassword',
          })
          .expect('content-type', /application\/json/)
          .expect(200)
          .then((resp) => {
            const body = JSON.parse(resp.text);
            chai.expect(body).to.eql({
              accountId: '1001',
              status: 'Success',
            });
            chai.expect(repo.createAccount.callCount).to.be.equal(1);
            chai.expect(repo.createAccount.getCalls()[0].args).to.deep.equal([{
              accountId: '1001',
              name: 'Test Account',
              ownerUserId: 'testUser',
            }]);
            chai.expect(repo.createUser.callCount).to.be.equal(1);
            chai.expect(repo.createUser.getCalls()[0].args).to.deep.equal([{
              confirmCode: 'confirmCode',
              email: 'test@test.com',
              name: 'Test User',
              password: 'hashedPassword',
              userId: 'testUser',
            }]);
          });
      });
    });

    it('Fails when userId already in system as account', () => {
      // Arrange
      sinon.stub(repo, 'getAccountByOwnerId').resolves({});
      sinon.stub(repo, 'getUserByUserId').resolves(undefined);
      sinon.stub(repo, 'createAccount');
      sinon.stub(repo, 'createUser');
      process.env.BYPASS_USER_ACTIVATION = 'true';

      // Act / Assert
      return supertest(app)
        .post('/v1/register')
        .send({
          email: 'test@test.com',
          userId: 'testUser',
          accountName: 'Test Account',
          friendlyName: 'Test User',
          password: 'testPassword',
        })
        .expect('content-type', /application\/json/)
        .expect(400)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.eql({
            message: 'Invalid userId',
            status: 'Failed',
          });
          chai.expect(repo.createAccount.callCount).to.be.equal(0);
          chai.expect(repo.createUser.callCount).to.be.equal(0);
        });
    });

    it('Fails when userId already in system as user', () => {
      // Arrange
      sinon.stub(repo, 'getAccountByOwnerId').resolves(undefined);
      sinon.stub(repo, 'getUserByUserId').resolves({});
      sinon.stub(repo, 'createAccount');
      sinon.stub(repo, 'createUser');
      process.env.BYPASS_USER_ACTIVATION = 'true';

      // Act / Assert
      return supertest(app)
        .post('/v1/register')
        .send({
          email: 'test@test.com',
          userId: 'testUser',
          accountName: 'Test Account',
          friendlyName: 'Test User',
          password: 'testPassword',
        })
        .expect('content-type', /application\/json/)
        .expect(400)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.eql({
            message: 'Invalid userId',
            status: 'Failed',
          });
          chai.expect(repo.createAccount.callCount).to.be.equal(0);
          chai.expect(repo.createUser.callCount).to.be.equal(0);
        });
    });

    it('Fails when body fails verification', () => {
      // Arrange
      sinon.stub(repo, 'getAccountByOwnerId').resolves(undefined);
      sinon.stub(repo, 'getUserByUserId').resolves({});
      sinon.stub(repo, 'createAccount');
      sinon.stub(repo, 'createUser');
      process.env.BYPASS_USER_ACTIVATION = 'true';

      // Act / Assert
      return supertest(app)
        .post('/v1/register')
        .send({})
        .expect('content-type', /application\/json/)
        .expect(400)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body.length).to.be.equal(5);
          chai.expect(_.find(body, (e) => e.message === 'requires property "userId"')).to.not.be.undefined;
          chai.expect(_.find(body, (e) => e.message === 'requires property "email"')).to.not.be.undefined;
          chai.expect(_.find(body, (e) => e.message === 'requires property "accountName"')).to.not.be.undefined;
          chai.expect(_.find(body, (e) => e.message === 'requires property "friendlyName"')).to.not.be.undefined;
          chai.expect(_.find(body, (e) => e.message === 'requires property "password"')).to.not.be.undefined;
          chai.expect(repo.createAccount.callCount).to.be.equal(0);
          chai.expect(repo.createUser.callCount).to.be.equal(0);
        });
    });
  });

  describe('authenticate', () => {
    it('With simple signing, succeeds when userId, password and account all match', () => {
      // Arrange
      sinon.stub(repo, 'getAccountById').resolves({
        accountId: '1001',
        isActive: true,
      });
      sinon.stub(repo, 'getUserByUserId').resolves({
        userId: 'testUser',
        name: 'Test User',
        isActive: true,
      });
      sinon.stub(bcryptjs, 'compare').resolves(true);
      sinon.stub(repo, 'updateUser').resolves();
      sinon.stub(jwt, 'sign').returns('signedToken');

      // Act / Assert
      return supertest(app)
        .post('/v1/authenticate')
        .send({
          userId: 'testUser',
          accountId: '1001',
          password: 'testPassword',
        })
        .expect('content-type', /application\/json/)
        .expect(200)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.eql({
            token: 'signedToken',
          });
          chai.expect(jwt.sign.callCount).to.be.equal(1);
          chai.expect(jwt.sign.getCalls()[0].args).to.deep.equal([
            {
              accountId: '1001',
              friendlyName: 'Test User',
              userId: 'testUser',
            },
            'MDS-Cloud-Development-Secret',
            {
              expiresIn: '4h',
              issuer: 'mdsCloudIdentity',
            },
          ]);
        });
    });

    it('With RSA signing, succeeds when userId, password and account all match', () => {
      // Arrange
      sinon.stub(repo, 'getAccountById').resolves({
        accountId: '1001',
        isActive: true,
      });
      sinon.stub(repo, 'getUserByUserId').resolves({
        userId: 'testUser',
        name: 'Test User',
        isActive: true,
      });
      sinon.stub(bcryptjs, 'compare').resolves(true);
      sinon.stub(repo, 'updateUser').resolves();
      sinon.stub(jwt, 'sign').returns('signedToken');
      process.env.IDENTITY_SECRET_PRIVATE_PASS = 'test-secret';

      // Act / Assert
      return supertest(app)
        .post('/v1/authenticate')
        .send({
          userId: 'testUser',
          accountId: '1001',
          password: 'testPassword',
        })
        .expect('content-type', /application\/json/)
        .expect(200)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.eql({
            token: 'signedToken',
          });
          chai.expect(jwt.sign.callCount).to.be.equal(1);
          chai.expect(jwt.sign.getCalls()[0].args).to.deep.equal([
            {
              accountId: '1001',
              friendlyName: 'Test User',
              userId: 'testUser',
            },
            {
              key: 'MDS-Cloud-Development-Secret',
              passphrase: 'test-secret',
            },
            {
              algorithm: 'RS256',
              expiresIn: '4h',
              issuer: 'mdsCloudIdentity',
            },
          ]);
        })
        .finally(() => {
          delete process.env.IDENTITY_SECRET_PRIVATE_PASS;
        });
    });

    it('Fails when passwords do not match', () => {
      // Arrange
      sinon.stub(repo, 'getAccountById').resolves({
        accountId: '1001',
        isActive: true,
      });
      sinon.stub(repo, 'getUserByUserId').resolves({
        userId: 'testUser',
        name: 'Test User',
        isActive: true,
      });
      sinon.stub(bcryptjs, 'compare').resolves(false);

      // Act / Assert
      return supertest(app)
        .post('/v1/authenticate')
        .send({
          userId: 'testUser',
          accountId: '1001',
          password: 'testPassword',
        })
        .expect('content-type', /application\/json/)
        .expect(400)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.eql({
            message: 'Could not find account, user or passwords did not match',
          });
        });
    });

    it('Fails when user is inactive', () => {
      // Arrange
      sinon.stub(repo, 'getAccountById').resolves({
        accountId: '1001',
        isActive: true,
      });
      sinon.stub(repo, 'getUserByUserId').resolves({
        userId: 'testUser',
        name: 'Test User',
        isActive: false,
      });

      // Act / Assert
      return supertest(app)
        .post('/v1/authenticate')
        .send({
          userId: 'testUser',
          accountId: '1001',
          password: 'testPassword',
        })
        .expect('content-type', /application\/json/)
        .expect(400)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.eql({
            message: 'Could not find account, user or passwords did not match',
          });
        });
    });

    it('Fails when user is not found', () => {
      // Arrange
      sinon.stub(repo, 'getAccountById').resolves({
        accountId: '1001',
        isActive: true,
      });
      sinon.stub(repo, 'getUserByUserId').resolves();

      // Act / Assert
      return supertest(app)
        .post('/v1/authenticate')
        .send({
          userId: 'testUser',
          accountId: '1001',
          password: 'testPassword',
        })
        .expect('content-type', /application\/json/)
        .expect(400)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.eql({
            message: 'Could not find account, user or passwords did not match',
          });
        });
    });

    it('Fails when account is not active', () => {
      // Arrange
      sinon.stub(repo, 'getAccountById').resolves({
        accountId: '1001',
        isActive: false,
      });
      sinon.stub(repo, 'getUserByUserId').resolves({
        userId: 'testUser',
        name: 'Test User',
        isActive: true,
      });

      // Act / Assert
      return supertest(app)
        .post('/v1/authenticate')
        .send({
          userId: 'testUser',
          accountId: '1001',
          password: 'testPassword',
        })
        .expect('content-type', /application\/json/)
        .expect(400)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.eql({
            message: 'Could not find account, user or passwords did not match',
          });
        });
    });

    it('Fails when account is not found', () => {
      // Arrange
      sinon.stub(repo, 'getAccountById').resolves();
      sinon.stub(repo, 'getUserByUserId').resolves({
        userId: 'testUser',
        name: 'Test User',
        isActive: true,
      });

      // Act / Assert
      return supertest(app)
        .post('/v1/authenticate')
        .send({
          userId: 'testUser',
          accountId: '1001',
          password: 'testPassword',
        })
        .expect('content-type', /application\/json/)
        .expect(400)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.eql({
            message: 'Could not find account, user or passwords did not match',
          });
        });
    });
  });

  describe('publicSignature', () => {
    it('Returns the public signature when available', () => {
      // Arrange
      sinon.stub(globals, 'getAppPublicSignature').returns('testPublicSignature');

      // Act / Assert
      return supertest(app)
        .get('/v1/publicSignature')
        .expect('content-type', /application\/json/)
        .expect(200)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.eql({
            signature: 'testPublicSignature',
          });
        });
    });

    it('Returns an empty response when no public signature available', () => {
      // Arrange
      sinon.stub(globals, 'getAppPublicSignature').returns();

      // Act / Assert
      return supertest(app)
        .get('/v1/publicSignature')
        .expect('content-type', /application\/json/)
        .expect(200)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.eql({});
        });
    });
  });

  describe('updateUser', () => {
    it('Successfully updates user details', () => {
      // Arrange
      sinon.stub(repo, 'getUserByUserId').resolves({
        userId: 'testUser',
        name: 'Test User',
        isActive: true,
        password: 'oldPassword',
      });
      sinon.stub(bcryptjs, 'compare').withArgs('oldPassword', 'oldPassword').resolves(true);
      sinon.stub(repo, 'updateUser').resolves();
      sinon.stub(globals, 'getAppPublicSignature').returns('publicSignature');
      sinon.stub(jwt, 'verify')
        .withArgs(
          'testToken',
          'publicSignature',
          { complete: true },
        )
        .returns({
          payload: {
            iss: 'mdsCloudIdentity',
          },
        });

      // Act / Assert
      return supertest(app)
        .post('/v1/updateUser')
        .set('token', 'testToken')
        .send({
          email: 'new@email.io',
          oldPassword: 'oldPassword',
          newPassword: 'newPassword',
          friendlyName: 'Test Guy',
        })
        .expect('content-type', /application\/json/)
        .expect(200)
        .then((resp) => {
          chai.expect(resp.text).to.be.equal('');

          chai.expect(repo.updateUser.callCount).to.be.equal(1);
          const callArgs = repo.updateUser.getCalls()[0].args;
          delete callArgs[0].lastActivity;
          chai.expect(callArgs).to.deep.equal([{
            email: 'new@email.io',
            isActive: true,
            password: 'hashedPassword',
            name: 'Test Guy',
            userId: 'testUser',
          }]);
        });
    });

    it('Fails when updating password and old password does not match', () => {
      // Arrange
      sinon.stub(repo, 'getUserByUserId').resolves({
        userId: 'testUser',
        name: 'Test User',
        isActive: true,
        password: 'password',
      });
      sinon.stub(bcryptjs, 'compare').withArgs('oldPassword', 'password').resolves(false);
      sinon.stub(repo, 'updateUser').resolves();
      sinon.stub(globals, 'getAppPublicSignature').returns('publicSignature');
      sinon.stub(jwt, 'verify')
        .withArgs(
          'testToken',
          'publicSignature',
          { complete: true },
        )
        .returns({
          payload: {
            iss: 'mdsCloudIdentity',
          },
        });

      // Act / Assert
      return supertest(app)
        .post('/v1/updateUser')
        .set('token', 'testToken')
        .send({
          email: 'new@email.io',
          oldPassword: 'oldPassword',
          newPassword: 'newPassword',
          friendlyName: 'Test Guy',
        })
        .expect('content-type', /application\/json/)
        .expect(400)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.deep.equal({
            message: 'Could not find account, user or passwords did not match',
          });

          chai.expect(repo.updateUser.callCount).to.be.equal(0);
        });
    });

    it('Fails when no fields provided to update', () => {
      // Arrange
      sinon.stub(repo, 'getUserByUserId').resolves({
        userId: 'testUser',
        name: 'Test User',
        isActive: true,
        password: 'password',
      });
      sinon.stub(repo, 'updateUser');
      sinon.stub(globals, 'getAppPublicSignature').returns('publicSignature');
      sinon.stub(jwt, 'verify')
        .withArgs(
          'testToken',
          'publicSignature',
          { complete: true },
        )
        .returns({
          payload: {
            iss: 'mdsCloudIdentity',
          },
        });

      // Act / Assert
      return supertest(app)
        .post('/v1/updateUser')
        .set('token', 'testToken')
        .send({
        })
        .expect('content-type', /application\/json/)
        .expect(400)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.deep.equal({
            message: 'Could not find account, user or passwords did not match',
          });

          chai.expect(repo.updateUser.callCount).to.be.equal(0);
        });
    });

    it('Fails when user is not active', () => {
      // Arrange
      sinon.stub(repo, 'getUserByUserId').resolves({
        userId: 'testUser',
        name: 'Test User',
        isActive: false,
        password: 'password',
      });
      sinon.stub(repo, 'updateUser');
      sinon.stub(globals, 'getAppPublicSignature').returns('publicSignature');
      sinon.stub(jwt, 'verify')
        .withArgs(
          'testToken',
          'publicSignature',
          { complete: true },
        )
        .returns({
          payload: {
            iss: 'mdsCloudIdentity',
          },
        });

      // Act / Assert
      return supertest(app)
        .post('/v1/updateUser')
        .set('token', 'testToken')
        .send({
        })
        .expect('content-type', /application\/json/)
        .expect(400)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.deep.equal({
            message: 'Could not find account, user or passwords did not match',
          });

          chai.expect(repo.updateUser.callCount).to.be.equal(0);
        });
    });

    it('Fails when user is not found', () => {
      // Arrange
      sinon.stub(repo, 'getUserByUserId').resolves();
      sinon.stub(repo, 'updateUser');
      sinon.stub(globals, 'getAppPublicSignature').returns('publicSignature');
      sinon.stub(jwt, 'verify')
        .withArgs(
          'testToken',
          'publicSignature',
          { complete: true },
        )
        .returns({
          payload: {
            iss: 'mdsCloudIdentity',
          },
        });

      // Act / Assert
      return supertest(app)
        .post('/v1/updateUser')
        .set('token', 'testToken')
        .send({
        })
        .expect('content-type', /application\/json/)
        .expect(400)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.deep.equal({
            message: 'Could not find account, user or passwords did not match',
          });

          chai.expect(repo.updateUser.callCount).to.be.equal(0);
        });
    });

    it('Fails when no token provided', () => {
      // Arrange
      sinon.stub(repo, 'updateUser');
      sinon.stub(globals, 'getAppPublicSignature').returns('publicSignature');
      sinon.stub(jwt, 'verify')
        .withArgs(
          'testToken',
          'publicSignature',
          { complete: true },
        )
        .returns({
          payload: {
            iss: 'mdsCloudIdentity',
          },
        });

      // Act / Assert
      return supertest(app)
        .post('/v1/updateUser')
        .send({
        })
        .expect('content-type', /application\/json/)
        .expect(403)
        .then((resp) => {
          chai.expect(resp.text).to.deep.equal('');
          chai.expect(repo.updateUser.callCount).to.be.equal(0);
        });
    });

    it('Fails when token is from another provider', () => {
      // Arrange
      sinon.stub(repo, 'updateUser');
      sinon.stub(globals, 'getAppPublicSignature').returns('publicSignature');
      sinon.stub(jwt, 'verify')
        .withArgs(
          'testToken',
          'publicSignature',
          { complete: true },
        )
        .returns({
          payload: {
            iss: 'otherProvider',
          },
        });

      // Act / Assert
      return supertest(app)
        .post('/v1/updateUser')
        .set('token', 'testToken')
        .send({
        })
        .expect('content-type', /application\/json/)
        .expect(403)
        .then((resp) => {
          chai.expect(resp.text).to.deep.equal('');
          chai.expect(repo.updateUser.callCount).to.be.equal(0);
        });
    });

    it('Fails when token fails verification', () => {
      // Arrange
      sinon.stub(repo, 'updateUser');
      sinon.stub(globals, 'getAppPublicSignature').returns('publicSignature');
      sinon.stub(jwt, 'verify')
        .withArgs(
          'testToken',
          'publicSignature',
          { complete: true },
        )
        .throws(new Error('Test Verification Error'));

      // Act / Assert
      return supertest(app)
        .post('/v1/updateUser')
        .set('token', 'testToken')
        .send({
        })
        .expect('content-type', /application\/json/)
        .expect(403)
        .then((resp) => {
          chai.expect(resp.text).to.deep.equal('');
          chai.expect(repo.updateUser.callCount).to.be.equal(0);
        });
    });
  });

  describe('impersonate', () => {
    it('Succeeds when system account requesting valid account and user', () => {
      // Arrange
      sinon.stub(repo, 'getAccountById').resolves({
        ownerId: 'testUser',
        isActive: true,
      });
      sinon.stub(repo, 'getUserByUserId').resolves({
        userId: 'testUser',
        name: 'Test User',
        isActive: true,
        password: 'oldPassword',
      });
      sinon.stub(globals, 'getAppPublicSignature').returns('publicSignature');
      sinon.stub(jwt, 'verify')
        .withArgs(
          'testToken',
          'publicSignature',
          { complete: true },
        )
        .returns({
          payload: {
            accountId: '1',
            iss: 'mdsCloudIdentity',
          },
        });
      sinon.stub(jwt, 'sign').returns('impersonationToken');

      // Act / Assert
      return supertest(app)
        .post('/v1/impersonate')
        .set('token', 'testToken')
        .send({
          accountId: '1001',
          userId: 'testUser',
        })
        .expect('content-type', /application\/json/)
        .expect(200)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.eql({
            token: 'impersonationToken',
          });
        });
    });

    it('Fails when non-system account requesting valid account and user', () => {
      // Arrange
      sinon.stub(repo, 'getAccountById').resolves({
        ownerId: 'testUser',
        isActive: true,
      });
      sinon.stub(repo, 'getUserByUserId').resolves({
        userId: 'testUser',
        name: 'Test User',
        isActive: true,
        password: 'oldPassword',
      });
      sinon.stub(globals, 'getAppPublicSignature').returns('publicSignature');
      sinon.stub(jwt, 'verify')
        .withArgs(
          'testToken',
          'publicSignature',
          { complete: true },
        )
        .returns({
          payload: {
            accountId: '2',
            iss: 'mdsCloudIdentity',
          },
        });
      sinon.stub(jwt, 'sign').returns('impersonationToken');

      // Act / Assert
      return supertest(app)
        .post('/v1/impersonate')
        .set('token', 'testToken')
        .send({
          accountId: '1001',
          userId: 'testUser',
        })
        .expect('content-type', /application\/json/)
        .expect(400)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.eql({
            message: 'Could not find account, user or insufficient privilege to impersonate',
          });
        });
    });

    it('Fails when system account requesting inactive account', () => {
      // Arrange
      sinon.stub(repo, 'getAccountById').resolves({
        ownerId: 'testUser',
        isActive: false,
      });
      sinon.stub(repo, 'getUserByUserId').resolves({
        userId: 'testUser',
        name: 'Test User',
        isActive: true,
        password: 'oldPassword',
      });
      sinon.stub(globals, 'getAppPublicSignature').returns('publicSignature');
      sinon.stub(jwt, 'verify')
        .withArgs(
          'testToken',
          'publicSignature',
          { complete: true },
        )
        .returns({
          payload: {
            accountId: '1',
            iss: 'mdsCloudIdentity',
          },
        });
      sinon.stub(jwt, 'sign').returns('impersonationToken');

      // Act / Assert
      return supertest(app)
        .post('/v1/impersonate')
        .set('token', 'testToken')
        .send({
          accountId: '1',
          userId: 'testUser',
        })
        .expect('content-type', /application\/json/)
        .expect(400)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.eql({
            message: 'Could not find account, user or insufficient privilege to impersonate',
          });
        });
    });

    it('Fails when system account requesting account that does not exist', () => {
      // Arrange
      sinon.stub(repo, 'getAccountById').resolves();
      sinon.stub(repo, 'getUserByUserId').resolves({
        userId: 'testUser',
        name: 'Test User',
        isActive: true,
        password: 'oldPassword',
      });
      sinon.stub(globals, 'getAppPublicSignature').returns('publicSignature');
      sinon.stub(jwt, 'verify')
        .withArgs(
          'testToken',
          'publicSignature',
          { complete: true },
        )
        .returns({
          payload: {
            accountId: '1',
            iss: 'mdsCloudIdentity',
          },
        });
      sinon.stub(jwt, 'sign').returns('impersonationToken');

      // Act / Assert
      return supertest(app)
        .post('/v1/impersonate')
        .set('token', 'testToken')
        .send({
          accountId: '1',
          userId: 'testUser',
        })
        .expect('content-type', /application\/json/)
        .expect(400)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.eql({
            message: 'Could not find account, user or insufficient privilege to impersonate',
          });
        });
    });

    it('Fails when system account requesting inactive user', () => {
      // Arrange
      sinon.stub(repo, 'getAccountById').resolves({
        ownerId: 'testUser',
        isActive: true,
      });
      sinon.stub(repo, 'getUserByUserId').resolves({
        userId: 'testUser',
        name: 'Test User',
        isActive: false,
        password: 'oldPassword',
      });
      sinon.stub(globals, 'getAppPublicSignature').returns('publicSignature');
      sinon.stub(jwt, 'verify')
        .withArgs(
          'testToken',
          'publicSignature',
          { complete: true },
        )
        .returns({
          payload: {
            accountId: '1',
            iss: 'mdsCloudIdentity',
          },
        });
      sinon.stub(jwt, 'sign').returns('impersonationToken');

      // Act / Assert
      return supertest(app)
        .post('/v1/impersonate')
        .set('token', 'testToken')
        .send({
          accountId: '1',
          userId: 'testUser',
        })
        .expect('content-type', /application\/json/)
        .expect(400)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.eql({
            message: 'Could not find account, user or insufficient privilege to impersonate',
          });
        });
    });

    it('Fails when system account requesting user that does not exist', () => {
      // Arrange
      sinon.stub(repo, 'getAccountById').resolves({
        ownerId: 'testUser',
        isActive: true,
      });
      sinon.stub(repo, 'getUserByUserId').resolves();
      sinon.stub(globals, 'getAppPublicSignature').returns('publicSignature');
      sinon.stub(jwt, 'verify')
        .withArgs(
          'testToken',
          'publicSignature',
          { complete: true },
        )
        .returns({
          payload: {
            accountId: '1',
            iss: 'mdsCloudIdentity',
          },
        });
      sinon.stub(jwt, 'sign').returns('impersonationToken');

      // Act / Assert
      return supertest(app)
        .post('/v1/impersonate')
        .set('token', 'testToken')
        .send({
          accountId: '1',
          userId: 'testUser',
        })
        .expect('content-type', /application\/json/)
        .expect(400)
        .then((resp) => {
          const body = JSON.parse(resp.text);
          chai.expect(body).to.eql({
            message: 'Could not find account, user or insufficient privilege to impersonate',
          });
        });
    });
  });
});
