import { Request, Response, NextFunction } from 'express';
import { requestLogger } from '@/api/middleware/requestLogger';

describe('Request Logger Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/test',
      ip: '127.0.0.1',
    };
    mockResponse = {
      statusCode: 200,
      end: jest.fn(),
    };
    mockNext = jest.fn();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockRestore();
  });

  it('should log request in development mode', () => {
    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'development';

    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('GET /test - 127.0.0.1');

    const response = mockResponse as any;
    response.end();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('GET /test - 200')
    );

    process.env['NODE_ENV'] = originalEnv;
  });

  it('should not log request in production mode', () => {
    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'production';

    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();

    process.env['NODE_ENV'] = originalEnv;
  });

  it('should call next function', () => {
    requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
