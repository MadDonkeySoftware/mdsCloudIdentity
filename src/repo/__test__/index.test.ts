import config from 'config';
import { getRepo, resetRepoCache } from '../index';

jest.mock('config');
const configMock = jest.mocked(config);

jest.mock('../../logging', () => ({
  getLogger: jest.fn().mockReturnValue({
    warn: jest.fn(),
  }),
}));

describe('getRepo test', () => {
  const originalConfigGet = jest.requireActual('config').get;
  const originalConfigHas = jest.requireActual('config').has;

  beforeEach(() => {
    resetRepoCache();
  });

  it('throws error when no dbUrl is ', () => {
    // Arrange
    configMock.has.mockImplementation((key) => {
      if (key === 'dbUrl') return false;
      return originalConfigHas(key);
    });

    // Act & Assert
    expect(() => getRepo()).toThrow(
      'Database not configured properly. No connection string found',
    );
  });

  it('throws error when dbUrl is unknown format', () => {
    // Arrange
    configMock.has.mockImplementation((key) => {
      if (key === 'dbUrl') return true;
      return originalConfigHas(key);
    });
    configMock.get.mockImplementation((key) => {
      if (key === 'dbUrl') return 'unknownDb://someUri';
      return originalConfigGet(key);
    });

    // Act & Assert
    expect(() => getRepo()).toThrow(
      'Database not configured properly. "unknownDb://someUri" not understood.',
    );
  });

  it('Returns a mongo implementation when connection string is for mongo', () => {
    // Arrange
    configMock.has.mockImplementation((key) => {
      if (key === 'dbUrl') return true;
      return originalConfigHas(key);
    });
    configMock.get.mockImplementation((key) => {
      if (key === 'dbUrl') return 'mongodb://someUri';
      return originalConfigGet(key);
    });

    // Act
    const repo = getRepo();
    const repo2 = getRepo();

    // Assert
    expect(repo).toBeTruthy();
    expect(repo).toEqual(repo2);
  });
});
