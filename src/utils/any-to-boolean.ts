/**
 * Inspects the input and translates it to a boolean.
 * @param input item to convert to a boolean
 * @param defaultValue default value type to return in lue of false.
 */
export function anyToBoolean(input: any, defaultValue?: boolean): boolean {
  if (input !== undefined && input !== null) {
    switch (typeof input) {
      case 'string':
        return input.toLowerCase() === 'true';
      default:
        return !!input;
    }
  }
  return defaultValue || false;
}
