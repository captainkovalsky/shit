import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config';

export interface AuthenticatedRequest extends Request {
  user?: {
    telegramId: string;
    userId: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const telegramUserId = req.headers['x-telegram-user-id'] as string;

    if (!authHeader && !telegramUserId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Missing authentication credentials',
      });
      return;
    }

    if (telegramUserId) {
      // Telegram user ID authentication (for bot requests)
      req.user = {
        telegramId: telegramUserId,
        userId: '', // Will be resolved in the route handler
      };
      next();
      return;
    }

    if (authHeader) {
      // JWT token authentication
      const token = authHeader.replace('Bearer ', '');
      
      try {
        const decoded = jwt.verify(token, config.bot.token) as any;
        req.user = {
          telegramId: decoded.telegramId,
          userId: decoded.userId,
        };
        next();
        return;
      } catch (jwtError) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid token',
        });
        return;
      }
    }

    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid authentication method',
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Authentication failed',
    });
  }
};

export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const telegramUserId = req.headers['x-telegram-user-id'] as string;

    if (telegramUserId) {
      req.user = {
        telegramId: telegramUserId,
        userId: '',
      };
    } else if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, config.bot.token) as any;
        req.user = {
          telegramId: decoded.telegramId,
          userId: decoded.userId,
        };
      } catch (jwtError) {
        // Token is invalid, but we continue without authentication
        req.user = undefined;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};
