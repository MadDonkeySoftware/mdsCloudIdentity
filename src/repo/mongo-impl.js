const mongodb = require('mongodb');
const helpers = require('../helpers');

const CONNECT_OPTIONS = {
  useNewUrlParser: true,
};

const TABLES = {
  account: 'mdsAccount',
  counter: 'mdsCounter',
  user: 'mdsUser',
};

/**
 * Create and configure a new db client object
 * @param {string} connString the mongo connections string
 * @returns {mongodb.MongoClient}
 */
const initClient = (connString) => {
  const connOptions = { useUnifiedTopology: true };
  const connStr = connString || process.env.MDS_IDENTITY_DB_URL;
  const client = new mongodb.MongoClient(connStr, connOptions);

  return client;
};

/**
 * @param {mongodb.MongoClient} mongoClient the mongo client
 */
const ensureConnected = (mongoClient) => (mongoClient.isConnected()
  ? Promise.resolve(mongoClient)
  : mongoClient.connect(CONNECT_OPTIONS));

const getNextCounterValue = (mongoClient, entity) => ensureConnected(mongoClient)
  .then((client) => {
    const db = client.db();
    const query = {
      key: entity,
    };
    const params = {
      $inc: { value: 1 },
    };
    const options = {
      writeConcern: {
        j: true,
      },
      upsert: true,
      returnOriginal: false,
    };
    return db.collection(TABLES.counter).findOneAndUpdate(query, params, options)
      .then((data) => data.value.value);
  });

/**
 * Creates a new user in the data store
 * @param {mongodb.MongoClient} mongoClient the mongo client
 * @param {object} userData object containing data about the user
 * @param {string} userData.userId The userId that will uniquely identify the user
 * @param {string} userData.email The email for the user
 * @param {string} userData.name The friendly name for the user
 * @param {string} userData.password The password of the user
 * @param {string} userData.confirmCode The confirmation code associated with the user
 * @param {string} [userData.isActive] Optional indicator to block or allow user to authenticate.
 */
const createUser = (mongoClient, userData) => ensureConnected(mongoClient)
  .then((client) => {
    const now = new Date();
    const db = client.db();
    const params = {
      userId: userData.userId,
      email: userData.email,
      friendlyName: userData.name,
      password: userData.password,
      isActive: helpers.anyToString(userData.isActive, 'false'),
      created: now.toISOString(),
      lastActivity: now.toISOString(),
    };

    if (userData.confirmCode) {
      params.activationCode = userData.confirmCode;
    }

    const options = {
      writeConcern: {
        j: true,
      },
    };

    return db.collection(TABLES.user)
      .insertOne(params, options)
      .then(() => ({
        userId: userData.userId,
        email: userData.email,
        friendlyName: userData.name,
        password: userData.password,
        activationCode: userData.confirmCode,
        isActive: helpers.toBoolean(userData.isActive),
        created: now,
        lastActivity: now,
      }));
  });

/**
 * Retrieves a user by their unique id
 * @param {mongodb.MongoClient} mongoClient the mongo client
 * @param {string} userId The id that will uniquely identify the user
 */
const getUserByUserId = (mongoClient, userId) => ensureConnected(mongoClient)
  .then((client) => {
    const db = client.db();
    return db.collection(TABLES.user).findOne({ userId })
      .then((item) => {
        if (item) {
          const user = {
            userId: item.userId,
            email: item.email,
            name: item.friendlyName,
            password: item.password,
            isActive: helpers.toBoolean(item.isActive),
            created: item.created,
            lastActivity: item.lastActivity,
          };

          if (item.activationCode) {
            user.confirmCode = item.activationCode;
          }

          return user;
        }
        return null;
      });
  });

/**
 * Creates a new user in the data store
 * @param {mongodb.MongoClient} mongoClient the mongo client
 * @param {object} userData object containing data about the user
 * @param {string} userData.email The email that will uniquely identify the user
 * @param {string} userData.name The friendly name for the user
 * @param {string} userData.password The password of the user
 * @param {string} userData.confirmCode The confirmation code associated with the user
 * @param {string} [userData.isActive] Optional indicator to block or allow user to authenticate.
 */
