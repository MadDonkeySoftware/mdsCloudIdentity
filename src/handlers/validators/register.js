const jsonschema = require('jsonschema');

const schema = {
  id: '/RegisterRequest',
  title: 'RegisterRequest',
  description: 'Register new account and user request schema',
  type: 'object',
  properties: {
    userId: {
      type: 'string',
      description: 'The field that the user will use to authenticate',
    },
    email: {
      type: 'string',
      description: 'The email address used for password recovery',
    },
    accountName: {
      type: 'string',
      description: '',
    },
    friendlyName: {
      type: 'string',
      description: '',
    },
    password: {
      type: 'string',
      description: '',
    },
  },
  required: ['userId', 'email', 'accountName', 'friendlyName', 'password'],
  additionalProperties: false,
};

const validate = (data) => {
  const validator = new jsonschema.Validator();
  return validator.validate(data, schema);
};

module.exports = {
  validate,
};
