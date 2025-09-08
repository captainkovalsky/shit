"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterService = void 0;
const client_1 = __importDefault(require("../client"));
class CharacterService {
    db;
    constructor(db = client_1.default) {
        this.db = db;
    }
    async createCharacter(userId, name, characterClass, stats, equipment) {
        return this.db.character.create({
            data: {
                userId,
                name,
                class: characterClass,
                level: 1,
                xp: 0,
                stats: stats,
                equipment: equipment,
            },
        });
    }
    async getCharacterById(id) {
        return this.db.character.findUnique({
            where: { id },
        });
    }
    async getCharacterByName(userId, name) {
        return this.db.character.findUnique({
            where: {
                userId_name: {
                    userId,
                    name,
                },
            },
        });
    }
    async getCharactersByUserId(userId) {
        return this.db.character.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async updateCharacter(id, data) {
        const { userId, ...updateData } = data;
        return this.db.character.update({
            where: { id },
            data: updateData,
        });
    }
    async updateCharacterStats(id, stats) {
        return this.db.character.update({
            where: { id },
            data: {
                stats: stats,
            },
        });
    }
    async updateCharacterEquipment(id, equipment) {
        return this.db.character.update({
            where: { id },
            data: {
                equipment: equipment,
            },
        });
    }
    async addXp(id, xp) {
        return this.db.character.update({
            where: { id },
            data: {
                xp: {
                    increment: xp,
                },
            },
        });
    }
    async levelUp(id, newLevel, newStats) {
        return this.db.character.update({
            where: { id },
            data: {
                level: newLevel,
                stats: newStats,
            },
        });
    }
    async updateSpriteUrl(id, spriteUrl) {
        return this.db.character.update({
            where: { id },
            data: { spriteUrl },
        });
    }
    async deleteCharacter(id) {
        await this.db.character.delete({
            where: { id },
        });
    }
    async getCharacterWithInventory(id) {
        return this.db.character.findUnique({
            where: { id },
            include: {
                inventory: {
                    include: {
                        item: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        telegramId: true,
                        username: true,
                        gold: true,
                        gems: true,
                    },
                },
            },
        });
    }
    async getCharacterWithQuests(id) {
        return this.db.character.findUnique({
            where: { id },
            include: {
                characterQuests: {
                    include: {
                        quest: true,
                    },
                },
            },
        });
    }
    async getCharacterWithBattles(id) {
        return this.db.character.findUnique({
            where: { id },
            include: {
                pveBattles: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                pvpMatches: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
    }
    async getCharacterCount(userId) {
        return this.db.character.count({
            where: { userId },
        });
    }
    async getCharactersByLevel(minLevel, maxLevel) {
        return this.db.character.findMany({
            where: {
                level: {
                    gte: minLevel,
                    ...(maxLevel && { lte: maxLevel }),
                },
            },
            include: {
                user: {
                    select: {
                        telegramId: true,
                        username: true,
                    },
                },
            },
        });
    }
}
exports.CharacterService = CharacterService;
//# sourceMappingURL=CharacterService.js.map