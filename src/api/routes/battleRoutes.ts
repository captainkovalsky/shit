import { Router, Request, Response } from 'express';
import { PvEService } from '@/game/services/PvEService';
import { BossService } from '@/game/services/BossService';

const router = Router();
const pveService = new PvEService();
const bossService = new BossService();

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
        const characterLevel = (character.state as any).characterLevel || 1;
        const spawnedEnemy = pveService.spawnEnemy(area, characterLevel);
        if (spawnedEnemy) {
          enemyToFight = spawnedEnemy.type;
        }
      }
    }

    const result = await pveService.startBattle(characterId, enemyToFight, enemyLevel);
    
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
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

    const result = await pveService.takeTurn(battleId, action, skillId, itemId);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to execute turn',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/pve/:battleId', async (req: Request, res: Response) => {
  try {
    const { battleId } = req.params;
    const battle = await pveService.getBattle(battleId);
    
    if (!battle) {
      return res.status(404).json({
        success: false,
        error: 'Battle not found',
      });
    }

    res.json({
      success: true,
      data: { battle },
    });
  } catch (error) {
    res.status(500).json({
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
    
    res.status(201).json({
      success: true,
      data: { battleState },
    });
  } catch (error) {
    res.status(400).json({
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
    
    res.json({
      success: true,
      data: { battleState: newBattleState },
    });
  } catch (error) {
    res.status(400).json({
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
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to complete boss battle',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/bosses', async (req: Request, res: Response) => {
  try {
    const bosses = bossService.getAllBosses();
    
    res.json({
      success: true,
      data: { bosses },
    });
  } catch (error) {
    res.status(500).json({
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
    
    res.json({
      success: true,
      data: { enemies },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enemies',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as battleRoutes };
