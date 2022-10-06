import { Static, Type } from '@sinclair/typebox';

export const UpdateUserResponseBodySchema = Type.Void();

export type UpdateUserResponseBody = Static<
  typeof UpdateUserResponseBodySchema
>;
