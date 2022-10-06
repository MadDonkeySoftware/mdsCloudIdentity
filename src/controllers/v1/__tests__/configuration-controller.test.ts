import { FastifyInstance, InjectOptions } from 'fastify';
import * as jwt from 'jsonwebtoken';
import * as src from '../../..';
import * as utils from '../../../utils';
import * as repo from '../../../repo';
import { BaseRepo } from '../../../repo';
import { ConfigurationData } from '../../../types';

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

jest.mock('../../../repo', () => ({
  ...jest.requireActual('../../../repo'),
  getRepo: jest.fn(),
}));
const mockedRepo = jest.mocked(repo);

jest.mock('jsonwebtoken');
const mockJwt = jest.mocked(jwt);

describe('configurationController test', () => {
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

  describe('publicSignature', () => {
    it('Returns the public signature when available', async () => {
      // Arrange
      mockUtils.getPublicSignature.mockReset();
      mockUtils.getPublicSignature.mockImplementation(() =>
        Promise.resolve('testPublicSignature'),
      );

      // Act
      const response = await makeRequest({
        url: '/v1/publicSignature',
      });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        signature: 'testPublicSignature',
      });
    });

    it('Returns an empty response when no public signature available', async () => {
      // Arrange
      mockUtils.getPublicSignature.mockReset();
      mockUtils.getPublicSignature.mockImplementation(() =>
        Promise.reject(new Error('test')),
      );

      // Act
      const response = await makeRequest({
        url: '/v1/publicSignature',
      });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      const body = JSON.parse(response.body);
      expect(body).toEqual({});
    });
  });

  describe('getConfiguration', () => {
    it('Loads the configuration from the data store and returns it', async () => {
      // Arrange
      mockedRepo.getRepo.mockReset();
      mockedRepo.getRepo.mockImplementation(
        () =>
          ({
            getConfiguration: jest.fn().mockImplementation(() =>
              Promise.resolve({
                internal: {
                  allowSelfSignCert: true,
                  identityUrl: 'internal',
                  fsUrl: 'internal',
                  nsUrl: 'internal',
                  qsUrl: 'internal',
                  sfUrl: 'internal',
                  smUrl: 'internal',
                },
                external: {
                  allowSelfSignCert: true,
                  identityUrl: 'external',
                  fsUrl: 'external',
                  nsUrl: 'external',
                  qsUrl: 'external',
                  sfUrl: 'external',
                  smUrl: 'external',
                },
              } as ConfigurationData),
            ),
          } as Partial<BaseRepo>),
      );

      // Act
      const response = await makeRequest({
        url: '/v1/configuration',
      });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        allowSelfSignCert: true,
        identityUrl: 'internal',
        fsUrl: 'internal',
        nsUrl: 'internal',
        qsUrl: 'internal',
        sfUrl: 'internal',
        smUrl: 'internal',
      });
    });
  });

  describe('updateConfiguration', () => {
    it('Saves configuration that originates from internal network with valid token', async () => {
      // Arrange
      mockedRepo.getRepo.mockReset();
      mockedRepo.getRepo.mockImplementation(
        () =>
          ({
            getConfiguration: jest.fn().mockImplementation(() =>
              Promise.resolve({
                internal: {
                  allowSelfSignCert: true,
                  identityUrl: 'internal',
                  fsUrl: 'internal',
                  nsUrl: 'internal',
                  qsUrl: 'internal',
                  sfUrl: 'internal',
                  smUrl: 'internal',
                },
                external: {
                  allowSelfSignCert: true,
                  identityUrl: 'external',
                  fsUrl: 'external',
                  nsUrl: 'external',
                  qsUrl: 'external',
                  sfUrl: 'external',
                  smUrl: 'external',
                },
              } as ConfigurationData),
            ),
            getAccountById: jest.fn().mockImplementation(() =>
              Promise.resolve({
                ownerId: 'testUser',
                isActive: true,
              }),
            ),
            updateConfiguration: jest
              .fn()
              .mockImplementation(() => Promise.resolve()),
          } as Partial<BaseRepo> as BaseRepo),
      );
      mockUtils.getPublicSignature.mockReset();
      mockUtils.getPublicSignature.mockImplementation(() =>
        Promise.resolve('testPublicSignature'),
      );
      mockJwt.verify.mockReset();
      mockJwt.verify.mockImplementation(() => ({
        payload: {
          accountId: '1',
          iss: 'testIssuer',
        },
      }));

      // Act
      const response = await makeRequest({
        url: '/v1/configuration',
        method: 'POST',
        headers: {
          token: 'testToken',
        },
        payload: {
          internal: {
            identityUrl: 'internalIdentity',
            nsUrl: 'internalNs',
            qsUrl: 'internalQs',
            fsUrl: 'internalFs',
            sfUrl: 'internalSf',
            smUrl: 'internalSm',
            allowSelfSignCert: true,
          },
          external: {
            identityUrl: 'externalIdentity',
            nsUrl: 'externalNs',
            qsUrl: 'externalQs',
            fsUrl: 'externalFs',
            sfUrl: 'externalSf',
            smUrl: 'externalSm',
            allowSelfSignCert: true,
          },
        },
      });

      // Assert
      expect(response.statusCode).toBe(200);
      // expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toBe('');
      expect(mockJwt.verify).toHaveBeenCalledTimes(1);
      expect(mockJwt.verify.mock.calls[0]).toEqual([
        'testToken',
        'testPublicSignature',
        { complete: true },
      ]);
    });

    it('Rejects configuration that originates from internal network with invalid token', async () => {
      // Arrange
      mockedRepo.getRepo.mockReset();
      mockedRepo.getRepo.mockImplementation(
        () =>
          ({
            getConfiguration: jest.fn().mockImplementation(() =>
              Promise.resolve({
                internal: {
                  allowSelfSignCert: true,
                  identityUrl: 'internal',
                  fsUrl: 'internal',
                  nsUrl: 'internal',
                  qsUrl: 'internal',
                  sfUrl: 'internal',
                  smUrl: 'internal',
                },
                external: {
                  allowSelfSignCert: true,
                  identityUrl: 'external',
                  fsUrl: 'external',
                  nsUrl: 'external',
                  qsUrl: 'external',
                  sfUrl: 'external',
                  smUrl: 'external',
                },
              } as ConfigurationData),
            ),
            getAccountById: jest.fn().mockImplementation(() =>
              Promise.resolve({
                ownerId: 'testUser',
                isActive: true,
              }),
            ),
            updateConfiguration: jest
              .fn()
              .mockImplementation(() => Promise.resolve()),
          } as Partial<BaseRepo> as BaseRepo),
      );
      mockUtils.getPublicSignature.mockReset();
      mockUtils.getPublicSignature.mockImplementation(() =>
        Promise.resolve('testPublicSignature'),
      );
      mockJwt.verify.mockReset();
      mockJwt.verify.mockImplementation(() => ({
        payload: {
          accountId: '1001',
          iss: 'testIssuer',
        },
      }));

      // Act
      const response = await makeRequest({
        url: '/v1/configuration',
        method: 'POST',
        headers: {
          token: 'testToken',
        },
        payload: {
          internal: {
            identityUrl: 'internalIdentity',
            nsUrl: 'internalNs',
            qsUrl: 'internalQs',
            fsUrl: 'internalFs',
            sfUrl: 'internalSf',
            smUrl: 'internalSm',
            allowSelfSignCert: true,
          },
          external: {
            identityUrl: 'externalIdentity',
            nsUrl: 'externalNs',
            qsUrl: 'externalQs',
            fsUrl: 'externalFs',
            sfUrl: 'externalSf',
            smUrl: 'externalSm',
            allowSelfSignCert: true,
          },
        },
      });

      // Assert
      expect(response.statusCode).toBe(404);
      // expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toBe('');
      expect(mockJwt.verify).toHaveBeenCalledTimes(1);
      expect(mockJwt.verify.mock.calls[0]).toEqual([
        'testToken',
        'testPublicSignature',
        { complete: true },
      ]);
    });
  });
});
