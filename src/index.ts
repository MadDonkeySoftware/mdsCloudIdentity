import fastify, { FastifyServerOptions } from 'fastify';
import config from 'config';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { rootRouter } from './routes';

export function buildApp() {
  // Note: The object coming out of the config is immutable. We spread into
  // a new object so that fastify can modify the object internally as it expects
  // to do.
  const fastifyOptions: FastifyServerOptions = {
    ...config.get<FastifyServerOptions>('fastifyOptions'),
  };
  const server = fastify(fastifyOptions);
  server.withTypeProvider<TypeBoxTypeProvider>();

  server.register(rootRouter);

  return server;
}
