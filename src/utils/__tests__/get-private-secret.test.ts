import config from 'config';
import {
  getPrivateSecret,
  resetPrivateSecretCache,
} from '../get-private-secret';
import * as fileExistsModule from '../file-exists';
import * as fs from 'fs/promises';

jest.mock('fs/promises');
const fsMock = jest.mocked(fs);

jest.mock('config');
const configMock = jest.mocked(config);

jest.mock('../file-exists', () => ({
  fileExists: jest.fn(),
}));
const fileExistsMock = jest.mocked(fileExistsModule);

jest.mock('../../logging', () => ({
  getLogger: jest.fn().mockReturnValue({
    warn: jest.fn(),
  }),
}));

describe('getPrivateSecret test', () => {
  const originalConfigGet = jest.requireActual('config').get;
  const originalConfigHas = jest.requireActual('config').has;

  beforeEach(() => {
    jest.clearAllMocks();
    resetPrivateSecretCache();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('Returns configured secret when it exists.', async () => {
    // Arrange
    configMock.get.mockImplementation((key) => {
      if (key === 'secrets.privatePath') return '/tmp/foo';
      return originalConfigGet(key);
    });
    configMock.has.mockImplementation((key) => {
      if (key === 'secrets.privatePath') return true;
      return originalConfigHas(key);
    });

    fileExistsMock.fileExists.mockImplementation(() => Promise.resolve(true));

    fsMock.readFile.mockReset();
    fsMock.readFile.mockImplementation(() =>
      Promise.resolve('some secret value'),
    );

    // Act
    const result = await getPrivateSecret();

    // Assert
    expect(result).toBe('some secret value');
  });

  it('Only loads secret from disk once when it exists', async () => {
    // Arrange
    configMock.get.mockImplementation((key) => {
      if (key === 'secrets.privatePath') return '/tmp/foo';
      return originalConfigGet(key);
    });
    configMock.has.mockImplementation((key) => {
      if (key === 'secrets.privatePath') return true;
      return originalConfigHas(key);
    });

    fileExistsMock.fileExists.mockImplementation(() => Promise.resolve(true));

    fsMock.readFile.mockReset();
    fsMock.readFile.mockImplementation(() =>
      Promise.resolve('some secret value'),
    );

    // Act
    const result = await getPrivateSecret();
    const result2 = await getPrivateSecret();

    // Assert
    expect(result).toBe('some secret value');
    expect(result2).toBe(result);
    expect(fileExistsMock.fileExists).toHaveBeenCalledTimes(1);
    expect(fileExistsMock.fileExists).toHaveBeenCalledWith('/tmp/foo');
  });

  it('Returns error when configured secret file does not exist', async () => {
    // Arrange
    configMock.get.mockImplementation((key) => {
      if (key === 'secrets.privatePath') return '/tmp/foo';
      return originalConfigGet(key);
    });
    configMock.has.mockImplementation((key) => {
      if (key === 'secrets.privatePath') return true;
      return originalConfigHas(key);
    });

    fileExistsMock.fileExists.mockImplementation(() => Promise.resolve(false));

    // Act & Assert
    await expect(() => getPrivateSecret()).rejects.toEqual(
      new Error('private key file not found'),
    );
  });

  it('Returns error when secret private path not configured', async () => {
    // Arrange
    configMock.has.mockImplementation((key) => {
      if (key === 'secrets.privatePath') return false;
      return originalConfigHas(key);
    });

    // Act & Assert
    await expect(() => getPrivateSecret()).rejects.toEqual(
      new Error('path to private key file not found'),
    );
  });
});
