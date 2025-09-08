import dotenv from 'dotenv';
import { AppConfig, CharacterClass, ItemRarity } from '@/types';

dotenv.config();

const requiredEnvVars = [
  'BOT_TOKEN',
  'DATABASE_URL',
  'JWT_SECRET_KEY',
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  logLevel: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',

  database: {
    url: process.env.DATABASE_URL!,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '60000', 10),
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379/0',
    retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10),
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
  },

  bot: {
    token: process.env.BOT_TOKEN!,
    webhookUrl: process.env.WEBHOOK_URL,
    webhookSecret: process.env.WEBHOOK_SECRET,
  },

  payment: {
    providerToken: process.env.TELEGRAM_PAYMENT_PROVIDER_TOKEN || '',
    webhookSecret: process.env.WEBHOOK_SECRET_KEY,
  },

  image: {
    cdnBaseUrl: process.env.CDN_BASE_URL || 'https://cdn.example.com',
    spriteBasePath: process.env.SPRITE_BASE_PATH || '/sprites',
    assetsPath: process.env.ASSETS_PATH || 'assets/sprites',
  },

  game: {
    maxCharactersPerUser: parseInt(process.env.MAX_CHARACTERS_PER_USER || '3', 10),
    maxInventorySlots: parseInt(process.env.MAX_INVENTORY_SLOTS || '30', 10),
    baseInventorySlots: parseInt(process.env.BASE_INVENTORY_SLOTS || '20', 10),
    baseHpPerLevel: parseInt(process.env.BASE_HP_PER_LEVEL || '20', 10),
    baseMpPerLevel: parseInt(process.env.BASE_MP_PER_LEVEL || '10', 10),
    baseAttackPerLevel: parseInt(process.env.BASE_ATTACK_PER_LEVEL || '2', 10),
    baseDefensePerLevel: parseFloat(process.env.BASE_DEFENSE_PER_LEVEL || '1.5'),
    baseSpeedPerLevel: parseFloat(process.env.BASE_SPEED_PER_LEVEL || '0.5'),
    baseCritChancePerLevel: parseFloat(process.env.BASE_CRIT_CHANCE_PER_LEVEL || '0.002'),

    classStatBonuses: {
      [CharacterClass.WARRIOR]: {
        strength: 2,
        hp: 20,
      },
      [CharacterClass.MAGE]: {
        intelligence: 2,
        mp: 20,
      },
      [CharacterClass.ROGUE]: {
        agility: 2,
        speed: 1.0,
        critChance: 0.01,
      },
    },

    itemDropRates: {
      [ItemRarity.COMMON]: 0.6,
      [ItemRarity.RARE]: 0.25,
      [ItemRarity.EPIC]: 0.1,
      [ItemRarity.LEGENDARY]: 0.05,
    },
  },
};

export default config;
