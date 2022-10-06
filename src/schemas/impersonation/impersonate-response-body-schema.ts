import { Static, Type } from '@sinclair/typebox';

export const ImpersonateResponseBodySchema = Type.Object({
  token: Type.String(),
});

export type ImpersonateResponseBody = Static<
  typeof ImpersonateResponseBodySchema
>;
