import { CharacterClass } from '@prisma/client';
import { config } from '@/config/index';

export interface CharacterStats {
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

export interface ILevelingService {
  createBaseStats(characterClass: CharacterClass): CharacterStats;
  calculateLevelUpStats(
    currentStats: CharacterStats,
    characterClass: CharacterClass,
    newLevel: number
  ): CharacterStats;
  calculateXpRequired(level: number): number;
  canLevelUp(currentXp: number, currentLevel: number): boolean;
  getLevelFromXp(xp: number): number;
}

export class LevelingService implements ILevelingService {
  static calculateXpForLevel(level: number): number {
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  static calculateTotalXpForLevel(level: number): number {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += this.calculateXpForLevel(i);
    }
    return total;
  }

  static addXp(
    currentLevel: number,
    currentXp: number,
    xpGained: number,
    characterClass: CharacterClass,
    currentStats: CharacterStats
  ): LevelUpResult {
    const oldLevel = currentLevel;
    let newLevel = currentLevel;
    let newXp = currentXp + xpGained;
    let levelsGained = 0;

    while (newXp >= this.calculateTotalXpForLevel(newLevel + 1)) {
      newLevel++;
      levelsGained++;
    }

    if (levelsGained > 0) {
      const newStats = this.applyLevelUpStats(
        currentStats,
        characterClass,
        levelsGained
      );
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

  static applyLevelUpStats(
    stats: CharacterStats,
    characterClass: CharacterClass,
    levelsGained: number
  ): CharacterStats {
    const newStats = { ...stats };

    newStats.hp += config.game.baseHpPerLevel * levelsGained;
    newStats.mp += config.game.baseMpPerLevel * levelsGained;
    newStats.attack += config.game.baseAttackPerLevel * levelsGained;
    newStats.defense += config.game.baseDefensePerLevel * levelsGained;
    newStats.speed += config.game.baseSpeedPerLevel * levelsGained;
    newStats.critChance += config.game.baseCritChancePerLevel * levelsGained;

    const classBonuses = config.game.classStatBonuses[characterClass];
    for (const [stat, bonus] of Object.entries(classBonuses)) {
      if (stat in newStats) {
        (newStats as any)[stat] += (bonus as number) * levelsGained;
      }
    }

    return newStats;
  }

  static createBaseStats(characterClass: CharacterClass, level: number = 1): CharacterStats {
    const baseHp = 100 + (level - 1) * config.game.baseHpPerLevel;
    const baseMp = 50 + (level - 1) * config.game.baseMpPerLevel;
    const baseAttack = 10 + (level - 1) * config.game.baseAttackPerLevel;
    const baseDefense = 5 + (level - 1) * config.game.baseDefensePerLevel;
    const baseSpeed = 5.0 + (level - 1) * config.game.baseSpeedPerLevel;
    const baseCritChance = 0.05 + (level - 1) * config.game.baseCritChancePerLevel;

    let strength = 5 + level;
    let agility = 5 + level;
    let intelligence = 5 + level;
    let hpBonus = 0;
    let attackBonus = 0;

    if (characterClass === CharacterClass.WARRIOR) {
      strength = 8 + level;
      agility = 5 + level;
      intelligence = 3 + level;
      hpBonus = 20;
      attackBonus = 5;
    } else if (characterClass === CharacterClass.MAGE) {
      strength = 3 + level;
      agility = 5 + level;
      intelligence = 8 + level;
      hpBonus = 0;
      attackBonus = 0;
    } else if (characterClass === CharacterClass.ROGUE) {
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

  static getXpToNextLevel(currentLevel: number, currentXp: number): number {
    const totalXpForNextLevel = this.calculateTotalXpForLevel(currentLevel + 1);
    return totalXpForNextLevel - currentXp;
  }

  static getXpProgress(currentLevel: number, currentXp: number): {
    current: number;
    required: number;
    percentage: number;
  } {
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

  static canLevelUp(currentLevel: number, currentXp: number): boolean {
    return currentXp >= this.calculateTotalXpForLevel(currentLevel + 1);
  }

  static getMaxLevel(): number {
    return 50; // Season 1 max level
  }

  static isMaxLevel(level: number): boolean {
    return level >= this.getMaxLevel();
  }

  // Interface implementation methods
  createBaseStats(characterClass: CharacterClass): CharacterStats {
    return LevelingService.createBaseStats(characterClass, 1);
  }

  calculateLevelUpStats(
    currentStats: CharacterStats,
    characterClass: CharacterClass,
    newLevel: number
  ): CharacterStats {
    const levelsGained = newLevel - 1; // Assuming starting from level 1
    return LevelingService.applyLevelUpStats(currentStats, characterClass, levelsGained);
  }

  calculateXpRequired(level: number): number {
    return LevelingService.calculateTotalXpForLevel(level);
  }

  canLevelUp(currentXp: number, currentLevel: number): boolean {
    return LevelingService.canLevelUp(currentLevel, currentXp);
  }

  getLevelFromXp(xp: number): number {
    let level = 1;
    while (xp >= LevelingService.calculateTotalXpForLevel(level + 1)) {
      level++;
    }
    return level;
  }
}
