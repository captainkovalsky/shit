import { CharacterClass } from '@prisma/client';
interface CharacterStats {
    hp: number;
    mp: number;
    attack: number;
    defense: number;
    speed: number;
    critChance: number;
    strength: number;
    agility: number;
    intelligence: number;
}
interface LevelUpResult {
    oldLevel: number;
    newLevel: number;
    levelsGained: number;
    xpGained: number;
    totalXp: number;
    newStats?: CharacterStats;
}
export declare class LevelingService {
    static calculateXpForLevel(level: number): number;
    static calculateTotalXpForLevel(level: number): number;
    static addXp(currentLevel: number, currentXp: number, xpGained: number, characterClass: CharacterClass, currentStats: CharacterStats): LevelUpResult;
    static applyLevelUpStats(stats: CharacterStats, characterClass: CharacterClass, levelsGained: number): CharacterStats;
    static createBaseStats(characterClass: CharacterClass, level?: number): CharacterStats;
    static getXpToNextLevel(currentLevel: number, currentXp: number): number;
    static getXpProgress(currentLevel: number, currentXp: number): {
        current: number;
        required: number;
        percentage: number;
    };
    static canLevelUp(currentLevel: number, currentXp: number): boolean;
    static getMaxLevel(): number;
    static isMaxLevel(level: number): boolean;
}
export {};
//# sourceMappingURL=LevelingService.d.ts.map