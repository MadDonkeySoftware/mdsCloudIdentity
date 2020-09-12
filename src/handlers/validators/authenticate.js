const jsonschema = require('jsonschema');

const schema = {
  id: '/AuthenticationRequest',
  title: 'AuthenticationRequest',
  description: 'Register new account and user request schema',
  type: 'object',
  properties: {
    accountId: {
      type: 'string',
      description: 'The account the user will authenticate against',
    },
    userId: {
      type: 'string',
      description: 'The unique id for the user authenticating.',
    },
    password: {
      type: 'string',
      description: 'The shared secret used during account authentication',
    },
  },
  required: ['accountId', 'userId', 'password'],
  additionalProperties: false,
};

const validate = (data) => {
  const validator = new jsonschema.Validator();
  return validator.validate(data, schema);
};

module.exports = {
  validate,
};
