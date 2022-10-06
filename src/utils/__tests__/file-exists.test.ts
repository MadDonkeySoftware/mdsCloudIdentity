import { fileExists } from '../file-exists';
import fs from 'fs/promises';

describe('fileExists', () => {
  it('When file exists returns true', async () => {
    // Arrange
    jest.resetAllMocks();
    jest.spyOn(fs, 'access').mockImplementation(() => Promise.resolve());

    // Act
    const result = await fileExists('/tmp/testFile');

    // Assert
    expect(result).toBe(true);
  });

  it('When file does not exists returns false', async () => {
    // Arrange
    jest.resetAllMocks();
    jest.spyOn(fs, 'access').mockImplementation(() => Promise.reject());

    // Act
    const result = await fileExists('/tmp/testFile');

    // Assert
    expect(result).toBe(false);
  });
});
