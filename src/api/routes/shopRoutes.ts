import { Router, Request, Response } from 'express';
import { ShopService } from '@/database/services/ShopService';
import { ItemType, ItemRarity } from '@prisma/client';

const router = Router();
const shopService = new ShopService();

router.get('/items', async (req: Request, res: Response) => {
  try {
    const { type, rarity, minLevel, maxLevel } = req.query;
    
    const filters: {
      type?: ItemType;
      rarity?: ItemRarity;
      minLevel?: number;
      maxLevel?: number;
    } = {};
    if (type) filters.type = type as ItemType;
    if (rarity) filters.rarity = rarity as ItemRarity;
    if (minLevel) filters.minLevel = parseInt(minLevel as string);
    if (maxLevel) filters.maxLevel = parseInt(maxLevel as string);

    const items = await shopService.getShopItems(filters);
    
    res.json({
      success: true,
      data: { items },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shop items',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/items/:itemId', async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    
    if (!itemId) {
      return res.status(400).json({
        success: false,
        error: 'Item ID is required',
      });
    }
    
    const item = await shopService.getItemById(itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found',
      });
    }

    return res.json({
      success: true,
      data: { item },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch item',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/buy/gold', async (req: Request, res: Response) => {
  try {
    const { characterId, itemId, quantity = 1 } = req.body;

    if (!characterId || !itemId) {
      return res.status(400).json({
        success: false,
        error: 'Character ID and item ID are required',
      });
    }

    const result = await shopService.purchaseWithGold(characterId, itemId, quantity);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to purchase item',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/buy/gems', async (req: Request, res: Response) => {
  try {
    const { characterId, itemId, quantity = 1 } = req.body;

    if (!characterId || !itemId) {
      return res.status(400).json({
        success: false,
        error: 'Character ID and item ID are required',
      });
    }

    const result = await shopService.purchaseWithGems(characterId, itemId, quantity);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to purchase item',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/inventory/:characterId', async (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;
    
    if (!characterId) {
      return res.status(400).json({
        success: false,
        error: 'Character ID is required',
      });
    }
    
    const inventory = await shopService.getCharacterInventory(characterId);
    
    return res.json({
      success: true,
      data: { inventory },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/inventory/:characterId/slots', async (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;
    
    if (!characterId) {
      return res.status(400).json({
        success: false,
        error: 'Character ID is required',
      });
    }
    
    const slots = await shopService.getInventorySlots(characterId);
    
    return res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory slots',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/inventory/:characterId/expand', async (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;
    const { slots = 5 } = req.body;

    if (!characterId) {
      return res.status(400).json({
        success: false,
        error: 'Character ID is required',
      });
    }

    if (slots <= 0 || slots > 20) {
      return res.status(400).json({
        success: false,
        error: 'Invalid number of slots (1-20)',
      });
    }

    const result = await shopService.expandInventory(characterId, slots);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient gems or invalid request',
        cost: result.cost,
      });
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Failed to expand inventory',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/afford/:characterId/:itemId', async (req: Request, res: Response) => {
  try {
    const { characterId, itemId } = req.params;
    const { currency = 'gold' } = req.query;

    if (!characterId || !itemId) {
      return res.status(400).json({
        success: false,
        error: 'Character ID and Item ID are required',
      });
    }

    if (currency !== 'gold' && currency !== 'gems') {
      return res.status(400).json({
        success: false,
        error: 'Invalid currency type',
      });
    }

    const canAfford = await shopService.canAfford(characterId, itemId, currency as 'gold' | 'gems');
    
    return res.json({
      success: true,
      data: { canAfford, currency },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to check affordability',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/seed', async (_req: Request, res: Response) => {
  try {
    await shopService.seedDefaultItems();
    
    return res.json({
      success: true,
      message: 'Default items seeded successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to seed items',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as shopRoutes };
