import config from 'config';
import {
  getPublicSignature,
  resetPublicSignatureCache,
} from '../get-public-signature';
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

describe('getPublicSignature test', () => {
  const originalConfigGet = jest.requireActual('config').get;
  const originalConfigHas = jest.requireActual('config').has;

  beforeEach(() => {
    jest.clearAllMocks();
    resetPublicSignatureCache();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('Returns configured public signature when it exists.', async () => {
    // Arrange
    configMock.get.mockImplementation((key) => {
      if (key === 'secrets.publicPath') return '/tmp/foo';
      return originalConfigGet(key);
    });
    configMock.has.mockImplementation((key) => {
      if (key === 'secrets.publicPath') return true;
      return originalConfigHas(key);
    });

    fileExistsMock.fileExists.mockImplementation(() => Promise.resolve(true));

    fsMock.readFile.mockReset();
    fsMock.readFile.mockImplementation(() =>
      Promise.resolve('some public value'),
    );

    // Act
    const result = await getPublicSignature();

    // Assert
    expect(result).toBe('some public value');
  });

  it('Only loads public signature from disk once when it exists', async () => {
    // Arrange
    configMock.get.mockImplementation((key) => {
      if (key === 'secrets.publicPath') return '/tmp/foo';
      return originalConfigGet(key);
    });
    configMock.has.mockImplementation((key) => {
      if (key === 'secrets.publicPath') return true;
      return originalConfigHas(key);
    });

    fileExistsMock.fileExists.mockImplementation(() => Promise.resolve(true));

    fsMock.readFile.mockReset();
    fsMock.readFile.mockImplementation(() =>
      Promise.resolve('some public value'),
    );

    // Act
    const result = await getPublicSignature();
    const result2 = await getPublicSignature();

    // Assert
    expect(result).toBe('some public value');
    expect(result2).toBe(result);
    expect(fileExistsMock.fileExists).toHaveBeenCalledTimes(1);
    expect(fileExistsMock.fileExists).toHaveBeenCalledWith('/tmp/foo');
  });

  it('Returns error when configured public signature file does not exist', async () => {
    // Arrange
    configMock.get.mockImplementation((key) => {
      if (key === 'secrets.publicPath') return '/tmp/foo';
      return originalConfigGet(key);
    });
    configMock.has.mockImplementation((key) => {
      if (key === 'secrets.publicPath') return true;
      return originalConfigHas(key);
    });

    fileExistsMock.fileExists.mockImplementation(() => Promise.resolve(false));

    // Act & Assert
    await expect(() => getPublicSignature()).rejects.toEqual(
      new Error('public key file not found'),
    );
  });

  it('Returns error when public signature private path not configured', async () => {
    // Arrange
    configMock.has.mockImplementation((key) => {
      if (key === 'secrets.publicPath') return false;
      return originalConfigHas(key);
    });

    // Act & Assert
    await expect(() => getPublicSignature()).rejects.toEqual(
      new Error('path to public key file not found'),
    );
  });
});
