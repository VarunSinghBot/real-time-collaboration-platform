// apps/api/prisma.config.ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',   // path to your Prisma schema
  datasource: {
    url: env('DATABASE_URL'), // direct DB connection
  },
  migrations: {
    path: './prisma/migrations',
  },
});
