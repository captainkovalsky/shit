"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const client_1 = __importDefault(require("../client"));
class UserService {
    db;
    constructor(db = client_1.default) {
        this.db = db;
    }
    async createUser(telegramId, username) {
        return this.db.user.create({
            data: {
                telegramId,
                username: username || null,
                gold: 0,
                gems: 0,
            },
        });
    }
    async getUserByTelegramId(telegramId) {
        return this.db.user.findUnique({
            where: { telegramId },
        });
    }
    async getUserById(id) {
        return this.db.user.findUnique({
            where: { id },
        });
    }
    async updateUser(id, data) {
        return this.db.user.update({
            where: { id },
            data,
        });
    }
    async addGold(id, amount) {
        return this.db.user.update({
            where: { id },
            data: {
                gold: {
                    increment: amount,
                },
            },
        });
    }
    async addGems(id, amount) {
        return this.db.user.update({
            where: { id },
            data: {
                gems: {
                    increment: amount,
                },
            },
        });
    }
    async spendGold(id, amount) {
        return this.db.user.update({
            where: { id },
            data: {
                gold: {
                    decrement: amount,
                },
            },
        });
    }
    async spendGems(id, amount) {
        return this.db.user.update({
            where: { id },
            data: {
                gems: {
                    decrement: amount,
                },
            },
        });
    }
    async deleteUser(id) {
        await this.db.user.delete({
            where: { id },
        });
    }
    async getUserWithCharacters(telegramId) {
        return this.db.user.findUnique({
            where: { telegramId },
            include: {
                characters: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
    }
    async getUserStats(telegramId) {
        const user = await this.db.user.findUnique({
            where: { telegramId },
            include: {
                characters: {
                    select: {
                        id: true,
                        name: true,
                        class: true,
                        level: true,
                        xp: true,
                        spriteUrl: true,
                    },
                },
                _count: {
                    select: {
                        characters: true,
                    },
                },
            },
        });
        return user;
    }
}
exports.UserService = UserService;
//# sourceMappingURL=UserService.js.map