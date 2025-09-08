import { PrismaClient, Character, ItemRarity } from '@prisma/client';
import prisma from '../../database/client';
import { CombatService, CharacterStats, Enemy } from './CombatService';

export interface BossSkill {
  name: string;
  description: string;
  damageMultiplier: number;
  mpCost: number;
  cooldown: number;
  effects?: {
    stun?: number;
    defenseReduction?: number;
    attackBuff?: number;
  };
  condition?: {
    hpThreshold?: number;
    turnCount?: number;
  };
}

export interface Boss {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  skills: BossSkill[];
  rewards: {
    xp: number;
    gold: number;
    guaranteedItems: string[];
    rareItems: Array<{ itemId: string; chance: number }>;
  };
  enrageThreshold: number;
  isEnraged: boolean;
}

export interface BossBattleState {
  boss: Boss;
  character: Character;
  turn: number;
  characterHp: number;
  characterMp: number;
  bossHp: number;
  log: string[];
  isEnraged: boolean;
  skillCooldowns: { [skillName: string]: number };
}

export interface IBossService {
  getBossById(id: string): Boss | null;
  getAllBosses(): Boss[];
  createBossBattle(characterId: string, bossId: string): Promise<BossBattleState>;
  executeBossTurn(battleState: BossBattleState): BossBattleState;
  calculateBossRewards(boss: Boss, characterLevel: number): { xp: number; gold: number; items: string[] };
  checkBossDefeated(battleState: BossBattleState): boolean;
  checkCharacterDefeated(battleState: BossBattleState): boolean;
}

export class BossService implements IBossService {
  private bosses: Map<string, Boss> = new Map();
  private combatService: CombatService;

  constructor() {
    this.combatService = new CombatService();
    this.initializeBosses();
  }

  private initializeBosses(): void {
    const goblinChief: Boss = {
      id: 'goblin_chief',
      name: 'Goblin Chief',
      level: 5,
      hp: 1500,
      maxHp: 1500,
      attack: 45,
      defense: 20,
      speed: 8,
      skills: [
        {
          name: 'Smash',
          description: 'Heavy strike with increased damage',
          damageMultiplier: 1.5,
          mpCost: 0,
          cooldown: 0,
        },
        {
          name: 'Roar',
          description: 'Intimidating roar that may stun the enemy',
          damageMultiplier: 0.3,
          mpCost: 0,
          cooldown: 3,
          effects: { stun: 0.3 },
        },
        {
          name: 'Enrage',
          description: 'Increases attack power when health is low',
          damageMultiplier: 0,
          mpCost: 0,
          cooldown: 0,
          effects: { attackBuff: 0.2 },
          condition: { hpThreshold: 0.5 },
        },
      ],
      rewards: {
        xp: 250,
        gold: 100,
        guaranteedItems: ['rare_weapon'],
        rareItems: [
          { itemId: 'goblin_chief_axe', chance: 0.3 },
          { itemId: 'goblin_chief_armor', chance: 0.2 },
        ],
      },
      enrageThreshold: 0.5,
      isEnraged: false,
    };

    const dragonGuardian: Boss = {
      id: 'dragon_guardian',
      name: 'Dragon\'s Guardian',
      level: 10,
      hp: 3000,
      maxHp: 3000,
      attack: 80,
      defense: 40,
      speed: 12,
      skills: [
        {
          name: 'Stone Slam',
          description: 'Powerful AoE attack that hits all enemies',
          damageMultiplier: 1.2,
          mpCost: 0,
          cooldown: 2,
        },
        {
          name: 'Earthquake',
          description: 'Shakes the ground, reducing enemy defense',
          damageMultiplier: 0.8,
          mpCost: 0,
          cooldown: 4,
          effects: { defenseReduction: 0.2 },
        },
      ],
      rewards: {
        xp: 600,
        gold: 300,
        guaranteedItems: ['epic_armor'],
        rareItems: [
          { itemId: 'dragon_guardian_scale', chance: 0.4 },
          { itemId: 'dragon_guardian_helmet', chance: 0.25 },
        ],
      },
      enrageThreshold: 0.3,
      isEnraged: false,
    };

    const dragonLord: Boss = {
      id: 'dragon_lord',
      name: 'Dragon Lord',
      level: 12,
      hp: 5000,
      maxHp: 5000,
      attack: 120,
      defense: 60,
      speed: 15,
      skills: [
        {
          name: 'Fire Breath',
          description: 'Devastating fire attack with burn effect',
          damageMultiplier: 1.8,
          mpCost: 0,
          cooldown: 3,
        },
        {
          name: 'Tail Swipe',
          description: 'Multi-hit attack that strikes 2-3 times',
          damageMultiplier: 0.7,
          mpCost: 0,
          cooldown: 2,
        },
        {
          name: 'Enrage',
          description: 'Doubles attack power when near death',
          damageMultiplier: 0,
          mpCost: 0,
          cooldown: 0,
          effects: { attackBuff: 1.0 },
          condition: { hpThreshold: 0.2 },
        },
      ],
      rewards: {
        xp: 2000,
        gold: 1000,
        guaranteedItems: ['epic_weapon'],
        rareItems: [
          { itemId: 'dragon_lord_sword', chance: 0.15 },
          { itemId: 'dragon_lord_armor', chance: 0.1 },
          { itemId: 'legendary_ring', chance: 0.05 },
        ],
      },
      enrageThreshold: 0.2,
      isEnraged: false,
    };

    this.bosses.set('goblin_chief', goblinChief);
    this.bosses.set('dragon_guardian', dragonGuardian);
    this.bosses.set('dragon_lord', dragonLord);
  }

