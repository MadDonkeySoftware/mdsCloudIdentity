/* istanbul ignore file */

// All interactions with any storage mechanism should go through a "top level"
// repository such as this module. Implementation details should be hidden from
// callers to make supporting different stores as easy as possible.
const mongo = require('./mongo-impl');

const initializeMongoDb = () => {
  const client = mongo.initClient();

  const handleAppShutdown = () => client.close();

  const getNextCounterValue = (entity) =>
    mongo.getNextCounterValue(client, entity);
  const createUser = (userData) => mongo.createUser(client, userData);
  const getUserByUserId = (userId) => mongo.getUserByUserId(client, userId);
  const updateUser = (userData) => mongo.updateUser(client, userData);
  const createAccount = (accountData) =>
    mongo.createAccount(client, accountData);
  const getAccountById = (accountId) => mongo.getAccountById(client, accountId);
  const getAccountByOwnerId = (accountId) =>
    mongo.getAccountByOwnerId(client, accountId);
  const updateAccount = (accountData) =>
    mongo.updateAccount(client, accountData);
  const getConfiguration = () => mongo.getConfiguration(client);
  const updateConfiguration = (configuration) =>
    mongo.updateConfiguration(client, configuration);

  return {
    handleAppShutdown,
    getNextCounterValue,
    createUser,
    getUserByUserId,
    updateUser,
    createAccount,
    getAccountById,
    getAccountByOwnerId,
    updateAccount,
    getConfiguration,
    updateConfiguration,
  };
};

const initializeDatabase = () => {
  if (
    !process.env.MDS_IDENTITY_DB_URL ||
    process.env.MDS_IDENTITY_DB_URL.startsWith('mongodb://')
  ) {
    return initializeMongoDb();
  }

  // NOTE: Example for future expandability
  // if (process.env.MDS_IDENTITY_DB_URL.startsWith('mysql://')) {
  //   return initializeMysqlDb();
  // }
  throw new Error(
    `Database not configured properly. "${process.env.MDS_IDENTITY_DB_URL}" not understood.`,
  );
};

module.exports = initializeDatabase();
