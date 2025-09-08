import { ImageService } from '../../src/image/ImageService';
import { CharacterClass } from '@prisma/client';

jest.mock('../../src/config', () => ({
  config: {
    cdn: {
      baseUrl: 'https://test-cdn.com',
      spriteBasePath: '/sprites',
      assetsPath: 'assets/sprites',
    },
    image: {
      assetsPath: 'assets/sprites',
    },
    game: {
      maxCharactersPerUser: 3,
      maxInventorySlots: 30,
      baseInventorySlots: 20,
    },
  },
}));

jest.mock('canvas', () => ({
  createCanvas: jest.fn((width, height) => ({
    width: width || 200,
    height: height || 200,
    getContext: jest.fn(() => ({
      drawImage: jest.fn(),
      fillRect: jest.fn(),
      fillStyle: '',
      font: '',
      textAlign: '',
      fillText: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),
    })),
    toBuffer: jest.fn(() => Buffer.from('mock-image-data')),
  })),
  loadImage: jest.fn(),
}));

jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  existsSync: jest.fn(() => false),
  mkdirSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

describe('ImageService', () => {
  let imageService: ImageService;

  beforeEach(() => {
    imageService = new ImageService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCharacterSprite', () => {
    it('should generate character sprite successfully', async () => {
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
        spriteUrl: 'https://example.com/sprite.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await imageService.generateCharacterSprite(mockCharacter);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle missing sprite files gracefully', async () => {
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
        spriteUrl: 'https://example.com/sprite.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await imageService.generateCharacterSprite(mockCharacter);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('generateCharacterCard', () => {
    it('should generate character card successfully', async () => {
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
        equipment: {
          weapon: 'sword',
          armor: 'leather',
        },
        spriteUrl: 'sprite.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await imageService.generateCharacterCard(mockCharacter, 'sprite.png');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle character without sprite', async () => {
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
        spriteUrl: 'https://example.com/sprite.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await imageService.generateCharacterCard(mockCharacter, '');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('getBaseSpritePath', () => {
    it('should return correct path for warrior male', () => {
      const path = (imageService as any).getBaseSpritePath(CharacterClass.WARRIOR, 'male');
      expect(path).toContain('warrior_m.png');
    });

    it('should return correct path for mage female', () => {
      const path = (imageService as any).getBaseSpritePath(CharacterClass.MAGE, 'female');
      expect(path).toContain('mage_f.png');
    });

    it('should return correct path for rogue male', () => {
      const path = (imageService as any).getBaseSpritePath(CharacterClass.ROGUE, 'male');
      expect(path).toContain('rogue_m.png');
    });

    it('should return default path for unknown class', () => {
      const path = (imageService as any).getBaseSpritePath('UNKNOWN' as CharacterClass, 'male');
      expect(path).toContain('default.png');
    });
  });

  describe('createPlaceholderSprite', () => {
    it('should create placeholder sprite for warrior', () => {
      const canvas = (imageService as any).createPlaceholderSprite(CharacterClass.WARRIOR, 'male');
      expect(canvas).toBeDefined();
      expect(canvas.width).toBe(64);
      expect(canvas.height).toBe(64);
    });

    it('should create placeholder sprite for mage', () => {
      const canvas = (imageService as any).createPlaceholderSprite(CharacterClass.MAGE, 'female');
      expect(canvas).toBeDefined();
      expect(canvas.width).toBe(64);
      expect(canvas.height).toBe(64);
    });

    it('should create placeholder sprite for rogue', () => {
      const canvas = (imageService as any).createPlaceholderSprite(CharacterClass.ROGUE, 'male');
      expect(canvas).toBeDefined();
      expect(canvas.width).toBe(64);
      expect(canvas.height).toBe(64);
    });
  });

  describe('createEquipmentPlaceholder', () => {
    it('should create equipment placeholder', () => {
      const canvas = (imageService as any).createEquipmentPlaceholder('weapon', 'sword');
      expect(canvas).toBeDefined();
      expect(canvas.width).toBe(64);
      expect(canvas.height).toBe(64);
    });
  });

  describe('createFallbackSprite', () => {
    it('should create fallback sprite', () => {
      const mockCharacter = {
        id: 'char1',
        userId: 'user1',
        name: 'TestWarrior',
        class: CharacterClass.WARRIOR,
        level: 1,
        xp: 0,
        stats: {},
        equipment: {},
        spriteUrl: 'https://example.com/sprite.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = (imageService as any).createFallbackSprite(mockCharacter);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('createFallbackCard', () => {
    it('should create fallback card', () => {
      const mockCharacter = {
        id: 'char1',
        userId: 'user1',
        name: 'TestWarrior',
        class: CharacterClass.WARRIOR,
        level: 1,
        xp: 0,
        stats: {},
        equipment: {},
        spriteUrl: 'https://example.com/sprite.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = (imageService as any).createFallbackCard(mockCharacter);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });
});
