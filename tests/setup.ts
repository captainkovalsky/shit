import 'reflect-metadata';
import { config } from '../src/config';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_mmorpg_bot';
process.env.BOT_TOKEN = 'test_token';
process.env.JWT_SECRET_KEY = 'test_secret_key';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup test database
beforeAll(async () => {
  // Initialize test database if needed
});

afterAll(async () => {
  // Cleanup test database if needed
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
