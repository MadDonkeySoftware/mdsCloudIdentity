import { FastifyInstance, InjectOptions } from 'fastify';
import * as bcryptjs from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as src from '../../..';
import * as repo from '../../../repo';
import * as utils from '../../../utils';
import { BaseRepo } from '../../../repo';

jest.mock('../../../repo');
const mockRepo = jest.mocked(repo);

jest.mock('bcryptjs');
const mockBcryptjs = jest.mocked(bcryptjs);

jest.mock('jsonwebtoken');
const mockJwt = jest.mocked(jwt);

jest.mock('../../../utils', () => ({
  ...jest.requireActual('../../../utils'),
  delay: jest.fn().mockResolvedValue(undefined),
  getJwtSigningData: jest.fn().mockResolvedValue({
    signingKey: 'mockPrivateSecret',
    signingOptions: { expiresIn: '4h', issuer: 'testIssuer' },
  }),
}));
const mockUtils = jest.mocked(utils);

describe('authenticationController test', () => {
  let app: FastifyInstance;

  function makeRequest(overrides: InjectOptions = {}) {
    return app.inject({
      ...({
        url: '/',
        method: 'GET',
      } as InjectOptions),
      ...overrides,
    });
  }

  beforeAll(() => {
    app = src.buildApp();
  });

  beforeEach(() => {
    // process.env.NODE_CONFIG = undefined;
    // const testConfig = importFresh('config');
    // mockRequire('config', testConfig as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('With simple signing, succeeds when userId, password, and account all match', async () => {
    // Arrange
    mockRepo.getRepo.mockImplementation(
      () =>
        ({
          getAccountById: () =>
            Promise.resolve({
              accountId: '1001',
              isActive: true,
            }),
          getUserById: () =>
            Promise.resolve({
              userId: 'testUser',
              friendlyName: 'Test User',
              isActive: true,
            }),
          updateUser: () => jest.fn().mockResolvedValue(undefined),
        } as unknown as BaseRepo),
    );
    mockBcryptjs.compare.mockImplementation(() => Promise.resolve(true));
    mockJwt.sign.mockImplementation(() => 'signedToken');
    mockUtils.getJwtSigningData.mockImplementation(() =>
      Promise.resolve({
        signingKey: 'mockPrivateSecret',
        signingOptions: { expiresIn: '4h', issuer: 'testIssuer' },
      }),
    );

    // Act
    const resp = await makeRequest({
      url: '/v1/authenticate',
      method: 'POST',
      payload: {
        userId: 'testUser',
        accountId: '1001',
        password: 'testPassword',
      },
    });

    // Assert
    expect(resp.statusCode).toBe(200);
    const body = JSON.parse(resp.body);
    expect(body).toEqual({
      token: 'signedToken',
    });
    expect(mockJwt.sign).toHaveBeenCalledTimes(1);
    expect(mockJwt.sign.mock.calls[0]).toEqual([
      {
        accountId: '1001',
        friendlyName: 'Test User',
        userId: 'testUser',
      },
      'mockPrivateSecret',
      {
        expiresIn: '4h',
        issuer: 'testIssuer',
      },
    ]);
  });

  it('With RSA signing, succeeds when userId, password and account all match', async () => {
    // Arrange
    mockRepo.getRepo.mockImplementation(
      () =>
        ({
          getAccountById: () =>
            Promise.resolve({
              accountId: '1001',
              isActive: true,
            }),
          getUserById: () =>
            Promise.resolve({
              userId: 'testUser',
              friendlyName: 'Test User',
              isActive: true,
            }),
          updateUser: () => jest.fn().mockResolvedValue(undefined),
        } as unknown as BaseRepo),
    );
    mockBcryptjs.compare.mockImplementation(() => Promise.resolve(true));
    mockJwt.sign.mockImplementation(() => 'signedToken');
    mockUtils.getJwtSigningData.mockImplementation(() =>
      Promise.resolve({
        signingKey: { key: 'mockPrivateSecret', passphrase: 'test-secret' },
        signingOptions: {
          algorithm: 'RS256',
          expiresIn: '4h',
          issuer: 'testIssuer',
        },
      }),
    );

    // Act
    const resp = await makeRequest({
      url: '/v1/authenticate',
      method: 'POST',
      payload: {
        userId: 'testUser',
        accountId: '1001',
        password: 'testPassword',
      },
    });

    // Assert
    expect(resp.statusCode).toBe(200);
    const body = JSON.parse(resp.body);
    expect(body).toEqual({
      token: 'signedToken',
    });
    expect(mockJwt.sign).toHaveBeenCalledTimes(1);
    expect(mockJwt.sign.mock.calls[0]).toEqual([
      {
        accountId: '1001',
        friendlyName: 'Test User',
        userId: 'testUser',
      },
      {
        key: 'mockPrivateSecret',
        passphrase: 'test-secret',
      },
      {
        algorithm: 'RS256',
        expiresIn: '4h',
        issuer: 'testIssuer',
      },
    ]);
  });

  it('Fails when passwords do not match', async () => {
    // Arrange
    mockRepo.getRepo.mockImplementation(
      () =>
        ({
          getAccountById: () =>
            Promise.resolve({
              accountId: '1001',
              isActive: true,
            }),
          getUserById: () =>
            Promise.resolve({
              userId: 'testUser',
              friendlyName: 'Test User',
              isActive: true,
            }),
          updateUser: () => jest.fn().mockResolvedValue(undefined),
        } as unknown as BaseRepo),
    );
    mockBcryptjs.compare.mockImplementation(() => Promise.resolve(false));

    // Act
    const resp = await makeRequest({
      url: '/v1/authenticate',
      method: 'POST',
      payload: {
        userId: 'testUser',
        accountId: '1001',
        password: 'testPassword',
      },
    });

    // Assert
    expect(resp.statusCode).toBe(400);
    const body = JSON.parse(resp.body);
    expect(body).toEqual({
      message: 'Could not find account, user, or passwords did not match',
    });
  });

  it('Fails when user is inactive', async () => {
    // Arrange
    mockRepo.getRepo.mockImplementation(
      () =>
        ({
          getAccountById: () =>
            Promise.resolve({
              accountId: '1001',
              isActive: true,
            }),
          getUserById: () =>
            Promise.resolve({
              userId: 'testUser',
              friendlyName: 'Test User',
              isActive: false,
            }),
        } as unknown as BaseRepo),
    );

    // Act
    const resp = await makeRequest({
      url: '/v1/authenticate',
      method: 'POST',
      payload: {
        userId: 'testUser',
        accountId: '1001',
        password: 'testPassword',
      },
    });

    // Assert
    expect(resp.statusCode).toBe(400);
    const body = JSON.parse(resp.body);
    expect(body).toEqual({
      message: 'Could not find account, user, or passwords did not match',
    });
  });

  it('Fails when user is not found', async () => {
    // Arrange
    mockRepo.getRepo.mockImplementation(
      () =>
        ({
          getAccountById: () =>
            Promise.resolve({
              accountId: '1001',
              isActive: true,
            }),
          getUserById: () => Promise.resolve(undefined),
        } as unknown as BaseRepo),
    );

    // Act
    const resp = await makeRequest({
      url: '/v1/authenticate',
      method: 'POST',
      payload: {
        userId: 'testUser',
        accountId: '1001',
        password: 'testPassword',
      },
    });

    // Assert
    expect(resp.statusCode).toBe(400);
    const body = JSON.parse(resp.body);
    expect(body).toEqual({
      message: 'Could not find account, user, or passwords did not match',
    });
  });

  it('Fails when account is not active', async () => {
    // Arrange
    mockRepo.getRepo.mockImplementation(
      () =>
        ({
          getAccountById: () =>
            Promise.resolve({
              accountId: '1001',
              isActive: false,
            }),
          getUserById: () =>
            Promise.resolve({
              userId: 'testUser',
              friendlyName: 'Test User',
              isActive: true,
            }),
        } as unknown as BaseRepo),
    );

    // Act
    const resp = await makeRequest({
      url: '/v1/authenticate',
      method: 'POST',
      payload: {
        userId: 'testUser',
        accountId: '1001',
        password: 'testPassword',
      },
    });

    // Assert
    expect(resp.statusCode).toBe(400);
    const body = JSON.parse(resp.body);
    expect(body).toEqual({
      message: 'Could not find account, user, or passwords did not match',
    });
  });

  it('Fails when account is not found', async () => {
    // Arrange
    mockRepo.getRepo.mockImplementation(
      () =>
        ({
          getAccountById: () => Promise.resolve(undefined),
          getUserById: () =>
            Promise.resolve({
              userId: 'testUser',
              friendlyName: 'Test User',
              isActive: true,
            }),
        } as unknown as BaseRepo),
    );

    // Act
    const resp = await makeRequest({
      url: '/v1/authenticate',
      method: 'POST',
      payload: {
        userId: 'testUser',
        accountId: '1001',
        password: 'testPassword',
      },
    });

    // Assert
    expect(resp.statusCode).toBe(400);
    const body = JSON.parse(resp.body);
    expect(body).toEqual({
      message: 'Could not find account, user, or passwords did not match',
    });
  });
});
