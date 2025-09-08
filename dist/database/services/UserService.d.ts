import { PrismaClient, User } from '@prisma/client';
export declare class UserService {
    private readonly db;
    constructor(db?: PrismaClient);
    createUser(telegramId: bigint, username?: string): Promise<User>;
    getUserByTelegramId(telegramId: bigint): Promise<User | null>;
    getUserById(id: string): Promise<User | null>;
    updateUser(id: string, data: Partial<User>): Promise<User>;
    addGold(id: string, amount: number): Promise<User>;
    addGems(id: string, amount: number): Promise<User>;
    spendGold(id: string, amount: number): Promise<User>;
    spendGems(id: string, amount: number): Promise<User>;
    deleteUser(id: string): Promise<void>;
    getUserWithCharacters(telegramId: bigint): Promise<({
        characters: {
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
        }[];
    } & {
        id: string;
        telegramId: bigint;
        username: string | null;
        gold: number;
        gems: number;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    getUserStats(telegramId: bigint): Promise<({
        characters: {
            name: string;
            id: string;
            class: import(".prisma/client").$Enums.CharacterClass;
            level: number;
            xp: number;
            spriteUrl: string | null;
        }[];
        _count: {
            characters: number;
        };
    } & {
        id: string;
        telegramId: bigint;
        username: string | null;
        gold: number;
        gems: number;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
}
//# sourceMappingURL=UserService.d.ts.map