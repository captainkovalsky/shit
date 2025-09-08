import { PrismaClient, Quest, CharacterQuest, QuestStatus, QuestType } from '@prisma/client';
import prisma from '../client';

export interface QuestObjective {
  type: 'kill' | 'collect' | 'reach' | 'defeat_boss';
  target: string;
  count: number;
  description: string;
}

export interface QuestReward {
  xp: number;
  gold: number;
  items?: string[];
}

export interface QuestProgress {
  [key: string]: {
    count: number;
    completed: boolean;
  };
}

export interface IQuestService {
  createQuest(
    type: QuestType,
    levelReq: number,
    title: string,
    description: string,
    objective: QuestObjective,
    rewards: QuestReward
  ): Promise<Quest>;
  getQuestById(id: string): Promise<Quest | null>;
  getQuestsByType(type: QuestType): Promise<Quest[]>;
  getAvailableQuests(characterLevel: number): Promise<Quest[]>;
  getCharacterQuests(characterId: string): Promise<CharacterQuest[]>;
  acceptQuest(characterId: string, questId: string): Promise<CharacterQuest>;
  updateQuestProgress(characterId: string, questId: string, progress: QuestProgress): Promise<CharacterQuest>;
  completeQuest(characterId: string, questId: string): Promise<{ characterQuest: CharacterQuest; rewards: QuestReward }>;
  isQuestCompleted(characterId: string, questId: string): Promise<boolean>;
  getQuestProgress(characterId: string, questId: string): Promise<CharacterQuest | null>;
  checkQuestRequirements(characterId: string, questId: string): Promise<{ canAccept: boolean; reason?: string }>;
  seedDefaultQuests(): Promise<void>;
}

export class QuestService implements IQuestService {
  constructor(private readonly db: PrismaClient = prisma) {}

  async createQuest(
    type: QuestType,
    levelReq: number,
    title: string,
    description: string,
    objective: QuestObjective,
    rewards: QuestReward
  ): Promise<Quest> {
    return this.db.quest.create({
      data: {
        type,
        levelReq,
        title,
        description,
        objective: objective as any,
        rewards: rewards as any,
      },
    });
  }

  async getQuestById(id: string): Promise<Quest | null> {
    return this.db.quest.findUnique({
      where: { id },
    });
  }

  async getQuestsByType(type: QuestType): Promise<Quest[]> {
    return this.db.quest.findMany({
      where: { type },
      orderBy: { levelReq: 'asc' },
    });
  }

  async getAvailableQuests(characterLevel: number): Promise<Quest[]> {
    return this.db.quest.findMany({
      where: {
        levelReq: { lte: characterLevel },
      },
      orderBy: { levelReq: 'asc' },
    });
  }

