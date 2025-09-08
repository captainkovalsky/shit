import { Character, ItemType } from '@prisma/client';
import prisma from '../client';
import { CharacterService } from './CharacterService';
import { ImageService } from '../../image/ImageService';

export interface EquipmentSlot {
  weapon?: string;
  helmet?: string;
  armor?: string;
  boots?: string;
  accessory?: string;
}

export interface EquipResult {
  success: boolean;
  character: Character;
  renderJob?: any;
  error?: string;
}

export interface IEquipmentService {
  equipItem(characterId: string, inventoryItemId: string, slot: keyof EquipmentSlot): Promise<EquipResult>;
  unequipItem(characterId: string, slot: keyof EquipmentSlot): Promise<EquipResult>;
  getCharacterEquipment(characterId: string): Promise<EquipmentSlot>;
  getEquippedStats(characterId: string): Promise<any>;
  canEquipItem(characterId: string, itemId: string, slot: keyof EquipmentSlot): Promise<{ canEquip: boolean; reason?: string }>;
  getAvailableSlots(characterId: string): Promise<{ [key in keyof EquipmentSlot]: boolean }>;
}

export class EquipmentService implements IEquipmentService {
  private characterService: CharacterService;
  private imageService: ImageService;

  constructor() {
    this.characterService = new CharacterService();
    this.imageService = new ImageService();
  }

  async equipItem(characterId: string, inventoryItemId: string, slot: keyof EquipmentSlot): Promise<EquipResult> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      return {
        success: false,
        character: {} as Character,
        error: 'Character not found',
      };
    }

    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
      include: { item: true },
    });

    if (!inventoryItem) {
      return {
        success: false,
        character,
        error: 'Inventory item not found',
      };
    }

    if (inventoryItem.characterId !== characterId) {
      return {
        success: false,
        character,
        error: 'Item does not belong to character',
      };
    }

    if (inventoryItem.qty <= 0) {
      return {
        success: false,
        character,
        error: 'Item quantity is zero',
      };
    }

    const canEquip = await this.canEquipItem(characterId, inventoryItem.itemId, slot);
    if (!canEquip.canEquip) {
      return {
        success: false,
        character,
        error: canEquip.reason || 'Cannot equip item',
      };
    }

    const currentEquipment = character.equipment as EquipmentSlot;
    const newEquipment = { ...currentEquipment };

    if (newEquipment[slot]) {
      await this.unequipItem(characterId, slot);
    }

    newEquipment[slot] = inventoryItem.itemId;

    const updatedCharacter = await this.characterService.updateCharacter(characterId, {
      equipment: newEquipment as any,
    });

    await prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { isEquipped: true },
    });

    const renderJob = await this.imageService.generateCharacterSprite({
      ...updatedCharacter,
      stats: updatedCharacter.stats as any,
      equipment: updatedCharacter.equipment as any,
      spriteUrl: updatedCharacter.spriteUrl || '',
    });

    return {
      success: true,
      character: updatedCharacter,
      renderJob,
    };
  }

  async unequipItem(characterId: string, slot: keyof EquipmentSlot): Promise<EquipResult> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      return {
        success: false,
        character: {} as Character,
        error: 'Character not found',
      };
    }

    const currentEquipment = character.equipment as EquipmentSlot;
    const itemId = currentEquipment[slot];

    if (!itemId) {
      return {
        success: false,
        character,
        error: 'No item equipped in this slot',
      };
    }

    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        characterId,
        itemId,
        isEquipped: true,
      },
    });

    if (inventoryItem) {
      await prisma.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: { isEquipped: false },
      });
    }

    const newEquipment = { ...currentEquipment };
    delete newEquipment[slot];

    const updatedCharacter = await this.characterService.updateCharacter(characterId, {
      equipment: newEquipment as any,
    });

    const renderJob = await this.imageService.generateCharacterSprite({
      ...updatedCharacter,
      stats: updatedCharacter.stats as any,
      equipment: updatedCharacter.equipment as any,
      spriteUrl: updatedCharacter.spriteUrl || '',
    });

    return {
      success: true,
      character: updatedCharacter,
      renderJob,
    };
  }

  async getCharacterEquipment(characterId: string): Promise<EquipmentSlot> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      return {};
    }

    return character.equipment as EquipmentSlot;
  }

  async getEquippedStats(characterId: string): Promise<any> {
    const equipment = await this.getCharacterEquipment(characterId);
    const equippedItems = await prisma.item.findMany({
      where: {
        id: { in: Object.values(equipment).filter(Boolean) },
      },
    });

    const totalStats = {
      attack: 0,
      defense: 0,
      hp: 0,
      mp: 0,
      speed: 0,
      critChance: 0,
    };

    for (const item of equippedItems) {
      const stats = item.stats as any;
      for (const [stat, value] of Object.entries(stats)) {
        if (typeof value === 'number' && stat in totalStats) {
          totalStats[stat as keyof typeof totalStats] += value;
        }
      }
    }

    return totalStats;
  }

  async canEquipItem(characterId: string, itemId: string, slot: keyof EquipmentSlot): Promise<{ canEquip: boolean; reason?: string }> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      return { canEquip: false, reason: 'Character not found' };
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return { canEquip: false, reason: 'Item not found' };
    }

    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        characterId,
        itemId,
        qty: { gt: 0 },
      },
    });

    if (!inventoryItem) {
      return { canEquip: false, reason: 'Item not in inventory' };
    }

    const slotTypeMap: { [key in keyof EquipmentSlot]: ItemType } = {
      weapon: 'WEAPON',
      helmet: 'HELMET',
      armor: 'ARMOR',
      boots: 'BOOTS',
      accessory: 'ACCESSORY',
    };

    if (item.type !== slotTypeMap[slot]) {
      return { canEquip: false, reason: `Item type ${item.type} cannot be equipped in ${slot} slot` };
    }

    if (character.level < (item as any).levelReq || 1) {
      return { canEquip: false, reason: 'Character level too low' };
    }

    return { canEquip: true };
  }

  async getAvailableSlots(characterId: string): Promise<{ [key in keyof EquipmentSlot]: boolean }> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      return {
        weapon: false,
        helmet: false,
        armor: false,
        boots: false,
        accessory: false,
      };
    }

    // const _equipment = character.equipment as EquipmentSlot;
    const inventory = await prisma.inventoryItem.findMany({
      where: {
        characterId,
        qty: { gt: 0 },
        isEquipped: false,
      },
      include: { item: true },
    });

    const availableSlots: { [key in keyof EquipmentSlot]: boolean } = {
      weapon: false,
      helmet: false,
      armor: false,
      boots: false,
      accessory: false,
    };

    const slotTypeMap: { [key in keyof EquipmentSlot]: ItemType } = {
      weapon: 'WEAPON',
      helmet: 'HELMET',
      armor: 'ARMOR',
      boots: 'BOOTS',
      accessory: 'ACCESSORY',
    };

    for (const slot of Object.keys(slotTypeMap) as Array<keyof EquipmentSlot>) {
      const itemType = slotTypeMap[slot];
      const hasAvailableItem = inventory.some(invItem => invItem.item.type === itemType);
      availableSlots[slot] = hasAvailableItem;
    }

    return availableSlots;
  }
}
