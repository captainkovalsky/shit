import { PrismaClient } from '@prisma/client';
import { config } from '@/config/index';

declare global {
  var __prisma: PrismaClient | undefined;
}

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
