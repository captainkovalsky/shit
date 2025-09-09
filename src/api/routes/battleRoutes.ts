import { Router, Request, Response } from 'express';
import { PvEService } from '@/game/services/PvEService';
import { BossService } from '@/game/services/BossService';
import { PvPService } from '@/game/services/PvPService';

const router = Router();
const pveService = new PvEService();
const bossService = new BossService();
const pvpService = new PvPService();

router.post('/pve', async (req: Request, res: Response) => {
  try {
    const { characterId, enemyType, enemyLevel, area } = req.body;

    if (!characterId || !enemyType) {
      return res.status(400).json({
        success: false,
        error: 'Character ID and enemy type are required',
      });
    }

    let enemyToFight = enemyType;
    
    if (area && !enemyLevel) {
      const character = await pveService.getBattle(characterId);
      if (character) {
        const characterLevel = (character.state as { characterLevel?: number }).characterLevel || 1;
        const spawnedEnemy = pveService.spawnEnemy(area, characterLevel);
        if (spawnedEnemy) {
          enemyToFight = spawnedEnemy.type;
        }
      }
    }

    const result = await pveService.startBattle(characterId, enemyToFight, enemyLevel);
    
    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to start battle',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/pve/:battleId/turns', async (req: Request, res: Response) => {
  try {
    const { battleId } = req.params;
    const { action, skillId, itemId } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required',
      });
    }

    if (!battleId) {
      return res.status(400).json({
        success: false,
        error: 'Battle ID is required',
      });
    }
    const result = await pveService.takeTurn(battleId, action, skillId, itemId);
    
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to execute turn',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/pve/:battleId', async (req: Request, res: Response) => {
  try {
    const { battleId } = req.params;
    if (!battleId) {
      return res.status(400).json({
        success: false,
        error: 'Battle ID is required',
      });
    }
    const battle = await pveService.getBattle(battleId);
    
    if (!battle) {
      return res.status(404).json({
        success: false,
        error: 'Battle not found',
      });
    }

    return res.json({
      success: true,
      data: { battle },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch battle',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/boss', async (req: Request, res: Response) => {
  try {
    const { characterId, bossId } = req.body;

    if (!characterId || !bossId) {
      return res.status(400).json({
        success: false,
        error: 'Character ID and boss ID are required',
      });
    }

    const battleState = await pveService.startBossBattle(characterId, bossId);
    
    return res.status(201).json({
      success: true,
      data: { battleState },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to start boss battle',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/boss/turn', async (req: Request, res: Response) => {
  try {
    const { battleState } = req.body;

    if (!battleState) {
      return res.status(400).json({
        success: false,
        error: 'Battle state is required',
      });
    }

    const newBattleState = pveService.executeBossTurn(battleState);
    
    return res.json({
      success: true,
      data: { battleState: newBattleState },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to execute boss turn',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/boss/complete', async (req: Request, res: Response) => {
  try {
    const { battleState } = req.body;

    if (!battleState) {
      return res.status(400).json({
        success: false,
        error: 'Battle state is required',
      });
    }

    const result = await pveService.completeBossBattle(battleState);
    
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to complete boss battle',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/bosses', async (_req: Request, res: Response) => {
  try {
    const bosses = bossService.getAllBosses();
    
    return res.json({
      success: true,
      data: { bosses },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch bosses',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/enemies', async (req: Request, res: Response) => {
  try {
    const { characterLevel } = req.query;
    
    if (!characterLevel) {
      return res.status(400).json({
        success: false,
        error: 'Character level is required',
      });
    }

    const enemies = pveService.getAvailableEnemies(parseInt(characterLevel as string));
    
    return res.json({
      success: true,
      data: { enemies },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch enemies',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PvP Routes
router.post('/pvp/challenge', async (req: Request, res: Response) => {
  try {
    const { challengerId, opponentId } = req.body;

    if (!challengerId || !opponentId) {
      return res.status(400).json({
        success: false,
        error: 'Challenger ID and opponent ID are required',
      });
    }

    const match = await pvpService.createMatch(challengerId, opponentId);
    
    return res.status(201).json({
      success: true,
      data: { match },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to create PvP match',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/pvp/:matchId/accept', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    if (!matchId) {
      return res.status(400).json({
        success: false,
        error: 'Match ID is required',
      });
    }
    const match = await pvpService.acceptMatch(matchId);
    
    return res.json({
      success: true,
      data: { match },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to accept match',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/pvp/:matchId/turn', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { characterId, action, skillId } = req.body;

    if (!characterId || !action) {
      return res.status(400).json({
        success: false,
        error: 'Character ID and action are required',
      });
    }

    if (!matchId) {
      return res.status(400).json({
        success: false,
        error: 'Match ID is required',
      });
    }
    const result = await pvpService.takeTurn(matchId, characterId, action, skillId);
    
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to execute turn',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/pvp/:matchId', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    if (!matchId) {
      return res.status(400).json({
        success: false,
        error: 'Match ID is required',
      });
    }
    const match = await pvpService.getMatch(matchId);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found',
      });
    }

    return res.json({
      success: true,
      data: { match },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch match',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/pvp/rating/:characterId', async (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;
    if (!characterId) {
      return res.status(400).json({
        success: false,
        error: 'Character ID is required',
      });
    }
    const rating = await pvpService.getCharacterRating(characterId);
    
    return res.json({
      success: true,
      data: { rating },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch rating',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/pvp/leaderboard', async (req: Request, res: Response) => {
  try {
    const { season = '2025-01', limit = 100 } = req.query;
    const leaderboard = await pvpService.getLeaderboard(season as string, parseInt(limit as string));
    
    return res.json({
      success: true,
      data: { leaderboard },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/pvp/active/:characterId', async (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;
    if (!characterId) {
      return res.status(400).json({
        success: false,
        error: 'Character ID is required',
      });
    }
    const matches = await pvpService.getActiveMatches(characterId);
    
    return res.json({
      success: true,
      data: { matches },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch active matches',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/pvp/:matchId/forfeit', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { characterId } = req.body;

    if (!characterId) {
      return res.status(400).json({
        success: false,
        error: 'Character ID is required',
      });
    }

    if (!matchId) {
      return res.status(400).json({
        success: false,
        error: 'Match ID is required',
      });
    }
    const result = await pvpService.forfeitMatch(matchId, characterId);
    
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to forfeit match',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as battleRoutes };
