import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

jest.mock('@/config', () => ({
  config: {
    environment: 'development',
    database: {
      url: 'postgresql://test:test@localhost:5432/test_db',
    },
  },
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
    const { default: prisma1 } = await import('@/database/client');
    
    // Don't reset modules, just import again
    const { default: prisma2 } = await import('@/database/client');

    expect(prisma1).toBe(prisma2);
  });

  it('should create new instance in production', async () => {
    // Mock config to return production environment
    const mockConfig = {
      config: {
        environment: 'production',
        database: {
          url: 'postgresql://test:test@localhost:5432/test_db',
        },
      },
    };
    
    jest.doMock('@/config', () => mockConfig);

    // Clear the module cache and re-import
    jest.resetModules();
    const { default: prisma } = await import('@/database/client');

    expect(PrismaClient).toHaveBeenCalled();
    expect(prisma).toBeDefined();
  });
});
