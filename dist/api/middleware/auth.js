"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("@/config");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const telegramUserId = req.headers['x-telegram-user-id'];
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
                userId: '',
            };
            next();
            return;
        }
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            try {
                const decoded = jsonwebtoken_1.default.verify(token, config_1.config.bot.token);
                req.user = {
                    telegramId: decoded.telegramId,
                    userId: decoded.userId,
                };
                next();
                return;
            }
            catch (jwtError) {
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
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Authentication failed',
        });
    }
};
exports.authMiddleware = authMiddleware;
const optionalAuthMiddleware = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const telegramUserId = req.headers['x-telegram-user-id'];
        if (telegramUserId) {
            req.user = {
                telegramId: telegramUserId,
                userId: '',
            };
        }
        else if (authHeader) {
            try {
                const token = authHeader.replace('Bearer ', '');
                const decoded = jsonwebtoken_1.default.verify(token, config_1.config.bot.token);
                req.user = {
                    telegramId: decoded.telegramId,
                    userId: decoded.userId,
                };
            }
            catch (jwtError) {
                req.user = undefined;
            }
        }
        next();
    }
    catch (error) {
        console.error('Optional auth middleware error:', error);
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
//# sourceMappingURL=auth.js.map