module.exports = {
  "env": {
    "commonjs": true,
    "es6": true,
    "node": true,
    "mocha": true
  },
  "extends": "airbnb-base",
  "parserOptions": {
    "ecmaVersion": 2018
  },
  "rules": {
    "no-underscore-dangle": "off"
  },
  "globals": {
    "Atomics": "readonly",
    "SharedArrayBuffer": "readonly"
  }
};