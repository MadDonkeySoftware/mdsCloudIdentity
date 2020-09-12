const bcryptjs = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');

const globals = require('../globals');
const helpers = require('../helpers');
const repo = require('../repo');
const entityKeys = require('../entity-keys');
const registerValidator = require('./validators/register');
const authenticateValidator = require('./validators/authenticate');

const router = express.Router();

const getIssuer = () => process.env.ORID_PROVIDER_KEY || 'mdsCloudIdentity';

const getJwtSigningData = () => {
  const secret = globals.getAppSecret();

  const signingKey = (process.env.IDENTITY_SECRET_PRIVATE_PASS
    ? { key: secret, passphrase: process.env.IDENTITY_SECRET_PRIVATE_PASS }
    : secret);

  const signingOptions = (process.env.IDENTITY_SECRET_PRIVATE_PASS
    ? { algorithm: 'RS256', expiresIn: '4h', issuer: getIssuer() }
    : { expiresIn: '4h', issuer: getIssuer() });

  return { signingKey, signingOptions };
};

const sendResponse = (response, status, payload) => {
  response.status(status || 200);
  if (payload) {
    switch (typeof payload) {
      case 'object':
        response.send(JSON.stringify(payload));
        break;
      default:
        response.send(payload);
        break;
    }
  } else {
    response.send();
  }
  return Promise.resolve();
};

