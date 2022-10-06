import { anyToString } from '../any-to-string';

describe('anyToString', () => {
  it('converts string to its string value.', () => {
    // Act
    const result = anyToString('test value');

    // Assert
    expect(result).toBe('test value');
  });

  it('converts number to its string value.', () => {
    // Act
    const result = anyToString(123);

    // Assert
    expect(result).toBe('123');
  });

  it('converts boolean to its string value.', () => {
    // Act
    const result = anyToString(false);

    // Assert
    expect(result).toBe('false');
  });

  it('converts undefined to false', () => {
    // Act
    const result = anyToString(undefined);

    // Assert
    expect(result).toBe('false');
  });

  it('converts null to false', () => {
    // Act
    const result = anyToString(null);

    // Assert
    expect(result).toBe('false');
  });
});
