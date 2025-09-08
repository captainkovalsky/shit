import 'reflect-metadata';
import { config } from '@/config';
import { Bot } from '@/bot/Bot';
import { ApiServer } from '@/api/server';
import { logger } from '@/utils/logger';

class Application {
  private bot: Bot;
  private apiServer: ApiServer;

  constructor() {
    this.bot = new Bot();
    this.apiServer = new ApiServer();
  }

  public async start(): Promise<void> {
    try {
      logger.info('🚀 Starting MMO RPG Telegram Bot...');

      await this.apiServer.start();
      logger.info('✅ API server started');

      await this.bot.start();
      logger.info('✅ Telegram bot started');

      logger.info('🎮 Application started successfully!');
      logger.info(`📊 Environment: ${config.environment}`);
      logger.info(`🌐 API running on port: ${config.port}`);

      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('❌ Failed to start application:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`📡 Received ${signal}. Starting graceful shutdown...`);

      try {
        await this.bot.stop();
        logger.info('✅ Bot stopped gracefully');

        logger.info('✅ Database connections closed');

        logger.info('👋 Application shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon
  }
}

const app = new Application();
app.start().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
