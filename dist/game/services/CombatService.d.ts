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
export declare class CombatService {
    static calculateDamage(attackerStats: CharacterStats, defenderStats: CharacterStats, skillMultiplier?: number, isCrit?: boolean): number;
    static isCriticalHit(critChance: number): boolean;
    static getSkillData(characterClass: CharacterClass, skillId: string): SkillData;
    static simulateTurn(characterStats: CharacterStats, enemy: Enemy, action: 'attack' | 'skill' | 'item' | 'run', skillId?: string): TurnResult;
    static calculateBattleRating(characterLevel: number, enemyLevel: number, result: 'WIN' | 'LOSE' | 'FLED'): number;
    static generateEnemyStats(baseEnemy: Enemy, level: number): Enemy;
}
export {};
//# sourceMappingURL=CombatService.d.ts.map