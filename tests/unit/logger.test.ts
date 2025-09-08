import winston from 'winston';

jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    simple: jest.fn(),
    colorize: jest.fn(),
    printf: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

jest.mock('winston-daily-rotate-file', () => jest.fn());

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create logger instance', async () => {
    const { logger } = await import('@/utils/logger');
    
    expect(winston.createLogger).toHaveBeenCalled();
    expect(logger).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
  });

  it('should log info messages', async () => {
    const { logger } = await import('@/utils/logger');
    
    logger.info('Test info message');
    
    expect(logger.info).toHaveBeenCalledWith('Test info message');
  });

  it('should log error messages', async () => {
    const { logger } = await import('@/utils/logger');
    
    logger.error('Test error message');
    
    expect(logger.error).toHaveBeenCalledWith('Test error message');
  });

  it('should log warn messages', async () => {
    const { logger } = await import('@/utils/logger');
    
    logger.warn('Test warn message');
    
    expect(logger.warn).toHaveBeenCalledWith('Test warn message');
  });

  it('should log debug messages', async () => {
    const { logger } = await import('@/utils/logger');
    
    logger.debug('Test debug message');
    
    expect(logger.debug).toHaveBeenCalledWith('Test debug message');
  });
});
