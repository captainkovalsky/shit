import { PrismaClient, Character, CharacterClass } from '@prisma/client';
import { CharacterStats, Equipment } from '@/types';
import prisma from '../client';

export class CharacterService {
  constructor(private readonly db: PrismaClient = prisma) {}

  async createCharacter(
    userId: string,
    name: string,
    characterClass: CharacterClass,
    stats: CharacterStats,
    equipment: Equipment
  ): Promise<Character> {
    return this.db.character.create({
      data: {
        userId,
        name,
        class: characterClass,
        level: 1,
        xp: 0,
        stats: stats as any,
        equipment: equipment as any,
      },
    });
  }

  async getCharacterById(id: string): Promise<Character | null> {
    return this.db.character.findUnique({
      where: { id },
    });
  }

  async getCharacterByName(userId: string, name: string): Promise<Character | null> {
    return this.db.character.findUnique({
      where: {
        userId_name: {
          userId,
          name,
        },
      },
    });
  }

  async getCharactersByUserId(userId: string): Promise<Character[]> {
    return this.db.character.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateCharacter(id: string, data: Partial<Character>): Promise<Character> {
    return this.db.character.update({
      where: { id },
      data,
    });
  }

  async updateCharacterStats(id: string, stats: CharacterStats): Promise<Character> {
    return this.db.character.update({
      where: { id },
      data: {
        stats: stats as any,
      },
    });
  }

  async updateCharacterEquipment(id: string, equipment: Equipment): Promise<Character> {
    return this.db.character.update({
      where: { id },
      data: {
        equipment: equipment as any,
      },
    });
  }

  async addXp(id: string, xp: number): Promise<Character> {
    return this.db.character.update({
      where: { id },
      data: {
        xp: {
          increment: xp,
        },
      },
    });
  }

  async levelUp(id: string, newLevel: number, newStats: CharacterStats): Promise<Character> {
    return this.db.character.update({
      where: { id },
      data: {
        level: newLevel,
        stats: newStats as any,
      },
    });
  }

  async updateSpriteUrl(id: string, spriteUrl: string): Promise<Character> {
    return this.db.character.update({
      where: { id },
      data: { spriteUrl },
    });
  }

  async deleteCharacter(id: string): Promise<void> {
    await this.db.character.delete({
      where: { id },
    });
  }

  async getCharacterWithInventory(id: string) {
    return this.db.character.findUnique({
      where: { id },
      include: {
        inventory: {
          include: {
            item: true,
          },
        },
        user: {
          select: {
            id: true,
            telegramId: true,
            username: true,
            gold: true,
            gems: true,
          },
        },
      },
    });
  }

  async getCharacterWithQuests(id: string) {
    return this.db.character.findUnique({
      where: { id },
      include: {
        characterQuests: {
          include: {
            quest: true,
          },
        },
      },
    });
  }

  async getCharacterWithBattles(id: string) {
    return this.db.character.findUnique({
      where: { id },
      include: {
        pveBattles: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        pvpMatches: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async getCharacterCount(userId: string): Promise<number> {
    return this.db.character.count({
      where: { userId },
    });
  }

  async getCharactersByLevel(minLevel: number, maxLevel?: number) {
    return this.db.character.findMany({
      where: {
        level: {
          gte: minLevel,
          ...(maxLevel && { lte: maxLevel }),
        },
      },
      include: {
        user: {
          select: {
            telegramId: true,
            username: true,
          },
        },
      },
    });
  }
}
