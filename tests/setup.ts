import 'reflect-metadata';

process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test_db';
process.env['BOT_TOKEN'] = 'test-token';
process.env['REDIS_URL'] = 'redis://localhost:6379/1';
process.env['JWT_SECRET_KEY'] = 'test-jwt-secret-key';
process.env['TELEGRAM_PAYMENT_PROVIDER_TOKEN'] = 'test-payment-token';
process.env['CDN_BASE_URL'] = 'https://test-cdn.com';
process.env['SPRITE_BASE_PATH'] = '/sprites';
process.env['ASSETS_PATH'] = 'assets/sprites';
process.env['MAX_CHARACTERS_PER_USER'] = '3';
process.env['MAX_INVENTORY_SLOTS'] = '30';
process.env['BASE_INVENTORY_SLOTS'] = '20';
process.env['BASE_HP_PER_LEVEL'] = '20';
process.env['BASE_MP_PER_LEVEL'] = '10';
process.env['BASE_ATTACK_PER_LEVEL'] = '2';
process.env['BASE_DEFENSE_PER_LEVEL'] = '1';
process.env['BASE_SPEED_PER_LEVEL'] = '0.5';
process.env['BASE_CRIT_CHANCE_PER_LEVEL'] = '0.01';
process.env['PORT'] = '3000';
process.env['LOG_LEVEL'] = 'error';

jest.setTimeout(10000);