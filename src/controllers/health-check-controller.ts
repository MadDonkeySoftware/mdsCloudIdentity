import { FastifyInstance } from 'fastify';
import { GetHealthResponse, GetHealthResponseSchema } from '../schemas';

export async function healthCheckController(
  app: FastifyInstance,
): Promise<void> {
  app.get<{
    Body: any;
  }>(
    '/',
    {
      schema: {
        response: {
          200: GetHealthResponseSchema,
        },
      },
    },
    async function handleGet(request, response) {
      response.status(200);
      response.send({ status: 'OK' } as GetHealthResponse);
    },
  );
}
