import 'reflect-metadata';

process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test_db';
process.env['BOT_TOKEN'] = 'test-token';
process.env['REDIS_URL'] = 'redis://localhost:6379/1';

jest.setTimeout(10000);