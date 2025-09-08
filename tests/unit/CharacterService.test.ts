import { CharacterService } from '../../src/database/services/CharacterService';
import { CharacterClass } from '@prisma/client';

jest.mock('../../src/database/client', () => ({
  __esModule: true,
  default: {
    character: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('CharacterService', () => {
  let characterService: CharacterService;
  let mockPrisma: any;

  beforeEach(() => {
    characterService = new CharacterService();
    mockPrisma = require('../../src/database/client').default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCharacter', () => {
    it('should create a new character', async () => {
      const mockCharacter = {
        id: 'char1',
        userId: 'user1',
        name: 'TestWarrior',
        class: CharacterClass.WARRIOR,
        level: 1,
        xp: 0,
        stats: {
          hp: 100,
          mp: 50,
          attack: 20,
          defense: 15,
          speed: 10,
          critChance: 0.05,
          strength: 15,
          agility: 10,
          intelligence: 5,
        },
        equipment: {},
        spriteUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const stats = {
        hp: 100,
        mp: 50,
        attack: 20,
        defense: 15,
        speed: 10,
        critChance: 0.05,
        strength: 15,
        agility: 10,
        intelligence: 5,
      };

      const equipment = {};

      mockPrisma.character.create.mockResolvedValue(mockCharacter);

      const result = await characterService.createCharacter(
        'user1',
        'TestWarrior',
        CharacterClass.WARRIOR,
        stats,
        equipment
      );

      expect(mockPrisma.character.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          name: 'TestWarrior',
          class: CharacterClass.WARRIOR,
          level: 1,
          xp: 0,
          stats: stats,
          equipment: equipment,
        },
      });
      expect(result).toEqual(mockCharacter);
    });
  });

  describe('getCharacterById', () => {
    it('should return character when found', async () => {
      const mockCharacter = {
        id: 'char1',
        userId: 'user1',
        name: 'TestWarrior',
        class: CharacterClass.WARRIOR,
        level: 5,
        xp: 1000,
        stats: { hp: 200, mp: 100 },
        equipment: { weapon: 'sword' },
        spriteUrl: 'sprite.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.character.findUnique.mockResolvedValue(mockCharacter);

      const result = await characterService.getCharacterById('char1');

      expect(mockPrisma.character.findUnique).toHaveBeenCalledWith({
        where: { id: 'char1' },
      });
      expect(result).toEqual(mockCharacter);
    });

    it('should return null when character not found', async () => {
      mockPrisma.character.findUnique.mockResolvedValue(null);

      const result = await characterService.getCharacterById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getCharactersByUserId', () => {
    it('should return all characters for a user', async () => {
      const mockCharacters = [
        {
          id: 'char1',
          userId: 'user1',
          name: 'Warrior1',
          class: CharacterClass.WARRIOR,
          level: 5,
          xp: 1000,
          stats: {},
          equipment: {},
          spriteUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'char2',
          userId: 'user1',
          name: 'Mage1',
          class: CharacterClass.MAGE,
          level: 3,
          xp: 500,
          stats: {},
          equipment: {},
          spriteUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.character.findMany.mockResolvedValue(mockCharacters);

      const result = await characterService.getCharactersByUserId('user1');

      expect(mockPrisma.character.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(mockCharacters);
    });
  });

  describe('updateCharacterStats', () => {
    it('should update character stats', async () => {
      const mockCharacter = {
        id: 'char1',
        userId: 'user1',
        name: 'TestWarrior',
        class: CharacterClass.WARRIOR,
        level: 5,
        xp: 1000,
        stats: { hp: 200, mp: 100 },
        equipment: {},
        spriteUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newStats = {
        hp: 250,
        mp: 120,
        attack: 30,
        defense: 25,
        speed: 15,
        critChance: 0.08,
        strength: 20,
        agility: 15,
        intelligence: 10,
      };

      mockPrisma.character.update.mockResolvedValue({
        ...mockCharacter,
        stats: newStats,
      });

      const result = await characterService.updateCharacterStats('char1', newStats);

      expect(mockPrisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char1' },
        data: { stats: newStats },
      });
      expect(result.stats).toEqual(newStats);
    });
  });

  describe('deleteCharacter', () => {
    it('should delete character successfully', async () => {
      const mockCharacter = {
        id: 'char1',
        userId: 'user1',
        name: 'TestWarrior',
        class: CharacterClass.WARRIOR,
        level: 5,
        xp: 1000,
        stats: {},
        equipment: {},
        spriteUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.character.delete.mockResolvedValue(mockCharacter);

      const result = await characterService.deleteCharacter('char1');

      expect(mockPrisma.character.delete).toHaveBeenCalledWith({
        where: { id: 'char1' },
      });
      expect(result).toEqual(mockCharacter);
    });
  });
});
