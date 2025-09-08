"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombatService = void 0;
const client_1 = require("@prisma/client");
class CombatService {
    static calculateDamage(attackerStats, defenderStats, skillMultiplier = 1.0, isCrit = false) {
        let baseDamage = attackerStats.attack * skillMultiplier;
        if (isCrit) {
            baseDamage *= 2.0;
        }
        const defenseReduction = defenderStats.defense * 0.5;
        const finalDamage = Math.max(1, Math.floor(baseDamage - defenseReduction));
        return finalDamage;
    }
    static isCriticalHit(critChance) {
        return Math.random() < critChance;
    }
    static getSkillData(characterClass, skillId) {
        const skills = {
            [client_1.CharacterClass.WARRIOR]: {
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
            [client_1.CharacterClass.MAGE]: {
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
            [client_1.CharacterClass.ROGUE]: {
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
    static simulateTurn(characterStats, enemy, action, skillId) {
        let charDamage = 0;
        let charMpCost = 0;
        let log = '';
        if (action === 'attack') {
            const isCrit = this.isCriticalHit(characterStats.critChance);
            charDamage = this.calculateDamage(characterStats, characterStats, 1.0, isCrit);
            charMpCost = 0;
            log = `You attack for ${charDamage} damage${isCrit ? ' (Critical Hit!)' : ''}`;
        }
        else if (action === 'skill' && skillId) {
            const skillData = this.getSkillData(characterStats, skillId);
            if (characterStats.mp < skillData.mpCost) {
                return {
                    characterHp: characterStats.hp,
                    characterMp: characterStats.mp,
                    enemyHp: enemy.hp,
                    damageDealt: 0,
                    mpUsed: 0,
                    result: undefined,
                    log: 'Not enough MP',
                    error: 'Not enough MP',
                };
            }
            const isCrit = this.isCriticalHit(characterStats.critChance + (skillData.critBonus || 0));
            charDamage = this.calculateDamage(characterStats, characterStats, skillData.damageMultiplier, isCrit);
            charMpCost = skillData.mpCost;
            log = `You cast ${skillId} for ${charDamage} damage${isCrit ? ' (Critical Hit!)' : ''}`;
        }
        else if (action === 'run') {
            return {
                characterHp: characterStats.hp,
                characterMp: characterStats.mp,
                enemyHp: enemy.hp,
                damageDealt: 0,
                mpUsed: 0,
                result: 'FLED',
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
                result: 'WIN',
                log: `${log}. ${enemy.name} is defeated!`,
            };
        }
        const enemyDamage = this.calculateDamage({
            hp: 0,
            mp: 0,
            attack: enemy.attack,
            defense: 0,
            speed: 0,
            critChance: 0,
            strength: 0,
            agility: 0,
            intelligence: 0,
        }, characterStats, 1.0, false);
        const newCharHp = Math.max(0, characterStats.hp - enemyDamage);
        if (newCharHp <= 0) {
            return {
                characterHp: 0,
                characterMp: characterStats.mp - charMpCost,
                enemyHp: newEnemyHp,
                damageDealt: charDamage,
                damageTaken: enemyDamage,
                mpUsed: charMpCost,
                result: 'LOSE',
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
            result: undefined,
            log: `${log}. ${enemy.name} deals ${enemyDamage} damage to you.`,
        };
    }
    static calculateBattleRating(characterLevel, enemyLevel, result) {
        const levelDiff = characterLevel - enemyLevel;
        const baseRating = 20;
        if (result === 'WIN') {
            return baseRating + levelDiff * 2;
        }
        else if (result === 'LOSE') {
            return -(baseRating + Math.abs(levelDiff) * 2);
        }
        else {
            return -5;
        }
    }
    static generateEnemyStats(baseEnemy, level) {
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
exports.CombatService = CombatService;
//# sourceMappingURL=CombatService.js.map