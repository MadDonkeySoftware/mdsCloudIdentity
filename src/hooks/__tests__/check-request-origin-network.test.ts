import config from 'config';
import { FastifyBaseLogger, FastifyInstance, FastifyRequest } from 'fastify';
import * as os from 'os';

import { checkRequestOriginNetwork } from '../check-request-origin-network';

jest.mock('config');
const configMock = jest.mocked(config);

jest.mock('os');
const osMock = jest.mocked(os);

describe('checkRequestOriginNetwork test', () => {
  const originalConfigGet = jest.requireActual('config').get;
  const originalConfigHas = jest.requireActual('config').has;

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('Marks request as undefined when error occurs.', async () => {
    // Arrange
    const app = {
      log: {
        warn: jest.fn(),
      } as Partial<FastifyBaseLogger>,
    } as Partial<FastifyInstance>;
    const req = {} as Partial<FastifyRequest>;
    const resp = { send: jest.fn() };

    // Act
    const handler = checkRequestOriginNetwork(app as FastifyInstance);
    await handler(req as FastifyRequest);

    // Assert
    expect(resp.send).toHaveBeenCalledTimes(0);
    expect(req.isLocal).toBeUndefined();
  });

  it('Marks request as local when requester is localhost', async () => {
    // Arrange
    const app = {
      log: {
        warn: jest.fn(),
      } as Partial<FastifyBaseLogger>,
    } as Partial<FastifyInstance>;
    const req = {
      headers: {},
      ip: '127.0.0.1',
    } as Partial<FastifyRequest>;
    const resp = { send: jest.fn() };

    // Act
    const handler = checkRequestOriginNetwork(app as FastifyInstance);
    await handler(req as FastifyRequest);

    // Assert
    expect(resp.send).toHaveBeenCalledTimes(0);
    expect(req.isLocal).toBe(true);
  });

  it('Marks request as external when requester is external', async () => {
    // Arrange
    configMock.has.mockImplementation((key) => {
      if (key === 'serviceNicId') return true;
      return originalConfigHas(key);
    });
    configMock.get.mockImplementation((key) => {
      if (key === 'serviceNicId') return 'testNic';
      return originalConfigGet(key);
    });

    osMock.networkInterfaces.mockImplementation(
      () =>
        ({
          testNic: [
            {
              cidr: '192.168.1.1/32',
            } as Partial<os.NetworkInterfaceInfo>,
          ],
        } as any),
    );

    const app = {
      log: {
        warn: jest.fn(),
        debug: jest.fn(),
      } as Partial<FastifyBaseLogger>,
    } as Partial<FastifyInstance>;
    const req = {
      headers: {},
      ip: '8.8.8.8',
    } as Partial<FastifyRequest>;
    const resp = { send: jest.fn() };

    // Act
    const handler = checkRequestOriginNetwork(app as FastifyInstance);
    await handler(req as FastifyRequest);

    // Assert
    expect(resp.send).toHaveBeenCalledTimes(0);
    expect(req.isLocal).toBe(false);
  });

  it('Marks request as ??? when service NIC not found', async () => {
    // Arrange
    configMock.has.mockImplementation((key) => {
      if (key === 'serviceNicId') return true;
      return originalConfigHas(key);
    });
    configMock.get.mockImplementation((key) => {
      if (key === 'serviceNicId') return 'notFoundNic';
      return originalConfigGet(key);
    });

    osMock.networkInterfaces.mockImplementation(
      () =>
        ({
          testNic: [
            {
              cidr: '192.168.1.1/32',
            } as Partial<os.NetworkInterfaceInfo>,
          ],
        } as any),
    );

    const app = {
      log: {
        warn: jest.fn(),
        debug: jest.fn(),
      } as Partial<FastifyBaseLogger>,
    } as Partial<FastifyInstance>;
    const req = {
      headers: {},
      ip: '8.8.8.8',
    } as Partial<FastifyRequest>;
    const resp = { send: jest.fn() };

    // Act
    const handler = checkRequestOriginNetwork(app as FastifyInstance);
    await handler(req as FastifyRequest);

    // Assert
    expect(resp.send).toHaveBeenCalledTimes(0);
    expect(req.isLocal).toBeUndefined();
  });
});
