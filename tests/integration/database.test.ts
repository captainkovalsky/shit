import { PrismaClient } from '@prisma/client';
import { UserService } from '../../src/database/services/UserService';
import { CharacterService } from '../../src/database/services/CharacterService';
import { CharacterClass } from '@prisma/client';

describe('Database Integration Tests', () => {
  let prisma: PrismaClient;
  let userService: UserService;
  let characterService: CharacterService;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env['DATABASE_URL'] || 'postgresql://test:test@localhost:5432/test_db',
        },
      },
    });
    userService = new UserService(prisma);
    characterService = new CharacterService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.character.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('User and Character Integration', () => {
    it('should create user and character together', async () => {
      const user = await userService.createUser(BigInt(123456789), 'testuser');
      expect(user).toBeDefined();
      expect(user.telegramId).toBe(BigInt(123456789));
      expect(user.username).toBe('testuser');

      const stats = {
        hp: 100,
        mp: 50,
        attack: 20,
        defense: 10,
        speed: 15,
        critChance: 0.05,
        strength: 15,
        agility: 10,
        intelligence: 5,
      };

      const equipment = {};

      const character = await characterService.createCharacter(
        user.id,
        'TestWarrior',
        CharacterClass.WARRIOR,
        stats,
        equipment
      );

      expect(character).toBeDefined();
      expect(character.userId).toBe(user.id);
      expect(character.name).toBe('TestWarrior');
      expect(character.class).toBe(CharacterClass.WARRIOR);
    });

    it('should retrieve user with characters', async () => {
      const user = await userService.createUser(BigInt(987654321), 'testuser2');
      
      const stats = {
        hp: 100,
        mp: 50,
        attack: 20,
        defense: 10,
        speed: 15,
        critChance: 0.05,
        strength: 15,
        agility: 10,
        intelligence: 5,
      };

      const equipment = {};

      await characterService.createCharacter(
        user.id,
        'Warrior1',
        CharacterClass.WARRIOR,
        stats,
        equipment
      );

      await characterService.createCharacter(
        user.id,
        'Mage1',
        CharacterClass.MAGE,
        stats,
        equipment
      );

      const characters = await characterService.getCharactersByUserId(user.id);
      expect(characters).toHaveLength(2);
      expect(characters[0]?.name).toBe('Warrior1');
      expect(characters[1]?.name).toBe('Mage1');
    });

    it('should update character stats', async () => {
      const user = await userService.createUser(BigInt(555666777), 'testuser3');
      
      const initialStats = {
        hp: 100,
        mp: 50,
        attack: 20,
        defense: 10,
        speed: 15,
        critChance: 0.05,
        strength: 15,
        agility: 10,
        intelligence: 5,
      };

      const equipment = {};

      const character = await characterService.createCharacter(
        user.id,
        'TestCharacter',
        CharacterClass.WARRIOR,
        initialStats,
        equipment
      );

      const updatedStats = {
        hp: 150,
        mp: 75,
        attack: 30,
        defense: 20,
        speed: 20,
        critChance: 0.08,
        strength: 20,
        agility: 15,
        intelligence: 10,
      };

      const updatedCharacter = await characterService.updateCharacterStats(
        character.id,
        updatedStats
      );

      expect(updatedCharacter.stats).toEqual(updatedStats);
    });

    it('should handle character deletion', async () => {
      const user = await userService.createUser(BigInt(111222333), 'testuser4');
      
      const stats = {
        hp: 100,
        mp: 50,
        attack: 20,
        defense: 10,
        speed: 15,
        critChance: 0.05,
        strength: 15,
        agility: 10,
        intelligence: 5,
      };

      const equipment = {};

      const character = await characterService.createCharacter(
        user.id,
        'ToBeDeleted',
        CharacterClass.ROGUE,
        stats,
        equipment
      );

      await characterService.deleteCharacter(character.id);

      const retrievedCharacter = await characterService.getCharacterById(character.id);
      expect(retrievedCharacter).toBeNull();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity', async () => {
      const user = await userService.createUser(BigInt(444555666), 'testuser5');
      
      const stats = {
        hp: 100,
        mp: 50,
        attack: 20,
        defense: 10,
        speed: 15,
        critChance: 0.05,
        strength: 15,
        agility: 10,
        intelligence: 5,
      };

      const equipment = {};

      const character = await characterService.createCharacter(
        user.id,
        'ConsistencyTest',
        CharacterClass.MAGE,
        stats,
        equipment
      );

      const retrievedCharacter = await characterService.getCharacterById(character.id);
      expect(retrievedCharacter).toBeDefined();
      expect(retrievedCharacter!.userId).toBe(user.id);

      const retrievedUser = await userService.getUserByTelegramId(BigInt(444555666));
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser!.id).toBe(user.id);
    });

    it('should handle unique constraints', async () => {
      const user = await userService.createUser(BigInt(777888999), 'testuser6');
      
      const stats = {
        hp: 100,
        mp: 50,
        attack: 20,
        defense: 10,
        speed: 15,
        critChance: 0.05,
        strength: 15,
        agility: 10,
        intelligence: 5,
      };

      const equipment = {};

      await characterService.createCharacter(
        user.id,
        'UniqueName',
        CharacterClass.WARRIOR,
        stats,
        equipment
      );

      await expect(
        characterService.createCharacter(
          user.id,
          'UniqueName',
          CharacterClass.MAGE,
          stats,
          equipment
        )
      ).rejects.toThrow();
    });
  });
});
