import { PrismaClient, User } from '@prisma/client';
import prisma from '../client';

export class UserService {
  constructor(private readonly db: PrismaClient = prisma) {}

  async createUser(telegramId: bigint, username?: string): Promise<User> {
    return this.db.user.create({
      data: {
        telegramId,
        username,
        gold: 0,
        gems: 0,
      },
    });
  }

  async getUserByTelegramId(telegramId: bigint): Promise<User | null> {
    return this.db.user.findUnique({
      where: { telegramId },
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.db.user.update({
      where: { id },
      data,
    });
  }

  async addGold(id: string, amount: number): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        gold: {
          increment: amount,
        },
      },
    });
  }

  async addGems(id: string, amount: number): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        gems: {
          increment: amount,
        },
      },
    });
  }

  async spendGold(id: string, amount: number): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        gold: {
          decrement: amount,
        },
      },
    });
  }

  async spendGems(id: string, amount: number): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        gems: {
          decrement: amount,
        },
      },
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.user.delete({
      where: { id },
    });
  }

  async getUserWithCharacters(telegramId: bigint) {
    return this.db.user.findUnique({
      where: { telegramId },
      include: {
        characters: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async getUserStats(telegramId: bigint) {
    const user = await this.db.user.findUnique({
      where: { telegramId },
      include: {
        characters: {
          select: {
            id: true,
            name: true,
            class: true,
            level: true,
            xp: true,
            spriteUrl: true,
          },
        },
        _count: {
          select: {
            characters: true,
          },
        },
      },
    });

    return user;
  }
}
