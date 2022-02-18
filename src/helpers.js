const _ = require('lodash');

/**
 * Inspects the input and translates it to a boolean.
 * @param {any} input item to convert to a boolean
 * @param {boolean} [defaultValue] default value type to return in lue of false.
 */
const toBoolean = (input, defaultValue) => {
  if (input) {
    switch (typeof input) {
      case 'string':
        return input.toLowerCase() === 'true';
      default:
        return !!input;
    }
  }
  return defaultValue || false;
};

const anyToString = (input, defaultValue) => {
  if (input && input.toString) {
    return input.toString();
  }
  return defaultValue || 'false';
};

/**
 * Provides a wrapper around process.env for testing
 * @param {string} key the environment variable key
 * @param {string} defaultValue the environment variable key
 * @returns {string} the environment variable value
 */
const getEnvVar = (key, defaultValue) =>
  _.get(process.env, [key], defaultValue);

/**
 * Normalizes IP addresses that are IPv4 wrapped in IPv6 back to IPv4 format
 * @param {string} address The IPv4 or IPv6 request address.
 * @returns {string}
 */
const normalizeRequestAddress = (address) => {
  // I'm not going to do any better better explaining this so see link for more info:
  // https://stackoverflow.com/questions/29411551/express-js-req-ip-is-returning-ffff127-0-0-1
  const requestIp = address;
  if (requestIp.startsWith('::ffff:') && requestIp.indexOf('.') > -1) {
    return requestIp.slice(7);
  }
  return requestIp;
};

module.exports = {
  toBoolean,
  anyToString,
  getEnvVar,
  normalizeRequestAddress,
};
