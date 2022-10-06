export function anyToString(input: any, defaultValue?: string): string {
  if (
    input !== undefined &&
    input !== null &&
    typeof input.toString === 'function'
  ) {
    return input.toString();
  }
  return defaultValue || 'false';
}
