import { Request, Response, NextFunction } from 'express';
import { config } from '@/config';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  if (config.environment === 'development') {
    console.log(`${req.method} ${req.path} - ${req.ip}`);
  }

  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - start;
    
    if (config.environment === 'development') {
      console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};
