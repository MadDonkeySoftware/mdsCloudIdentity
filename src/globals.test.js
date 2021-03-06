/* eslint-disable no-unused-expressions */
const sinon = require('sinon');
const chai = require('chai');
const fs = require('fs');

const globals = require('./globals');

describe('globals', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getLogger', () => {
    it('Returns a logger', () => {
      // Act
      const logger = globals.getLogger();

      // Assert
      chai.expect(logger.debug).to.not.be.undefined;
      chai.expect(logger.error).to.not.be.undefined;
      chai.expect(logger.info).to.not.be.undefined;
      chai.expect(logger.trace).to.not.be.undefined;
      chai.expect(logger.warn).to.not.be.undefined;
    });
  });

  describe('buildLogStreams', () => {
    it('Includes bunyan logstash http stream when MDS_LOG_URL present', () => {
      // Arrange
      const beforeValueNodeEnv = process.env.NODE_ENV;
      const beforeValueMdsLogUrl = process.env.MDS_LOG_URL;

      process.env.MDS_LOG_URL = 'http://127.0.0.1:8080';
      process.env.NODE_ENV = undefined;

      try {
        // Act
        const streams = globals.buildLogStreams();

        // Assert
        chai.expect(streams.length).to.be.eql(2);
        chai.expect(streams[0].stream).to.eql(process.stdout);
        chai.expect(streams[1].stream).to.not.eql(process.stdout);
      } finally {
        // Cleanup
        process.env.MDS_LOG_URL = beforeValueMdsLogUrl;
        process.env.NODE_ENV = beforeValueNodeEnv;
      }
    });
  });

  describe('delay', () => {
    it('Delays for the provided duration', () => {
      // Arrange
      const start = new Date().getTime();
      const delay = 10;

      // Act
      return globals.delay(delay).then(() => {
        // Assert
        const done = new Date().getTime();
        const drift = done - start - delay;

        chai.expect(drift).to.be.lessThan(2);
      });
    });
  });

  describe.skip('getAppSecret', () => {
    it('reads app secret from file', () => {
      // Arrange
      const existingValue = process.env.IDENTITY_SECRET_PRIVATE;
      process.env.IDENTITY_SECRET_PRIVATE = 'secret';
      sinon.stub(fs, 'readFileSync').returns(Buffer.from('12345'));

      try {
        let secret;
        try {
          // Act
          secret = globals.getAppSecret();
        } finally {
          fs.readFileSync.restore();
        }

        // Assert
        chai.expect(secret).to.be.equal('12345');
      } finally {
        process.env.IDENTITY_SECRET_PRIVATE = existingValue;
      }
    });
  });

  describe.skip('getAppPublicSignature', () => {
    it('reads app public signature from file', () => {
    });
  });

  describe('generateRandomString', () => {
    it('gives empty string when length not specified', () => {
      chai.expect(globals.generateRandomString()).to.be.equal('');
    });

    it('gives empty string when length less than 1', () => {
      chai.expect(globals.generateRandomString(0)).to.be.equal('');
    });

    it('gives string of appropriate length', () => {
      chai.expect(globals.generateRandomString(4).length).to.equal(4);
      chai.expect(globals.generateRandomString(11).length).to.equal(11);
    });
  });

  describe('getMailer', () => {
    it('returns configured mailer', () => {
      // Act
      const mailer = globals.getMailer();
      chai.expect(mailer).to.not.be.null;
      chai.expect(mailer).to.not.be.undefined;
    });
  });
});
