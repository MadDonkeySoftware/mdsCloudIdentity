const _ = require('lodash');
const chai = require('chai');
const sinon = require('sinon');

const helpers = require('./helpers');

describe(__filename, () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('toBoolean', () => {
    it('without input or default returns false', () => {
      chai.expect(helpers.toBoolean()).to.be.equal(false);
    });

    it('with zero returns false', () => {
      chai.expect(helpers.toBoolean(0)).to.be.equal(false);
    });

    it('with non-zero returns true', () => {
      chai.expect(helpers.toBoolean(1)).to.be.equal(true);
    });

    it('with string true returns true', () => {
      chai.expect(helpers.toBoolean('TrUe')).to.be.equal(true);
    });

    it('with string false returns false', () => {
      chai.expect(helpers.toBoolean('FaLSe')).to.be.equal(false);
    });
  });

  describe('anyToString', () => {
    it('without input or default returns false string', () => {
      chai.expect(helpers.anyToString()).to.be.equal('false');
    });

    it('with boolean false input returns false string', () => {
      chai.expect(helpers.anyToString(false)).to.be.equal('false');
    });

    it('with boolean true input returns true string', () => {
      chai.expect(helpers.anyToString(true)).to.be.equal('true');
    });

    it('with numeric input returns string', () => {
      chai.expect(helpers.anyToString(135)).to.be.equal('135');
    });
  });

  describe('getEnvVar', () => {
    it('Reads env vars', () => {
      const keys = ['NODE_ENV', 'NONEXISTENT'];
      _.map(keys, (k) => chai.expect(helpers.getEnvVar(k)).to.equal(process.env[k]));
    });
  });
});
