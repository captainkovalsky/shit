import { ItemType, ItemRarity } from '@prisma/client';
import prisma from '../client';
import { UserService } from './UserService';
// import { CharacterService } from './CharacterService';

export interface ShopItem {
  id: string;
  type: ItemType;
  rarity: ItemRarity;
  name: string;
  description: string;
  stats: any;
  priceGold: number;
  priceGems: number | null;
  stackable: boolean;
  iconUrl: string | null;
  overlayLayer: string | null;
  available: boolean;
}

export interface PurchaseResult {
  success: boolean;
  item: ShopItem;
  inventoryItem?: any;
  remainingGold?: number;
  remainingGems?: number;
  error?: string;
}

export interface IShopService {
  getShopItems(filters?: {
    type?: ItemType;
    rarity?: ItemRarity;
    minLevel?: number;
    maxLevel?: number;
  }): Promise<ShopItem[]>;
  getItemById(itemId: string): Promise<ShopItem | null>;
  purchaseWithGold(characterId: string, itemId: string, quantity?: number): Promise<PurchaseResult>;
  purchaseWithGems(characterId: string, itemId: string, quantity?: number): Promise<PurchaseResult>;
  canAfford(characterId: string, itemId: string, currency: 'gold' | 'gems'): Promise<boolean>;
  getCharacterInventory(characterId: string): Promise<any[]>;
  expandInventory(characterId: string, slots: number): Promise<{ success: boolean; newSlots: number; cost: number }>;
  getInventorySlots(characterId: string): Promise<{ current: number; max: number }>;
  seedDefaultItems(): Promise<void>;
}

export class ShopService implements IShopService {
  private userService: UserService;
  // private _characterService: CharacterService;

  constructor() {
    this.userService = new UserService();
    // this._characterService = new CharacterService();
  }

  async getShopItems(filters?: {
    type?: ItemType;
    rarity?: ItemRarity;
    minLevel?: number;
    maxLevel?: number;
  }): Promise<ShopItem[]> {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.rarity) {
      where.rarity = filters.rarity;
    }

    const items = await prisma.item.findMany({
      where,
      orderBy: [
        { rarity: 'asc' },
        { priceGold: 'asc' },
      ],
    });

