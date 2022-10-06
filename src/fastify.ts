import jwt from 'jsonwebtoken';

/**
 * Extensions to the base fastify types.
 */
declare module 'fastify' {
  interface FastifyRequest {
    parsedToken?: jwt.Jwt;
    requestorIp?: string;
    isLocal?: boolean;
  }
}
