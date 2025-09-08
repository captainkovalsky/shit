import { CombatService } from '../../src/game/services/CombatService';
import { CharacterClass } from '@prisma/client';

describe('CombatService', () => {
  describe('calculateDamage', () => {
    it('should calculate basic damage correctly', () => {
      const attackerStats = {
        hp: 100,
        mp: 50,
        attack: 20,
        defense: 10,
        speed: 15,
        critChance: 0.05,
        strength: 15,
        agility: 10,
        intelligence: 5,
        class: CharacterClass.WARRIOR,
      };

      const defenderStats = {
        hp: 100,
        mp: 50,
        attack: 15,
        defense: 12,
        speed: 10,
        critChance: 0.03,
        strength: 12,
        agility: 8,
        intelligence: 7,
        class: CharacterClass.WARRIOR,
      };

      const damage = CombatService.calculateDamage(attackerStats, defenderStats);

      expect(damage).toBeGreaterThan(0);
      expect(damage).toBeLessThanOrEqual(attackerStats.attack);
    });

    it('should handle critical hits', () => {
      const attackerStats = {
        hp: 100,
        mp: 50,
        attack: 20,
        defense: 10,
        speed: 15,
        critChance: 1.0,
        strength: 15,
        agility: 10,
        intelligence: 5,
        class: CharacterClass.WARRIOR,
      };

      const defenderStats = {
        hp: 100,
        mp: 50,
        attack: 15,
        defense: 12,
        speed: 10,
        critChance: 0.03,
        strength: 12,
        agility: 8,
        intelligence: 7,
        class: CharacterClass.WARRIOR,
      };

      const normalDamage = CombatService.calculateDamage(attackerStats, defenderStats, 1.0, false);
      const critDamage = CombatService.calculateDamage(attackerStats, defenderStats, 1.0, true);

      expect(critDamage).toBeGreaterThan(normalDamage);
      expect(critDamage).toBeGreaterThan(attackerStats.attack);
    });
  });

  describe('isCriticalHit', () => {
    it('should return true for 100% crit chance', () => {
      const result = CombatService.isCriticalHit(1.0);
      expect(result).toBe(true);
    });

    it('should return false for 0% crit chance', () => {
      const result = CombatService.isCriticalHit(0.0);
      expect(result).toBe(false);
    });

    it('should return boolean for any crit chance', () => {
      const result = CombatService.isCriticalHit(0.5);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('executeTurn', () => {
    const characterStats = {
      hp: 100,
      mp: 50,
      attack: 20,
      defense: 10,
      speed: 15,
      critChance: 0.05,
      strength: 15,
      agility: 10,
      intelligence: 5,
      class: CharacterClass.MAGE,
    };

    const enemy = {
      name: 'Goblin',
      level: 1,
      hp: 50,
      attack: 15,
      defense: 5,
      speed: 10,
      xpReward: 100,
      goldReward: [10, 20] as [number, number],
      lootChance: 0.1,
      description: 'A small goblin',
    };

    it('should execute basic attack turn', () => {
      const result = CombatService.simulateTurn(
        characterStats,
        enemy,
        'attack',
        undefined
      );

      expect(result).toHaveProperty('characterHp');
      expect(result).toHaveProperty('characterMp');
      expect(result).toHaveProperty('enemyHp');
      expect(result).toHaveProperty('damageDealt');
      expect(result).toHaveProperty('mpUsed');
      expect(result).toHaveProperty('log');
      expect(result.log).toContain('attack');
    });

    it('should execute skill turn', () => {
      const result = CombatService.simulateTurn(
        characterStats,
        enemy,
        'skill',
        'fireball'
      );

      expect(result).toHaveProperty('characterHp');
      expect(result).toHaveProperty('characterMp');
      expect(result).toHaveProperty('enemyHp');
      expect(result).toHaveProperty('damageDealt');
      expect(result).toHaveProperty('mpUsed');
      expect(result).toHaveProperty('log');
    });

    it('should handle flee action', () => {
      const result = CombatService.simulateTurn(
        characterStats,
        enemy,
        'run',
        undefined
      );

      expect(result).toHaveProperty('result');
      expect(result.result).toBe('FLED');
      expect(result.log).toContain('fled');
    });

    it('should handle insufficient MP for skill', () => {
      const lowMpStats = { ...characterStats, mp: 0 };
      
      const result = CombatService.simulateTurn(
        lowMpStats,
        enemy,
        'skill',
        'fireball'
      );

      expect(result).toHaveProperty('error');
      expect(result.error).toBe('Not enough MP');
      expect(result.mpUsed).toBe(0);
    });
  });

  describe('calculateBattleRating', () => {
    it('should return positive rating for higher level character', () => {
      const rating = CombatService.calculateBattleRating(5, 3, 'WIN');
      expect(rating).toBeGreaterThan(0);
    });

    it('should return negative rating for lower level character', () => {
      const rating = CombatService.calculateBattleRating(3, 5, 'LOSE');
      expect(rating).toBeLessThan(0);
    });

    it('should return base rating for same level', () => {
      const rating = CombatService.calculateBattleRating(5, 5, 'WIN');
      expect(rating).toBe(20);
    });
  });

  describe('getSkillData', () => {
    it('should return skill data for valid skill', () => {
      const skillData = CombatService.getSkillData(CharacterClass.MAGE, 'fireball');
      
      expect(skillData).toHaveProperty('damageMultiplier');
      expect(skillData).toHaveProperty('mpCost');
      expect(skillData.damageMultiplier).toBeGreaterThan(1);
      expect(skillData.mpCost).toBeGreaterThan(0);
    });

    it('should return default skill data for invalid skill', () => {
      const skillData = CombatService.getSkillData(CharacterClass.MAGE, 'invalid_skill');
      
      expect(skillData).toHaveProperty('damageMultiplier');
      expect(skillData).toHaveProperty('mpCost');
      expect(skillData.damageMultiplier).toBe(1);
      expect(skillData.mpCost).toBe(0);
    });
  });
});
