import { FastifyBaseLogger } from 'fastify';
import { initialize, getLogger } from '../logging';

describe('index test', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('Returns undefined for logger when uninitialized', async () => {
    // Act
    const result = await getLogger();

    // Assert
    expect(result).toBeUndefined();
  });

  it('Returns object for logger when initialized', async () => {
    // Arrange
    const fake = {} as FastifyBaseLogger;
    initialize(fake);

    // Act
    const result = await getLogger();

    // Assert
    expect(result).toBe(fake);
  });
});
