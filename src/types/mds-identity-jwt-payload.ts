import { JwtPayload } from 'jsonwebtoken';

export interface MdsIdentityJwtPayload extends JwtPayload {
  accountId: string;
  userId: string;
  friendlyName: string;
  iat: number;
  exp: number;
  iss: string;
}
