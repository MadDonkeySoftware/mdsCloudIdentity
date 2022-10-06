import { compare } from 'bcryptjs';
import { FastifyInstance } from 'fastify';
import { sign } from 'jsonwebtoken';
import { getRepo } from '../../repo';
import {
  AuthenticationRequestBody,
  AuthenticationRequestBodySchema,
} from '../../schemas';
import { AuthenticationResponseBodySchema } from '../../schemas/authentication/authenticate-response-body-schema';
import { delay, getJwtSigningData } from '../../utils';

export async function authenticationController(
  app: FastifyInstance,
): Promise<void> {
  app.post<{
    Body: AuthenticationRequestBody;
  }>(
    '/authenticate',
    {
      schema: {
        body: AuthenticationRequestBodySchema,
        response: {
          200: AuthenticationResponseBodySchema,
        },
      },
    },
    async function handleAuthentication(request, response) {
      const { body } = request;
      const { accountId, userId, password } = body;

      const repo = getRepo();
      const errorMessage =
        'Could not find account, user, or passwords did not match';
      const [account, user] = await Promise.all([
        repo.getAccountById(accountId),
        repo.getUserById(userId),
      ]);

      if (!account) {
        app.log.debug({ accountId }, 'No such account found');
        await delay(10000);
        response.status(400);
        response.send({ message: errorMessage });
        return;
      }

      if (!account?.isActive) {
        app.log.debug({ accountId }, 'Account not active');
        await delay(10000);
        response.status(400);
        response.send({ message: errorMessage });
        return;
      }

      if (!user) {
        app.log.debug({ userId }, 'No such user found');
        await delay(10000);
        response.status(400);
        response.send({ message: errorMessage });
        return;
      }

      if (!user?.isActive) {
        app.log.debug({ userId }, 'User not active');
        await delay(10000);
        response.status(400);
        response.send({ message: errorMessage });
        return;
      }

      const valid = await compare(password, user?.password);
      if (!valid) {
        app.log.debug({ userId }, 'Invalid password');
        await delay(10000);
        response.status(400);
        response.send({ message: errorMessage });
        return;
      }

      const jwtObject = {
        accountId: account?.accountId,
        userId: user?.userId,
        friendlyName: user?.friendlyName,
      };

      const { signingKey, signingOptions } = await getJwtSigningData();

      let token;
      try {
        token = sign(jwtObject, signingKey, signingOptions);
      } catch (err) {
        app.log.error({ err }, 'Could not generate user token.');
        response.status(500);
        response.send();
        return;
      }

      user.lastActivity = new Date().toISOString();
      await repo.updateUser(user);

      response.status(200);
      response.send({ token });
    },
  );
}
