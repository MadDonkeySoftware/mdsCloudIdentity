const jsonschema = require('jsonschema');

const schema = {
  id: '/ConfigurationUpdateRequest',
  title: 'ConfigurationUpdateRequest',
  description: 'System configuration update schema',
  type: 'object',
  properties: {
    internal: {
      type: 'object',
      description: 'The internal configuration properties',
      properties: {
        identityUrl: {
          type: 'string',
          description: 'The identity service url',
        },
        nsUrl: {
          type: 'string',
          description: 'The notification service url',
        },
        qsUrl: {
          type: 'string',
          description: 'The queue service url',
        },
        fsUrl: {
          type: 'string',
          description: 'The file service url',
        },
        sfUrl: {
          type: 'string',
          description: 'The serverless functions service url',
        },
        smUrl: {
          type: 'string',
          description: 'The state machine service url',
        },
        allowSelfSignCert: {
          type: 'string',
          description: 'Toggle to allow self signed certs',
        },
      },
      required: ['identityUrl', 'nsUrl', 'qsUrl', 'fsUrl', 'sfUrl', 'smUrl', 'allowSelfSignCert'],
    },
    external: {
      type: 'object',
      description: 'The external configuration properties',
      properties: {
        identityUrl: {
          type: 'string',
          description: 'The identity service url',
        },
        nsUrl: {
          type: 'string',
          description: 'The notification service url',
        },
        qsUrl: {
          type: 'string',
          description: 'The queue service url',
        },
        fsUrl: {
          type: 'string',
          description: 'The file service url',
        },
        sfUrl: {
          type: 'string',
          description: 'The serverless functions service url',
        },
        smUrl: {
          type: 'string',
          description: 'The state machine service url',
        },
        allowSelfSignCert: {
          type: 'string',
          description: 'Toggle to allow self signed certs',
        },
      },
      required: ['identityUrl', 'nsUrl', 'qsUrl', 'fsUrl', 'sfUrl', 'smUrl', 'allowSelfSignCert'],
    },
  },
  required: ['internal', 'external'],
  additionalProperties: false,
};

const validate = (data) => {
  const validator = new jsonschema.Validator();
  return validator.validate(data, schema);
};

module.exports = {
  validate,
};
