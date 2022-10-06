import { Static, Type } from '@sinclair/typebox';

export const AuthenticationResponseBodySchema = Type.Object({
  token: Type.String(),
});

export type AuthenticationResponseBody = Static<
  typeof AuthenticationResponseBodySchema
>;
