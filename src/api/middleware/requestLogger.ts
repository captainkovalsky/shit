import { Request, Response, NextFunction } from 'express';
import { config } from '@/config/index';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  if (config.environment === 'development') {
    console.log(`${req.method} ${req.path} - ${req.ip}`);
  }

  const originalEnd = res.end;
  res.end = function(chunk?: unknown, encoding?: BufferEncoding): Response {
    const duration = Date.now() - start;
    
    if (config.environment === 'development') {
      console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    }

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};
