import { FastifyInstance, InjectOptions } from 'fastify';
import * as jwt from 'jsonwebtoken';
import * as src from '../../..';
import * as repo from '../../../repo';
import * as utils from '../../../utils';
import { BaseRepo } from '../../../repo';

jest.mock('../../../repo');
const mockRepo = jest.mocked(repo);

jest.mock('jsonwebtoken');
const mockJwt = jest.mocked(jwt);

jest.mock('../../../utils', () => ({
  ...jest.requireActual('../../../utils'),
  delay: jest.fn().mockResolvedValue(undefined),
  getPublicSignature: jest.fn(),
  getJwtSigningData: jest.fn().mockResolvedValue({
    signingKey: 'mockPrivateSecret',
    signingOptions: { expiresIn: '4h', issuer: 'testIssuer' },
  }),
}));
const mockUtils = jest.mocked(utils);

describe('impersonationController test', () => {
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

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('Succeeds when system account requesting valid account user', async () => {
    // Arrange
    mockRepo.getRepo.mockImplementation(
      () =>
        ({
          getAccountById: () =>
            Promise.resolve({
              accountId: '1001',
              ownerId: 'testUser',
              isActive: true,
            }),
          getUserById: () =>
            Promise.resolve({
              userId: 'testUser',
              friendlyName: 'Test User',
              isActive: true,
            }),
        } as unknown as BaseRepo),
    );
    mockJwt.verify.mockImplementation(() => ({
      payload: {
        accountId: '1',
        iss: 'testIssuer',
      },
    }));
    mockJwt.sign.mockImplementation(() => 'impersonationToken');
    mockUtils.getPublicSignature.mockImplementation(() =>
      Promise.resolve('testPublicSignature'),
    );
    mockUtils.getJwtSigningData.mockImplementation(() =>
      Promise.resolve({
        signingKey: 'mockPrivateSecret',
        signingOptions: { expiresIn: '4h', issuer: 'testIssuer' },
      }),
    );
    mockJwt.sign.mockClear();

    // Act
    const resp = await makeRequest({
      url: '/v1/impersonate',
      method: 'POST',
      headers: {
        token: 'testToken',
      },
      payload: {
        userId: 'testUser',
        accountId: '1001',
      },
    });

    // Assert
    expect(resp.statusCode).toBe(200);
    const body = JSON.parse(resp.body);
    expect(body).toEqual({
      token: 'impersonationToken',
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

  it('Fails when non-system account requesting valid account and user', async () => {
    // Arrange
    mockRepo.getRepo.mockImplementation(
      () =>
        ({
          getAccountById: () =>
            Promise.resolve({
              accountId: '1001',
              ownerId: 'testUser',
              isActive: true,
            }),
          getUserById: () =>
            Promise.resolve({
              userId: 'testUser',
              friendlyName: 'Test User',
              isActive: true,
            }),
        } as unknown as BaseRepo),
    );
    mockJwt.verify.mockImplementation(() => ({
      payload: {
        accountId: '2',
        iss: 'testIssuer',
      },
    }));
    mockUtils.getPublicSignature.mockImplementation(() =>
      Promise.resolve('testPublicSignature'),
    );
    mockJwt.sign.mockClear();

    // Act
    const resp = await makeRequest({
      url: '/v1/impersonate',
      method: 'POST',
      headers: {
        token: 'testToken',
      },
      payload: {
        userId: 'testUser',
        accountId: '1001',
      },
    });

    // Assert
    expect(resp.statusCode).toBe(400);
    const body = JSON.parse(resp.body);
    expect(body).toEqual({
      message:
        'Could not find account, user or insufficient privilege to impersonate',
    });
    expect(mockJwt.sign).toHaveBeenCalledTimes(0);
  });

  it('Fails when system account requesting inactive account', async () => {
    // Arrange
    mockRepo.getRepo.mockImplementation(
      () =>
        ({
          getAccountById: () =>
            Promise.resolve({
              accountId: '1001',
              ownerId: 'testUser',
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
    mockJwt.verify.mockImplementation(() => ({
      payload: {
        accountId: '1',
        iss: 'testIssuer',
      },
    }));
    mockUtils.getPublicSignature.mockImplementation(() =>
      Promise.resolve('testPublicSignature'),
    );
    mockJwt.sign.mockClear();

    // Act
    const resp = await makeRequest({
      url: '/v1/impersonate',
      method: 'POST',
      headers: {
        token: 'testToken',
      },
      payload: {
        userId: 'testUser',
        accountId: '1001',
      },
    });

    // Assert
    expect(resp.statusCode).toBe(400);
    const body = JSON.parse(resp.body);
    expect(body).toEqual({
      message:
        'Could not find account, user or insufficient privilege to impersonate',
    });
    expect(mockJwt.sign).toHaveBeenCalledTimes(0);
  });

  it('Fails when system account requesting account that does not exist', async () => {
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
    mockJwt.verify.mockImplementation(() => ({
      payload: {
        accountId: '1',
        iss: 'testIssuer',
      },
    }));
    mockUtils.getPublicSignature.mockImplementation(() =>
      Promise.resolve('testPublicSignature'),
    );
    mockJwt.sign.mockClear();

    // Act
    const resp = await makeRequest({
      url: '/v1/impersonate',
      method: 'POST',
      headers: {
        token: 'testToken',
      },
      payload: {
        userId: 'testUser',
        accountId: '1001',
      },
    });

    // Assert
    expect(resp.statusCode).toBe(400);
    const body = JSON.parse(resp.body);
    expect(body).toEqual({
      message:
        'Could not find account, user or insufficient privilege to impersonate',
    });
    expect(mockJwt.sign).toHaveBeenCalledTimes(0);
  });

  it('Fails when system account requesting inactive user', async () => {
    // Arrange
    mockRepo.getRepo.mockImplementation(
      () =>
        ({
          getAccountById: () =>
            Promise.resolve({
              accountId: '1001',
              ownerId: 'testUser',
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
    mockJwt.verify.mockImplementation(() => ({
      payload: {
        accountId: '1',
        iss: 'testIssuer',
      },
    }));
    mockUtils.getPublicSignature.mockImplementation(() =>
      Promise.resolve('testPublicSignature'),
    );
    mockJwt.sign.mockClear();

    // Act
    const resp = await makeRequest({
      url: '/v1/impersonate',
      method: 'POST',
      headers: {
        token: 'testToken',
      },
      payload: {
        userId: 'testUser',
        accountId: '1001',
      },
    });

    // Assert
    expect(resp.statusCode).toBe(400);
    const body = JSON.parse(resp.body);
    expect(body).toEqual({
      message:
        'Could not find account, user or insufficient privilege to impersonate',
    });
    expect(mockJwt.sign).toHaveBeenCalledTimes(0);
  });

  it('Fails when system account requesting user that does not exist', async () => {
    // Arrange
    mockRepo.getRepo.mockImplementation(
      () =>
        ({
          getAccountById: () =>
            Promise.resolve({
              accountId: '1001',
              ownerId: 'testUser',
              isActive: true,
            }),
          getUserById: () => Promise.resolve(undefined),
        } as unknown as BaseRepo),
    );
    mockJwt.verify.mockImplementation(() => ({
      payload: {
        accountId: '1',
        iss: 'testIssuer',
      },
    }));
    mockUtils.getPublicSignature.mockImplementation(() =>
      Promise.resolve('testPublicSignature'),
    );
    mockJwt.sign.mockClear();

    // Act
    const resp = await makeRequest({
      url: '/v1/impersonate',
      method: 'POST',
      headers: {
        token: 'testToken',
      },
      payload: {
        userId: 'testUser',
        accountId: '1001',
      },
    });

    // Assert
    expect(resp.statusCode).toBe(400);
    const body = JSON.parse(resp.body);
    expect(body).toEqual({
      message:
        'Could not find account, user or insufficient privilege to impersonate',
    });
    expect(mockJwt.sign).toHaveBeenCalledTimes(0);
  });
});
