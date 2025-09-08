import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config/index';
import { JwtPayload } from '@/types';

export interface AuthenticatedRequest extends Request {
  user?: {
    telegramId: string;
    userId: string;
  } | undefined;
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
      req.user = {
        telegramId: telegramUserId,
        userId: '', // Will be resolved in the route handler
      };
      next();
      return;
    }

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      
      try {
        const decoded = jwt.verify(token, config.bot.token) as JwtPayload;
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
  _res: Response,
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
        const decoded = jwt.verify(token, config.bot.token) as JwtPayload;
        req.user = {
          telegramId: decoded.telegramId,
          userId: decoded.userId,
        };
      } catch (jwtError) {
        req.user = undefined;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};
