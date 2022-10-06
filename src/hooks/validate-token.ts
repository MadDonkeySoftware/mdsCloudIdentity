import config from 'config';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getPublicSignature } from '../utils';
import { verify } from 'jsonwebtoken';
import { MdsIdentityJwtPayload } from '../types';

export function validateToken(app: FastifyInstance) {
  return async function validateTokenHandler(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { token } = request.headers;

    if (token === undefined || Array.isArray(token)) {
      reply.header('content-type', 'text/plain');
      reply.status(403);
      reply.send('Please include authentication token in header "token"');
      return;
    }

    try {
      const publicSignature = await getPublicSignature();
      const parsedToken = verify(token, publicSignature, { complete: true });

      if (
        parsedToken &&
        (parsedToken.payload as MdsIdentityJwtPayload).iss ===
          config.get<string>('oridProviderKey')
      ) {
        request.parsedToken = parsedToken;
      } else {
        app.log.debug({ token: parsedToken }, 'Invalid token detected');
        reply.status(403);
        reply.send();
        return;
      }
    } catch (err) {
      app.log.debug({ err }, 'Error detected while parsing token');
      reply.status(403);
      reply.send();
      return;
    }
  };
}
