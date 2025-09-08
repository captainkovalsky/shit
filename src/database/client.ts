import { PrismaClient } from '@prisma/client';
import { config } from '@/config';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.__prisma || new PrismaClient({
  datasources: {
    db: {
      url: config.database.url,
    },
  },
  log: config.environment === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (config.environment === 'development') {
  globalThis.__prisma = prisma;
}

export default prisma;
