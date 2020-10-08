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

module.exports = {
  toBoolean,
  anyToString,
};
