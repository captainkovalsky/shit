import { CharacterClass } from '@prisma/client';
interface Character {
    id: string;
    userId: string;
    name: string;
    class: CharacterClass;
    level: number;
    xp: number;
    stats: CharacterStats;
    equipment: Equipment;
    spriteUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
interface CharacterStats {
    hp: number;
    mp: number;
    attack: number;
    defense: number;
    speed: number;
    critChance: number;
    strength: number;
    agility: number;
    intelligence: number;
}
interface Equipment {
    weapon?: string;
    helmet?: string;
    armor?: string;
    boots?: string;
    accessory?: string;
}
export declare class ImageService {
    private assetsPath;
    private outputPath;
    constructor();
    private ensureDirectories;
    generateCharacterSprite(character: Character): Promise<string>;
    generateCharacterCard(character: Character, spriteUrl: string): Promise<string>;
    private getBaseSpritePath;
    private applyEquipmentLayers;
    private loadEquipmentImage;
    private createPlaceholderSprite;
    private createEquipmentPlaceholder;
    private createFallbackSprite;
    private createFallbackCard;
}
export {};
//# sourceMappingURL=ImageService.d.ts.map