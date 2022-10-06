import { setupSystemUser } from '../setup-system-user';

describe('setupSystemUser test', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it.skip('UPDATE ME', async () => {
    // Act
    const result = await setupSystemUser();

    // Assert
    expect(result).toBeUndefined();
  });
});
