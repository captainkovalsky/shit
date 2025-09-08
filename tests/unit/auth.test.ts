import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '@/api/middleware/auth';

jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should call next() for valid JWT token', async () => {
      const mockPayload = { telegramId: '123', userId: 'user123' };
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockJwt.verify.mockReturnValue(mockPayload as any);

      await authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next() for telegram user ID header', async () => {
      mockRequest.headers = { 'x-telegram-user-id': '123' };

      await authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual({ telegramId: '123', userId: '' });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 for missing credentials', async () => {
      await authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Missing authentication credentials'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should call next() even without credentials', async () => {
      await optionalAuthMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should set user for valid telegram ID', async () => {
      mockRequest.headers = { 'x-telegram-user-id': '123' };

      await optionalAuthMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual({ telegramId: '123', userId: '' });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should set user for valid JWT token', async () => {
      const mockPayload = { telegramId: '123', userId: 'user123' };
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockJwt.verify.mockReturnValue(mockPayload as any);

      await optionalAuthMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue with undefined user for invalid token', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await optionalAuthMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
