"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LevelingService = void 0;
const client_1 = require("@prisma/client");
const config_1 = require("@/config");
class LevelingService {
    static calculateXpForLevel(level) {
        return Math.floor(100 * Math.pow(level, 1.5));
    }
    static calculateTotalXpForLevel(level) {
        let total = 0;
        for (let i = 1; i < level; i++) {
            total += this.calculateXpForLevel(i);
        }
        return total;
    }
    static addXp(currentLevel, currentXp, xpGained, characterClass, currentStats) {
        const oldLevel = currentLevel;
        let newLevel = currentLevel;
        let newXp = currentXp + xpGained;
        let levelsGained = 0;
        while (newXp >= this.calculateTotalXpForLevel(newLevel + 1)) {
            newLevel++;
            levelsGained++;
        }
        if (levelsGained > 0) {
            const newStats = this.applyLevelUpStats(currentStats, characterClass, levelsGained);
            return {
                oldLevel,
                newLevel,
                levelsGained,
                xpGained,
                totalXp: newXp,
                newStats,
            };
        }
        return {
            oldLevel,
            newLevel,
            levelsGained,
            xpGained,
            totalXp: newXp,
        };
    }
    static applyLevelUpStats(stats, characterClass, levelsGained) {
        const newStats = { ...stats };
        newStats.hp += config_1.config.game.baseHpPerLevel * levelsGained;
        newStats.mp += config_1.config.game.baseMpPerLevel * levelsGained;
        newStats.attack += config_1.config.game.baseAttackPerLevel * levelsGained;
        newStats.defense += config_1.config.game.baseDefensePerLevel * levelsGained;
        newStats.speed += config_1.config.game.baseSpeedPerLevel * levelsGained;
        newStats.critChance += config_1.config.game.baseCritChancePerLevel * levelsGained;
        const classBonuses = config_1.config.game.classStatBonuses[characterClass];
        for (const [stat, bonus] of Object.entries(classBonuses)) {
            if (stat in newStats) {
                newStats[stat] += bonus * levelsGained;
            }
        }
        return newStats;
    }
    static createBaseStats(characterClass, level = 1) {
        const baseHp = 100 + (level - 1) * config_1.config.game.baseHpPerLevel;
        const baseMp = 50 + (level - 1) * config_1.config.game.baseMpPerLevel;
        const baseAttack = 10 + (level - 1) * config_1.config.game.baseAttackPerLevel;
        const baseDefense = 5 + (level - 1) * config_1.config.game.baseDefensePerLevel;
        const baseSpeed = 5.0 + (level - 1) * config_1.config.game.baseSpeedPerLevel;
        const baseCritChance = 0.05 + (level - 1) * config_1.config.game.baseCritChancePerLevel;
        let strength = 5 + level;
        let agility = 5 + level;
        let intelligence = 5 + level;
        let hpBonus = 0;
        let attackBonus = 0;
        if (characterClass === client_1.CharacterClass.WARRIOR) {
            strength = 8 + level;
            agility = 5 + level;
            intelligence = 3 + level;
            hpBonus = 20;
            attackBonus = 5;
        }
        else if (characterClass === client_1.CharacterClass.MAGE) {
            strength = 3 + level;
            agility = 5 + level;
            intelligence = 8 + level;
            hpBonus = 0;
            attackBonus = 0;
        }
        else if (characterClass === client_1.CharacterClass.ROGUE) {
            strength = 5 + level;
            agility = 8 + level;
            intelligence = 5 + level;
            hpBonus = 0;
            attackBonus = 0;
        }
        return {
            hp: baseHp + hpBonus,
            mp: baseMp,
            attack: baseAttack + attackBonus,
            defense: baseDefense,
            speed: baseSpeed,
            critChance: baseCritChance,
            strength,
            agility,
            intelligence,
        };
    }
    static getXpToNextLevel(currentLevel, currentXp) {
        const totalXpForNextLevel = this.calculateTotalXpForLevel(currentLevel + 1);
        return totalXpForNextLevel - currentXp;
    }
    static getXpProgress(currentLevel, currentXp) {
        const currentLevelXp = this.calculateTotalXpForLevel(currentLevel);
        const nextLevelXp = this.calculateTotalXpForLevel(currentLevel + 1);
        const xpInCurrentLevel = currentXp - currentLevelXp;
        const xpRequiredForLevel = nextLevelXp - currentLevelXp;
        const percentage = (xpInCurrentLevel / xpRequiredForLevel) * 100;
        return {
            current: xpInCurrentLevel,
            required: xpRequiredForLevel,
            percentage: Math.min(100, Math.max(0, percentage)),
        };
    }
    static canLevelUp(currentLevel, currentXp) {
        return currentXp >= this.calculateTotalXpForLevel(currentLevel + 1);
    }
    static getMaxLevel() {
        return 50;
    }
    static isMaxLevel(level) {
        return level >= this.getMaxLevel();
    }
}
exports.LevelingService = LevelingService;
//# sourceMappingURL=LevelingService.js.map