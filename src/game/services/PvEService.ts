import { PrismaClient, Character, PveBattle, BattleResult } from '@prisma/client';
import prisma from '../../database/client';
import { CombatService, CharacterStats, Enemy, TurnResult } from './CombatService';
import { BossService, BossBattleState } from './BossService';
import { QuestService } from '../../database/services/QuestService';
import { UserService } from '../../database/services/UserService';
import { CharacterService } from '../../database/services/CharacterService';
import { LevelingService } from './LevelingService';

export interface PvEBattleResult {
  battle: PveBattle;
  result: BattleResult;
  rewards: {
    xp: number;
    gold: number;
    items: string[];
  };
  levelUp?: {
    oldLevel: number;
    newLevel: number;
    levelsGained: number;
  };
}

export interface EnemySpawn {
  type: string;
  level: number;
  area: string;
  spawnChance: number;
}

export interface IPvEService {
  startBattle(characterId: string, enemyType: string, enemyLevel?: number): Promise<PvEBattleResult>;
  takeTurn(battleId: string, action: 'attack' | 'skill' | 'item' | 'run', skillId?: string, itemId?: string): Promise<TurnResult>;
  getBattle(battleId: string): Promise<PveBattle | null>;
  startBossBattle(characterId: string, bossId: string): Promise<BossBattleState>;
  executeBossTurn(battleState: BossBattleState): BossBattleState;
  completeBossBattle(battleState: BossBattleState): Promise<PvEBattleResult>;
  spawnEnemy(area: string, characterLevel: number): EnemySpawn | null;
  updateQuestProgress(characterId: string, enemyType: string, count: number): Promise<void>;
  getAvailableEnemies(characterLevel: number): EnemySpawn[];
}

export class PvEService implements IPvEService {
  private combatService: CombatService;
  private bossService: BossService;
  private questService: QuestService;
  private userService: UserService;
  private characterService: CharacterService;
  private levelingService: LevelingService;

  private enemySpawns: EnemySpawn[] = [
    { type: 'Goblin', level: 1, area: 'village', spawnChance: 0.4 },
    { type: 'Goblin Scout', level: 2, area: 'forest', spawnChance: 0.3 },
    { type: 'Orc', level: 3, area: 'forest', spawnChance: 0.2 },
    { type: 'Bandit', level: 4, area: 'road', spawnChance: 0.15 },
    { type: 'Wolf', level: 2, area: 'forest', spawnChance: 0.25 },
    { type: 'Bear', level: 5, area: 'forest', spawnChance: 0.1 },
    { type: 'Skeleton', level: 6, area: 'cave', spawnChance: 0.2 },
    { type: 'Zombie', level: 7, area: 'cave', spawnChance: 0.15 },
    { type: 'Troll', level: 8, area: 'mountain', spawnChance: 0.1 },
    { type: 'Dragon Spawn', level: 9, area: 'mountain', spawnChance: 0.05 },
  ];

  constructor() {
    this.combatService = new CombatService();
    this.bossService = new BossService();
    this.questService = new QuestService();
    this.userService = new UserService();
    this.characterService = new CharacterService();
    this.levelingService = new LevelingService();
  }

