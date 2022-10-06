import { Static, Type } from '@sinclair/typebox';

const ConfigurationBlock = Type.Object({
  allowSelfSignCert: Type.Boolean(),
  identityUrl: Type.String(),
  nsUrl: Type.String(),
  qsUrl: Type.String(),
  fsUrl: Type.String(),
  sfUrl: Type.String(),
  smUrl: Type.String(),
});

export const UpdateConfigurationRequestBodySchema = Type.Object({
  internal: ConfigurationBlock,
  external: ConfigurationBlock,
});

export type UpdateConfigurationRequestBody = Static<
  typeof UpdateConfigurationRequestBodySchema
>;
