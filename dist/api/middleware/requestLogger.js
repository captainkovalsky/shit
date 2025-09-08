"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const config_1 = require("@/config");
const requestLogger = (req, res, next) => {
    const start = Date.now();
    if (config_1.config.environment === 'development') {
        console.log(`${req.method} ${req.path} - ${req.ip}`);
    }
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const duration = Date.now() - start;
        if (config_1.config.environment === 'development') {
            console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
        }
        return originalEnd.call(this, chunk, encoding);
    };
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=requestLogger.js.map