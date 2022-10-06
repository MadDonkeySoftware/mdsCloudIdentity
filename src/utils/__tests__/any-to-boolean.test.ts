import { anyToBoolean } from '../any-to-boolean';

describe('anyToBoolean', () => {
  it('converts string "true" to boolean true.', () => {
    // Act
    const result = anyToBoolean('true');

    // Assert
    expect(result).toBe(true);
  });

  it('converts string that is not "true" to boolean false.', () => {
    // Act
    const result = anyToBoolean('bacon');

    // Assert
    expect(result).toBe(false);
  });

  it('converts number that is not 0 to boolean true.', () => {
    // Act
    const result = anyToBoolean(-1);

    // Assert
    expect(result).toBe(true);
  });

  it('converts number that is 0 to boolean false.', () => {
    // Act
    const result = anyToBoolean(0);

    // Assert
    expect(result).toBe(false);
  });

  it('converts undefined to false', () => {
    // Act
    const result = anyToBoolean(undefined);

    // Assert
    expect(result).toBe(false);
  });

  it('converts null to false', () => {
    // Act
    const result = anyToBoolean(null);

    // Assert
    expect(result).toBe(false);
  });
});
