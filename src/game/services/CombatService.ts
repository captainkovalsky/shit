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
  class: CharacterClass;
}

interface Enemy {
  name: string;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  xpReward: number;
  goldReward: [number, number];
  lootChance: number;
  description: string;
  specialAbilities?: string[];
}

interface SkillData {
  damageMultiplier: number;
  mpCost: number;
  critBonus?: number;
  stunChance?: number;
  buffAttack?: number;
  duration?: number;
  aoe?: boolean;
  element?: string;
  absorbDamage?: number;
  dodgeChance?: number;
  multiHit?: number;
}

interface TurnResult {
  characterHp: number;
  characterMp: number;
  enemyHp: number;
  damageDealt: number;
  damageTaken?: number;
  mpUsed: number;
  result?: 'WIN' | 'LOSE' | 'FLED';
  log: string;
  error?: string;
}

export class CombatService {
  static calculateDamage(
    attackerStats: CharacterStats,
    defenderStats: CharacterStats,
    skillMultiplier: number = 1.0,
    isCrit: boolean = false
  ): number {
    let baseDamage = attackerStats.attack * skillMultiplier;

    if (isCrit) {
      baseDamage *= 2.0;
    }

    const defenseReduction = defenderStats.defense * 0.5;
    const finalDamage = Math.max(1, Math.floor(baseDamage - defenseReduction));

    return finalDamage;
  }

  static isCriticalHit(critChance: number): boolean {
    return Math.random() < critChance;
  }

  static getSkillData(characterClass: CharacterClass, skillId: string): SkillData {
    const skills: Record<CharacterClass, Record<string, SkillData>> = {
      [CharacterClass.WARRIOR]: {
        shield_slam: {
          damageMultiplier: 1.2,
          mpCost: 10,
          stunChance: 0.3,
        },
        battle_cry: {
          damageMultiplier: 0,
          mpCost: 15,
          buffAttack: 0.2,
          duration: 3,
        },
        whirlwind: {
          damageMultiplier: 0.8,
          mpCost: 25,
          aoe: true,
        },
      },
      [CharacterClass.MAGE]: {
        fireball: {
          damageMultiplier: 1.5,
          mpCost: 12,
          element: 'fire',
        },
        ice_barrier: {
          damageMultiplier: 0,
          mpCost: 20,
          absorbDamage: 0.3,
          duration: 2,
        },
        lightning_storm: {
          damageMultiplier: 1.0,
          mpCost: 30,
          aoe: true,
          stunChance: 0.1,
        },
      },
      [CharacterClass.ROGUE]: {
        backstab: {
          damageMultiplier: 2.0,
          mpCost: 8,
          critBonus: 0.5,
        },
        smoke_bomb: {
          damageMultiplier: 0,
          mpCost: 12,
          dodgeChance: 0.5,
        },
        blade_dance: {
          damageMultiplier: 0.7,
          mpCost: 18,
          multiHit: 3,
        },
      },
    };

    return skills[characterClass]?.[skillId] || { damageMultiplier: 1.0, mpCost: 0 };
  }

  static simulateTurn(
    characterStats: CharacterStats,
    enemy: Enemy,
    action: 'attack' | 'skill' | 'item' | 'run',
    skillId?: string
  ): TurnResult {
    let charDamage = 0;
    let charMpCost = 0;
    let log = '';

    if (action === 'attack') {
      const isCrit = this.isCriticalHit(characterStats.critChance);
      charDamage = this.calculateDamage(characterStats, characterStats, 1.0, isCrit);
      charMpCost = 0;
      log = `You attack for ${charDamage} damage${isCrit ? ' (Critical Hit!)' : ''}`;
    } else if (action === 'skill' && skillId) {
      const skillData = this.getSkillData(characterStats.class as CharacterClass, skillId);
      
      if (characterStats.mp < skillData.mpCost) {
        return {
          characterHp: characterStats.hp,
          characterMp: characterStats.mp,
          enemyHp: enemy.hp,
          damageDealt: 0,
          mpUsed: 0,
          result: undefined as any,
          log: 'Not enough MP',
          error: 'Not enough MP',
        };
      }

      const isCrit = this.isCriticalHit(
        characterStats.critChance + (skillData.critBonus || 0)
      );
      charDamage = this.calculateDamage(
        characterStats,
        characterStats,
        skillData.damageMultiplier,
        isCrit
      );
      charMpCost = skillData.mpCost;
      log = `You cast ${skillId} for ${charDamage} damage${isCrit ? ' (Critical Hit!)' : ''}`;
    } else if (action === 'run') {
      return {
        characterHp: characterStats.hp,
        characterMp: characterStats.mp,
        enemyHp: enemy.hp,
        damageDealt: 0,
        mpUsed: 0,
        result: 'FLED' as any,
        log: 'You fled from battle!',
      };
    }

    const newEnemyHp = Math.max(0, enemy.hp - charDamage);

    if (newEnemyHp <= 0) {
      return {
        characterHp: characterStats.hp,
        characterMp: characterStats.mp - charMpCost,
        enemyHp: 0,
        damageDealt: charDamage,
        mpUsed: charMpCost,
        result: 'WIN' as any,
        log: `${log}. ${enemy.name} is defeated!`,
      };
    }

    const enemyDamage = this.calculateDamage(
      {
        hp: 0,
        mp: 0,
        attack: enemy.attack,
        defense: 0,
        speed: 0,
        critChance: 0,
        strength: 0,
        agility: 0,
        intelligence: 0,
        class: CharacterClass.WARRIOR,
      },
      characterStats,
      1.0,
      false
    );

    const newCharHp = Math.max(0, characterStats.hp - enemyDamage);

    if (newCharHp <= 0) {
      return {
        characterHp: 0,
        characterMp: characterStats.mp - charMpCost,
        enemyHp: newEnemyHp,
        damageDealt: charDamage,
        damageTaken: enemyDamage,
        mpUsed: charMpCost,
        result: 'LOSE' as any,
        log: `${log}. ${enemy.name} deals ${enemyDamage} damage to you. You are defeated!`,
      };
    }

    return {
      characterHp: newCharHp,
      characterMp: characterStats.mp - charMpCost,
      enemyHp: newEnemyHp,
      damageDealt: charDamage,
      damageTaken: enemyDamage,
      mpUsed: charMpCost,
      result: undefined as any,
      log: `${log}. ${enemy.name} deals ${enemyDamage} damage to you.`,
    };
  }

  static calculateBattleRating(
    characterLevel: number,
    enemyLevel: number,
    result: 'WIN' | 'LOSE' | 'FLED'
  ): number {
    const levelDiff = characterLevel - enemyLevel;
    const baseRating = 20;

    if (result === 'WIN') {
      return baseRating + levelDiff * 2;
    } else if (result === 'LOSE') {
      return -(baseRating + Math.abs(levelDiff) * 2);
    } else {
      return -5; // Fleeing penalty
    }
  }

  static generateEnemyStats(baseEnemy: Enemy, level: number): Enemy {
    return {
      ...baseEnemy,
      level,
      hp: baseEnemy.hp + (level - 1) * 10,
      attack: baseEnemy.attack + (level - 1) * 2,
      defense: baseEnemy.defense + (level - 1),
      speed: baseEnemy.speed + (level - 1) * 0.5,
      xpReward: baseEnemy.xpReward + (level - 1) * 5,
    };
  }
}