  getBossById(id: string): Boss | null {
    return this.bosses.get(id) || null;
  }

  getAllBosses(): Boss[] {
    return Array.from(this.bosses.values());
  }

  async createBossBattle(characterId: string, bossId: string): Promise<BossBattleState> {
    const boss = this.getBossById(bossId);
    if (!boss) {
      throw new Error('Boss not found');
    }

    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error('Character not found');
    }

    const characterStats = character.stats as CharacterStats;
    const characterHp = characterStats.hp;
    const characterMp = characterStats.mp;

    return {
      boss: { ...boss, hp: boss.maxHp, isEnraged: false },
      character,
      turn: 1,
      characterHp,
      characterMp,
      bossHp: boss.maxHp,
      log: [`Boss battle started! ${boss.name} appears!`],
      isEnraged: false,
      skillCooldowns: {},
    };
  }

  executeBossTurn(battleState: BossBattleState): BossBattleState {
    const { boss, character, turn, characterHp, characterMp, bossHp, log, skillCooldowns } = battleState;
    
    const newState = { ...battleState };
    newState.turn = turn + 1;
    newState.log = [...log];

    const hpPercentage = bossHp / boss.maxHp;
    const shouldEnrage = hpPercentage <= boss.enrageThreshold && !boss.isEnraged;

    if (shouldEnrage) {
      newState.boss = { ...boss, isEnraged: true };
      newState.isEnraged = true;
      newState.log.push(`${boss.name} enters an enraged state! Attack power increased!`);
    }

    const availableSkills = boss.skills.filter(skill => {
      const cooldown = skillCooldowns[skill.name] || 0;
      return cooldown <= 0;
    });

    if (availableSkills.length === 0) {
      const basicAttack = boss.attack * (boss.isEnraged ? 1.2 : 1.0);
      const damage = Math.max(1, basicAttack - (character.stats as CharacterStats).defense);
      newState.characterHp = Math.max(0, characterHp - damage);
      newState.log.push(`${boss.name} attacks for ${damage} damage!`);
    } else {
      const skill = this.selectBossSkill(availableSkills, hpPercentage, turn);
      const result = this.executeBossSkill(skill, boss, character, newState);
      
      newState.characterHp = result.characterHp;
      newState.characterMp = result.characterMp;
      newState.log.push(...result.log);
      
      newState.skillCooldowns = { ...skillCooldowns };
      newState.skillCooldowns[skill.name] = skill.cooldown;
    }

    Object.keys(newState.skillCooldowns).forEach(skillName => {
      if (newState.skillCooldowns[skillName] > 0) {
        newState.skillCooldowns[skillName]--;
      }
    });

    return newState;
  }

  private selectBossSkill(availableSkills: BossSkill[], hpPercentage: number, turn: number): BossSkill {
    const enrageSkills = availableSkills.filter(skill => skill.name === 'Enrage');
    const otherSkills = availableSkills.filter(skill => skill.name !== 'Enrage');

    if (enrageSkills.length > 0 && hpPercentage <= 0.3) {
      return enrageSkills[0];
    }

    if (otherSkills.length === 0) {
      return availableSkills[0];
    }

    const randomIndex = Math.floor(Math.random() * otherSkills.length);
    return otherSkills[randomIndex];
  }

  private executeBossSkill(
    skill: BossSkill,
    boss: Boss,
    character: Character,
    battleState: BossBattleState
  ): { characterHp: number; characterMp: number; log: string[] } {
    const characterStats = character.stats as CharacterStats;
    let characterHp = battleState.characterHp;
    let characterMp = battleState.characterMp;
    const log: string[] = [];

    if (skill.name === 'Enrage') {
      battleState.boss.isEnraged = true;
      battleState.isEnraged = true;
      log.push(`${boss.name} enters an enraged state! Attack power increased!`);
      return { characterHp, characterMp, log };
    }

    const baseDamage = boss.attack * skill.damageMultiplier;
    const finalDamage = boss.isEnraged ? baseDamage * 1.2 : baseDamage;
    const damage = Math.max(1, finalDamage - characterStats.defense);

    characterHp = Math.max(0, characterHp - damage);
    log.push(`${boss.name} uses ${skill.name} for ${damage} damage!`);

    if (skill.effects) {
      if (skill.effects.stun && Math.random() < skill.effects.stun) {
        log.push(`${character.name} is stunned!`);
      }
      if (skill.effects.defenseReduction) {
        log.push(`${character.name}'s defense is reduced!`);
      }
    }

    return { characterHp, characterMp, log };
  }

  calculateBossRewards(boss: Boss, characterLevel: number): { xp: number; gold: number; items: string[] } {
    const levelMultiplier = 1 + (characterLevel - boss.level) * 0.1;
    const xp = Math.floor(boss.rewards.xp * levelMultiplier);
    const gold = Math.floor(boss.rewards.gold * levelMultiplier);
    
    const items: string[] = [...boss.rewards.guaranteedItems];
    
    boss.rewards.rareItems.forEach(rareItem => {
      if (Math.random() < rareItem.chance) {
        items.push(rareItem.itemId);
      }
    });

    return { xp, gold, items };
  }

  checkBossDefeated(battleState: BossBattleState): boolean {
    return battleState.bossHp <= 0;
  }

  checkCharacterDefeated(battleState: BossBattleState): boolean {
    return battleState.characterHp <= 0;
  }
}
