// Core game types and interfaces

export enum CharacterClass {
  WARRIOR = 'WARRIOR',
  MAGE = 'MAGE',
  ROGUE = 'ROGUE',
}

export enum ItemType {
  WEAPON = 'WEAPON',
  ARMOR = 'ARMOR',
  HELMET = 'HELMET',
  BOOTS = 'BOOTS',
  ACCESSORY = 'ACCESSORY',
  CONSUMABLE = 'CONSUMABLE',
}

export enum ItemRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

export enum QuestType {
  STORY = 'STORY',
  SIDE = 'SIDE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

export enum QuestStatus {
  AVAILABLE = 'AVAILABLE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum BattleResult {
  WIN = 'WIN',
  LOSE = 'LOSE',
  FLED = 'FLED',
}

export enum BattleStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export enum RenderStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

// Core interfaces
export interface CharacterStats {
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

export interface Equipment {
  weapon?: string;
  helmet?: string;
  armor?: string;
  boots?: string;
  accessory?: string;
}

export interface User {
  id: string;
  telegramId: bigint;
  username?: string;
  gold: number;
  gems: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Character {
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

export interface Item {
  id: string;
  type: ItemType;
  rarity: ItemRarity;
  name: string;
  description: string;
  stats: Record<string, any>;
  priceGold: number;
  priceGems?: number;
  stackable: boolean;
  iconUrl?: string;
  overlayLayer?: string;
  createdAt: Date;
}

export interface InventoryItem {
  id: string;
  characterId: string;
  itemId: string;
  qty: number;
  isEquipped: boolean;
  createdAt: Date;
}

export interface Quest {
  id: string;
  type: QuestType;
  levelReq: number;
  title: string;
  description: string;
  objective: Record<string, any>;
  rewards: Record<string, any>;
  createdAt: Date;
}

export interface CharacterQuest {
  id: string;
  characterId: string;
  questId: string;
  status: QuestStatus;
  progress: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PveBattle {
  id: string;
  characterId: string;
  enemy: Enemy;
  state: BattleState;
  result?: BattleResult;
  createdAt: Date;
  updatedAt: Date;
}

export interface PvpMatch {
  id: string;
  challengerId: string;
  opponentId: string;
  status: BattleStatus;
  round: number;
  log: string[];
  winnerId?: string;
  ratingDelta: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CharacterRating {
  characterId: string;
  rating: number;
  season: string;
  wins: number;
  losses: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentIntent {
  id: string;
  userId: string;
  product: string;
  amountMinor: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  metadata: Record<string, any>;
  confirmationUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RenderJob {
  id: string;
  characterId: string;
  layers: RenderLayer[];
  status: RenderStatus;
  resultUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Game-specific interfaces
export interface Enemy {
  name: string;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  xpReward: number;
  goldReward: [number, number];
  lootChance: number;
  description: string;
  specialAbilities?: string[];
}

export interface BattleState {
  turn: number;
  characterHp: number;
  characterMp: number;
  enemyHp: number;
  log: string[];
}

export interface RenderLayer {
  asset: string;
  zIndex?: number;
}

export interface SkillData {
  damageMultiplier: number;
  mpCost: number;
  critBonus?: number;
  stunChance?: number;
  buffAttack?: number;
  duration?: number;
  aoe?: boolean;
  element?: string;
  absorbDamage?: number;
  dodgeChance?: number;
  multiHit?: number;
}

export interface LootResult {
  gold: number;
  xp: number;
  items: string[];
}

export interface LevelUpResult {
  oldLevel: number;
  newLevel: number;
  levelsGained: number;
  xpGained: number;
  totalXp: number;
}

export interface TurnResult {
  characterHp: number;
  characterMp: number;
  enemyHp: number;
  damageDealt: number;
  damageTaken?: number;
  mpUsed: number;
  result?: BattleResult;
  log: string;
  error?: string;
}

// API interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateCharacterRequest {
  name: string;
  class: CharacterClass;
}

export interface EquipItemRequest {
  inventoryItemId: string;
  slot: keyof Equipment;
}

export interface UnequipItemRequest {
  slot: keyof Equipment;
}

export interface StartBattleRequest {
  characterId: string;
  enemyType: string;
  enemyLevel?: number;
}

export interface TakeTurnRequest {
  action: 'attack' | 'skill' | 'item' | 'run';
  skillId?: string;
  target?: string;
}

export interface AcceptQuestRequest {
  questId: string;
}

export interface BuyItemRequest {
  characterId: string;
  itemId: string;
  qty?: number;
}

export interface CreatePaymentIntentRequest {
  product: string;
  currency?: string;
}

// Bot interfaces
export interface BotContext {
  user: User;
  character?: Character;
  state?: any;
}

export interface BotCommand {
  command: string;
  description: string;
  handler: (ctx: any) => Promise<void>;
}

export interface BotCallback {
  pattern: string | RegExp;
  handler: (ctx: any) => Promise<void>;
}

// Configuration interfaces
export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  connectionTimeout?: number;
}

export interface RedisConfig {
  url: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
}

export interface BotConfig {
  token: string;
  webhookUrl?: string;
  webhookSecret?: string;
}

export interface PaymentConfig {
  providerToken: string;
  webhookSecret?: string;
}

export interface ImageConfig {
  cdnBaseUrl: string;
  spriteBasePath: string;
  assetsPath: string;
}

export interface GameConfig {
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

export interface AppConfig {
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

// Error interfaces
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Event interfaces
export interface GameEvent {
  type: string;
  data: any;
  timestamp: Date;
  userId?: string;
  characterId?: string;
}

export interface BattleEvent extends GameEvent {
  type: 'battle.start' | 'battle.turn' | 'battle.end';
  data: {
    battleId: string;
    characterId: string;
    enemy?: Enemy;
    result?: BattleResult;
  };
}

export interface QuestEvent extends GameEvent {
  type: 'quest.accept' | 'quest.progress' | 'quest.complete';
  data: {
    questId: string;
    characterId: string;
    progress?: Record<string, any>;
    rewards?: Record<string, any>;
  };
}

export interface CharacterEvent extends GameEvent {
  type: 'character.create' | 'character.levelup' | 'character.equip';
  data: {
    characterId: string;
    userId: string;
    level?: number;
    equipment?: Equipment;
  };
}
