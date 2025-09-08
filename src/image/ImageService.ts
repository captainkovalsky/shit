import { createCanvas, loadImage, Canvas, CanvasRenderingContext2D } from 'canvas';
import { Character, CharacterClass, Equipment } from '@/types';
import { config } from '@/config';
import * as fs from 'fs';
import * as path from 'path';

export class ImageService {
  private assetsPath: string;
  private outputPath: string;

  constructor() {
    this.assetsPath = config.image.assetsPath;
    this.outputPath = path.join(process.cwd(), 'generated_sprites');
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const dirs = [
      this.outputPath,
      path.join(this.outputPath, 'cards'),
      path.join(this.assetsPath, 'sprites'),
      path.join(this.assetsPath, 'sprites', 'weapons'),
      path.join(this.assetsPath, 'sprites', 'armor'),
      path.join(this.assetsPath, 'sprites', 'helmets'),
      path.join(this.assetsPath, 'sprites', 'boots'),
      path.join(this.assetsPath, 'sprites', 'accessories'),
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async generateCharacterSprite(character: Character): Promise<string> {
    try {
      const gender = 'male'; // Default gender, could be made configurable
      const baseSpritePath = this.getBaseSpritePath(character.class, gender);
      
      // Load base character sprite
      let baseImage: Canvas;
      if (fs.existsSync(baseSpritePath)) {
        const img = await loadImage(baseSpritePath);
        baseImage = createCanvas(img.width, img.height);
        const ctx = baseImage.getContext('2d');
        ctx.drawImage(img, 0, 0);
      } else {
        // Create placeholder if base sprite doesn't exist
        baseImage = this.createPlaceholderSprite(character.class, gender);
      }

      // Apply equipment layers
      const finalImage = await this.applyEquipmentLayers(baseImage, character.equipment);

      // Generate filename and save
      const filename = `character_${character.id}_${character.level}.png`;
      const outputPath = path.join(this.outputPath, filename);
      
      const buffer = finalImage.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);

      // Return URL (in production, this would be uploaded to CDN)
      return `${config.image.cdnBaseUrl}${config.image.spriteBasePath}/${filename}`;
    } catch (error) {
      console.error('Error generating sprite:', error);
      return this.createFallbackSprite(character);
    }
  }

  async generateCharacterCard(character: Character, spriteUrl: string): Promise<string> {
    try {
      const canvas = createCanvas(400, 600);
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#1a1a28';
      ctx.fillRect(0, 0, 400, 600);

      // Load character sprite
      let spriteImage: Canvas | null = null;
      try {
        const localPath = spriteUrl.replace(config.image.cdnBaseUrl, this.outputPath);
        if (fs.existsSync(localPath)) {
          const img = await loadImage(localPath);
          spriteImage = createCanvas(img.width, img.height);
          const spriteCtx = spriteImage.getContext('2d');
          spriteCtx.drawImage(img, 0, 0);
        }
      } catch (error) {
        console.warn('Could not load sprite for card:', error);
      }

      // Draw character sprite
      if (spriteImage) {
        const spriteCtx = spriteImage.getContext('2d');
        const resizedSprite = createCanvas(200, 200);
        const resizedCtx = resizedSprite.getContext('2d');
        resizedCtx.drawImage(spriteImage, 0, 0, 200, 200);
        
        ctx.drawImage(resizedSprite, 100, 50);
      }

      // Character info
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(character.name, 200, 270);

      ctx.fillStyle = '#6496ff';
      ctx.font = '16px Arial';
      ctx.fillText(`${character.class} - Level ${character.level}`, 200, 300);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(`XP: ${character.xp}`, 200, 320);

      // Stats
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      const stats = character.stats;
      const statRows = [
        ['HP', stats.hp.toString()],
        ['MP', stats.mp.toString()],
        ['Attack', stats.attack.toString()],
        ['Defense', stats.defense.toString()],
        ['Speed', stats.speed.toFixed(1)],
        ['Crit Chance', `${(stats.critChance * 100).toFixed(1)}%`],
        ['Strength', stats.strength.toString()],
        ['Agility', stats.agility.toString()],
        ['Intelligence', stats.intelligence.toString()],
      ];

      let yStart = 350;
      statRows.forEach(([statName, statValue], index) => {
        const yPos = yStart + (index * 20);
        ctx.fillText(`${statName}: ${statValue}`, 50, yPos);
      });

      // Save card
      const filename = `card_${character.id}_${character.level}.png`;
      const outputPath = path.join(this.outputPath, 'cards', filename);
      
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);

      return `${config.image.cdnBaseUrl}/cards/${filename}`;
    } catch (error) {
      console.error('Error generating character card:', error);
      return this.createFallbackCard(character);
    }
  }

