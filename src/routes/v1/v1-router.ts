import { FastifyInstance } from 'fastify';
import {
  authenticationController,
  configurationController,
  impersonationController,
  registrationController,
  userController,
} from '../../controllers/v1';

export async function v1Router(app: FastifyInstance): Promise<void> {
  app.register(authenticationController, { prefix: '/' });
  app.register(impersonationController, { prefix: '/' });
  app.register(registrationController, { prefix: '/' });
  app.register(configurationController, { prefix: '/' });
  app.register(userController, { prefix: '/' });
}