    return items.map(item => ({
      ...item,
      available: true,
    }));
  }

  async getItemById(itemId: string): Promise<ShopItem | null> {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return null;
    }

    return {
      ...item,
      available: true,
    };
  }

  async purchaseWithGold(characterId: string, itemId: string, quantity: number = 1): Promise<PurchaseResult> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: { user: true },
    });

    if (!character) {
      return {
        success: false,
        item: {} as ShopItem,
        error: 'Character not found',
      };
    }

    const item = await this.getItemById(itemId);
    if (!item) {
      return {
        success: false,
        item: {} as ShopItem,
        error: 'Item not found',
      };
    }

    if (item.priceGold <= 0) {
      return {
        success: false,
        item,
        error: 'Item cannot be purchased with gold',
      };
    }

    const totalCost = item.priceGold * quantity;
    if (character.user.gold < totalCost) {
      return {
        success: false,
        item,
        error: 'Insufficient gold',
      };
    }

    const inventorySlots = await this.getInventorySlots(characterId);
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        characterId,
        itemId,
      },
    });

    if (!existingItem && !item.stackable) {
      const currentItems = await prisma.inventoryItem.count({
        where: { characterId },
      });

      if (currentItems >= inventorySlots.max) {
        return {
          success: false,
          item,
          error: 'Inventory is full',
        };
      }
    }

    await this.userService.spendGold(character.user.id, totalCost);

    let inventoryItem;
    if (existingItem && item.stackable) {
      inventoryItem = await prisma.inventoryItem.update({
        where: { id: existingItem.id },
        data: { qty: existingItem.qty + quantity },
      });
    } else {
      inventoryItem = await prisma.inventoryItem.create({
        data: {
          characterId,
          itemId,
          qty: quantity,
          isEquipped: false,
        },
      });
    }

    const updatedUser = await this.userService.getUserById(character.user.id);

    return {
      success: true,
      item,
      inventoryItem,
      remainingGold: updatedUser?.gold || 0,
    };
  }

  async purchaseWithGems(characterId: string, itemId: string, quantity: number = 1): Promise<PurchaseResult> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: { user: true },
    });

    if (!character) {
      return {
        success: false,
        item: {} as ShopItem,
        error: 'Character not found',
      };
    }

    const item = await this.getItemById(itemId);
    if (!item) {
      return {
        success: false,
        item: {} as ShopItem,
        error: 'Item not found',
      };
    }

    if (!item.priceGems || item.priceGems <= 0) {
      return {
        success: false,
        item,
        error: 'Item cannot be purchased with gems',
      };
    }

    const totalCost = item.priceGems * quantity;
    if (character.user.gems < totalCost) {
      return {
        success: false,
        item,
        error: 'Insufficient gems',
      };
    }

    const inventorySlots = await this.getInventorySlots(characterId);
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        characterId,
        itemId,
      },
    });

    if (!existingItem && !item.stackable) {
      const currentItems = await prisma.inventoryItem.count({
        where: { characterId },
      });

      if (currentItems >= inventorySlots.max) {
        return {
          success: false,
          item,
          error: 'Inventory is full',
        };
      }
    }

    await this.userService.spendGems(character.user.id, totalCost);

    let inventoryItem;
    if (existingItem && item.stackable) {
      inventoryItem = await prisma.inventoryItem.update({
        where: { id: existingItem.id },
        data: { qty: existingItem.qty + quantity },
      });
    } else {
      inventoryItem = await prisma.inventoryItem.create({
        data: {
          characterId,
          itemId,
          qty: quantity,
          isEquipped: false,
        },
      });
    }

    const updatedUser = await this.userService.getUserById(character.user.id);

    return {
      success: true,
      item,
      inventoryItem,
      remainingGems: updatedUser?.gems || 0,
    };
  }

  async canAfford(characterId: string, itemId: string, currency: 'gold' | 'gems'): Promise<boolean> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: { user: true },
    });

    if (!character) {
      return false;
    }

    const item = await this.getItemById(itemId);
    if (!item) {
      return false;
    }

    if (currency === 'gold') {
      return character.user.gold >= (item.priceGold || 0);
    } else {
      return character.user.gems >= (item.priceGems || 0);
    }
  }

  async getCharacterInventory(characterId: string): Promise<any[]> {
    return prisma.inventoryItem.findMany({
      where: { characterId },
      include: {
        item: true,
      },
    });
  }

  async expandInventory(characterId: string, slots: number): Promise<{ success: boolean; newSlots: number; cost: number }> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: { user: true },
    });

    if (!character) {
      return { success: false, newSlots: 0, cost: 0 };
    }

    const cost = slots * 100;
    if (character.user.gems < cost) {
      return { success: false, newSlots: 0, cost };
    }

    await this.userService.spendGems(character.user.id, cost);

    const currentSlots = await this.getInventorySlots(characterId);
    const newSlots = currentSlots.max + slots;

    return { success: true, newSlots, cost };
  }

  async getInventorySlots(characterId: string): Promise<{ current: number; max: number }> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: { user: true },
    });

    if (!character) {
      return { current: 0, max: 20 };
    }

    const currentItems = await prisma.inventoryItem.count({
      where: { characterId },
    });

    const baseSlots = 20;
    const gemExpansions = Math.floor(character.user.gems / 100);
    const maxSlots = baseSlots + gemExpansions;

    return { current: currentItems, max: maxSlots };
  }

  async seedDefaultItems(): Promise<void> {
    const existingItems = await prisma.item.count();
    if (existingItems > 0) {
      return;
    }

    const defaultItems = [
      {
        type: 'WEAPON' as ItemType,
        rarity: 'COMMON' as ItemRarity,
        name: 'Iron Sword',
        description: 'A basic iron sword',
        stats: { attack: 10 },
        priceGold: 100,
        priceGems: null,
        stackable: false,
        overlayLayer: 'weapon',
      },
      {
        type: 'WEAPON' as ItemType,
        rarity: 'RARE' as ItemRarity,
        name: 'Steel Sword',
        description: 'A well-crafted steel sword',
        stats: { attack: 20, critChance: 0.05 },
        priceGold: 500,
        priceGems: 50,
        stackable: false,
        overlayLayer: 'weapon',
      },
      {
        type: 'WEAPON' as ItemType,
        rarity: 'EPIC' as ItemRarity,
        name: 'Dragon Slayer',
        description: 'A legendary sword that can slay dragons',
        stats: { attack: 50, critChance: 0.1, fireDamage: 25 },
        priceGold: 2000,
        priceGems: 200,
        stackable: false,
        overlayLayer: 'weapon',
      },
      {
        type: 'ARMOR' as ItemType,
        rarity: 'COMMON' as ItemRarity,
        name: 'Leather Armor',
        description: 'Basic leather protection',
        stats: { defense: 5, hp: 20 },
        priceGold: 80,
        priceGems: null,
        stackable: false,
        overlayLayer: 'armor',
      },
      {
        type: 'ARMOR' as ItemType,
        rarity: 'RARE' as ItemRarity,
        name: 'Chain Mail',
        description: 'Interlocked metal rings provide good protection',
        stats: { defense: 15, hp: 40 },
        priceGold: 400,
        priceGems: 40,
        stackable: false,
        overlayLayer: 'armor',
      },
      {
        type: 'ARMOR' as ItemType,
        rarity: 'EPIC' as ItemRarity,
        name: 'Dragon Scale Armor',
        description: 'Armor forged from dragon scales',
        stats: { defense: 30, hp: 80, fireResistance: 0.5 },
        priceGold: 1500,
        priceGems: 150,
        stackable: false,
        overlayLayer: 'armor',
      },
      {
        type: 'HELMET' as ItemType,
        rarity: 'COMMON' as ItemRarity,
        name: 'Leather Cap',
        description: 'A simple leather cap',
        stats: { defense: 2, hp: 10 },
        priceGold: 40,
        priceGems: null,
        stackable: false,
        overlayLayer: 'helmet',
      },
      {
        type: 'HELMET' as ItemType,
        rarity: 'RARE' as ItemRarity,
        name: 'Iron Helmet',
        description: 'A sturdy iron helmet',
        stats: { defense: 8, hp: 25 },
        priceGold: 200,
        priceGems: 20,
        stackable: false,
        overlayLayer: 'helmet',
      },
      {
        type: 'BOOTS' as ItemType,
        rarity: 'COMMON' as ItemRarity,
        name: 'Leather Boots',
        description: 'Comfortable leather boots',
        stats: { defense: 1, speed: 1 },
        priceGold: 30,
        priceGems: null,
        stackable: false,
        overlayLayer: 'boots',
      },
      {
        type: 'BOOTS' as ItemType,
        rarity: 'RARE' as ItemRarity,
        name: 'Speed Boots',
        description: 'Boots that enhance movement',
        stats: { defense: 3, speed: 3 },
        priceGold: 150,
        priceGems: 15,
        stackable: false,
        overlayLayer: 'boots',
      },
      {
        type: 'ACCESSORY' as ItemType,
        rarity: 'COMMON' as ItemRarity,
        name: 'Health Ring',
        description: 'A ring that increases health',
        stats: { hp: 30 },
        priceGold: 60,
        priceGems: null,
        stackable: false,
        overlayLayer: 'accessory',
      },
      {
        type: 'ACCESSORY' as ItemType,
        rarity: 'RARE' as ItemRarity,
        name: 'Power Ring',
        description: 'A ring that increases attack power',
        stats: { attack: 15, critChance: 0.03 },
        priceGold: 300,
        priceGems: 30,
        stackable: false,
        overlayLayer: 'accessory',
      },
      {
        type: 'CONSUMABLE' as ItemType,
        rarity: 'COMMON' as ItemRarity,
        name: 'Healing Potion',
        description: 'Restores 50 HP',
        stats: { healAmount: 50 },
        priceGold: 25,
        priceGems: null,
        stackable: true,
        overlayLayer: null,
      },
      {
        type: 'CONSUMABLE' as ItemType,
        rarity: 'COMMON' as ItemRarity,
        name: 'Mana Potion',
        description: 'Restores 30 MP',
        stats: { manaAmount: 30 },
        priceGold: 20,
        priceGems: null,
        stackable: true,
        overlayLayer: null,
      },
      {
        type: 'CONSUMABLE' as ItemType,
        rarity: 'RARE' as ItemRarity,
        name: 'Greater Healing Potion',
        description: 'Restores 150 HP',
        stats: { healAmount: 150 },
        priceGold: 100,
        priceGems: 10,
        stackable: true,
        overlayLayer: null,
      },
    ];

    for (const itemData of defaultItems) {
      await prisma.item.create({
        data: itemData,
      });
    }
  }
}
