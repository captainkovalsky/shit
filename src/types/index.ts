// Re-export common interfaces from their respective modules
export type { CharacterStats, Equipment } from '@/database/services/CharacterService';
export type { IUserService } from '@/database/services/UserService';
export type { ICharacterService } from '@/database/services/CharacterService';
export type { Enemy, SkillData, TurnResult, ICombatService } from '@/game/services/CombatService';
export type { ILevelingService } from '@/game/services/LevelingService';

// Common types that are used across modules
export interface JwtPayload {
  telegramId: string;
  userId: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest {
  user?: {
    telegramId: string;
    userId: string;
  } | undefined;
}
