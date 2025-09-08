import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from '@/config/index';
import { errorHandler } from '@/api/middleware/errorHandler';
import { requestLogger } from '@/api/middleware/requestLogger';
import { userRoutes } from '@/api/routes/userRoutes';
import { characterRoutes } from '@/api/routes/characterRoutes';
import { battleRoutes } from '@/api/routes/battleRoutes';
import { questRoutes } from '@/api/routes/questRoutes';
import { shopRoutes } from '@/api/routes/shopRoutes';
import { paymentRoutes } from '@/api/routes/paymentRoutes';
import { webhookRoutes } from '@/api/routes/webhookRoutes';

export class ApiServer {
  private app: express.Application;
  private port: number;
  private server: any;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    
    this.app.use(cors({
      origin: config.environment === 'production' 
        ? ['https://yourdomain.com'] 
        : true,
      credentials: true,
    }));

    this.app.use(compression());

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    });
    this.app.use('/api/', limiter);

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    this.app.use(requestLogger);

    this.app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: config.environment,
        version: process.env['npm_package_version'] || '1.0.0',
      });
    });
  }

  private setupRoutes(): void {
    this.app.use('/api/v1/users', userRoutes);
    this.app.use('/api/v1/characters', characterRoutes);
    this.app.use('/api/v1/battles', battleRoutes);
    this.app.use('/api/v1/quests', questRoutes);
    this.app.use('/api/v1/shop', shopRoutes);
    this.app.use('/api/v1/payments', paymentRoutes);
    this.app.use('/webhooks', webhookRoutes);

    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          console.log(`🌐 API server started on port ${this.port}`);
          console.log(`📊 Health check: http://localhost:${this.port}/health`);
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public getApp(): express.Application {
    return this.app;
  }

  public async close(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          resolve();
        });
      });
    }
  }
}
