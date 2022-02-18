import { Static, Type } from '@sinclair/typebox';

export const RegisterResponseBodySchema = Type.Object({
  accountId: Type.Optional(Type.String()),
  message: Type.Optional(Type.String()),
  status: Type.String(),
});

export type RegisterResponseBody = Static<typeof RegisterResponseBodySchema>;
