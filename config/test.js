module.exports = {
  // The location that files are persisted once uploaded.
  uploadFolder: '/tmp/mds-test',

  fastifyOptions: {
    logger: {
      level: 'error',
    },
  },

  smtp: {
    user: 'test-smtp-user',
  },

  // The provider element for all ORIDs created or consumed. USed int he validation process.
  oridProviderKey: 'testIssuer',

  // The MDS Identity URL used during certain request validations
  identityUrl: 'http://identity-server',
};
