const bunyan = require('bunyan');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fs = require('fs');

const bunyanLogstashHttp = require('./bunyan-logstash-http');

const buildLogStreams = () => {
  const loggerMetadata = { fromLocal: process.env.DEBUG };
  const logStreams = [];

  if (!/test/.test(process.env.NODE_ENV)) {
    logStreams.push({
      stream: process.stdout,
    });
  }

  if (process.env.MDS_LOG_URL) {
    logStreams.push({
      stream: bunyanLogstashHttp.createLoggerStream({
        loggingEndpoint: process.env.MDS_LOG_URL,
        level: 'debug',
        metadata: loggerMetadata,
      }),
    });
  }

  return logStreams;
};

const logger = bunyan.createLogger({
  name: 'mdsCloudIdentity',
  level: bunyan.TRACE,
  serializers: bunyan.stdSerializers,
  streams: buildLogStreams(),
});

/**
 * returns the current logger for the application
 */
const getLogger = () => logger;

const delay = (timeout) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });

/* istanbul ignore next: Trouble mocking fs methods */
const getAppSecret = () => {
  if (!process.env.IDENTITY_SECRET_PRIVATE) {
    const log = getLogger();
    const defaultSecret = 'MDS-Cloud-Development-Secret';
    log.warn(
      { secret: defaultSecret },
      'Environment variable IDENTITY_SECRET_PRIVATE not set. Using insecure value.',
    );
    return defaultSecret;
  }

  const key = fs.readFileSync(process.env.IDENTITY_SECRET_PRIVATE);
  return key.toString();
};

/* istanbul ignore next: Trouble mocking fs methods */
const getAppPublicSignature = () => {
  if (!process.env.IDENTITY_SECRET_PRIVATE) {
    const log = getLogger();
    log.warn('Environment variable IDENTITY_SECRET_PUBLIC not set.');
    return undefined;
  }

  const key = fs.readFileSync(process.env.IDENTITY_SECRET_PUBLIC);
  return key.toString();
};

const generateRandomString = (length) => {
  if (!length || length < 1) {
    return '';
  }

  // When converting bytes to hex you get two characters for every byte. So
  // we divide the requested length in half rounding up to save a bit of
  // memory / processing.
  const l = Math.floor(length / 2.0 + 0.5);
  const str = crypto.randomBytes(l).toString('hex');
  return str.substring(0, length);
};

const getMailer = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

module.exports = {
  buildLogStreams,
  getLogger,
  delay,
  getAppSecret,
  getAppPublicSignature,
  generateRandomString,
  getMailer,
};