  private getBaseSpritePath(characterClass: CharacterClass, gender: string): string {
    const baseSprites: Record<CharacterClass, Record<string, string>> = {
      [CharacterClass.WARRIOR]: {
        male: 'warrior_m.png',
        female: 'warrior_f.png',
      },
      [CharacterClass.MAGE]: {
        male: 'mage_m.png',
        female: 'mage_f.png',
      },
      [CharacterClass.ROGUE]: {
        male: 'rogue_m.png',
        female: 'rogue_f.png',
      },
    };

    const filename = baseSprites[characterClass][gender];
    return path.join(this.assetsPath, 'sprites', filename);
  }

  private async applyEquipmentLayers(baseImage: Canvas, equipment: Equipment): Promise<Canvas> {
    const resultImage = createCanvas(baseImage.width, baseImage.height);
    const ctx = resultImage.getContext('2d');
    ctx.drawImage(baseImage, 0, 0);

    // Apply equipment in order (background to foreground)
    const layerOrder: (keyof Equipment)[] = ['boots', 'armor', 'helmet', 'weapon', 'accessory'];

    for (const layer of layerOrder) {
      const equipmentId = equipment[layer];
      if (equipmentId) {
        const equipmentImage = await this.loadEquipmentImage(layer, equipmentId);
        if (equipmentImage) {
          ctx.drawImage(equipmentImage, 0, 0);
        }
      }
    }

    return resultImage;
  }

  private async loadEquipmentImage(equipmentType: string, equipmentId: string): Promise<Canvas | null> {
    try {
      const equipmentPath = path.join(
        this.assetsPath,
        'sprites',
        equipmentType,
        `${equipmentId}.png`
      );

      if (fs.existsSync(equipmentPath)) {
        const img = await loadImage(equipmentPath);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return canvas;
      } else {
        // Create placeholder equipment
        return this.createEquipmentPlaceholder(equipmentType, equipmentId);
      }
    } catch (error) {
      console.error(`Error loading equipment image ${equipmentId}:`, error);
      return null;
    }
  }

  private createPlaceholderSprite(characterClass: CharacterClass, gender: string): Canvas {
    const canvas = createCanvas(64, 64);
    const ctx = canvas.getContext('2d');

    // Color based on class
    const colors: Record<CharacterClass, string> = {
      [CharacterClass.WARRIOR]: '#8b4513', // Brown
      [CharacterClass.MAGE]: '#4b0082',     // Purple
      [CharacterClass.ROGUE]: '#006400',    // Dark green
    };

    const color = colors[characterClass];

    // Draw character silhouette
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(32, 32, 24, 0, 2 * Math.PI);
    ctx.fill();

    // Draw face
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(20, 20, 24, 24);

    return canvas;
  }

  private createEquipmentPlaceholder(equipmentType: string, equipmentId: string): Canvas {
    const canvas = createCanvas(64, 64);
    const ctx = canvas.getContext('2d');

    // Simple equipment representation
    ctx.fillStyle = '#c0c0c0';
    
    switch (equipmentType) {
      case 'weapon':
        ctx.fillRect(30, 20, 4, 30);
        break;
      case 'helmet':
        ctx.beginPath();
        ctx.arc(32, 20, 12, 0, 2 * Math.PI);
        ctx.fill();
        break;
      case 'armor':
        ctx.fillRect(15, 25, 34, 20);
        break;
      case 'boots':
        ctx.beginPath();
        ctx.arc(20, 50, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(44, 50, 4, 0, 2 * Math.PI);
        ctx.fill();
        break;
      case 'accessory':
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(32, 19, 4, 0, 2 * Math.PI);
        ctx.fill();
        break;
    }

    return canvas;
  }

  private createFallbackSprite(character: Character): string {
    const canvas = createCanvas(64, 64);
    const ctx = canvas.getContext('2d');

    // Draw character class initial
    const classInitial = character.class[0];
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(classInitial, 32, 40);

    // Save fallback
    const filename = `fallback_${character.id}.png`;
    const outputPath = path.join(this.outputPath, filename);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    return `${config.image.cdnBaseUrl}${config.image.spriteBasePath}/${filename}`;
  }

  private createFallbackCard(character: Character): string {
    const canvas = createCanvas(400, 600);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1a1a28';
    ctx.fillRect(0, 0, 400, 600);

    // Simple text-based card
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(character.name, 200, 300);
    
    ctx.fillStyle = '#6496ff';
    ctx.fillText(`${character.class} - Level ${character.level}`, 200, 330);

    // Save fallback card
    const filename = `fallback_card_${character.id}.png`;
    const outputPath = path.join(this.outputPath, 'cards', filename);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    return `${config.image.cdnBaseUrl}/cards/${filename}`;
  }
}
