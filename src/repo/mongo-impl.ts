import config from 'config';
import {
  MongoClient,
  MongoClientOptions,
  Filter,
  Document,
  UpdateFilter,
  FindOneAndUpdateOptions,
  OptionalId,
  InsertOneOptions,
  UpdateOptions,
  MatchKeysAndValues,
} from 'mongodb';
import { AccountData, ConfigurationData, UserData } from '../types';
import { anyToString, anyToBoolean } from '../utils';
import { BaseRepo } from './base-repo';

// TODO: Make this a class & interface

const TABLES = {
  account: 'mdsAccount',
  counter: 'mdsCounter',
  user: 'mdsUser',
  configuration: 'mdsConfig',
};

async function ensureConnected(client: MongoClient) {
  // TODO: Research and potentially remove?
  /*
  if (!client.isConnected()) {
    client.connect({ useNewUrlParser:true });
  }
   */
  await client.connect();
  return client;
}

export class MongoRepo extends BaseRepo {
  client: MongoClient;

  constructor(connString?: string) {
    super(connString);

    const connOptions: MongoClientOptions = {
      // useUnifiedTopology: true
    };
    const connStr = connString || config.get<string>('dbUrl');
    this.client = new MongoClient(connStr, connOptions);
  }

  async handleAppShutdown(): Promise<void> {
    await this.client.close();
  }

  async getNextCounterValue(entity: string): Promise<number> {
    const client = await ensureConnected(this.client);
    const db = client.db();
    const query: Filter<Document> = {
      key: entity,
    };
    const params: UpdateFilter<Document> = {
      $inc: { value: 1 },
    };
    const options: FindOneAndUpdateOptions = {
      writeConcern: {
        j: true,
      },
      upsert: true,
      returnDocument: 'after',
    };
    const data = await db
      .collection(TABLES.counter)
      .findOneAndUpdate(query, params, options);
    return data.value?.value as number;
  }

  async createUser(userData: UserData): Promise<UserData> {
    const client = await ensureConnected(this.client);
    const now = new Date();
    const db = client.db();

    const params: OptionalId<UserData> = {
      userId: userData.userId,
      accountId: userData.accountId,
      email: userData.email,
      friendlyName: userData.friendlyName, // userData.name,
      password: userData.password,
      isActive: userData.isActive !== undefined ? userData.isActive : false,
      activationCode: userData.activationCode,
      created: now.toISOString(),
      lastActivity: now.toISOString(),
    };

    const options: InsertOneOptions = {
      writeConcern: {
        j: true,
      },
    };

    await db.collection(TABLES.user).insertOne(params, options);

    return {
      userId: userData.userId,
      accountId: userData.accountId,
      email: userData.email,
      friendlyName: userData.friendlyName,
      password: userData.password,
      activationCode: userData.activationCode,
      isActive: userData.isActive,
      created: now,
      lastActivity: now,
    };
  }

  async getUserById(userId: string): Promise<UserData | null> {
    const client = await ensureConnected(this.client);
    const db = client.db();
    const item = await db.collection(TABLES.user).findOne({ userId });

    if (item) {
      const user = {
        userId: item.userId,
        accountId: item.accountId,
        email: item.email,
        friendlyName: item.friendlyName,
        password: item.password,
        isActive: anyToBoolean(item.isActive),
        created: item.created,
        lastActivity: item.lastActivity,
        confirmCode: undefined,
      };

      if (item.activationCode) {
        user.confirmCode = item.activationCode;
      }

      return user;
    }

    return null;
  }

  async updateUser(userData: UserData): Promise<void> {
    const client = await ensureConnected(this.client);
    const db = client.db();
    const params: UpdateFilter<Document> = {
      $set: {
        email: userData.email,
        friendlyName: userData.friendlyName,
        password: userData.password,
        isActive: anyToString(userData.isActive),
        lastActivity: userData.lastActivity,
      },
    };

    if (userData.activationCode !== undefined) {
      if (userData.activationCode === null) {
        params.$unset = { activationCode: '' };
      } else {
        (params.$set as MatchKeysAndValues<Document>).activationCode =
          userData.activationCode;
      }
    }
    const options: UpdateOptions = {
      writeConcern: {
        j: true,
      },
    };

    const selector: Filter<Document> = { userId: userData.userId };
    await db.collection(TABLES.user).updateOne(selector, params, options);
  }

  async createAccount(accountData: AccountData): Promise<AccountData> {
    const client = await ensureConnected(this.client);
    const now = new Date();
    const db = client.db();
    const params = {
      accountId: accountData.accountId,
      name: accountData.name,
      ownerId: accountData.ownerId,
      isActive:
        accountData.isActive !== undefined ? accountData.isActive : true,
      created: now.toISOString(),
      lastActivity: now.toISOString(),
    };

    await db.collection(TABLES.account).insertOne(params);
    return {
      accountId: accountData.accountId,
      name: accountData.name,
      ownerId: accountData.ownerId,
      isActive:
        accountData.isActive !== undefined ? accountData.isActive : true,
      created: now,
      lastActivity: now,
    };
  }

  async getAccountById(accountId: string): Promise<AccountData | null> {
    const client = await ensureConnected(this.client);
    const db = client.db();
    const item = await db.collection(TABLES.account).findOne({ accountId });
    if (item) {
      const account = {
        accountId: item.accountId,
        name: item.name,
        ownerId: item.ownerId,
        isActive: item.isActive,
        created: item.created,
        lastActivity: item.lastActivity,
      };
      return account;
    }
    return null;
  }

  async getAccountByOwnerId(ownerId: string): Promise<AccountData | null> {
    const client = await ensureConnected(this.client);
    const db = client.db();
    const item = await db.collection(TABLES.account).findOne({ ownerId });
    if (item) {
      const account = {
        accountId: item.accountId,
        name: item.friendlyName,
        ownerId: item.ownerId,
        isActive: item.isActive,
        created: item.created,
        lastActivity: item.lastActivity,
      };
      return account;
    }
    return null;
  }

  async updateAccount(accountData: AccountData): Promise<void> {
    const client = await ensureConnected(this.client);
    const db = client.db();
    const selector = { accountId: accountData.accountId };
    const params = {
      $set: {
        friendlyName: accountData.name,
        ownerId: accountData.ownerId,
        isActive:
          accountData.isActive !== undefined ? accountData.isActive : true,
        lastActivity: accountData.lastActivity,
      },
    };
    const options = {
      writeConcern: {
        j: true,
      },
    };

    await db.collection(TABLES.account).updateOne(selector, params, options);
  }

  async getConfiguration(): Promise<ConfigurationData | null> {
    const client = await ensureConnected(this.client);
    const db = client.db();
    const item = await db.collection(TABLES.configuration).findOne({ v: 1 });
    if (item) {
      return item as unknown as ConfigurationData;
    }
    // throw new Error('Configuration information is not setup.');
    return null;
  }

  async updateConfiguration(configuration: ConfigurationData): Promise<void> {
    const client = await ensureConnected(this.client);
    const db = client.db();
    const selector = { v: 1 };
    const params = {
      $set: {
        internal: configuration.internal,
        external: configuration.external,
      },
    };
    const options = {
      writeConcern: {
        j: true,
      },
      upsert: true,
    };

    await db
      .collection(TABLES.configuration)
      .updateOne(selector, params, options);
  }
}
