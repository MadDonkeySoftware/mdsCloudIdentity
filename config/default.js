module.exports = {
  // The port that the HTTP interface will listen upon for requests
  apiPort: 8888,

  // The database to use for data persistence
  dbUrl: 'mongodb://usr:pwd@localhost:27017/identity-db',

  fastifyOptions: {
    logger: {
      level: 'info',
      mixin: (mergeObject) => ({
        ...mergeObject,
        'event.dataset': 'mdsCloudIdentity',
      }),
    },
  },

  secrets: {
    // The path to the private key used for JWT signing
    privatePath: null,

    // The password associated with the private key used for JWT signing
    privatePassword: null,

    // The path to the public key that external systems can use to validate the JWT has not been
    // tampered with
    publicPath: null,
  },

  // The number of times to re-hash user passwords before storage or comparison.
  passwordHashCycles: 16,

  // The username to use for the default admin user with then system is initialized. WARNING: If
  // no user name is provided then this setup step is skipped.
  systemUser: 'admin',

  // The password to use for the default admin user when the system is initialized. A randomized
  // string is used if this value is left blank
  systemPassword: null,

  // When true users registered to the system will be set active upon creation. When false users
  // will need to obtain their activation code before being able to authenticate with the system.
  bypassUserActivation: false,

  // The provider element for all ORIDs created or consumed. USed int he valdation process.
  oridProviderKey: 'orid',

  smtp: {
    host: null,
    port: null,
    secure: false,
    user: null,
    password: null,
  },

  // The id of the interface this service is listening upon. This may be useful if you are having
  // trouble with the configuration endpoint returning improper configurations.
  serviceNicId: 'eth0',
};
