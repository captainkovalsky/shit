"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.createError = exports.errorHandler = void 0;
const config_1 = require("@/config");
const errorHandler = (error, _req, res, _next) => {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal server error';
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation error';
    }
    else if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    else if (error.name === 'PrismaClientKnownRequestError') {
        statusCode = 400;
        message = 'Database error';
    }
    else if (error.name === 'PrismaClientUnknownRequestError') {
        statusCode = 500;
        message = 'Unknown database error';
    }
    if (config_1.config.environment === 'development') {
        console.error('Error:', error);
    }
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(config_1.config.environment === 'development' && {
            stack: error.stack,
            details: error,
        }),
    });
};
exports.errorHandler = errorHandler;
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map