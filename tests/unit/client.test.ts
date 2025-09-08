import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

describe('Database Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (global as any).__prisma;
  });

  it('should create a new PrismaClient instance', async () => {
    const { default: prisma } = await import('@/database/client');
    
    expect(PrismaClient).toHaveBeenCalled();
    expect(prisma).toBeDefined();
  });

  it('should reuse existing PrismaClient instance in development', async () => {
    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'development';

    const { default: prisma1 } = await import('@/database/client');
    
    jest.resetModules();
    
    const { default: prisma2 } = await import('@/database/client');

    expect(prisma1).toBe(prisma2);

    process.env['NODE_ENV'] = originalEnv;
  });

  it('should create new instance in production', async () => {
    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'production';

    const { default: prisma } = await import('@/database/client');

    expect(PrismaClient).toHaveBeenCalled();
    expect(prisma).toBeDefined();

    process.env['NODE_ENV'] = originalEnv;
  });
});
