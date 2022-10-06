import { FastifyInstance } from 'fastify';
import { healthCheckController } from '../controllers';
import { v1Router } from './v1/v1-router';

export async function rootRouter(app: FastifyInstance): Promise<void> {
  app.register(healthCheckController, { prefix: '/health' });
  app.register(v1Router, { prefix: '/v1' });
}
