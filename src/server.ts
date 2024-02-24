import config from 'config';
import { buildApp } from '.';
import { initialize } from './logging';
import { setupSystemUser } from './utils';

// const config = require('config');
// const src = require('../dist');
// const logging = require('../dist/logging');
// const utils = require('../dist/utils');

const port = config.get<number>('apiPort');
const app = buildApp();

initialize(app.log);

setupSystemUser();
// app.listen(port, () => logger.info(`Example app listening on port ${port}!`));

app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  reply.send(error);
});

app.listen(
  {
    port,
    host: '::',
  },
  async (err, addr: string) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    app.log.info(
      app.printRoutes({
        includeHooks: false,
        includeMeta: ['metaProperty'],
      }),
    );
    app.log.info(`Server listening at ${addr}`);
  },
);
