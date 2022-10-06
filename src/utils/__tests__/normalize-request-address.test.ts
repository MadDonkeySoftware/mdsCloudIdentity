import { normalizeRequestAddress } from '../normalize-request-address';

describe('getPublicSignature test', () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('when provided with a ip v4 the address is returned', () => {
    // Act
    const result = normalizeRequestAddress('192.168.1.1');

    // Assert
    expect(result).toBe('192.168.1.1');
  });

  it('when provided with a ip v4 in ip v6 the ip v4 address is returned', () => {
    // Act
    const result = normalizeRequestAddress('::ffff:192.168.1.1');

    // Assert
    expect(result).toBe('192.168.1.1');
  });

  it('when provided with a ip v6 the address is returned', () => {
    // Act
    const result = normalizeRequestAddress('2345:425:2CA1:::567:5673:23b5');

    // Assert
    expect(result).toBe('2345:425:2CA1:::567:5673:23b5');
  });
});
