import config from 'config';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { Netmask } from 'netmask';
import { networkInterfaces, NetworkInterfaceInfo } from 'os';
import { normalizeRequestAddress } from '../utils';

export function checkRequestOriginNetwork(app: FastifyInstance) {
  return async function checkRequestOriginNetworkHandler(
    request: FastifyRequest,
  ): Promise<void> {
    try {
      const requestIp = normalizeRequestAddress(
        (request.headers['x-forwarded-for'] as string) || request.ip,
      );
      request.requestorIp = requestIp;
      if (requestIp) {
        if (['127.0.0.1', '::1'].indexOf(requestIp) > -1) {
          request.isLocal = true;
          return;
        }

        const nets = networkInterfaces();
        const nicId = config.get<string>('serviceNicId');
        const net = nets[nicId] || [{}];

        app.log.debug(
          { nets, nicId, net, requestIp },
          'Network Request check origin info.',
        );
        const block = new Netmask(
          (net[0] as NetworkInterfaceInfo).cidr as string,
        );
        const isLocal = block.contains(requestIp);
        request.isLocal = isLocal;
      }
    } catch (err) {
      app.log.warn(
        { err },
        'An error occurred in checkRequestOriginNetwork hook',
      );
      request.isLocal = undefined;
      return;
    }
  };
}
