import { Router, Request, Response } from 'express';
import { CharacterService } from '@/database/services/CharacterService';
import { EquipmentService } from '@/database/services/EquipmentService';
import { CharacterClass } from '@prisma/client';

const router = Router();
const characterService = new CharacterService();
const equipmentService = new EquipmentService();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const characters = await characterService.getCharactersByUserId(userId as string);
    
    return res.json({
      success: true,
      data: { characters },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch characters',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Character ID is required',
      });
    }
    
    const character = await characterService.getCharacterById(id);
    
    if (!character) {
      return res.status(404).json({
        success: false,
        error: 'Character not found',
      });
    }

    return res.json({
      success: true,
      data: { character },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch character',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, name, class: characterClass } = req.body;

    if (!userId || !name || !characterClass) {
      return res.status(400).json({
        success: false,
        error: 'User ID, name, and class are required',
      });
    }

    const characterCount = await characterService.getCharacterCount(userId);
    if (characterCount >= 3) {
      return res.status(400).json({
        success: false,
        error: 'Maximum character limit reached (3)',
      });
    }

    const existingCharacter = await characterService.getCharacterByName(userId, name);
    if (existingCharacter) {
      return res.status(400).json({
        success: false,
        error: 'Character name already exists',
      });
    }

    const baseStats = {
      hp: 100,
      mp: 50,
      attack: 10,
      defense: 5,
      speed: 5.0,
      critChance: 0.05,
      strength: 8,
      agility: 6,
      intelligence: 4,
    };

    const equipment = {};

    const character = await characterService.createCharacter(
      userId,
      name,
      characterClass as CharacterClass,
      baseStats,
      equipment
    );

    return res.status(201).json({
      success: true,
      data: { character },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to create character',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Character ID is required',
      });
    }

    const character = await characterService.updateCharacter(id, updateData);
    
    return res.json({
      success: true,
      data: { character },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to update character',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Character ID is required',
      });
    }
    
    await characterService.deleteCharacter(id);
    
    return res.json({
      success: true,
      message: 'Character deleted successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to delete character',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:id/inventory', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Character ID is required',
      });
    }
    
    const inventory = await characterService.getCharacterWithInventory(id);
    
    return res.json({
      success: true,
      data: { inventory: inventory?.inventory || [] },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/:id/equip', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { inventoryItemId, slot } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Character ID is required',
      });
    }

    if (!inventoryItemId || !slot) {
      return res.status(400).json({
        success: false,
        error: 'Inventory item ID and slot are required',
      });
    }

    const result = await equipmentService.equipItem(id, inventoryItemId, slot);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      data: { 
        character: result.character,
        renderJob: result.renderJob,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to equip item',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/:id/unequip', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { slot } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Character ID is required',
      });
    }

    if (!slot) {
      return res.status(400).json({
        success: false,
        error: 'Slot is required',
      });
    }

    const result = await equipmentService.unequipItem(id, slot);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      data: { 
        character: result.character,
        renderJob: result.renderJob,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to unequip item',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:id/equipment', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Character ID is required',
      });
    }
    
    const equipment = await equipmentService.getCharacterEquipment(id);
    
    return res.json({
      success: true,
      data: { equipment },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch equipment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Character ID is required',
      });
    }
    
    const character = await characterService.getCharacterById(id);
    
    if (!character) {
      return res.status(404).json({
        success: false,
        error: 'Character not found',
      });
    }

    const baseStats = character.stats as any;
    const equippedStats = await equipmentService.getEquippedStats(id);
    
    const totalStats = {
      hp: baseStats.hp + equippedStats.hp,
      mp: baseStats.mp + equippedStats.mp,
      attack: baseStats.attack + equippedStats.attack,
      defense: baseStats.defense + equippedStats.defense,
      speed: baseStats.speed + equippedStats.speed,
      critChance: baseStats.critChance + equippedStats.critChance,
    };

    return res.json({
      success: true,
      data: { 
        baseStats,
        equippedStats,
        totalStats,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:id/slots', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Character ID is required',
      });
    }
    
    const availableSlots = await equipmentService.getAvailableSlots(id);
    
    return res.json({
      success: true,
      data: { availableSlots },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch available slots',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as characterRoutes };
