import { FastifyInstance } from 'fastify';
import { checkRequestOriginNetwork, validateToken } from '../../hooks';
import { getRepo } from '../../repo';
import {
  GetConfigurationResponseBodySchema,
  GetPublicSignatureResponseBodySchema,
  UpdateConfigurationRequestBody,
  UpdateConfigurationRequestBodySchema,
} from '../../schemas';
import { MdsIdentityJwtPayload } from '../../types';
import { getPublicSignature } from '../../utils';

export async function configurationController(
  app: FastifyInstance,
): Promise<void> {
  app.get(
    '/publicSignature',
    {
      schema: {
        response: {
          200: GetPublicSignatureResponseBodySchema,
        },
      },
    },
    async function publicSignatureHandler(request, response) {
      try {
        const signature = await getPublicSignature();
        response.status(200);
        response.send({ signature });
      } catch (err) {
        app.log.warn({ err }, 'Error encountered attaining public signature');
        response.status(200);
        response.send({});
      }
    },
  );

  app.get(
    '/configuration',
    {
      schema: {
        response: {
          200: GetConfigurationResponseBodySchema,
        },
      },
      onRequest: checkRequestOriginNetwork(app),
    },
    async function getConfigurationHandler(request, response) {
      const repo = getRepo();
      const dbConfig = await repo.getConfiguration();
      if (dbConfig) {
        const data = request.isLocal ? dbConfig.internal : dbConfig.external;
        response.status(200);
        response.send(data);
      } else {
        app.log.error(
          {},
          'Get configuration endpoint could not find a configuration to supply caller.',
        );
        response.status(422);
        response.send();
      }
    },
  );

  app.post<{
    Body: UpdateConfigurationRequestBody;
  }>(
    '/configuration',
    {
      schema: {
        body: UpdateConfigurationRequestBodySchema,
        response: {
          200: {},
        },
      },
      onRequest: validateToken(app),
    },
    async function updateConfigurationHandler(request, response) {
      const repo = getRepo();
      const { body, parsedToken, requestorIp } = request;
      if ((parsedToken?.payload as MdsIdentityJwtPayload).accountId !== '1') {
        app.log.warn(
          { requestorIp },
          'Non root account attempting to change configuration',
        );

        // 404 here instead of 401 to not leak that this endpoint exists.
        response.status(404);
        response.send();
        return;
      }

      await repo.updateConfiguration(body);
      response.status(200);
      response.send();
      return;
    },
  );
}
