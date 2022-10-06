import { Static, Type } from '@sinclair/typebox';

export const ImpersonateRequestBodySchema = Type.Object({
  accountId: Type.String(),
  userId: Type.Optional(Type.String()),
});

export type ImpersonateRequestBody = Static<
  typeof ImpersonateRequestBodySchema
>;
