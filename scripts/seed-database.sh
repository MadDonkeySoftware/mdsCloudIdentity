#!/usr/bin/env node
const mongodb = require('mongodb');

const mongoImpl = require('../src/repo/mongo-impl');
const entityKeys = require('../src/entity-keys');

const DEFAULT_CONN_STR = 'mongodb://localhost:27017/mds-identity';
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
  const connStr = connString || process.env.DATABASE_CONN_STRING || DEFAULT_CONN_STR;
  const client = new mongodb.MongoClient(connStr, connOptions);

  return client;
};

/**
 * @param {mongodb.MongoClient} mongoClient the mongo client
 */
const ensureConnected = (mongoClient) => (mongoClient.isConnected()
  ? Promise.resolve(mongoClient)
  : mongoClient.connect(CONNECT_OPTIONS));

const writeOut = (message) => process.stdout.write(`${message}\n`);

const main = () => {
  const mongoClient = initClient();
  writeOut('Initializing database...');
  const counterDocuments = [
    { key: entityKeys.account, value: 1000 },
  ];
  return ensureConnected(mongoClient)
    .then((client) => client.db()
      .collection(TABLES.counter)
      .insertMany(counterDocuments)
      .then(() => writeOut('Finished!'))
      .then(() => client))
    .then((client) => client)
    .then((client) => client.close());
};

// const main2 = () => {
//   const mongoClient = mongoImpl.initClient(DEFAULT_CONN_STR);
//   return mongoImpl.getNextCounterValue(mongoClient, entityKeys.account)
//     .then((data) => writeOut(data));
// };

main();
