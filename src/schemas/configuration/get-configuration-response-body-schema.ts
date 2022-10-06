import { Static, Type } from '@sinclair/typebox';

export const GetConfigurationResponseBodySchema = Type.Object({
  allowSelfSignCert: Type.Optional(Type.Boolean()),
  identityUrl: Type.Optional(Type.String()),
  nsUrl: Type.Optional(Type.String()),
  qsUrl: Type.Optional(Type.String()),
  fsUrl: Type.Optional(Type.String()),
  sfUrl: Type.Optional(Type.String()),
  smUrl: Type.Optional(Type.String()),
});

export type GetConfigurationResponseBody = Static<
  typeof GetConfigurationResponseBodySchema
>;
