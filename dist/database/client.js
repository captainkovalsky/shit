"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const config_1 = require("@/config");
const prisma = globalThis.__prisma || new client_1.PrismaClient({
    datasources: {
        db: {
            url: config_1.config.database.url,
        },
    },
    log: config_1.config.environment === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
if (config_1.config.environment === 'development') {
    globalThis.__prisma = prisma;
}
exports.default = prisma;
//# sourceMappingURL=client.js.map