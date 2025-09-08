import { BossService } from '@/game/services/BossService';

describe('BossService', () => {
  let bossService: BossService;

  beforeEach(() => {
    bossService = new BossService();
  });

  describe('getBossById', () => {
    it('should return boss by id', () => {
      const boss = bossService.getBossById('goblin_chief');
      
      expect(boss).toBeDefined();
      expect(boss?.name).toBe('Goblin Chief');
      expect(boss?.level).toBe(5);
      expect(boss?.hp).toBe(1500);
    });

    it('should return null for non-existent boss', () => {
      const boss = bossService.getBossById('non_existent');
      
      expect(boss).toBeNull();
    });
  });

  describe('getAllBosses', () => {
    it('should return all bosses', () => {
      const bosses = bossService.getAllBosses();
      
      expect(bosses.length).toBe(3);
      expect(bosses.map(b => b.name)).toContain('Goblin Chief');
      expect(bosses.map(b => b.name)).toContain('Dragon\'s Guardian');
      expect(bosses.map(b => b.name)).toContain('Dragon Lord');
    });
  });

  describe('createBossBattle', () => {
    it('should create a boss battle state', async () => {
      const characterId = 'test-character-id';
      const bossId = 'goblin_chief';
      
      const battleState = await bossService.createBossBattle(characterId, bossId);
      
      expect(battleState).toBeDefined();
      expect(battleState.boss.name).toBe('Goblin Chief');
      expect(battleState.character.id).toBe(characterId);
      expect(battleState.turn).toBe(1);
      expect(battleState.bossHp).toBe(1500);
      expect(battleState.characterHp).toBeGreaterThan(0);
    });

    it('should throw error for non-existent boss', async () => {
      const characterId = 'test-character-id';
      const bossId = 'non_existent';
      
      await expect(bossService.createBossBattle(characterId, bossId)).rejects.toThrow('Boss not found');
    });
  });

  describe('executeBossTurn', () => {
    it('should execute boss turn and update battle state', async () => {
      const characterId = 'test-character-id';
      const bossId = 'goblin_chief';
      
      const battleState = await bossService.createBossBattle(characterId, bossId);
      const newBattleState = bossService.executeBossTurn(battleState);
      
      expect(newBattleState.turn).toBe(battleState.turn + 1);
      expect(newBattleState.log.length).toBeGreaterThan(battleState.log.length);
    });

    it('should trigger enrage when boss HP is low', async () => {
      const characterId = 'test-character-id';
      const bossId = 'goblin_chief';
      
      const battleState = await bossService.createBossBattle(characterId, bossId);
      battleState.bossHp = 500; // Below 50% threshold
      
      const newBattleState = bossService.executeBossTurn(battleState);
      
      expect(newBattleState.isEnraged).toBe(true);
      expect(newBattleState.boss.isEnraged).toBe(true);
    });
  });

  describe('calculateBossRewards', () => {
    it('should calculate rewards based on boss and character level', () => {
      const boss = bossService.getBossById('goblin_chief')!;
      const characterLevel = 5;
      
      const rewards = bossService.calculateBossRewards(boss, characterLevel);
      
      expect(rewards.xp).toBeGreaterThan(0);
      expect(rewards.gold).toBeGreaterThan(0);
      expect(rewards.items).toContain('rare_weapon');
    });

    it('should apply level multiplier for higher level characters', () => {
      const boss = bossService.getBossById('goblin_chief')!;
      const lowLevelRewards = bossService.calculateBossRewards(boss, 3);
      const highLevelRewards = bossService.calculateBossRewards(boss, 7);
      
      expect(highLevelRewards.xp).toBeGreaterThan(lowLevelRewards.xp);
      expect(highLevelRewards.gold).toBeGreaterThan(lowLevelRewards.gold);
    });
  });

  describe('checkBossDefeated', () => {
    it('should return true when boss HP is 0', async () => {
      const characterId = 'test-character-id';
      const bossId = 'goblin_chief';
      
      const battleState = await bossService.createBossBattle(characterId, bossId);
      battleState.bossHp = 0;
      
      const isDefeated = bossService.checkBossDefeated(battleState);
      
      expect(isDefeated).toBe(true);
    });

    it('should return false when boss HP is above 0', async () => {
      const characterId = 'test-character-id';
      const bossId = 'goblin_chief';
      
      const battleState = await bossService.createBossBattle(characterId, bossId);
      battleState.bossHp = 100;
      
      const isDefeated = bossService.checkBossDefeated(battleState);
      
      expect(isDefeated).toBe(false);
    });
  });

  describe('checkCharacterDefeated', () => {
    it('should return true when character HP is 0', async () => {
      const characterId = 'test-character-id';
      const bossId = 'goblin_chief';
      
      const battleState = await bossService.createBossBattle(characterId, bossId);
      battleState.characterHp = 0;
      
      const isDefeated = bossService.checkCharacterDefeated(battleState);
      
      expect(isDefeated).toBe(true);
    });

    it('should return false when character HP is above 0', async () => {
      const characterId = 'test-character-id';
      const bossId = 'goblin_chief';
      
      const battleState = await bossService.createBossBattle(characterId, bossId);
      battleState.characterHp = 100;
      
      const isDefeated = bossService.checkCharacterDefeated(battleState);
      
      expect(isDefeated).toBe(false);
    });
  });

  describe('boss skills', () => {
    it('should have correct skills for Goblin Chief', () => {
      const boss = bossService.getBossById('goblin_chief')!;
      
      expect(boss.skills.length).toBe(3);
      expect(boss.skills.map(s => s.name)).toContain('Smash');
      expect(boss.skills.map(s => s.name)).toContain('Roar');
      expect(boss.skills.map(s => s.name)).toContain('Enrage');
    });

    it('should have correct skills for Dragon Guardian', () => {
      const boss = bossService.getBossById('dragon_guardian')!;
      
      expect(boss.skills.length).toBe(2);
      expect(boss.skills.map(s => s.name)).toContain('Stone Slam');
      expect(boss.skills.map(s => s.name)).toContain('Earthquake');
    });

    it('should have correct skills for Dragon Lord', () => {
      const boss = bossService.getBossById('dragon_lord')!;
      
      expect(boss.skills.length).toBe(3);
      expect(boss.skills.map(s => s.name)).toContain('Fire Breath');
      expect(boss.skills.map(s => s.name)).toContain('Tail Swipe');
      expect(boss.skills.map(s => s.name)).toContain('Enrage');
    });
  });
});
