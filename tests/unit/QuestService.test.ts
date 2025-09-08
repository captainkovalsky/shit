import { QuestService } from '@/database/services/QuestService';
import { QuestType, QuestStatus } from '@prisma/client';

describe('QuestService', () => {
  let questService: QuestService;

  beforeEach(() => {
    questService = new QuestService();
  });

  describe('createQuest', () => {
    it('should create a quest with valid data', async () => {
      const questData = {
        type: QuestType.STORY,
        levelReq: 1,
        title: 'Test Quest',
        description: 'A test quest',
        objective: {
          type: 'kill' as const,
          target: 'Goblin',
          count: 3,
          description: 'Defeat 3 goblins',
        },
        rewards: {
          xp: 100,
          gold: 50,
          items: ['healing_potion'],
        },
      };

      const quest = await questService.createQuest(
        questData.type,
        questData.levelReq,
        questData.title,
        questData.description,
        questData.objective,
        questData.rewards
      );

      expect(quest).toBeDefined();
      expect(quest.type).toBe(QuestType.STORY);
      expect(quest.levelReq).toBe(1);
      expect(quest.title).toBe('Test Quest');
      expect(quest.description).toBe('A test quest');
    });
  });

  describe('acceptQuest', () => {
    it('should accept a quest for a character', async () => {
      const quest = await questService.createQuest(
        QuestType.STORY,
        1,
        'Test Quest',
        'A test quest',
        {
          type: 'kill',
          target: 'Goblin',
          count: 3,
          description: 'Defeat 3 goblins',
        },
        {
          xp: 100,
          gold: 50,
          items: ['healing_potion'],
        }
      );

      const characterId = 'test-character-id';
      const characterQuest = await questService.acceptQuest(characterId, quest.id);

      expect(characterQuest).toBeDefined();
      expect(characterQuest.characterId).toBe(characterId);
      expect(characterQuest.questId).toBe(quest.id);
      expect(characterQuest.status).toBe(QuestStatus.IN_PROGRESS);
    });

    it('should throw error if character level is too low', async () => {
      const quest = await questService.createQuest(
        QuestType.STORY,
        5,
        'High Level Quest',
        'A quest requiring level 5',
        {
          type: 'kill',
          target: 'Dragon',
          count: 1,
          description: 'Defeat a dragon',
        },
        {
          xp: 500,
          gold: 200,
          items: ['dragon_scale'],
        }
      );

      const characterId = 'test-character-id';
      
      await expect(questService.acceptQuest(characterId, quest.id)).rejects.toThrow('Character level 1 is below required level 5');
    });
  });

  describe('updateQuestProgress', () => {
    it('should update quest progress correctly', async () => {
      const quest = await questService.createQuest(
        QuestType.STORY,
        1,
        'Kill Goblins',
        'Defeat 3 goblins',
        {
          type: 'kill',
          target: 'Goblin',
          count: 3,
          description: 'Defeat 3 goblins',
        },
        {
          xp: 100,
          gold: 50,
          items: ['healing_potion'],
        }
      );

      const characterId = 'test-character-id';
      await questService.acceptQuest(characterId, quest.id);

      const progress = {
        kill_Goblin: { count: 2, completed: false },
      };

      const updatedQuest = await questService.updateQuestProgress(characterId, quest.id, progress);

      expect(updatedQuest.progress).toEqual(progress);
      expect(updatedQuest.status).toBe(QuestStatus.IN_PROGRESS);
    });

    it('should mark quest as completed when objective is met', async () => {
      const quest = await questService.createQuest(
        QuestType.STORY,
        1,
        'Kill Goblins',
        'Defeat 3 goblins',
        {
          type: 'kill',
          target: 'Goblin',
          count: 3,
          description: 'Defeat 3 goblins',
        },
        {
          xp: 100,
          gold: 50,
          items: ['healing_potion'],
        }
      );

      const characterId = 'test-character-id';
      await questService.acceptQuest(characterId, quest.id);

      const progress = {
        kill_Goblin: { count: 3, completed: true },
      };

      const updatedQuest = await questService.updateQuestProgress(characterId, quest.id, progress);

      expect(updatedQuest.status).toBe(QuestStatus.COMPLETED);
    });
  });

  describe('completeQuest', () => {
    it('should complete a quest and return rewards', async () => {
      const quest = await questService.createQuest(
        QuestType.STORY,
        1,
        'Kill Goblins',
        'Defeat 3 goblins',
        {
          type: 'kill',
          target: 'Goblin',
          count: 3,
          description: 'Defeat 3 goblins',
        },
        {
          xp: 100,
          gold: 50,
          items: ['healing_potion'],
        }
      );

      const characterId = 'test-character-id';
      await questService.acceptQuest(characterId, quest.id);

      const progress = {
        kill_Goblin: { count: 3, completed: true },
      };
      await questService.updateQuestProgress(characterId, quest.id, progress);

      const result = await questService.completeQuest(characterId, quest.id);

      expect(result.characterQuest.status).toBe(QuestStatus.COMPLETED);
      expect(result.rewards.xp).toBe(100);
      expect(result.rewards.gold).toBe(50);
      expect(result.rewards.items).toEqual(['healing_potion']);
    });

    it('should throw error if quest is not completed', async () => {
      const quest = await questService.createQuest(
        QuestType.STORY,
        1,
        'Kill Goblins',
        'Defeat 3 goblins',
        {
          type: 'kill',
          target: 'Goblin',
          count: 3,
          description: 'Defeat 3 goblins',
        },
        {
          xp: 100,
          gold: 50,
          items: ['healing_potion'],
        }
      );

      const characterId = 'test-character-id';
      await questService.acceptQuest(characterId, quest.id);

      await expect(questService.completeQuest(characterId, quest.id)).rejects.toThrow('Quest is not completed');
    });
  });

  describe('checkQuestRequirements', () => {
    it('should return true for valid requirements', async () => {
      const quest = await questService.createQuest(
        QuestType.STORY,
        1,
        'Test Quest',
        'A test quest',
        {
          type: 'kill',
          target: 'Goblin',
          count: 3,
          description: 'Defeat 3 goblins',
        },
        {
          xp: 100,
          gold: 50,
          items: ['healing_potion'],
        }
      );

      const characterId = 'test-character-id';
      const requirements = await questService.checkQuestRequirements(characterId, quest.id);

      expect(requirements.canAccept).toBe(true);
    });

    it('should return false if character level is too low', async () => {
      const quest = await questService.createQuest(
        QuestType.STORY,
        5,
        'High Level Quest',
        'A quest requiring level 5',
        {
          type: 'kill',
          target: 'Dragon',
          count: 1,
          description: 'Defeat a dragon',
        },
        {
          xp: 500,
          gold: 200,
          items: ['dragon_scale'],
        }
      );

      const characterId = 'test-character-id';
      const requirements = await questService.checkQuestRequirements(characterId, quest.id);

      expect(requirements.canAccept).toBe(false);
      expect(requirements.reason).toBe('Level 5 required');
    });
  });

  describe('seedDefaultQuests', () => {
    it('should seed default quests', async () => {
      await questService.seedDefaultQuests();

      const storyQuests = await questService.getQuestsByType(QuestType.STORY);
      const sideQuests = await questService.getQuestsByType(QuestType.SIDE);

      expect(storyQuests.length).toBeGreaterThan(0);
      expect(sideQuests.length).toBeGreaterThan(0);
    });
  });
});
