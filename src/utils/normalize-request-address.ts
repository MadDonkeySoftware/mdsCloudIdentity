/**
 * Normalizes IP addresses that are IPv4 wrapped in IPv6 back to IPv4 format
 * @param address The IPv4 or IPv6 request address.
 */
export function normalizeRequestAddress(address?: string): string | undefined {
  // I'm not going to do any better better explaining this so see link for more info:
  // https://stackoverflow.com/questions/29411551/express-js-req-ip-is-returning-ffff127-0-0-1
  if (address && address.startsWith('::ffff:') && address.indexOf('.') > -1) {
    return address.slice(7);
  }

  return address;
}
