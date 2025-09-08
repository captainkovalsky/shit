import { Scenes, Context } from 'telegraf';
import { CharacterClass } from '@prisma/client';
import { IUserService } from '@/database/services/UserService';
import { ICharacterService } from '@/database/services/CharacterService';
import { ImageService } from '@/image/ImageService';

export interface CombatSession extends Scenes.SceneSessionData {
  battleId?: string;
  characterId?: string;
  characterClass?: CharacterClass;
}

export interface BotContext extends Context {
  session: Scenes.SceneSession<CombatSession>;
  scene: Scenes.SceneContextScene<BotContext, CombatSession>;
  userService: IUserService;
  characterService: ICharacterService;
  imageService: ImageService;
}
