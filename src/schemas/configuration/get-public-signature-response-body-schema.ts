import { Static, Type } from '@sinclair/typebox';

export const GetPublicSignatureResponseBodySchema = Type.Object({
  signature: Type.Optional(Type.String()),
});

export type GetPublicSignatureResponseBody = Static<
  typeof GetPublicSignatureResponseBodySchema
>;
