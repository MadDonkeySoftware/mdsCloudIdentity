import { validateToken } from '../validate-token';

describe('validateToken test', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it.skip('UPDATE ME', async () => {
    // Act
    const result = await validateToken({} as any);

    // Assert
    expect(result).toBeUndefined();
  });
});
