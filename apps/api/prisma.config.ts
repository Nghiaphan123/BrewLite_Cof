// Prisma CLI configuration (C-03, ADR 002).
// Prisma 7 no longer reads DATABASE_URL from schema.prisma or loads .env by itself.
// Values come from the process environment (Docker Compose, CI, hosting platform),
// or from a local .env file in apps/api or at the repository root.
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: ['.env', '../../.env'], quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // A placeholder keeps `prisma validate` and `prisma generate` working without a database.
    url:
      process.env.DATABASE_URL ??
      'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
});
