import { Static, Type } from '@sinclair/typebox';

export const UpdateUserErrorResponseBodySchema = Type.Object({
  message: Type.String(),
});

export type UpdateUserErrorResponseBody = Static<
  typeof UpdateUserErrorResponseBodySchema
>;
