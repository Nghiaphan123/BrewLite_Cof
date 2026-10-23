/**
 * PrismaService — the single Prisma client provider for the API.
 *
 * Why it exists:
 * - Nest injects providers into feature services. Rather than each service
 *   constructing its own PrismaClient (which would open a connection pool
 *   per service and never close it), the whole app shares this one instance.
 * - It implements OnModuleInit / OnModuleDestroy so the connection is opened
 *   when the Nest app boots and closed when it shuts down. Tests rely on this:
 *   `e2e-app.ts` boots the app, uses the same instance for fixture setup, and
 *   `app.close()` disconnects it.
 *
 * Connection string:
 * - Reads DATABASE_URL from the environment. The `config()` call loads
 *   `.env` from the app directory first, then the repo root, so both
 *   `apps/api/.env` and the root `.env` work without extra setup.
 * - The fallback URL is a local development default; it must match the
 *   POSTGRES_* values in the root `.env` (database `brewlite`, user
 *   `brewlite`). If they drift, Prisma connects as one role while the
 *   container created another and you get "role does not exist".
 * - In Docker Compose, the api container gets its own DATABASE_URL with
 *   host `db` (see docker-compose.yml); this file does not need to know.
 *
 * Convention:
 * - This file lives in `common/` because every feature module uses it.
 *   Do not create a second PrismaService per feature.
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { PrismaClient } from '../generated/prisma/client.js';

config({ path: ['.env', '../../.env'], quiet: true });

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const databaseUrl =
      process.env.DATABASE_URL ??
      'postgresql://brewlite:change-me-local@localhost:5432/brewlite';
    super({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
