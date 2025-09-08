import { Bot } from '../../src/bot/Bot';
import { UserService } from '../../src/database/services/UserService';
import { CharacterService } from '../../src/database/services/CharacterService';
import { ImageService } from '../../src/image/ImageService';
import { CharacterClass } from '@prisma/client';

jest.mock('telegraf');
jest.mock('../../src/database/services/UserService');
jest.mock('../../src/database/services/CharacterService');
jest.mock('../../src/image/ImageService');

describe('Bot Tests', () => {
  let bot: Bot;
  let mockUserService: jest.Mocked<UserService>;
  let mockCharacterService: jest.Mocked<CharacterService>;
  let mockImageService: jest.Mocked<ImageService>;

  beforeEach(() => {
    mockUserService = new UserService() as jest.Mocked<UserService>;
    mockCharacterService = new CharacterService() as jest.Mocked<CharacterService>;
    mockImageService = new ImageService() as jest.Mocked<ImageService>;

    bot = new Bot(
      'test-token',
      mockUserService,
      mockCharacterService,
      mockImageService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Bot Initialization', () => {
    it('should initialize bot with services', () => {
      expect(bot).toBeDefined();
      expect(mockUserService).toBeDefined();
      expect(mockCharacterService).toBeDefined();
      expect(mockImageService).toBeDefined();
    });
  });

  describe('User Registration', () => {
    it('should register new user', async () => {
      const mockUser = {
        id: 'user1',
        telegramId: BigInt(123456789),
        username: 'testuser',
        gold: 0,
        gems: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserService.getUserByTelegramId.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(mockUser);

      const mockContext = {
        from: { id: 123456789, username: 'testuser' },
        reply: jest.fn(),
      } as any;

      await (bot as any).handleStart(mockContext);

      expect(mockUserService.getUserByTelegramId).toHaveBeenCalledWith(BigInt(123456789));
      expect(mockUserService.createUser).toHaveBeenCalledWith(BigInt(123456789), 'testuser');
      expect(mockContext.reply).toHaveBeenCalled();
    });

    it('should handle existing user', async () => {
      const mockUser = {
        id: 'user1',
        telegramId: BigInt(123456789),
        username: 'testuser',
        gold: 100,
        gems: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserService.getUserByTelegramId.mockResolvedValue(mockUser);

      const mockContext = {
        from: { id: 123456789, username: 'testuser' },
        reply: jest.fn(),
      } as any;

      await (bot as any).handleStart(mockContext);

      expect(mockUserService.getUserByTelegramId).toHaveBeenCalledWith(BigInt(123456789));
      expect(mockUserService.createUser).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalled();
    });
  });

  describe('Character Creation', () => {
    it('should create character successfully', async () => {
      const mockUser = {
        id: 'user1',
        telegramId: BigInt(123456789),
        username: 'testuser',
        gold: 0,
        gems: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

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
          defense: 10,
          speed: 15,
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

      mockUserService.getUserByTelegramId.mockResolvedValue(mockUser);
      mockCharacterService.getCharacterByName.mockResolvedValue(null);
      mockCharacterService.createCharacter.mockResolvedValue(mockCharacter);
      mockImageService.generateCharacterSprite.mockResolvedValue('sprite.png');
      mockImageService.generateCharacterCard.mockResolvedValue('card.png');

      const mockContext = {
        from: { id: 123456789 },
        message: { text: 'TestWarrior' },
        session: { characterClass: CharacterClass.WARRIOR },
        replyWithPhoto: jest.fn(),
      } as any;

      await (bot as any).handleCharacterName(mockContext);

      expect(mockCharacterService.getCharacterByName).toHaveBeenCalledWith('user1', 'TestWarrior');
      expect(mockCharacterService.createCharacter).toHaveBeenCalled();
      expect(mockImageService.generateCharacterSprite).toHaveBeenCalled();
      expect(mockImageService.generateCharacterCard).toHaveBeenCalled();
      expect(mockContext.replyWithPhoto).toHaveBeenCalled();
    });

    it('should handle duplicate character name', async () => {
      const mockUser = {
        id: 'user1',
        telegramId: BigInt(123456789),
        username: 'testuser',
        gold: 0,
        gems: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockExistingCharacter = {
        id: 'char1',
        userId: 'user1',
        name: 'TestWarrior',
        class: CharacterClass.WARRIOR,
        level: 1,
        xp: 0,
        stats: {},
        equipment: {},
        spriteUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserService.getUserByTelegramId.mockResolvedValue(mockUser);
      mockCharacterService.getCharacterByName.mockResolvedValue(mockExistingCharacter);

      const mockContext = {
        from: { id: 123456789 },
        message: { text: 'TestWarrior' },
        session: { characterClass: CharacterClass.WARRIOR },
        reply: jest.fn(),
      } as any;

      await (bot as any).handleCharacterName(mockContext);

      expect(mockCharacterService.getCharacterByName).toHaveBeenCalledWith('user1', 'TestWarrior');
      expect(mockCharacterService.createCharacter).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith('This name is already taken. Please choose another.');
    });
  });

  describe('Character Management', () => {
    it('should show character menu', async () => {
      const mockUser = {
        id: 'user1',
        telegramId: BigInt(123456789),
        username: 'testuser',
        gold: 0,
        gems: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCharacters = [
        {
          id: 'char1',
          userId: 'user1',
          name: 'Warrior1',
          class: CharacterClass.WARRIOR,
          level: 5,
          xp: 1000,
          stats: { hp: 200, mp: 100 },
          equipment: {},
          spriteUrl: 'sprite1.png',
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
          stats: { hp: 150, mp: 150 },
          equipment: {},
          spriteUrl: 'sprite2.png',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockUserService.getUserByTelegramId.mockResolvedValue(mockUser);
      mockCharacterService.getCharactersByUserId.mockResolvedValue(mockCharacters);

      const mockContext = {
        from: { id: 123456789 },
        reply: jest.fn(),
      } as any;

      await (bot as any).handleMenu(mockContext);

      expect(mockCharacterService.getCharactersByUserId).toHaveBeenCalledWith('user1');
      expect(mockContext.reply).toHaveBeenCalled();
    });

    it('should handle user with no characters', async () => {
      const mockUser = {
        id: 'user1',
        telegramId: BigInt(123456789),
        username: 'testuser',
        gold: 0,
        gems: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserService.getUserByTelegramId.mockResolvedValue(mockUser);
      mockCharacterService.getCharactersByUserId.mockResolvedValue([]);

      const mockContext = {
        from: { id: 123456789 },
        reply: jest.fn(),
      } as any;

      await (bot as any).handleMenu(mockContext);

      expect(mockCharacterService.getCharactersByUserId).toHaveBeenCalledWith('user1');
      expect(mockContext.reply).toHaveBeenCalled();
    });
  });

  describe('Character Information', () => {
    it('should show character information', async () => {
      const mockCharacter = {
        id: 'char1',
        userId: 'user1',
        name: 'TestWarrior',
        class: CharacterClass.WARRIOR,
        level: 5,
        xp: 1000,
        stats: {
          hp: 200,
          mp: 100,
          attack: 40,
          defense: 20,
          speed: 25,
          critChance: 0.08,
          strength: 25,
          agility: 20,
          intelligence: 15,
        },
        equipment: { weapon: 'sword' },
        spriteUrl: 'sprite.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCharacterService.getCharacterById.mockResolvedValue(mockCharacter);
      mockImageService.generateCharacterCard.mockResolvedValue('card.png');

      const mockContext = {
        match: ['char1'],
        replyWithPhoto: jest.fn(),
      } as any;

      await (bot as any).handleCharacterInfo(mockContext);

      expect(mockCharacterService.getCharacterById).toHaveBeenCalledWith('char1');
      expect(mockImageService.generateCharacterCard).toHaveBeenCalled();
      expect(mockContext.replyWithPhoto).toHaveBeenCalled();
    });

    it('should handle character not found', async () => {
      mockCharacterService.getCharacterById.mockResolvedValue(null);

      const mockContext = {
        match: ['nonexistent'],
        answerCbQuery: jest.fn(),
      } as any;

      await (bot as any).handleCharacterInfo(mockContext);

      expect(mockCharacterService.getCharacterById).toHaveBeenCalledWith('nonexistent');
      expect(mockContext.answerCbQuery).toHaveBeenCalledWith('Character not found!');
    });
  });

  describe('Battle System', () => {
    it('should start battle', async () => {
      const mockCharacter = {
        id: 'char1',
        userId: 'user1',
        name: 'TestWarrior',
        class: CharacterClass.WARRIOR,
        level: 5,
        xp: 1000,
        stats: { hp: 200, mp: 100 },
        equipment: {},
        spriteUrl: 'sprite.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCharacterService.getCharacterById.mockResolvedValue(mockCharacter);

      const mockContext = {
        match: ['char1'],
        session: {},
        scene: { enter: jest.fn() },
        editMessageText: jest.fn(),
      } as any;

      await (bot as any).handleBattle(mockContext);

      expect(mockCharacterService.getCharacterById).toHaveBeenCalledWith('char1');
      expect(mockContext.scene.enter).toHaveBeenCalledWith('combat');
      expect(mockContext.editMessageText).toHaveBeenCalled();
    });

    it('should handle battle with non-existent character', async () => {
      mockCharacterService.getCharacterById.mockResolvedValue(null);

      const mockContext = {
        match: ['nonexistent'],
        answerCbQuery: jest.fn(),
      } as any;

      await (bot as any).handleBattle(mockContext);

      expect(mockCharacterService.getCharacterById).toHaveBeenCalledWith('nonexistent');
      expect(mockContext.answerCbQuery).toHaveBeenCalledWith('Character not found!');
    });
  });
});
