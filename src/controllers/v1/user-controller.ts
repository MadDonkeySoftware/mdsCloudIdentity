import { compare, hash } from 'bcryptjs';
import config from 'config';
import { FastifyInstance } from 'fastify';
import { validateToken } from '../../hooks';
import { getRepo } from '../../repo';
import {
  UpdateUserErrorResponseBodySchema,
  UpdateUserRequestBody,
  UpdateUserRequestBodySchema,
  UpdateUserResponseBodySchema,
} from '../../schemas/user';
import { MdsIdentityJwtPayload } from '../../types';
import { delay } from '../../utils';

export async function userController(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', validateToken(app));

  app.post<{
    Body: UpdateUserRequestBody;
  }>(
    '/updateUser',
    {
      schema: {
        body: UpdateUserRequestBodySchema,
        response: {
          200: UpdateUserResponseBodySchema,
          400: UpdateUserErrorResponseBodySchema,
        },
      },
    },
    async function handleUpdateUser(request, response) {
      const repo = getRepo();
      const { body, parsedToken } = request;
      const { email, oldPassword, newPassword, friendlyName } = body;
      let shouldUpdate = false;

      const errorMessage =
        'Could not find account, user, or passwords did not match.';
      const user = await repo.getUserById(
        (parsedToken?.payload as MdsIdentityJwtPayload).userId,
      );

      if (!user) {
        app.log.debug({ email }, 'No such user found');
        await delay(10000);
        response.status(400);
        response.send({ message: errorMessage });
        return;
      }

      if (!user.isActive) {
        app.log.debug({ email }, 'User not active');
        await delay(10000);
        response.status(400);
        response.send({ message: errorMessage });
        return;
      }

      if (oldPassword && newPassword) {
        const valid = await compare(oldPassword, user.password);
        if (!valid) {
          app.log.debug({ email }, 'Invalid password');
          await delay(10000);
          response.status(400);
          response.send({ message: errorMessage });
          return;
        }

        const hashedPassword = await hash(
          newPassword,
          config.get<number>('passwordHashCycles'),
        );
        user.password = hashedPassword;
        shouldUpdate = true;
      }

      if (email) {
        user.email = email;
        shouldUpdate = true;
      }

      if (friendlyName) {
        user.friendlyName = friendlyName;
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        user.lastActivity = new Date().toISOString();
        await repo.updateUser(user);
        response.status(200);
        response.send();
        return;
      }

      response.status(400);
      response.send({ message: errorMessage });
      return;
    },
  );
}
