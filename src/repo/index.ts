// All interactions with any storage mechanism should go through a "top level"
// repository such as this module. Implementation details should be hidden from
// callers to make supporting different stores as easy as possible.
import config from 'config';
import { BaseRepo } from './base-repo';
import { MongoRepo } from './mongo-impl';

let repoImpl: BaseRepo | undefined;

export * from './base-repo';

export function resetRepoCache() {
  // Cache reset for testing
  repoImpl = undefined;
}

export function getRepo(): BaseRepo {
  if (!config.has('dbUrl')) {
    throw new Error(
      'Database not configured properly. No connection string found',
    );
  }

  const connString = config.get<string>('dbUrl');

  if (repoImpl) {
    return repoImpl;
  }

  if (connString.startsWith('mongodb://')) {
    repoImpl = new MongoRepo(connString);
  }

  if (repoImpl === undefined) {
    throw new Error(
      `Database not configured properly. "${connString}" not understood.`,
    );
  }
  return repoImpl;
}
