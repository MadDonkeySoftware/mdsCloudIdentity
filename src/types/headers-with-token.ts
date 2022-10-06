import { IncomingHttpHeaders } from 'http';

export interface HeadersWithToken extends IncomingHttpHeaders {
  token?: string;
}