const updateUser = (mongoClient, userData) => ensureConnected(mongoClient)
  .then((client) => {
    const db = client.db();
    const params = {
      $set: {
        email: userData.email,
        friendlyName: userData.name,
        password: userData.password,
        isActive: helpers.anyToString(userData.isActive),
        lastActivity: userData.lastActivity,
      },
    };

    if (Object.prototype.hasOwnProperty.call(userData, 'confirmCode')) {
      if (userData.confirmCode === null) {
        params.$unset = { activationCode: '' };
      } else {
        params.$set.activationCode = userData.confirmCode;
      }
    }
    const options = {
      writeConcern: {
        j: true,
      },
    };

    const selector = { userId: userData.userId };
    return db.collection(TABLES.user).updateOne(selector, params, options).then(() => null);
  });

/**
 * Creates a new account in the data store
 * @param {mongodb.MongoClient} mongoClient the mongo client
 * @param {object} accountData object containing data about the account
 * @param {string} accountData.accountId The id that will uniquely identify the account
 * @param {string} accountData.name The friendly name for the account
 * @param {string} accountData.ownerUserId The unique id for the root user of the account.
 * @param {string} [accountData.isActive] Optional indicator to block or allow user to authenticate.
 */
const createAccount = (mongoClient, accountData) => ensureConnected(mongoClient)
  .then((client) => {
    const now = new Date();
    const db = client.db();
    const params = {
      accountId: accountData.accountId,
      friendlyName: accountData.name,
      ownerId: accountData.ownerUserId,
      isActive: helpers.anyToString(accountData.isActive, 'true'),
      created: now.toISOString(),
      lastActivity: now.toISOString(),
    };
    return db.collection(TABLES.account).insertOne(params).then(() => ({
      accountId: accountData.accountId,
      friendlyName: accountData.name,
      ownerId: accountData.ownerUserId,
      isActive: helpers.toBoolean(accountData.isActive),
      created: now,
      lastActivity: now,
    }));
  });

/**
 * Retrieves a user by their unique email
 * @param {mongodb.MongoClient} mongoClient the mongo client
 * @param {string} accountId The id that will uniquely identify the account
 */
const getAccountById = (mongoClient, accountId) => ensureConnected(mongoClient)
  .then((client) => {
    const db = client.db();
    return db.collection(TABLES.account).findOne({ accountId })
      .then((item) => {
        if (item) {
          const account = {
            accountId: item.accountId,
            name: item.friendlyName,
            ownerId: item.ownerId,
            isActive: helpers.toBoolean(item.isActive),
            created: item.created,
            lastActivity: item.lastActivity,
          };
          return account;
        }
        return null;
      });
  });

/**
 * Retrieves a user by their unique email
 * @param {mongodb.MongoClient} mongoClient the mongo client
 * @param {string} ownerId The id that will uniquely identify the account
 */
const getAccountByOwnerId = (mongoClient, ownerId) => ensureConnected(mongoClient)
  .then((client) => {
    const db = client.db();
    return db.collection(TABLES.account).findOne({ ownerId })
      .then((item) => {
        if (item) {
          const account = {
            accountId: item.accountId,
            name: item.friendlyName,
            ownerId: item.ownerId,
            isActive: helpers.toBoolean(item.isActive),
            created: item.created,
            lastActivity: item.lastActivity,
          };
          return account;
        }
        return null;
      });
  });

/**
 * Creates a new user in the data store
 * @param {mongodb.MongoClient} mongoClient the mongo client
 * @param {object} accountData object containing data about the account
 * @param {string} accountData.accountId The id that will uniquely identify the account
 * @param {string} accountData.name The friendly name for the account
 * @param {string} accountData.ownerId The unique id for the root user of the account.
 * @param {string} [accountData.isActive] Optional indicator to block or allow user to authenticate.
 */
const updateAccount = (mongoClient, accountData) => ensureConnected(mongoClient)
  .then((client) => {
    const db = client.db();
    const selector = { accountId: accountData.accountId };
    const params = {
      $set: {
        friendlyName: accountData.name,
        ownerId: accountData.ownerId,
        isActive: helpers.anyToString(accountData.isActive, 'true'),
        lastActivity: accountData.lastActivity,
      },
    };
    const options = {
      writeConcern: {
        j: true,
      },
    };

    return db.collection(TABLES.account)
      .updateOne(selector, params, options)
      .then(() => null);
  });

module.exports = {
  initClient,
  getNextCounterValue,
  createUser,
  getUserByUserId,
  updateUser,
  createAccount,
  getAccountById,
  getAccountByOwnerId,
  updateAccount,
};
