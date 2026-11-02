import { execSync } from 'node:child_process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client.js';
import { adminDatabaseUrl, e2eDatabaseName, e2eDatabaseUrl } from './e2e-database.js';

/** Creates the e2e database on first use and brings it up to the latest migration. */
export default async function setup(): Promise<void> {
  const name = e2eDatabaseName();
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error(`Unsafe e2e database name: ${name}`);
  }

  const admin = new PrismaClient({
    adapter: new PrismaPg({ connectionString: adminDatabaseUrl() }),
  });
  try {
    const existing = await admin.$queryRaw<unknown[]>`SELECT 1 FROM pg_database WHERE datname = ${name}`;
    if (existing.length === 0) {
      await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
    }
  } finally {
    await admin.$disconnect();
  }

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: e2eDatabaseUrl() },
    stdio: 'pipe',
  });
}
