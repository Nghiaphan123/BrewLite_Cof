import { config } from 'dotenv';

config({ path: ['.env', '../../.env'], quiet: true });

function sourceDatabaseUrl(): URL {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. E2E tests derive their own database from it.');
  }
  return new URL(process.env.DATABASE_URL);
}

/** The same server as DATABASE_URL, with a database whose name ends in _test. */
export function e2eDatabaseUrl(): string {
  const url = sourceDatabaseUrl();
  const name = url.pathname.slice(1);
  if (!name.endsWith('_test')) url.pathname = `/${name}_test`;
  return url.toString();
}

export function e2eDatabaseName(): string {
  return new URL(e2eDatabaseUrl()).pathname.slice(1);
}

/** Connects to the source database, because the e2e one may not exist yet. */
export function adminDatabaseUrl(): string {
  return sourceDatabaseUrl().toString();
}
