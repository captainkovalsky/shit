import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '@/api/middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle AppError with status code', () => {
    const error: AppError = new Error('Test error');
    error.statusCode = 400;
    error.isOperational = true;

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Test error',
      ...(process.env['NODE_ENV'] === 'development' && { 
        stack: error.stack,
        details: error 
      })
    });
  });

  it('should handle generic error with 500 status', () => {
    const error = new Error('Generic error');

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Generic error',
      ...(process.env['NODE_ENV'] === 'development' && { 
        stack: error.stack,
        details: error 
      })
    });
  });

  it('should include stack trace in development mode', () => {
    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'development';

    const error = new Error('Test error');

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Test error',
      stack: error.stack,
      details: error
    });

    process.env['NODE_ENV'] = originalEnv;
  });

  it('should not include stack trace in production mode', () => {
    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'production';

    const error = new Error('Test error');

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Test error'
    });

    process.env['NODE_ENV'] = originalEnv;
  });
});
