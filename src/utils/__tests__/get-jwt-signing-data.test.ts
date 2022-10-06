import config from 'config';
import { getPrivateSecret } from '../get-private-secret';
import { getJwtSigningData } from '../get-jwt-signing-data';

jest.mock('config');
const mockConfig = jest.mocked(config);

jest.mock('../get-private-secret');
const mockGetPrivateSecret = jest.mocked(getPrivateSecret);

describe('getJwtSigningData test', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('with simple signing, returns proper key and options', async () => {
    // Arrange
    mockGetPrivateSecret.mockResolvedValue('mockPrivateSecret');
    const originalConfig = jest.requireActual('config');
    mockConfig.has.mockImplementation((key: string) => {
      if (key === 'secrets.privatePassword') return false;
      return originalConfig.has(key);
    });
    mockConfig.get.mockImplementation((key: string) => {
      if (key === 'secrets.privatePassword') return undefined;
      return originalConfig.get(key);
    });

    // Act
    const result = await getJwtSigningData();

    // Assert
    expect(result).toEqual({
      signingKey: 'mockPrivateSecret',
      signingOptions: { expiresIn: '4h', issuer: 'testIssuer' },
    });
  });

  it('with RSA signing, returns proper key and options', async () => {
    // Arrange
    mockGetPrivateSecret.mockResolvedValue('mockPrivateSecret');
    const originalConfig = jest.requireActual('config');
    mockConfig.has.mockImplementation((key: string) => {
      if (key === 'secrets.privatePassword') return true;
      return originalConfig.has(key);
    });
    mockConfig.get.mockImplementation((key: string) => {
      if (key === 'secrets.privatePassword') return 'test-secret';
      return originalConfig.get(key);
    });

    // Act
    const result = await getJwtSigningData();

    // Assert
    expect(result).toEqual({
      signingKey: { key: 'mockPrivateSecret', passphrase: 'test-secret' },
      signingOptions: {
        algorithm: 'RS256',
        expiresIn: '4h',
        issuer: 'testIssuer',
      },
    });
  });
});
