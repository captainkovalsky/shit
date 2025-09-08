import { UserService } from '../../src/database/services/UserService';
import { PrismaClient } from '@prisma/client';

jest.mock('../../src/database/client', () => ({
  __esModule: true,
  default: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('UserService', () => {
  let userService: UserService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    userService = new UserService();
    mockPrisma = require('../../src/database/client').default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const mockUser = {
        id: '1',
        telegramId: BigInt(123456789),
        username: 'testuser',
        gold: 0,
        gems: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await userService.createUser(BigInt(123456789), 'testuser');

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          telegramId: BigInt(123456789),
          username: 'testuser',
          gold: 0,
          gems: 0,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should create user with null username when not provided', async () => {
      const mockUser = {
        id: '1',
        telegramId: BigInt(123456789),
        username: null,
        gold: 0,
        gems: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await userService.createUser(BigInt(123456789));

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          telegramId: BigInt(123456789),
          username: null,
          gold: 0,
          gems: 0,
        },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserByTelegramId', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: '1',
        telegramId: BigInt(123456789),
        username: 'testuser',
        gold: 100,
        gems: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserByTelegramId(BigInt(123456789));

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { telegramId: BigInt(123456789) },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserByTelegramId(BigInt(123456789));

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const mockUser = {
        id: '1',
        telegramId: BigInt(123456789),
        username: 'updateduser',
        gold: 200,
        gems: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await userService.updateUser('1', { gold: 200, gems: 10 });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { gold: 200, gems: 10 },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const mockUser = {
        id: '1',
        telegramId: BigInt(123456789),
        username: 'testuser',
        gold: 100,
        gems: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.delete.mockResolvedValue(mockUser);

      const result = await userService.deleteUser('1');

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockUser);
    });
  });
});
