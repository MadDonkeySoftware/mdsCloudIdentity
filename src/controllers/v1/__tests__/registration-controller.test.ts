import config from 'config';
import { FastifyInstance, InjectOptions } from 'fastify';
import * as bcryptjs from 'bcryptjs';
import * as src from '../../..';
import * as repo from '../../../repo';
import * as utils from '../../../utils';
import { BaseRepo } from '../../../repo';

jest.mock('config');
const mockConfig = jest.mocked(config);

jest.mock('../../../repo');
const mockRepo = jest.mocked(repo);

jest.mock('bcryptjs');
const mockBcryptjs = jest.mocked(bcryptjs);

jest.mock('../../../utils');
const mockUtils = jest.mocked(utils);

describe('registrationController test', () => {
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
    mockUtils.delay.mockReset();
    mockUtils.delay.mockResolvedValue(undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Succeeds when userId not already in system and all details present', () => {
    it('bypassing user activation', async () => {
      // Arrange
      const mockCreateAccount = jest.fn();
      const mockCreateUser = jest.fn();
      mockRepo.getRepo.mockImplementation(
        () =>
          ({
            getNextCounterValue: () => Promise.resolve(1001),
            getAccountByOwnerId: () => Promise.resolve(undefined),
            getUserById: () => Promise.resolve(undefined),
            createAccount: mockCreateAccount,
            createUser: mockCreateUser,
          } as unknown as BaseRepo),
      );
      const originalConfig = jest.requireActual('config');
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'bypassUserActivation') return true;
        return originalConfig.get(key);
      });
      mockBcryptjs.hash.mockImplementation(() => 'hashedPassword');

      // Act
      const resp = await makeRequest({
        method: 'POST',
        url: '/v1/register',
        payload: {
          email: 'test@test.com',
          userId: 'testUser',
          accountName: 'Test Account',
          friendlyName: 'Test User',
          password: 'testPassword',
        },
      });

      // Assert
      expect(resp.statusCode).toBe(200);
      expect(resp.headers['content-type']).toMatch(/application\/json/);
      const body = JSON.parse(resp.body);
      expect(body).toEqual({
        accountId: '1001',
        status: 'Success',
      });
      expect(mockCreateAccount).toHaveBeenCalledTimes(1);
      expect(mockCreateAccount.mock.calls[0]).toEqual([
        {
          accountId: '1001',
          name: 'Test Account',
          ownerId: 'testUser',
        },
      ]);
      expect(mockCreateUser).toHaveBeenCalledTimes(1);
      expect(mockCreateUser.mock.calls[0]).toEqual([
        {
          accountId: '1001',
          activationCode: null,
          email: 'test@test.com',
          friendlyName: 'Test User',
          isActive: true,
          password: 'hashedPassword',
          userId: 'testUser',
        },
      ]);
    });

    it('Using user activation', async () => {
      // Arrange
      // Arrange
      const mockCreateAccount = jest.fn();
      const mockCreateUser = jest.fn();
      mockRepo.getRepo.mockImplementation(
        () =>
          ({
            getNextCounterValue: () => Promise.resolve(1001),
            getAccountByOwnerId: () => Promise.resolve(undefined),
            getUserById: () => Promise.resolve(undefined),
            createAccount: mockCreateAccount,
            createUser: mockCreateUser,
          } as unknown as BaseRepo),
      );
      const originalConfig = jest.requireActual('config');
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'bypassUserActivation') return false;
        return originalConfig.get(key);
      });
      mockBcryptjs.hash.mockImplementation(() => 'hashedPassword');
      mockUtils.generateRandomString.mockImplementation(() => 'activationCode');
      const mockSendMail = jest.fn();
      mockUtils.getMailer.mockImplementation(
        () =>
          ({
            sendMail: mockSendMail,
          } as any),
      );

      // Act
      const resp = await makeRequest({
        method: 'POST',
        url: '/v1/register',
        payload: {
          email: 'test@test.com',
          userId: 'testUser',
          accountName: 'Test Account',
          friendlyName: 'Test User',
          password: 'testPassword',
        },
      });

      // Assert
      expect(resp.statusCode).toBe(200);
      expect(resp.headers['content-type']).toMatch(/application\/json/);
      const body = JSON.parse(resp.body);
      expect(body).toEqual({
        accountId: '1001',
        status: 'Success',
      });
      expect(mockCreateAccount).toHaveBeenCalledTimes(1);
      expect(mockCreateAccount.mock.calls[0]).toEqual([
        {
          accountId: '1001',
          name: 'Test Account',
          ownerId: 'testUser',
        },
      ]);
      expect(mockCreateUser).toHaveBeenCalledTimes(1);
      expect(mockCreateUser.mock.calls[0]).toEqual([
        {
          accountId: '1001',
          activationCode: 'activationCode',
          email: 'test@test.com',
          friendlyName: 'Test User',
          password: 'hashedPassword',
          userId: 'testUser',
        },
      ]);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail.mock.calls[0]).toEqual([
        {
          from: '"testIssuer Registration" <test-smtp-user>',
          to: 'test@test.com',
          subject: 'Registration Activation Code',
          text: 'Your activation code: activationCode',
        },
      ]);
    });
  });

  it('Fails when userId already in system as account', async () => {
    // Arrange
    const mockCreateAccount = jest.fn();
    const mockCreateUser = jest.fn();
    mockRepo.getRepo.mockImplementation(
      () =>
        ({
          getAccountByOwnerId: () => Promise.resolve({}),
          getUserById: () => Promise.resolve(undefined),
          createAccount: mockCreateAccount,
          createUser: mockCreateUser,
        } as unknown as BaseRepo),
    );

    // Act
    const resp = await makeRequest({
      method: 'POST',
      url: '/v1/register',
      payload: {
        email: 'test@test.com',
        userId: 'testUser',
        accountName: 'Test Account',
        friendlyName: 'Test User',
        password: 'testPassword',
      },
    });

    // Assert
    expect(resp.statusCode).toBe(400);
    expect(resp.headers['content-type']).toMatch(/application\/json/);
    const body = JSON.parse(resp.body);
    expect(body).toEqual({
      message: 'Invalid userId',
      status: 'Failed',
    });
    expect(mockCreateAccount).toHaveBeenCalledTimes(0);
    expect(mockCreateUser).toHaveBeenCalledTimes(0);
  });

  it('Fails when userId already in system as user', async () => {
    // Arrange
    const mockCreateAccount = jest.fn();
    const mockCreateUser = jest.fn();
    mockRepo.getRepo.mockImplementation(
      () =>
        ({
          getAccountByOwnerId: () => Promise.resolve(undefined),
          getUserById: () => Promise.resolve({}),
          createAccount: mockCreateAccount,
          createUser: mockCreateUser,
        } as unknown as BaseRepo),
    );

    // Act
    const resp = await makeRequest({
      method: 'POST',
      url: '/v1/register',
      payload: {
        email: 'test@test.com',
        userId: 'testUser',
        accountName: 'Test Account',
        friendlyName: 'Test User',
        password: 'testPassword',
      },
    });

    // Assert
    expect(resp.statusCode).toBe(400);
    expect(resp.headers['content-type']).toMatch(/application\/json/);
    const body = JSON.parse(resp.body);
    expect(body).toEqual({
      message: 'Invalid userId',
      status: 'Failed',
    });
    expect(mockCreateAccount).toHaveBeenCalledTimes(0);
    expect(mockCreateUser).toHaveBeenCalledTimes(0);
  });

  it('Fails when body fails verification', async () => {
    // Act
    const resp = await makeRequest({
      method: 'POST',
      url: '/v1/register',
      payload: {},
    });

    // Assert
    expect(resp.statusCode).toBe(400);
    expect(resp.headers['content-type']).toMatch(/application\/json/);
    const body = JSON.parse(resp.body);
    expect(body).toEqual({
      code: 'FST_ERR_VALIDATION',
      error: 'Bad Request',
      message: "body must have required property 'accountName'",
      statusCode: 400,
    });
  });
});
