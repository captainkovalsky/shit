"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const config_1 = require("@/config");
const Bot_1 = require("@/bot/Bot");
const server_1 = require("@/api/server");
const logger_1 = require("@/utils/logger");
class Application {
    bot;
    apiServer;
    constructor() {
        this.bot = new Bot_1.Bot();
        this.apiServer = new server_1.ApiServer();
    }
    async start() {
        try {
            logger_1.logger.info('🚀 Starting MMO RPG Telegram Bot...');
            await this.apiServer.start();
            logger_1.logger.info('✅ API server started');
            await this.bot.start();
            logger_1.logger.info('✅ Telegram bot started');
            logger_1.logger.info('🎮 Application started successfully!');
            logger_1.logger.info(`📊 Environment: ${config_1.config.environment}`);
            logger_1.logger.info(`🌐 API running on port: ${config_1.config.port}`);
            this.setupGracefulShutdown();
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to start application:', error);
            process.exit(1);
        }
    }
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            logger_1.logger.info(`📡 Received ${signal}. Starting graceful shutdown...`);
            try {
                await this.bot.stop();
                logger_1.logger.info('✅ Bot stopped gracefully');
                logger_1.logger.info('✅ Database connections closed');
                logger_1.logger.info('👋 Application shutdown complete');
                process.exit(0);
            }
            catch (error) {
                logger_1.logger.error('❌ Error during shutdown:', error);
                process.exit(1);
            }
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGUSR2', () => shutdown('SIGUSR2'));
    }
}
const app = new Application();
app.start().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map