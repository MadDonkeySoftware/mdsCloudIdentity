/* istanbul ignore file */
import { hash } from 'bcryptjs';
import config from 'config';
import { getLogger } from '../logging';
import { getRepo } from '../repo';
import { UserData } from '../types';
import { generateRandomString } from './generate-random-string';

export async function setupSystemUser(): Promise<void> {
  const logger = getLogger();
  const repo = getRepo();

  const accountId = '1';
  const userId = config.get<string>('systemUser');
  if (!userId) {
    logger.warn(
      'Could not determine system user name. Aborting system user setup.',
    );
    return;
  }

  const systemUser = await repo.getUserById(userId);
  if (systemUser) {
    logger.info({ userId }, 'System user found. Bypassing system user setup.');
    return;
  }

  const systemAccount = await repo.getAccountById('1');
  if (!systemAccount) {
    await repo.createAccount({
      accountId,
      name: 'System',
      ownerId: userId,
      isActive: true,
    });
  }

  let password =
    process.env.MDS_SYS_PASSWORD || config.get<string>('systemPassword');

  if (!password) {
    logger.info(
      { accountId, userId, password },
      'System user will be created with random password. Be sure to change the default password using the "updateUser" endpoint!',
    );
    password = generateRandomString(32);
  }

  const hashedPassword = await hash(
    password,
    config.get<number>('passwordHashCycles'),
  );
  const newUser: UserData = {
    userId,
    email: 'system@localhost',
    friendlyName: 'System User',
    password: hashedPassword,
    accountId,
    activationCode: null,
    isActive: true,
  };
  await repo.createUser(newUser);
  logger.info({ accountId, userId }, 'System user created.');
}