  async startBattle(characterId: string, enemyType: string, enemyLevel?: number): Promise<PvEBattleResult> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error('Character not found');
    }

    const characterStats = character.stats as CharacterStats;
    const level = enemyLevel || this.getEnemyLevelForCharacter(character.level);
    
    const baseEnemy: Enemy = this.getBaseEnemy(enemyType);
    const enemy = this.combatService.generateEnemyStats(baseEnemy, level);

    const battle = await prisma.pveBattle.create({
      data: {
        characterId,
        enemy: enemy as any,
        state: {
          turn: 1,
          characterHp: characterStats.hp,
          characterMp: characterStats.mp,
          enemyHp: enemy.hp,
          log: [`Battle started! ${enemy.name} appears!`],
        } as any,
      },
    });

    return {
      battle,
      result: BattleResult.WIN,
      rewards: { xp: 0, gold: 0, items: [] },
    };
  }

  async takeTurn(battleId: string, action: 'attack' | 'skill' | 'item' | 'run', skillId?: string, itemId?: string): Promise<TurnResult> {
    const battle = await prisma.pveBattle.findUnique({
      where: { id: battleId },
    });

    if (!battle) {
      throw new Error('Battle not found');
    }

    const character = await prisma.character.findUnique({
      where: { id: battle.characterId },
    });

    if (!character) {
      throw new Error('Character not found');
    }

    const state = battle.state as any;
    const enemy = battle.enemy as Enemy;

    if (action === 'run') {
      await prisma.pveBattle.update({
        where: { id: battleId },
        data: {
          result: BattleResult.FLED,
          state: {
            ...state,
            log: [...state.log, `${character.name} fled from battle!`],
          },
        },
      });

      return {
        success: true,
        message: 'Successfully fled from battle',
        battleState: { ...state, result: BattleResult.FLED },
      };
    }

    const characterStats = character.stats as CharacterStats;
    let turnResult: TurnResult;

    if (action === 'attack') {
      turnResult = this.combatService.calculateDamage(characterStats, enemy, 'attack');
    } else if (action === 'skill' && skillId) {
      turnResult = this.combatService.useSkill(characterStats, enemy, skillId);
    } else {
      throw new Error('Invalid action or missing parameters');
    }

    if (!turnResult.success) {
      return turnResult;
    }

    const newEnemyHp = Math.max(0, enemy.hp - (turnResult.damage || 0));
    const newCharacterHp = Math.max(0, state.characterHp - (turnResult.enemyDamage || 0));
    const newCharacterMp = Math.max(0, state.characterMp - (turnResult.mpCost || 0));

    const isEnemyDefeated = newEnemyHp <= 0;
    const isCharacterDefeated = newCharacterHp <= 0;

    let result: BattleResult | null = null;
    let rewards = { xp: 0, gold: 0, items: [] as string[] };

    if (isEnemyDefeated) {
      result = BattleResult.WIN;
      rewards = this.calculateBattleRewards(enemy, character.level);
      await this.updateQuestProgress(character.id, enemy.type, 1);
    } else if (isCharacterDefeated) {
      result = BattleResult.LOSE;
    }

    const newState = {
      ...state,
      turn: state.turn + 1,
      characterHp: newCharacterHp,
      characterMp: newCharacterMp,
      enemyHp: newEnemyHp,
      log: [...state.log, ...(turnResult.log || [])],
    };

    await prisma.pveBattle.update({
      where: { id: battleId },
      data: {
        state: newState as any,
        result,
      },
    });

    if (result === BattleResult.WIN) {
      await this.applyBattleRewards(character.id, rewards);
    }

    return {
      ...turnResult,
      battleState: newState,
      result,
      rewards: result === BattleResult.WIN ? rewards : undefined,
    };
  }

  async getBattle(battleId: string): Promise<PveBattle | null> {
    return prisma.pveBattle.findUnique({
      where: { id: battleId },
    });
  }

  async startBossBattle(characterId: string, bossId: string): Promise<BossBattleState> {
    return this.bossService.createBossBattle(characterId, bossId);
  }

  executeBossTurn(battleState: BossBattleState): BossBattleState {
    return this.bossService.executeBossTurn(battleState);
  }

  async completeBossBattle(battleState: BossBattleState): Promise<PvEBattleResult> {
    const { boss, character } = battleState;
    const isBossDefeated = this.bossService.checkBossDefeated(battleState);
    const isCharacterDefeated = this.bossService.checkCharacterDefeated(battleState);

    let result: BattleResult;
    let rewards = { xp: 0, gold: 0, items: [] as string[] };

    if (isBossDefeated) {
      result = BattleResult.WIN;
      rewards = this.bossService.calculateBossRewards(boss, character.level);
      await this.updateQuestProgress(character.id, boss.name, 1);
    } else if (isCharacterDefeated) {
      result = BattleResult.LOSE;
    } else {
      throw new Error('Boss battle is not complete');
    }

    const battle = await prisma.pveBattle.create({
      data: {
        characterId: character.id,
        enemy: boss as any,
        state: battleState as any,
        result,
      },
    });

    if (result === BattleResult.WIN) {
      await this.applyBattleRewards(character.id, rewards);
    }

    return {
      battle,
      result,
      rewards,
    };
  }

  spawnEnemy(area: string, characterLevel: number): EnemySpawn | null {
    const availableEnemies = this.enemySpawns.filter(
      spawn => spawn.area === area && Math.abs(spawn.level - characterLevel) <= 2
    );

    if (availableEnemies.length === 0) {
      return null;
    }

    const randomEnemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
    return Math.random() < randomEnemy.spawnChance ? randomEnemy : null;
  }

  async updateQuestProgress(characterId: string, enemyType: string, count: number): Promise<void> {
    const characterQuests = await this.questService.getCharacterQuests(characterId);
    
    for (const characterQuest of characterQuests) {
      if (characterQuest.status !== 'IN_PROGRESS') continue;
      
      const quest = characterQuest.quest;
      const objective = quest.objective as any;
      
      if (objective.type === 'kill' && objective.target === enemyType) {
        const progressKey = `kill_${enemyType}`;
        const currentProgress = characterQuest.progress as any;
        const newCount = (currentProgress[progressKey]?.count || 0) + count;
        
        await this.questService.updateQuestProgress(characterId, quest.id, {
          [progressKey]: { count: newCount, completed: newCount >= objective.count }
        });
      }
    }
  }

  getAvailableEnemies(characterLevel: number): EnemySpawn[] {
    return this.enemySpawns.filter(
      spawn => Math.abs(spawn.level - characterLevel) <= 2
    );
  }

  private getEnemyLevelForCharacter(characterLevel: number): number {
    const minLevel = Math.max(1, characterLevel - 1);
    const maxLevel = characterLevel + 2;
    return Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;
  }

  private getBaseEnemy(type: string): Enemy {
    const enemyTemplates: { [key: string]: Enemy } = {
      'Goblin': {
        name: 'Goblin',
        hp: 50,
        attack: 12,
        defense: 5,
        speed: 8,
        critChance: 0.05,
        class: 'WARRIOR' as any,
      },
      'Goblin Scout': {
        name: 'Goblin Scout',
        hp: 60,
        attack: 15,
        defense: 6,
        speed: 12,
        critChance: 0.08,
        class: 'ROGUE' as any,
      },
      'Orc': {
        name: 'Orc',
        hp: 80,
        attack: 20,
        defense: 8,
        speed: 6,
        critChance: 0.03,
        class: 'WARRIOR' as any,
      },
      'Bandit': {
        name: 'Bandit',
        hp: 70,
        attack: 18,
        defense: 7,
        speed: 10,
        critChance: 0.1,
        class: 'ROGUE' as any,
      },
      'Wolf': {
        name: 'Wolf',
        hp: 45,
        attack: 14,
        defense: 4,
        speed: 15,
        critChance: 0.12,
        class: 'WARRIOR' as any,
      },
      'Bear': {
        name: 'Bear',
        hp: 120,
        attack: 25,
        defense: 12,
        speed: 5,
        critChance: 0.02,
        class: 'WARRIOR' as any,
      },
      'Skeleton': {
        name: 'Skeleton',
        hp: 65,
        attack: 16,
        defense: 6,
        speed: 9,
        critChance: 0.06,
        class: 'WARRIOR' as any,
      },
      'Zombie': {
        name: 'Zombie',
        hp: 90,
        attack: 14,
        defense: 8,
        speed: 4,
        critChance: 0.01,
        class: 'WARRIOR' as any,
      },
      'Troll': {
        name: 'Troll',
        hp: 150,
        attack: 30,
        defense: 15,
        speed: 7,
        critChance: 0.04,
        class: 'WARRIOR' as any,
      },
      'Dragon Spawn': {
        name: 'Dragon Spawn',
        hp: 100,
        attack: 22,
        defense: 10,
        speed: 11,
        critChance: 0.07,
        class: 'MAGE' as any,
      },
    };

    return enemyTemplates[type] || enemyTemplates['Goblin'];
  }

  private calculateBattleRewards(enemy: Enemy, characterLevel: number): { xp: number; gold: number; items: string[] } {
    const levelMultiplier = 1 + (characterLevel - enemy.level) * 0.1;
    const baseXp = Math.floor(enemy.hp * 0.1);
    const baseGold = Math.floor(enemy.attack * 2);
    
    const xp = Math.floor(baseXp * levelMultiplier);
    const gold = Math.floor(baseGold * levelMultiplier);
    
    const items: string[] = [];
    
    if (Math.random() < 0.1) {
      items.push('healing_potion_small');
    }
    
    if (Math.random() < 0.05) {
      items.push('leather_scrap');
    }

    return { xp, gold, items };
  }

  private async applyBattleRewards(characterId: string, rewards: { xp: number; gold: number; items: string[] }): Promise<void> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) return;

    const user = await prisma.user.findUnique({
      where: { id: character.userId },
    });

    if (!user) return;

    await this.userService.addGold(user.id, rewards.gold);
    
    const levelUpResult = this.levelingService.addXp(
      character.level,
      character.xp,
      rewards.xp,
      character.class,
      character.stats as any
    );

    if (levelUpResult.levelsGained > 0) {
      await this.characterService.levelUp(character.id, levelUpResult.newLevel, levelUpResult.newStats!);
    } else {
      await this.characterService.addXp(character.id, rewards.xp);
    }

    for (const itemId of rewards.items) {
      await this.addItemToInventory(characterId, itemId);
    }
  }

  private async addItemToInventory(characterId: string, itemId: string): Promise<void> {
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        characterId,
        itemId,
      },
    });

    if (existingItem) {
      await prisma.inventoryItem.update({
        where: { id: existingItem.id },
        data: { qty: existingItem.qty + 1 },
      });
    } else {
      await prisma.inventoryItem.create({
        data: {
          characterId,
          itemId,
          qty: 1,
          isEquipped: false,
        },
      });
    }
  }
}
