import config from 'config';
import { createTransport, TransportOptions } from 'nodemailer';

export function getMailer() {
  const transporter = createTransport({
    host: config.get<string>('smtp.host'),
    port: config.get<string>('smtp.port'),
    secure: config.get<boolean>('smtp.secure'),
    auth: {
      user: config.get<string>('smtp.user'),
      pass: config.get<string>('smtp.password'),
    },
  } as TransportOptions);

  return transporter;
}
