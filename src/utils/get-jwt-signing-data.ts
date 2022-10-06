import config from 'config';
import { Secret, SignOptions } from 'jsonwebtoken';
import { getPrivateSecret } from './get-private-secret';

export async function getJwtSigningData() {
  const secret = await getPrivateSecret();

  const pwd = config.has('secrets.privatePassword')
    ? config.get<string>('secrets.privatePassword')
    : null;
  const signingKey: Secret = pwd ? { key: secret, passphrase: pwd } : secret;

  const issuer = config.get<string>('oridProviderKey');
  const signingOptions: SignOptions = pwd
    ? { algorithm: 'RS256', expiresIn: '4h', issuer }
    : { expiresIn: '4h', issuer };

  return { signingKey, signingOptions };
}