const registerHandler = async (request, response) => {
  const { body } = request;
  const {
    userId,
    email,
    accountName,
    friendlyName,
    password,
  } = body;

  const responseBody = { status: 'Failed' };
  const [existingAccount, existingUser] = await Promise.all([
    repo.getAccountByOwnerId(userId),
    repo.getUserByUserId(userId),
  ]);

  if (existingAccount || existingUser) {
    await globals.delay(10000);
    responseBody.message = 'Invalid userId';
    return sendResponse(response, 400, responseBody);
  }
  const nextValue = await repo.getNextCounterValue(entityKeys.account);
  const accountId = nextValue.toString();
  const newAccount = {
    accountId,
    name: accountName,
    ownerUserId: userId,
  };
  await repo.createAccount(newAccount);

  // TODO: Use case for existing user.
  const hashedPassword = await bcryptjs.hash(password,
    parseInt(process.env.PWD_HASH_CYCLES, 10) || 18);
  const confirmCode = globals.generateRandomString(32);
  const newUser = {
    userId,
    email,
    name: friendlyName,
    password: hashedPassword,
    confirmCode,
  };

  const bypassUserActivation = helpers.toBoolean(process.env.BYPASS_USER_ACTIVATION, false);
  if (bypassUserActivation) {
    newUser.isActive = 'true';
    newUser.confirmCode = null;
  }

  responseBody.accountId = accountId;
  await repo.createUser(newUser);

  if (!bypassUserActivation) {
    const mailer = globals.getMailer();
    const mailOptions = {
      from: `"${process.env.ORID_PROVIDER_KEY} Registration" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Registration Activation Code',
      text: `Your activation code: ${confirmCode}`,
    };
    try {
      await mailer.sendMail(mailOptions);
    } catch (err) {
      const log = globals.getLogger();
      log.warn({ err }, 'Failed to send registration email');
      return sendResponse(response, 500, responseBody);
    }
  }

  responseBody.status = 'Success';
  return sendResponse(response, 200, responseBody);
};

const authenticateHandler = async (request, response) => {
  const { body } = request;
  const {
    accountId,
    userId,
    password,
  } = body;

  const log = globals.getLogger();
  const errorMessage = 'Could not find account, user or passwords did not match';
  const [account, user] = await Promise.all([
    repo.getAccountById(accountId),
    repo.getUserByUserId(userId),
  ]);

  if (!account) {
    log.debug({ accountId }, 'No such account found');
    await globals.delay(10000);
    return sendResponse(response, 400, { message: errorMessage });
  }

  if (!account.isActive) {
    log.debug({ accountId }, 'Account not active');
    await globals.delay(10000);
    return sendResponse(response, 400, { message: errorMessage });
  }

  if (!user) {
    log.debug({ userId }, 'No such user found');
    await globals.delay(10000);
    return sendResponse(response, 400, { message: errorMessage });
  }

  if (!user.isActive) {
    log.debug({ userId }, 'User not active');
    await globals.delay(10000);
    return sendResponse(response, 400, { message: errorMessage });
  }

  const valid = await bcryptjs.compare(password, user.password);
  if (!valid) {
    log.debug({ userId }, 'Invalid password');
    await globals.delay(10000);
    return sendResponse(response, 400, { message: errorMessage });
  }

  const jwtObject = {
    accountId: account.accountId,
    userId: user.userId,
    friendlyName: user.name,
  };

  const { signingKey, signingOptions } = getJwtSigningData();

  let token;
  try {
    token = jwt.sign(jwtObject, signingKey, signingOptions);
  } catch (err) {
    log.error({ err }, 'Could not generate user token.');
    return sendResponse(response, 500);
  }

  const dbUser = await repo.getUserByUserId(userId);
  dbUser.lastActivity = new Date().toISOString();
  await repo.updateUser(dbUser);

  return sendResponse(response, 200, { token });
};

const publicSignatureHandler = async (request, response) => {
  const signature = globals.getAppPublicSignature();
  return sendResponse(response, 200, { signature });
};

const updateUserHandler = async (request, response) => {
  const { body, parsedToken } = request;
  const {
    email,
    oldPassword,
    newPassword,
    friendlyName,
  } = body;
  let shouldUpdate = false;

  const log = globals.getLogger();
  const errorMessage = 'Could not find account, user or passwords did not match';
  const user = await repo.getUserByUserId(parsedToken.payload.userId);

  if (!user) {
    log.debug({ email }, 'No such user found');
    await globals.delay(10000);
    return sendResponse(response, 400, { message: errorMessage });
  }

  if (!user.isActive) {
    log.debug({ email }, 'User not active');
    await globals.delay(10000);
    return sendResponse(response, 400, { message: errorMessage });
  }

  if (oldPassword && newPassword) {
    const valid = await bcryptjs.compare(oldPassword, user.password);
    if (!valid) {
      log.debug({ email }, 'Invalid password');
      await globals.delay(10000);
      return sendResponse(response, 400, { message: errorMessage });
    }

    const hashedPassword = await bcryptjs.hash(newPassword,
      parseInt(process.env.PWD_HASH_CYCLES, 10) || 18);
    user.password = hashedPassword;
    shouldUpdate = true;
  }

  if (email) {
    user.email = email;
    shouldUpdate = true;
  }

  if (friendlyName) {
    user.name = friendlyName;
    shouldUpdate = true;
  }

  if (shouldUpdate) {
    user.lastActivity = new Date().toISOString();
    await repo.updateUser(user);
    return sendResponse(response);
  }
  return sendResponse(response, 400, { message: errorMessage });
};

const impersonateHandler = async (request, response) => {
  // TODO: Update impersonation to use surrogate account rather than root account
  const errorMessage = 'Could not find account, user or insufficient privilege to impersonate';
  if (request.parsedToken.payload.accountId !== '1') {
    await globals.delay(10000);
    return sendResponse(response, 400, { message: errorMessage });
  }

  const { body } = request;
  const {
    accountId,
    userId,
  } = body;

  const log = globals.getLogger();
  const account = await repo.getAccountById(accountId);

  if (!account) {
    log.debug({ accountId }, 'No such account found');
    await globals.delay(10000);
    return sendResponse(response, 400, { message: errorMessage });
  }

  if (!account.isActive) {
    log.debug({ accountId }, 'Account not active');
    await globals.delay(10000);
    return sendResponse(response, 400, { message: errorMessage });
  }

  const rootUserId = request.parsedToken.payload.accountId === '1' ? account.ownerId : undefined;

  const user = await repo.getUserByUserId(userId || rootUserId);
  if (!user) {
    log.debug({ userId }, 'No such user found');
    await globals.delay(10000);
    return sendResponse(response, 400, { message: errorMessage });
  }

  if (!user.isActive) {
    log.debug({ userId }, 'User not active');
    await globals.delay(10000);
    return sendResponse(response, 400, { message: errorMessage });
  }

  const jwtObject = {
    impersonatedBy: request.parsedToken.payload.userId,
    accountId: account.accountId,
    userId: user.userId,
    friendlyName: user.name,
  };

  const { signingKey, signingOptions } = getJwtSigningData();

  let token;
  try {
    token = jwt.sign(jwtObject, signingKey, signingOptions);
  } catch (err) {
    log.error({ err }, 'Could not generate user token.');
    return sendResponse(response, 500);
  }

  return sendResponse(response, 200, { token });
};

const validatePostBody = (validator) => (request, response, next) => {
  const { body } = request;
  const validationResult = validator.validate(body);
  if (!validationResult.valid) {
    return sendResponse(response, 400, validationResult.errors);
  }
  return next();
};

const validateToken = (request, response, next) => {
  const { headers } = request;
  const { token } = headers;
  if (!token) {
    return sendResponse(response, 403);
  }

  try {
    const parsedToken = jwt.verify(token, globals.getAppPublicSignature(), { complete: true });
    if (parsedToken && parsedToken.payload.iss === getIssuer()) {
      request.parsedToken = parsedToken;
    } else {
      return sendResponse(response, 403);
    }
  } catch (err) {
    return sendResponse(response, 403);
  }
  return next();
};

router.post('/register', validatePostBody(registerValidator), registerHandler);
router.post('/authenticate', validatePostBody(authenticateValidator), authenticateHandler);
router.get('/publicSignature', publicSignatureHandler);
router.post('/updateUser', validateToken, updateUserHandler);
router.post('/impersonate', validateToken, impersonateHandler);

/* TODO
 * Add user to account
 * Remove user from account
 * Change root user on account
 * Activate a user
 */

module.exports = router;
