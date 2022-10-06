import { buildApp } from '../index';

describe('index test', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('buildApp yields a fastify server', async () => {
    // Act
    const result = await buildApp();

    // Assert
    expect(result).toBeTruthy();
    expect(result.listen).toBeTruthy();
  });
});
