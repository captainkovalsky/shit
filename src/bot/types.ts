import { Scenes, Context } from 'telegraf';
import { CharacterClass } from '@prisma/client';
import { IUserService } from '@/database/services/UserService';
import { ICharacterService } from '@/database/services/CharacterService';
import { IQuestService } from '@/database/services/QuestService';
import { IShopService } from '@/database/services/ShopService';
import { IEquipmentService } from '@/database/services/EquipmentService';
import { IPaymentService } from '@/database/services/PaymentService';
import { IPvPService } from '@/game/services/PvPService';
import { IPvEService } from '@/game/services/PvEService';
import { IBossService } from '@/game/services/BossService';
import { ImageService } from '@/image/ImageService';

export interface CombatSession extends Scenes.SceneSessionData {
  battleId?: string;
  characterId?: string;
  characterClass?: CharacterClass;
  bossBattleState?: any; // Will be properly typed when BossBattleState is imported
}

export interface BotContext extends Context {
  session: Scenes.SceneSession<CombatSession>;
  scene: Scenes.SceneContextScene<BotContext, CombatSession>;
  userService: IUserService;
  characterService: ICharacterService;
  questService: IQuestService;
  shopService: IShopService;
  equipmentService: IEquipmentService;
  paymentService: IPaymentService;
  pvpService: IPvPService;
  pveService: IPvEService;
  bossService: IBossService;
  imageService: ImageService;
}
