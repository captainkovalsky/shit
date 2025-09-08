"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageService = void 0;
const canvas_1 = require("canvas");
const client_1 = require("@prisma/client");
const config_1 = require("@/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ImageService {
    assetsPath;
    outputPath;
    constructor() {
        this.assetsPath = config_1.config.image.assetsPath;
        this.outputPath = path.join(process.cwd(), 'generated_sprites');
        this.ensureDirectories();
    }
    ensureDirectories() {
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
    async generateCharacterSprite(character) {
        try {
            const gender = 'male';
            const baseSpritePath = this.getBaseSpritePath(character.class, gender);
            let baseImage;
            if (fs.existsSync(baseSpritePath)) {
                const img = await (0, canvas_1.loadImage)(baseSpritePath);
                baseImage = (0, canvas_1.createCanvas)(img.width, img.height);
                const ctx = baseImage.getContext('2d');
                ctx.drawImage(img, 0, 0);
            }
            else {
                baseImage = this.createPlaceholderSprite(character.class, gender);
            }
            const finalImage = await this.applyEquipmentLayers(baseImage, character.equipment);
            const filename = `character_${character.id}_${character.level}.png`;
            const outputPath = path.join(this.outputPath, filename);
            const buffer = finalImage.toBuffer('image/png');
            fs.writeFileSync(outputPath, buffer);
            return `${config_1.config.image.cdnBaseUrl}${config_1.config.image.spriteBasePath}/${filename}`;
        }
        catch (error) {
            console.error('Error generating sprite:', error);
            return this.createFallbackSprite(character);
        }
    }
    async generateCharacterCard(character, spriteUrl) {
        try {
            const canvas = (0, canvas_1.createCanvas)(400, 600);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#1a1a28';
            ctx.fillRect(0, 0, 400, 600);
            let spriteImage = null;
            try {
                const localPath = spriteUrl.replace(config_1.config.image.cdnBaseUrl, this.outputPath);
                if (fs.existsSync(localPath)) {
                    const img = await (0, canvas_1.loadImage)(localPath);
                    spriteImage = (0, canvas_1.createCanvas)(img.width, img.height);
                    const spriteCtx = spriteImage.getContext('2d');
                    spriteCtx.drawImage(img, 0, 0);
                }
            }
            catch (error) {
                console.warn('Could not load sprite for card:', error);
            }
            if (spriteImage) {
                const resizedSprite = (0, canvas_1.createCanvas)(200, 200);
                const resizedCtx = resizedSprite.getContext('2d');
                resizedCtx.drawImage(spriteImage, 0, 0, 200, 200);
                ctx.drawImage(resizedSprite, 100, 50);
            }
            ctx.fillStyle = '#ffffff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(character.name, 200, 270);
            ctx.fillStyle = '#6496ff';
            ctx.font = '16px Arial';
            ctx.fillText(`${character.class} - Level ${character.level}`, 200, 300);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`XP: ${character.xp}`, 200, 320);
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
            const filename = `card_${character.id}_${character.level}.png`;
            const outputPath = path.join(this.outputPath, 'cards', filename);
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(outputPath, buffer);
            return `${config_1.config.image.cdnBaseUrl}/cards/${filename}`;
        }
        catch (error) {
            console.error('Error generating character card:', error);
            return this.createFallbackCard(character);
        }
    }
    getBaseSpritePath(characterClass, gender) {
        const baseSprites = {
            [client_1.CharacterClass.WARRIOR]: {
                male: 'warrior_m.png',
                female: 'warrior_f.png',
            },
            [client_1.CharacterClass.MAGE]: {
                male: 'mage_m.png',
                female: 'mage_f.png',
            },
            [client_1.CharacterClass.ROGUE]: {
                male: 'rogue_m.png',
                female: 'rogue_f.png',
            },
        };
        const filename = baseSprites[characterClass]?.[gender] || 'default.png';
        return path.join(this.assetsPath, 'sprites', filename);
    }
    async applyEquipmentLayers(baseImage, equipment) {
        const resultImage = (0, canvas_1.createCanvas)(baseImage.width, baseImage.height);
        const ctx = resultImage.getContext('2d');
        ctx.drawImage(baseImage, 0, 0);
        const layerOrder = ['boots', 'armor', 'helmet', 'weapon', 'accessory'];
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
    async loadEquipmentImage(equipmentType, equipmentId) {
        try {
            const equipmentPath = path.join(this.assetsPath, 'sprites', equipmentType, `${equipmentId}.png`);
            if (fs.existsSync(equipmentPath)) {
                const img = await (0, canvas_1.loadImage)(equipmentPath);
                const canvas = (0, canvas_1.createCanvas)(img.width, img.height);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                return canvas;
            }
            else {
                return this.createEquipmentPlaceholder(equipmentType, equipmentId);
            }
        }
        catch (error) {
            console.error(`Error loading equipment image ${equipmentId}:`, error);
            return null;
        }
    }
    createPlaceholderSprite(characterClass, _gender) {
        const canvas = (0, canvas_1.createCanvas)(64, 64);
        const ctx = canvas.getContext('2d');
        const colors = {
            [client_1.CharacterClass.WARRIOR]: '#8b4513',
            [client_1.CharacterClass.MAGE]: '#4b0082',
            [client_1.CharacterClass.ROGUE]: '#006400',
        };
        const color = colors[characterClass] || '#666666';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(32, 32, 24, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(20, 20, 24, 24);
        return canvas;
    }
    createEquipmentPlaceholder(equipmentType, _equipmentId) {
        const canvas = (0, canvas_1.createCanvas)(64, 64);
        const ctx = canvas.getContext('2d');
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
    createFallbackSprite(character) {
        const canvas = (0, canvas_1.createCanvas)(64, 64);
        const ctx = canvas.getContext('2d');
        const classInitial = character.class[0] || '?';
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(classInitial, 32, 40);
        const filename = `fallback_${character.id}.png`;
        const outputPath = path.join(this.outputPath, filename);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        return `${config_1.config.image.cdnBaseUrl}${config_1.config.image.spriteBasePath}/${filename}`;
    }
    createFallbackCard(character) {
        const canvas = (0, canvas_1.createCanvas)(400, 600);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1a28';
        ctx.fillRect(0, 0, 400, 600);
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(character.name, 200, 300);
        ctx.fillStyle = '#6496ff';
        ctx.fillText(`${character.class} - Level ${character.level}`, 200, 330);
        const filename = `fallback_card_${character.id}.png`;
        const outputPath = path.join(this.outputPath, 'cards', filename);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        return `${config_1.config.image.cdnBaseUrl}/cards/${filename}`;
    }
}
exports.ImageService = ImageService;
//# sourceMappingURL=ImageService.js.map