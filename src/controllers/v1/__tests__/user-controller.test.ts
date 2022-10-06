import { FastifyInstance, InjectOptions } from 'fastify';
import * as jwt from 'jsonwebtoken';
import * as src from '../../..';
import * as utils from '../../../utils';
import * as repo from '../../../repo';
import * as bcryptjs from 'bcryptjs';
import { BaseRepo } from '../../../repo';

jest.mock('../../../utils', () => ({
  ...jest.requireActual('../../../utils'),
  delay: jest.fn().mockResolvedValue(undefined),
  getPublicSignature: jest.fn(),
}));
const mockUtils = jest.mocked(utils);

jest.mock('../../../repo', () => ({
  ...jest.requireActual('../../../repo'),
  getRepo: jest.fn(),
}));
const mockedRepo = jest.mocked(repo);

jest.mock('jsonwebtoken');
const mockJwt = jest.mocked(jwt);

jest.mock('bcryptjs');
const mockBcryptjs = jest.mocked(bcryptjs);

describe('userController test', () => {
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

  describe('updateUser', () => {
    it('Successfully updates user details', async () => {
      // Arrange
      const fakeRepo = {
        getUserById: jest.fn().mockImplementation(() =>
          Promise.resolve({
            userId: 'testUser',
            name: 'Test User',
            isActive: true,
            password: 'oldPassword',
          }),
        ),
        updateUser: jest.fn().mockImplementation(() => Promise.resolve()),
      } as Partial<BaseRepo> as BaseRepo;
      mockedRepo.getRepo.mockReset();
      mockedRepo.getRepo.mockImplementation(() => fakeRepo);
      mockBcryptjs.compare.mockReset();
      mockBcryptjs.compare.mockImplementation(() => Promise.resolve(true));
      mockBcryptjs.hash.mockReset();
      mockBcryptjs.hash.mockImplementation(() => 'hashedPassword');
      mockUtils.getPublicSignature.mockReset();
      mockUtils.getPublicSignature.mockImplementation(() =>
        Promise.resolve('publicSignature'),
      );
      mockJwt.verify.mockReset();
      mockJwt.verify.mockImplementation(() => ({
        payload: {
          iss: 'testIssuer',
        },
      }));

      // Act
      const response = await makeRequest({
        url: '/v1/updateUser',
        method: 'POST',
        headers: {
          token: 'testToken',
        },
        payload: {
          email: 'new@email.io',
          oldPassword: 'oldPassword',
          newPassword: 'newPassword',
          friendlyName: 'Test Guy',
        },
      });

      // Assert
      expect(response.statusCode).toBe(200);
      // expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toBe('');

      expect(mockJwt.verify).toHaveBeenCalledTimes(1);
      expect(mockJwt.verify).toHaveBeenCalledWith(
        'testToken',
        'publicSignature',
        {
          complete: true,
        },
      );

      expect(mockBcryptjs.compare).toHaveBeenCalledTimes(1);
      expect(mockBcryptjs.compare).toHaveBeenCalledWith(
        'oldPassword',
        'oldPassword',
      );

      expect(fakeRepo.updateUser).toHaveBeenCalledTimes(1);
      expect(fakeRepo.updateUser).toHaveBeenCalledWith({
        email: 'new@email.io',
        password: 'hashedPassword',
        friendlyName: 'Test Guy',
        isActive: true,
        name: 'Test User',
        userId: 'testUser',
        lastActivity: expect.any(String),
      });
    });

    it('Fails when updating password and old password does not match', async () => {
      // Arrange
      const fakeRepo = {
        getUserById: jest.fn().mockImplementation(() =>
          Promise.resolve({
            userId: 'testUser',
            name: 'Test User',
            isActive: true,
            password: 'password',
          }),
        ),
      } as Partial<BaseRepo> as BaseRepo;
      mockedRepo.getRepo.mockReset();
      mockedRepo.getRepo.mockImplementation(() => fakeRepo);
      mockBcryptjs.compare.mockReset();
      mockBcryptjs.compare.mockImplementation(() => Promise.resolve(false));
      mockBcryptjs.hash.mockReset();
      mockUtils.getPublicSignature.mockReset();
      mockUtils.getPublicSignature.mockImplementation(() =>
        Promise.resolve('publicSignature'),
      );
      mockJwt.verify.mockReset();
      mockJwt.verify.mockImplementation(() => ({
        payload: {
          iss: 'testIssuer',
        },
      }));

      // Act
      const response = await makeRequest({
        url: '/v1/updateUser',
        method: 'POST',
        headers: {
          token: 'testToken',
        },
        payload: {
          email: 'new@email.io',
          oldPassword: 'oldPassword',
          newPassword: 'newPassword',
          friendlyName: 'Test Guy',
        },
      });

      // Assert
      expect(response.statusCode).toBe(400);
      // expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Could not find account, user, or passwords did not match.',
      });

      expect(mockJwt.verify).toHaveBeenCalledTimes(1);
      expect(mockJwt.verify).toHaveBeenCalledWith(
        'testToken',
        'publicSignature',
        {
          complete: true,
        },
      );

      expect(mockBcryptjs.compare).toHaveBeenCalledTimes(1);
      expect(mockBcryptjs.compare).toHaveBeenCalledWith(
        'oldPassword',
        'password',
      );
    });

    it('Fails when no fields provided to update', async () => {
      // Arrange
      const fakeRepo = {
        getUserById: jest.fn().mockImplementation(() =>
          Promise.resolve({
            userId: 'testUser',
            name: 'Test User',
            isActive: true,
            password: 'oldPassword',
          }),
        ),
      } as Partial<BaseRepo> as BaseRepo;
      mockedRepo.getRepo.mockReset();
      mockedRepo.getRepo.mockImplementation(() => fakeRepo);
      mockBcryptjs.compare.mockReset();
      mockBcryptjs.hash.mockReset();
      mockUtils.getPublicSignature.mockReset();
      mockUtils.getPublicSignature.mockImplementation(() =>
        Promise.resolve('publicSignature'),
      );
      mockJwt.verify.mockReset();
      mockJwt.verify.mockImplementation(() => ({
        payload: {
          iss: 'testIssuer',
        },
      }));

      // Act
      const response = await makeRequest({
        url: '/v1/updateUser',
        method: 'POST',
        headers: {
          token: 'testToken',
        },
        payload: {},
      });

      // Assert
      expect(response.statusCode).toBe(400);
      // expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Could not find account, user, or passwords did not match.',
      });

      expect(mockJwt.verify).toHaveBeenCalledTimes(1);
      expect(mockJwt.verify).toHaveBeenCalledWith(
        'testToken',
        'publicSignature',
        {
          complete: true,
        },
      );

      expect(mockBcryptjs.compare).toHaveBeenCalledTimes(0);
    });

    it('Fails when user is not active', async () => {
      // Arrange
      const fakeRepo = {
        getUserById: jest.fn().mockImplementation(() =>
          Promise.resolve({
            userId: 'testUser',
            name: 'Test User',
            isActive: false,
            password: 'oldPassword',
          }),
        ),
      } as Partial<BaseRepo> as BaseRepo;
      mockedRepo.getRepo.mockReset();
      mockedRepo.getRepo.mockImplementation(() => fakeRepo);
      mockBcryptjs.compare.mockReset();
      mockBcryptjs.hash.mockReset();
      mockUtils.getPublicSignature.mockReset();
      mockUtils.getPublicSignature.mockImplementation(() =>
        Promise.resolve('publicSignature'),
      );
      mockJwt.verify.mockReset();
      mockJwt.verify.mockImplementation(() => ({
        payload: {
          iss: 'testIssuer',
        },
      }));

      // Act
      const response = await makeRequest({
        url: '/v1/updateUser',
        method: 'POST',
        headers: {
          token: 'testToken',
        },
        payload: {},
      });

      // Assert
      expect(response.statusCode).toBe(400);
      // expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Could not find account, user, or passwords did not match.',
      });

      expect(mockJwt.verify).toHaveBeenCalledTimes(1);
      expect(mockJwt.verify).toHaveBeenCalledWith(
        'testToken',
        'publicSignature',
        {
          complete: true,
        },
      );

      expect(mockBcryptjs.compare).toHaveBeenCalledTimes(0);
    });

    it('Fails when user is not found', async () => {
      // Arrange
      const fakeRepo = {
        getUserById: jest
          .fn()
          .mockImplementation(() => Promise.resolve(undefined)),
      } as Partial<BaseRepo> as BaseRepo;
      mockedRepo.getRepo.mockReset();
      mockedRepo.getRepo.mockImplementation(() => fakeRepo);
      mockBcryptjs.compare.mockReset();
      mockBcryptjs.hash.mockReset();
      mockUtils.getPublicSignature.mockReset();
      mockUtils.getPublicSignature.mockImplementation(() =>
        Promise.resolve('publicSignature'),
      );
      mockJwt.verify.mockReset();
      mockJwt.verify.mockImplementation(() => ({
        payload: {
          iss: 'testIssuer',
        },
      }));

      // Act
      const response = await makeRequest({
        url: '/v1/updateUser',
        method: 'POST',
        headers: {
          token: 'testToken',
        },
        payload: {},
      });

      // Assert
      expect(response.statusCode).toBe(400);
      // expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Could not find account, user, or passwords did not match.',
      });

      expect(mockJwt.verify).toHaveBeenCalledTimes(1);
      expect(mockJwt.verify).toHaveBeenCalledWith(
        'testToken',
        'publicSignature',
        {
          complete: true,
        },
      );

      expect(mockBcryptjs.compare).toHaveBeenCalledTimes(0);
    });

    it('Fails when no token provided', async () => {
      // Arrange
      mockedRepo.getRepo.mockReset();
      mockBcryptjs.compare.mockReset();
      mockBcryptjs.hash.mockReset();
      mockUtils.getPublicSignature.mockReset();
      mockJwt.verify.mockReset();
      mockJwt.verify.mockImplementation(() => ({
        payload: {
          iss: 'testIssuer',
        },
      }));

      // Act
      const response = await makeRequest({
        url: '/v1/updateUser',
        method: 'POST',
        headers: {},
        payload: {},
      });

      // Assert
      expect(response.statusCode).toBe(403);
      // expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toBe(
        'Please include authentication token in header "token"',
      );

      expect(mockJwt.verify).toHaveBeenCalledTimes(0);
      expect(mockBcryptjs.compare).toHaveBeenCalledTimes(0);
    });

    it('Fails when token from another issuer', async () => {
      // Arrange
      mockedRepo.getRepo.mockReset();
      mockBcryptjs.compare.mockReset();
      mockBcryptjs.hash.mockReset();
      mockUtils.getPublicSignature.mockReset();
      mockUtils.getPublicSignature.mockImplementation(() =>
        Promise.resolve('publicSignature'),
      );
      mockJwt.verify.mockReset();
      mockJwt.verify.mockImplementation(() => ({
        payload: {
          iss: 'otherIssuer',
        },
      }));

      // Act
      const response = await makeRequest({
        url: '/v1/updateUser',
        method: 'POST',
        headers: {
          token: 'testToken',
        },
        payload: {},
      });

      // Assert
      expect(response.statusCode).toBe(403);
      // expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toBe('');

      expect(mockJwt.verify).toHaveBeenCalledTimes(1);
      expect(mockJwt.verify).toHaveBeenCalledWith(
        'testToken',
        'publicSignature',
        {
          complete: true,
        },
      );

      expect(mockBcryptjs.compare).toHaveBeenCalledTimes(0);
    });

    it('Fails when token fails validation', async () => {
      // Arrange
      mockedRepo.getRepo.mockReset();
      mockBcryptjs.compare.mockReset();
      mockBcryptjs.hash.mockReset();
      mockUtils.getPublicSignature.mockReset();
      mockUtils.getPublicSignature.mockImplementation(() =>
        Promise.resolve('publicSignature'),
      );
      mockJwt.verify.mockReset();
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Test Verification Error');
      });

      // Act
      const response = await makeRequest({
        url: '/v1/updateUser',
        method: 'POST',
        headers: {
          token: 'testToken',
        },
        payload: {},
      });

      // Assert
      expect(response.statusCode).toBe(403);
      // expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toBe('');

      expect(mockJwt.verify).toHaveBeenCalledTimes(1);
      expect(mockJwt.verify).toHaveBeenCalledWith(
        'testToken',
        'publicSignature',
        {
          complete: true,
        },
      );

      expect(mockBcryptjs.compare).toHaveBeenCalledTimes(0);
    });
  });
});
