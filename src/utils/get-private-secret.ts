import config from 'config';
import { readFile } from 'fs/promises';
import { getLogger } from '../logging';
import { fileExists } from './file-exists';

let secretValue: string | undefined;

export function resetPrivateSecretCache() {
  // Cache reset for testing
  secretValue = undefined;
}

export async function getPrivateSecret(): Promise<string> {
  if (secretValue) {
    return secretValue;
  }

  const configKey = 'secrets.privatePath';
  if (!config.has(configKey)) {
    const logger = getLogger();
    logger.warn(`Setting "${configKey}" not set`);
    throw new Error('path to private key file not found');
  }

  const configKeyValue = config.get<string>(configKey);
  const exists = await fileExists(configKeyValue); // ?
  if (!exists) {
    return Promise.reject(new Error('private key file not found'));
    // throw new Error('private key file not found');
  }

  secretValue = (await readFile(configKeyValue)).toString();
  return secretValue;
}
