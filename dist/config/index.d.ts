declare enum CharacterClass {
    WARRIOR = "WARRIOR",
    MAGE = "MAGE",
    ROGUE = "ROGUE"
}
declare enum ItemRarity {
    COMMON = "COMMON",
    RARE = "RARE",
    EPIC = "EPIC",
    LEGENDARY = "LEGENDARY"
}
interface DatabaseConfig {
    url: string;
    maxConnections?: number;
    connectionTimeout?: number;
}
interface RedisConfig {
    url: string;
    retryDelayOnFailover?: number;
    maxRetriesPerRequest?: number;
}
interface BotConfig {
    token: string;
    webhookUrl?: string | undefined;
    webhookSecret?: string | undefined;
}
interface PaymentConfig {
    providerToken: string;
    webhookSecret?: string | undefined;
}
interface ImageConfig {
    cdnBaseUrl: string;
    spriteBasePath: string;
    assetsPath: string;
}
interface GameConfig {
    maxCharactersPerUser: number;
    maxInventorySlots: number;
    baseInventorySlots: number;
    baseHpPerLevel: number;
    baseMpPerLevel: number;
    baseAttackPerLevel: number;
    baseDefensePerLevel: number;
    baseSpeedPerLevel: number;
    baseCritChancePerLevel: number;
    classStatBonuses: Record<CharacterClass, Record<string, number>>;
    itemDropRates: Record<ItemRarity, number>;
}
interface AppConfig {
    port: number;
    environment: 'development' | 'production' | 'test';
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    database: DatabaseConfig;
    redis: RedisConfig;
    bot: BotConfig;
    payment: PaymentConfig;
    image: ImageConfig;
    game: GameConfig;
}
export declare const config: AppConfig;
export default config;
//# sourceMappingURL=index.d.ts.map