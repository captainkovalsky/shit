import { PrismaClient, Character, CharacterClass } from '@prisma/client';
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
export declare class CharacterService {
    private readonly db;
    constructor(db?: PrismaClient);
    createCharacter(userId: string, name: string, characterClass: CharacterClass, stats: CharacterStats, equipment: Equipment): Promise<Character>;
    getCharacterById(id: string): Promise<Character | null>;
    getCharacterByName(userId: string, name: string): Promise<Character | null>;
    getCharactersByUserId(userId: string): Promise<Character[]>;
    updateCharacter(id: string, data: Partial<Character>): Promise<Character>;
    updateCharacterStats(id: string, stats: CharacterStats): Promise<Character>;
    updateCharacterEquipment(id: string, equipment: Equipment): Promise<Character>;
    addXp(id: string, xp: number): Promise<Character>;
    levelUp(id: string, newLevel: number, newStats: CharacterStats): Promise<Character>;
    updateSpriteUrl(id: string, spriteUrl: string): Promise<Character>;
    deleteCharacter(id: string): Promise<void>;
    getCharacterWithInventory(id: string): Promise<({
        user: {
            id: string;
            telegramId: bigint;
            username: string | null;
            gold: number;
            gems: number;
        };
        inventory: ({
            item: {
                name: string;
                id: string;
                createdAt: Date;
                stats: import("@prisma/client/runtime/library").JsonValue;
                type: import(".prisma/client").$Enums.ItemType;
                description: string;
                rarity: import(".prisma/client").$Enums.ItemRarity;
                priceGold: number;
                priceGems: number | null;
                stackable: boolean;
                iconUrl: string | null;
                overlayLayer: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            characterId: string;
            itemId: string;
            qty: number;
            isEquipped: boolean;
        })[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        class: import(".prisma/client").$Enums.CharacterClass;
        level: number;
        xp: number;
        stats: import("@prisma/client/runtime/library").JsonValue;
        equipment: import("@prisma/client/runtime/library").JsonValue;
        spriteUrl: string | null;
    }) | null>;
    getCharacterWithQuests(id: string): Promise<({
        characterQuests: ({
            quest: {
                id: string;
                createdAt: Date;
                type: import(".prisma/client").$Enums.QuestType;
                title: string;
                description: string;
                levelReq: number;
                objective: import("@prisma/client/runtime/library").JsonValue;
                rewards: import("@prisma/client/runtime/library").JsonValue;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            characterId: string;
            status: import(".prisma/client").$Enums.QuestStatus;
            questId: string;
            progress: import("@prisma/client/runtime/library").JsonValue;
        })[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        class: import(".prisma/client").$Enums.CharacterClass;
        level: number;
        xp: number;
        stats: import("@prisma/client/runtime/library").JsonValue;
        equipment: import("@prisma/client/runtime/library").JsonValue;
        spriteUrl: string | null;
    }) | null>;
    getCharacterWithBattles(id: string): Promise<({
        pveBattles: {
            result: import(".prisma/client").$Enums.BattleResult | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            characterId: string;
            enemy: import("@prisma/client/runtime/library").JsonValue;
            state: import("@prisma/client/runtime/library").JsonValue;
        }[];
        pvpMatches: {
            log: import("@prisma/client/runtime/library").JsonValue;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            challengerId: string;
            opponentId: string;
            status: import(".prisma/client").$Enums.BattleStatus;
            round: number;
            winnerId: string | null;
            ratingDelta: number;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        class: import(".prisma/client").$Enums.CharacterClass;
        level: number;
        xp: number;
        stats: import("@prisma/client/runtime/library").JsonValue;
        equipment: import("@prisma/client/runtime/library").JsonValue;
        spriteUrl: string | null;
    }) | null>;
    getCharacterCount(userId: string): Promise<number>;
    getCharactersByLevel(minLevel: number, maxLevel?: number): Promise<({
        user: {
            telegramId: bigint;
            username: string | null;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        class: import(".prisma/client").$Enums.CharacterClass;
        level: number;
        xp: number;
        stats: import("@prisma/client/runtime/library").JsonValue;
        equipment: import("@prisma/client/runtime/library").JsonValue;
        spriteUrl: string | null;
    })[]>;
}
export {};
//# sourceMappingURL=CharacterService.d.ts.map