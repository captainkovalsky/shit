import { Router, Request, Response } from 'express';
import { QuestService } from '@/database/services/QuestService';
import { CharacterService, CharacterStats } from '@/database/services/CharacterService';
import { UserService } from '@/database/services/UserService';
import { LevelingService } from '@/game/services/LevelingService';

const router = Router();
const questService = new QuestService();
const characterService = new CharacterService();
const userService = new UserService();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { characterId, type } = req.query;
    
    if (characterId) {
      const character = await characterService.getCharacterById(characterId as string);
      if (!character) {
        return res.status(404).json({
          success: false,
          error: 'Character not found',
        });
      }

      const quests = type 
        ? await questService.getQuestsByType(type as 'STORY' | 'SIDE' | 'DAILY' | 'WEEKLY')
        : await questService.getAvailableQuests(character.level);
      
      const characterQuests = await questService.getCharacterQuests(characterId as string);
      
      const questsWithStatus = quests.map(quest => {
        const characterQuest = characterQuests.find(cq => cq.questId === quest.id);
        return {
          ...quest,
          status: characterQuest?.status || 'available',
          progress: characterQuest?.progress || {},
        };
      });

      return res.json({
        success: true,
        data: { quests: questsWithStatus },
      });
    }

    const quests = await questService.getQuestsByType('STORY');
    return res.json({
      success: true,
      data: { quests },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch quests',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:questId', async (req: Request, res: Response) => {
  try {
    const { questId } = req.params;
    
    if (!questId) {
      return res.status(400).json({
        success: false,
        error: 'Quest ID is required',
      });
    }
    
    const quest = await questService.getQuestById(questId);
    
    if (!quest) {
      return res.status(404).json({
        success: false,
        error: 'Quest not found',
      });
    }

    return res.json({
      success: true,
      data: { quest },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch quest',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/:questId/accept', async (req: Request, res: Response) => {
  try {
    const { questId } = req.params;
    const { characterId } = req.body;

    if (!questId) {
      return res.status(400).json({
        success: false,
        error: 'Quest ID is required',
      });
    }

    if (!characterId) {
      return res.status(400).json({
        success: false,
        error: 'Character ID is required',
      });
    }

    const characterQuest = await questService.acceptQuest(characterId, questId);
    
    return res.status(201).json({
      success: true,
      data: { characterQuest },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to accept quest',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/:questId/progress', async (req: Request, res: Response) => {
  try {
    const { questId } = req.params;
    const { characterId, progress } = req.body;

    if (!questId) {
      return res.status(400).json({
        success: false,
        error: 'Quest ID is required',
      });
    }

    if (!characterId || !progress) {
      return res.status(400).json({
        success: false,
        error: 'Character ID and progress are required',
      });
    }

    const characterQuest = await questService.updateQuestProgress(characterId, questId, progress);
    
    return res.json({
      success: true,
      data: { characterQuest },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to update quest progress',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/:questId/complete', async (req: Request, res: Response) => {
  try {
    const { questId } = req.params;
    const { characterId } = req.body;

    if (!questId) {
      return res.status(400).json({
        success: false,
        error: 'Quest ID is required',
      });
    }

    if (!characterId) {
      return res.status(400).json({
        success: false,
        error: 'Character ID is required',
      });
    }

    const { characterQuest, rewards } = await questService.completeQuest(characterId, questId);
    
    const character = await characterService.getCharacterById(characterId);
    if (!character) {
      return res.status(404).json({
        success: false,
        error: 'Character not found',
      });
    }

    const user = await userService.getUserById(character.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    await userService.addGold(user.id, rewards.gold);
    
    const levelUpResult = LevelingService.addXp(
      character.level,
      character.xp,
      rewards.xp,
      character.class,
      character.stats as CharacterStats
    );

    if (levelUpResult.levelsGained > 0) {
      await characterService.levelUp(character.id, levelUpResult.newLevel, levelUpResult.newStats!);
    } else {
      await characterService.addXp(character.id, rewards.xp);
    }

    return res.json({
      success: true,
      data: { 
        characterQuest,
        rewards,
        levelUp: levelUpResult.levelsGained > 0 ? levelUpResult : null,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to complete quest',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:questId/requirements/:characterId', async (req: Request, res: Response) => {
  try {
    const { questId, characterId } = req.params;
    
    if (!questId || !characterId) {
      return res.status(400).json({
        success: false,
        error: 'Quest ID and Character ID are required',
      });
    }
    
    const requirements = await questService.checkQuestRequirements(characterId, questId);
    
    return res.json({
      success: true,
      data: requirements,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to check quest requirements',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/seed', async (_req: Request, res: Response) => {
  try {
    await questService.seedDefaultQuests();
    
    return res.json({
      success: true,
      message: 'Default quests seeded successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to seed quests',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as questRoutes };
