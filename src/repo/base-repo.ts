import { AccountData, ConfigurationData, UserData } from '../types';

export abstract class BaseRepo {
  connString?: string;

  constructor(connString?: string) {
    this.connString = connString;
  }

  abstract handleAppShutdown(): Promise<void>;
  abstract getNextCounterValue(entity: string): Promise<number>;
  abstract createUser(userData: UserData): Promise<UserData>;
  abstract getUserById(userId: string): Promise<UserData | null>; // Old getUserByUserId
  abstract updateUser(userData: UserData): Promise<void>;
  abstract createAccount(accountData: AccountData): Promise<AccountData>;
  abstract getAccountById(accountId: string): Promise<AccountData | null>;
  abstract getAccountByOwnerId(ownerId: string): Promise<AccountData | null>;
  abstract updateAccount(accountData: AccountData): Promise<void>;
  abstract getConfiguration(): Promise<ConfigurationData | null>;
  abstract updateConfiguration(configuration: ConfigurationData): Promise<void>;
}
