import { LevelingService } from '../../src/game/services/LevelingService';
import { CharacterClass } from '@prisma/client';

describe('LevelingService', () => {
  describe('calculateXpForLevel', () => {
    it('should calculate XP correctly for level 1', () => {
      const xp = LevelingService.calculateXpForLevel(1);
      expect(xp).toBe(100);
    });

    it('should calculate XP correctly for level 5', () => {
      const xp = LevelingService.calculateXpForLevel(5);
      expect(xp).toBeGreaterThan(100);
      expect(xp).toBeLessThan(1000);
    });

    it('should return increasing XP for higher levels', () => {
      const xp1 = LevelingService.calculateXpForLevel(1);
      const xp2 = LevelingService.calculateXpForLevel(2);
      const xp3 = LevelingService.calculateXpForLevel(3);

      expect(xp2).toBeGreaterThan(xp1);
      expect(xp3).toBeGreaterThan(xp2);
    });
  });

  describe('calculateTotalXpForLevel', () => {
    it('should calculate total XP correctly for level 1', () => {
      const totalXp = LevelingService.calculateTotalXpForLevel(1);
      expect(totalXp).toBe(100);
    });

    it('should calculate total XP correctly for level 2', () => {
      const totalXp = LevelingService.calculateTotalXpForLevel(2);
      const expectedXp = LevelingService.calculateXpForLevel(1) + LevelingService.calculateXpForLevel(2);
      expect(totalXp).toBe(expectedXp);
    });

    it('should return increasing total XP for higher levels', () => {
      const totalXp1 = LevelingService.calculateTotalXpForLevel(1);
      const totalXp2 = LevelingService.calculateTotalXpForLevel(2);
      const totalXp3 = LevelingService.calculateTotalXpForLevel(3);

      expect(totalXp2).toBeGreaterThan(totalXp1);
      expect(totalXp3).toBeGreaterThan(totalXp2);
    });
  });

  describe('addXp', () => {
    const baseStats = {
      hp: 100,
      mp: 50,
      attack: 20,
      defense: 10,
      speed: 15,
      critChance: 0.05,
      strength: 15,
      agility: 10,
      intelligence: 5,
    };

    it('should add XP without leveling up', () => {
      const result = LevelingService.addXp(1, 0, 50, CharacterClass.WARRIOR, baseStats);

      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBe(1);
      expect(result.levelsGained).toBe(0);
      expect(result.xpGained).toBe(50);
      expect(result.totalXp).toBe(50);
      expect(result.newStats).toBeUndefined();
    });

    it('should level up when XP threshold is reached', () => {
      const result = LevelingService.addXp(1, 0, 200, CharacterClass.WARRIOR, baseStats);

      expect(result.oldLevel).toBe(1);
      expect(result.newLevel).toBeGreaterThan(1);
      expect(result.levelsGained).toBeGreaterThan(0);
      expect(result.xpGained).toBe(200);
      expect(result.totalXp).toBe(200);
      expect(result.newStats).toBeDefined();
    });

    it('should apply stat bonuses for level ups', () => {
      const result = LevelingService.addXp(1, 0, 500, CharacterClass.WARRIOR, baseStats);

      if (result.newStats) {
        expect(result.newStats.hp).toBeGreaterThan(baseStats.hp);
        expect(result.newStats.mp).toBeGreaterThan(baseStats.mp);
        expect(result.newStats.attack).toBeGreaterThan(baseStats.attack);
        expect(result.newStats.defense).toBeGreaterThan(baseStats.defense);
      }
    });
  });

  describe('createBaseStats', () => {
    it('should create base stats for warrior', () => {
      const stats = LevelingService.createBaseStats(CharacterClass.WARRIOR);

      expect(stats).toHaveProperty('hp');
      expect(stats).toHaveProperty('mp');
      expect(stats).toHaveProperty('attack');
      expect(stats).toHaveProperty('defense');
      expect(stats).toHaveProperty('speed');
      expect(stats).toHaveProperty('critChance');
      expect(stats).toHaveProperty('strength');
      expect(stats).toHaveProperty('agility');
      expect(stats).toHaveProperty('intelligence');

      expect(stats.hp).toBeGreaterThan(0);
      expect(stats.mp).toBeGreaterThan(0);
      expect(stats.attack).toBeGreaterThan(0);
      expect(stats.defense).toBeGreaterThan(0);
      expect(stats.speed).toBeGreaterThan(0);
      expect(stats.critChance).toBeGreaterThan(0);
      expect(stats.strength).toBeGreaterThan(0);
      expect(stats.agility).toBeGreaterThan(0);
      expect(stats.intelligence).toBeGreaterThan(0);
    });

    it('should create base stats for mage', () => {
      const stats = LevelingService.createBaseStats(CharacterClass.MAGE);

      expect(stats).toHaveProperty('hp');
      expect(stats).toHaveProperty('mp');
      expect(stats).toHaveProperty('attack');
      expect(stats).toHaveProperty('defense');
      expect(stats).toHaveProperty('speed');
      expect(stats).toHaveProperty('critChance');
      expect(stats).toHaveProperty('strength');
      expect(stats).toHaveProperty('agility');
      expect(stats).toHaveProperty('intelligence');

      expect(stats.hp).toBeGreaterThan(0);
      expect(stats.mp).toBeGreaterThan(0);
      expect(stats.attack).toBeGreaterThan(0);
      expect(stats.defense).toBeGreaterThan(0);
      expect(stats.speed).toBeGreaterThan(0);
      expect(stats.critChance).toBeGreaterThan(0);
      expect(stats.strength).toBeGreaterThan(0);
      expect(stats.agility).toBeGreaterThan(0);
      expect(stats.intelligence).toBeGreaterThan(0);
    });

    it('should create base stats for rogue', () => {
      const stats = LevelingService.createBaseStats(CharacterClass.ROGUE);

      expect(stats).toHaveProperty('hp');
      expect(stats).toHaveProperty('mp');
      expect(stats).toHaveProperty('attack');
      expect(stats).toHaveProperty('defense');
      expect(stats).toHaveProperty('speed');
      expect(stats).toHaveProperty('critChance');
      expect(stats).toHaveProperty('strength');
      expect(stats).toHaveProperty('agility');
      expect(stats).toHaveProperty('intelligence');

      expect(stats.hp).toBeGreaterThan(0);
      expect(stats.mp).toBeGreaterThan(0);
      expect(stats.attack).toBeGreaterThan(0);
      expect(stats.defense).toBeGreaterThan(0);
      expect(stats.speed).toBeGreaterThan(0);
      expect(stats.critChance).toBeGreaterThan(0);
      expect(stats.strength).toBeGreaterThan(0);
      expect(stats.agility).toBeGreaterThan(0);
      expect(stats.intelligence).toBeGreaterThan(0);
    });
  });

  describe('applyLevelUpStats', () => {
    const baseStats = {
      hp: 100,
      mp: 50,
      attack: 20,
      defense: 10,
      speed: 15,
      critChance: 0.05,
      strength: 15,
      agility: 10,
      intelligence: 5,
    };

    it('should apply stat increases for single level up', () => {
      const newStats = LevelingService.applyLevelUpStats(baseStats, CharacterClass.WARRIOR, 1);

      expect(newStats.hp).toBeGreaterThan(baseStats.hp);
      expect(newStats.mp).toBeGreaterThan(baseStats.mp);
      expect(newStats.attack).toBeGreaterThan(baseStats.attack);
      expect(newStats.defense).toBeGreaterThan(baseStats.defense);
      expect(newStats.speed).toBeGreaterThan(baseStats.speed);
      expect(newStats.critChance).toBeGreaterThan(baseStats.critChance);
    });

    it('should apply stat increases for multiple level ups', () => {
      const singleLevelStats = LevelingService.applyLevelUpStats(baseStats, CharacterClass.WARRIOR, 1);
      const multiLevelStats = LevelingService.applyLevelUpStats(baseStats, CharacterClass.WARRIOR, 3);

      expect(multiLevelStats.hp).toBeGreaterThan(singleLevelStats.hp);
      expect(multiLevelStats.mp).toBeGreaterThan(singleLevelStats.mp);
      expect(multiLevelStats.attack).toBeGreaterThan(singleLevelStats.attack);
    });

    it('should apply class-specific bonuses', () => {
      const warriorStats = LevelingService.applyLevelUpStats(baseStats, CharacterClass.WARRIOR, 1);
      const mageStats = LevelingService.applyLevelUpStats(baseStats, CharacterClass.MAGE, 1);
      const rogueStats = LevelingService.applyLevelUpStats(baseStats, CharacterClass.ROGUE, 1);

      expect(warriorStats.strength).toBeGreaterThan(mageStats.strength);
      expect(mageStats.intelligence).toBeGreaterThan(warriorStats.intelligence);
      expect(rogueStats.agility).toBeGreaterThan(warriorStats.agility);
    });
  });
});
