import { Static, Type } from '@sinclair/typebox';

export const AuthenticationRequestBodySchema = Type.Object({
  accountId: Type.String(),
  userId: Type.String(),
  password: Type.String(),
});

export type AuthenticationRequestBody = Static<
  typeof AuthenticationRequestBodySchema
>;
