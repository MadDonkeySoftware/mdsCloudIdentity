import config from 'config';
import { readFile } from 'fs/promises';
import { getLogger } from '../logging';
import { fileExists } from './file-exists';

let signatureValue: string | undefined;

export function resetPublicSignatureCache() {
  // Cache reset for testing
  signatureValue = undefined;
}

export async function getPublicSignature(): Promise<string> {
  if (signatureValue) {
    return signatureValue;
  }

  const configKey = 'secrets.publicPath';
  if (!config.has(configKey)) {
    const logger = getLogger();
    logger.warn(`Setting "${configKey}" not set`);
    throw new Error('path to public key file not found');
  }

  const exists = await fileExists(config.get<string>(configKey));
  if (!exists) {
    throw new Error('public key file not found');
  }

  const contents = await readFile(config.get<string>(configKey));
  signatureValue = contents.toString();
  return signatureValue;
}
