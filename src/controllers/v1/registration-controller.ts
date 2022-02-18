import { hash } from 'bcryptjs';
import config from 'config';
import { FastifyInstance } from 'fastify';
import { getRepo } from '../../repo';
import {
  RegisterRequestBody,
  RegisterRequestBodySchema,
  RegisterResponseBody,
  RegisterResponseBodySchema,
} from '../../schemas';
import { AccountData, EntityKeys, UserData } from '../../types';
import { delay, generateRandomString, getMailer } from '../../utils';

export async function registrationController(
  app: FastifyInstance,
): Promise<void> {
  app.post<{
    Body: RegisterRequestBody;
  }>(
    '/register',
    {
      schema: {
        body: RegisterRequestBodySchema,
        response: {
          200: RegisterResponseBodySchema,
        },
      },
    },
    async function handleRegister(request, response) {
      const repo = getRepo();
      const { body } = request;
      const { userId, email, accountName, friendlyName, password } = body;

      const responseBody: RegisterResponseBody = { status: 'Failed' };
      const [existingAccount, existingUser] = await Promise.all([
        repo.getAccountByOwnerId(userId),
        repo.getUserById(userId),
      ]);

      if (existingAccount || existingUser) {
        await delay(10000);
        responseBody.message = 'Invalid userId';
        response.status(400);
        response.send(responseBody);
        return;
      }

      const nextValue = await repo.getNextCounterValue(EntityKeys.account);
      const accountId = nextValue.toString();
      const newAccount: AccountData = {
        accountId,
        name: accountName,
        ownerId: userId,
      };
      await repo.createAccount(newAccount);

      // TODO: Use case for existing user.
      const hashedPassword = await hash(
        password,
        config.get<number>('passwordHashCycles'),
      );
      const activationCode = generateRandomString(32);
      const newUser: UserData = {
        userId,
        accountId,
        email,
        friendlyName: friendlyName,
        password: hashedPassword,
        activationCode,
      };

      const bypassUserActivation = config.get<boolean>('bypassUserActivation');
      if (bypassUserActivation) {
        newUser.isActive = true;
        newUser.activationCode = null;
      }

      responseBody.accountId = accountId;
      await repo.createUser(newUser);

      if (!bypassUserActivation) {
        const mailer = getMailer();
        const mailOptions = {
          from: `"${config.get<string>(
            'oridProviderKey',
          )} Registration" <${config.get<string>('smtp.user')}>`,
          to: email,
          subject: 'Registration Activation Code',
          text: `Your activation code: ${activationCode}`,
        };
        try {
          await mailer.sendMail(mailOptions);
        } catch (err) {
          app.log.warn({ err }, 'Failed to send registration email');
          response.status(500);
          response.send(responseBody);
          return;
        }
      }

      responseBody.status = 'Success';
      response.status(200);
      response.send(responseBody);
      return;
    },
  );
}
