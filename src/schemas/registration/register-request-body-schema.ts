import { Static, Type } from '@sinclair/typebox';

export const RegisterRequestBodySchema = Type.Object({
  accountName: Type.String(),
  email: Type.String(),
  friendlyName: Type.String(),
  password: Type.String(),
  userId: Type.String(),
});

export type RegisterRequestBody = Static<typeof RegisterRequestBodySchema>;
