"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("@/config");
const errorHandler_1 = require("@/api/middleware/errorHandler");
const requestLogger_1 = require("@/api/middleware/requestLogger");
const userRoutes_1 = require("@/api/routes/userRoutes");
const characterRoutes_1 = require("@/api/routes/characterRoutes");
const battleRoutes_1 = require("@/api/routes/battleRoutes");
const questRoutes_1 = require("@/api/routes/questRoutes");
const shopRoutes_1 = require("@/api/routes/shopRoutes");
const paymentRoutes_1 = require("@/api/routes/paymentRoutes");
const webhookRoutes_1 = require("@/api/routes/webhookRoutes");
class ApiServer {
    app;
    port;
    constructor() {
        this.app = (0, express_1.default)();
        this.port = config_1.config.port;
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        this.app.use((0, helmet_1.default)());
        this.app.use((0, cors_1.default)({
            origin: config_1.config.environment === 'production'
                ? ['https://yourdomain.com']
                : true,
            credentials: true,
        }));
        this.app.use((0, compression_1.default)());
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: 15 * 60 * 1000,
            max: 100,
            message: 'Too many requests from this IP, please try again later.',
        });
        this.app.use('/api/', limiter);
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use(requestLogger_1.requestLogger);
        this.app.get('/health', (_req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                environment: config_1.config.environment,
                version: process.env['npm_package_version'] || '1.0.0',
            });
        });
    }
    setupRoutes() {
        this.app.use('/api/v1/users', userRoutes_1.userRoutes);
        this.app.use('/api/v1/characters', characterRoutes_1.characterRoutes);
        this.app.use('/api/v1/battles', battleRoutes_1.battleRoutes);
        this.app.use('/api/v1/quests', questRoutes_1.questRoutes);
        this.app.use('/api/v1/shop', shopRoutes_1.shopRoutes);
        this.app.use('/api/v1/payments', paymentRoutes_1.paymentRoutes);
        this.app.use('/webhooks', webhookRoutes_1.webhookRoutes);
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Route not found',
                message: `Cannot ${req.method} ${req.originalUrl}`,
            });
        });
    }
    setupErrorHandling() {
        this.app.use(errorHandler_1.errorHandler);
    }
    async start() {
        return new Promise((resolve, reject) => {
            try {
                this.app.listen(this.port, () => {
                    console.log(`🌐 API server started on port ${this.port}`);
                    console.log(`📊 Health check: http://localhost:${this.port}/health`);
                    resolve();
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    getApp() {
        return this.app;
    }
}
exports.ApiServer = ApiServer;
//# sourceMappingURL=server.js.map