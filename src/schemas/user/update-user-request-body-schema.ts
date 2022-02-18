import { Static, Type } from '@sinclair/typebox';

export const UpdateUserRequestBodySchema = Type.Object({
  oldPassword: Type.Optional(Type.String()),
  newPassword: Type.Optional(Type.String()),
  friendlyName: Type.Optional(Type.String()),
  email: Type.Optional(Type.String()),
});

export type UpdateUserRequestBody = Static<typeof UpdateUserRequestBodySchema>;