  async getCharacterQuests(characterId: string): Promise<CharacterQuest[]> {
    return this.db.characterQuest.findMany({
      where: { characterId },
      include: {
        quest: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptQuest(characterId: string, questId: string): Promise<CharacterQuest> {
    const quest = await this.getQuestById(questId);
    if (!quest) {
      throw new Error('Quest not found');
    }

    const character = await this.db.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error('Character not found');
    }

    if (character.level < quest.levelReq) {
      throw new Error(`Character level ${character.level} is below required level ${quest.levelReq}`);
    }

    const existingQuest = await this.db.characterQuest.findUnique({
      where: {
        characterId_questId: {
          characterId,
          questId,
        },
      },
    });

    if (existingQuest) {
      throw new Error('Quest already accepted or completed');
    }

    return this.db.characterQuest.create({
      data: {
        characterId,
        questId,
        status: QuestStatus.IN_PROGRESS,
        progress: {},
      },
    });
  }

  async updateQuestProgress(characterId: string, questId: string, progress: QuestProgress): Promise<CharacterQuest> {
    const characterQuest = await this.db.characterQuest.findUnique({
      where: {
        characterId_questId: {
          characterId,
          questId,
        },
      },
      include: {
        quest: true,
      },
    });

    if (!characterQuest) {
      throw new Error('Quest not found for character');
    }

    if (characterQuest.status !== QuestStatus.IN_PROGRESS) {
      throw new Error('Quest is not in progress');
    }

    const updatedProgress = { ...(characterQuest.progress as any), ...progress };
    
    const isCompleted = this.checkQuestCompletion(characterQuest.quest.objective as unknown as QuestObjective, updatedProgress);

    return this.db.characterQuest.update({
      where: {
        characterId_questId: {
          characterId,
          questId,
        },
      },
      data: {
        progress: updatedProgress as any,
        status: isCompleted ? QuestStatus.COMPLETED : QuestStatus.IN_PROGRESS,
      },
    });
  }

  async completeQuest(characterId: string, questId: string): Promise<{ characterQuest: CharacterQuest; rewards: QuestReward }> {
    const characterQuest = await this.db.characterQuest.findUnique({
      where: {
        characterId_questId: {
          characterId,
          questId,
        },
      },
      include: {
        quest: true,
      },
    });

    if (!characterQuest) {
      throw new Error('Quest not found for character');
    }

    if (characterQuest.status !== QuestStatus.COMPLETED) {
      throw new Error('Quest is not completed');
    }

    const rewards = characterQuest.quest.rewards as unknown as QuestReward;

    await this.db.characterQuest.update({
      where: {
        characterId_questId: {
          characterId,
          questId,
        },
      },
      data: {
        status: QuestStatus.COMPLETED,
      },
    });

    return { characterQuest, rewards };
  }

  async isQuestCompleted(characterId: string, questId: string): Promise<boolean> {
    const characterQuest = await this.db.characterQuest.findUnique({
      where: {
        characterId_questId: {
          characterId,
          questId,
        },
      },
    });

    return characterQuest?.status === QuestStatus.COMPLETED;
  }

  async getQuestProgress(characterId: string, questId: string): Promise<CharacterQuest | null> {
    return this.db.characterQuest.findUnique({
      where: {
        characterId_questId: {
          characterId,
          questId,
        },
      },
      include: {
        quest: true,
      },
    });
  }

  async checkQuestRequirements(characterId: string, questId: string): Promise<{ canAccept: boolean; reason?: string }> {
    const quest = await this.getQuestById(questId);
    if (!quest) {
      return { canAccept: false, reason: 'Quest not found' };
    }

    const character = await this.db.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      return { canAccept: false, reason: 'Character not found' };
    }

    if (character.level < quest.levelReq) {
      return { canAccept: false, reason: `Level ${quest.levelReq} required` };
    }

    const existingQuest = await this.db.characterQuest.findUnique({
      where: {
        characterId_questId: {
          characterId,
          questId,
        },
      },
    });

    if (existingQuest) {
      return { canAccept: false, reason: 'Quest already accepted or completed' };
    }

    return { canAccept: true };
  }

  private checkQuestCompletion(objective: QuestObjective, progress: QuestProgress): boolean {
    const progressKey = `${objective.type}_${objective.target}`;
    const currentProgress = progress[progressKey];
    
    if (!currentProgress) {
      return false;
    }

    return currentProgress.count >= objective.count;
  }

  async seedDefaultQuests(): Promise<void> {
    const existingQuests = await this.db.quest.count();
    if (existingQuests > 0) {
      return;
    }

    const storyQuests = [
      {
        type: QuestType.STORY,
        levelReq: 1,
        title: 'The First Hunt',
        description: 'Defeat 3 goblins near the village to prove your worth.',
        objective: {
          type: 'kill' as const,
          target: 'Goblin',
          count: 3,
          description: 'Defeat 3 goblins',
        },
        rewards: {
          xp: 50,
          gold: 20,
          items: ['healing_potion_small'],
        },
      },
      {
        type: QuestType.STORY,
        levelReq: 2,
        title: 'Shadows in the Forest',
        description: 'Investigate the forest and defeat 5 goblin scouts.',
        objective: {
          type: 'kill' as const,
          target: 'Goblin Scout',
          count: 5,
          description: 'Defeat 5 goblin scouts',
        },
        rewards: {
          xp: 100,
          gold: 40,
          items: ['leather_armor'],
        },
      },
      {
        type: QuestType.STORY,
        levelReq: 5,
        title: 'The Goblin Chief',
        description: 'Enter the Goblin Camp and defeat the Goblin Chief.',
        objective: {
          type: 'defeat_boss' as const,
          target: 'Goblin Chief',
          count: 1,
          description: 'Defeat the Goblin Chief',
        },
        rewards: {
          xp: 250,
          gold: 100,
          items: ['rare_weapon'],
        },
      },
      {
        type: QuestType.STORY,
        levelReq: 6,
        title: 'The Broken Amulet',
        description: 'Retrieve the missing amulet piece from orcs.',
        objective: {
          type: 'collect' as const,
          target: 'Amulet Piece',
          count: 1,
          description: 'Collect the amulet piece',
        },
        rewards: {
          xp: 300,
          gold: 150,
          items: ['rare_accessory'],
        },
      },
      {
        type: QuestType.STORY,
        levelReq: 10,
        title: 'Whispers of the Dragon',
        description: 'Travel to the mountain caves and defeat the Dragon\'s Guardian.',
        objective: {
          type: 'defeat_boss' as const,
          target: 'Dragon Guardian',
          count: 1,
          description: 'Defeat the Dragon Guardian',
        },
        rewards: {
          xp: 600,
          gold: 300,
          items: ['epic_armor'],
        },
      },
      {
        type: QuestType.STORY,
        levelReq: 12,
        title: 'The Dragon Lord',
        description: 'Defeat the Dragon Lord in his lair.',
        objective: {
          type: 'defeat_boss' as const,
          target: 'Dragon Lord',
          count: 1,
          description: 'Defeat the Dragon Lord',
        },
        rewards: {
          xp: 2000,
          gold: 1000,
          items: ['epic_weapon', 'legendary_chance'],
        },
      },
    ];

    const sideQuests = [
      {
        type: QuestType.SIDE,
        levelReq: 2,
        title: 'Herbal Remedy',
        description: 'Collect 10 healing herbs for the village healer.',
        objective: {
          type: 'collect' as const,
          target: 'Healing Herb',
          count: 10,
          description: 'Collect 10 healing herbs',
        },
        rewards: {
          xp: 80,
          gold: 30,
          items: ['healing_potion_small', 'healing_potion_small'],
        },
      },
      {
        type: QuestType.SIDE,
        levelReq: 3,
        title: 'Arena Challenger',
        description: 'Win 2 duels in the Arena.',
        objective: {
          type: 'kill' as const,
          target: 'Arena Victory',
          count: 2,
          description: 'Win 2 arena duels',
        },
        rewards: {
          xp: 120,
          gold: 50,
        },
      },
      {
        type: QuestType.SIDE,
        levelReq: 4,
        title: 'Lost Necklace',
        description: 'Recover a stolen necklace from bandits.',
        objective: {
          type: 'collect' as const,
          target: 'Lost Necklace',
          count: 1,
          description: 'Recover the lost necklace',
        },
        rewards: {
          xp: 150,
          gold: 70,
          items: ['rare_ring'],
        },
      },
      {
        type: QuestType.SIDE,
        levelReq: 5,
        title: 'Merchant\'s Request',
        description: 'Escort a merchant through dangerous woods.',
        objective: {
          type: 'reach' as const,
          target: 'Merchant Destination',
          count: 1,
          description: 'Escort merchant to destination',
        },
        rewards: {
          xp: 200,
          gold: 100,
          items: ['random_item'],
        },
      },
      {
        type: QuestType.SIDE,
        levelReq: 8,
        title: 'The Cave Beast',
        description: 'Defeat the beast hiding in the dark cave.',
        objective: {
          type: 'defeat_boss' as const,
          target: 'Cave Beast',
          count: 1,
          description: 'Defeat the cave beast',
        },
        rewards: {
          xp: 400,
          gold: 200,
          items: ['rare_weapon'],
        },
      },
    ];

    const allQuests = [...storyQuests, ...sideQuests];

    for (const questData of allQuests) {
      await this.createQuest(
        questData.type,
        questData.levelReq,
        questData.title,
        questData.description,
        questData.objective,
        questData.rewards
      );
    }
  }
}
