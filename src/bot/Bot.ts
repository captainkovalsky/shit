import { Telegraf, Scenes } from 'telegraf';
import { config } from '@/config/index';
import { UserService, IUserService } from '@/database/services/UserService';
import { CharacterService, ICharacterService } from '@/database/services/CharacterService';
import { QuestService, IQuestService } from '@/database/services/QuestService';
import { ShopService, IShopService } from '@/database/services/ShopService';
import { EquipmentService, IEquipmentService } from '@/database/services/EquipmentService';
import { PaymentService, IPaymentService } from '@/database/services/PaymentService';
import { PvPService, IPvPService } from '@/game/services/PvPService';
import { PvEService, IPvEService } from '@/game/services/PvEService';
import { BossService, IBossService } from '@/game/services/BossService';
import { ImageService } from '@/image/ImageService';
import { CommandHandler } from './handlers/CommandHandler';
import { CallbackHandler } from './handlers/CallbackHandler';
import { SceneHandler } from './handlers/SceneHandler';
import { BotContext } from './types';

export class Bot {
  private bot: Telegraf<BotContext>;
  private userService: IUserService;
  private characterService: ICharacterService;
  private questService: IQuestService;
  private shopService: IShopService;
  private equipmentService: IEquipmentService;
  private paymentService: IPaymentService;
  private pvpService: IPvPService;
  private pveService: IPvEService;
  private bossService: IBossService;
  private imageService: ImageService;
  private commandHandler: CommandHandler;
  private callbackHandler: CallbackHandler;

  constructor() {
    this.bot = new Telegraf<BotContext>(config.bot.token);
    this.userService = new UserService();
    this.characterService = new CharacterService();
    this.questService = new QuestService();
    this.shopService = new ShopService();
    this.equipmentService = new EquipmentService();
    this.paymentService = new PaymentService();
    this.pvpService = new PvPService();
    this.pveService = new PvEService();
    this.bossService = new BossService();
    this.imageService = new ImageService();
    
    this.commandHandler = new CommandHandler(
      this.userService,
      this.characterService
    );
    this.callbackHandler = new CallbackHandler(
      this.userService,
      this.characterService,
      this.questService,
      this.shopService,
      this.equipmentService,
      this.paymentService,
      this.pvpService,
      this.pveService,
      this.bossService,
      this.imageService
    );

    this.setupMiddleware();
    this.setupScenes();
    this.setupCommands();
    this.setupCallbacks();
  }

  private setupMiddleware(): void {
    this.bot.use((ctx, next) => {
      ctx.userService = this.userService;
      ctx.characterService = this.characterService;
      ctx.questService = this.questService;
      ctx.shopService = this.shopService;
      ctx.equipmentService = this.equipmentService;
      ctx.paymentService = this.paymentService;
      ctx.pvpService = this.pvpService;
      ctx.pveService = this.pveService;
      ctx.bossService = this.bossService;
      ctx.imageService = this.imageService;
      return next();
    });

    this.bot.use((ctx, next) => {
      console.log(`Received message from ${ctx.from?.username || ctx.from?.id}: ${ctx.message}`);
      return next();
    });
  }

  private setupScenes(): void {
    const stage = new Scenes.Stage<BotContext>();

    stage.register(SceneHandler.createCharacterCreationScene());
    stage.register(SceneHandler.createCombatScene());

    this.bot.use(stage.middleware());
  }

  private setupCommands(): void {
    this.bot.start(async (ctx) => {
      await this.commandHandler.handleStart(ctx);
    });

    this.bot.command('menu', async (ctx) => {
      await this.commandHandler.handleMenu(ctx);
    });

    this.bot.command('help', async (ctx) => {
      await this.commandHandler.handleHelp(ctx);
    });
  }

  private setupCallbacks(): void {
    // Class selection
    this.bot.action(/^class_(.+)$/, async (ctx) => {
      const characterClass = ctx.match?.[1];
      if (characterClass) {
        await this.callbackHandler.handleClassSelection(ctx, characterClass);
      }
    });

    // Character selection
    this.bot.action(/^select_char_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      if (characterId) {
        await this.callbackHandler.handleCharacterSelection(ctx, characterId);
      }
    });

    // Character info
    this.bot.action(/^char_info_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      if (characterId) {
        await this.callbackHandler.handleCharacterInfo(ctx, characterId);
      }
    });

    // Battle
    this.bot.action(/^battle_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      if (characterId) {
        await this.callbackHandler.handleBattle(ctx, characterId);
      }
    });

    // Battle actions
    this.bot.action(/^action_(.+)$/, async (ctx) => {
      const action = ctx.match?.[1];
      if (action) {
        await this.callbackHandler.handleBattleAction(ctx, action);
      }
    });

    // Quest handlers
    this.bot.action(/^quests_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      if (characterId) {
        await this.callbackHandler.handleQuests(ctx, characterId);
      }
    });

    this.bot.action(/^quest_accept_(.+)_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      const questId = ctx.match?.[2];
      if (characterId && questId) {
        await this.callbackHandler.handleQuestAccept(ctx, characterId, questId);
      }
    });

    this.bot.action(/^quest_progress_(.+)_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      const questId = ctx.match?.[2];
      if (characterId && questId) {
        await this.callbackHandler.handleQuestProgress(ctx, characterId, questId);
      }
    });

    this.bot.action(/^quest_complete_(.+)_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      const questId = ctx.match?.[2];
      if (characterId && questId) {
        await this.callbackHandler.handleQuestComplete(ctx, characterId, questId);
      }
    });

    // Shop handlers
    this.bot.action(/^shop_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      if (characterId) {
        await this.callbackHandler.handleShop(ctx, characterId);
      }
    });

    this.bot.action(/^shop_buy_(.+)_(.+)_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      const itemId = ctx.match?.[2];
      const currency = ctx.match?.[3];
      if (characterId && itemId && currency) {
        await this.callbackHandler.handleShopBuy(ctx, characterId, itemId, currency as 'gold' | 'gems');
      }
    });

    this.bot.action(/^shop_item_(.+)_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      const itemId = ctx.match?.[2];
      if (characterId && itemId) {
        await this.callbackHandler.handleShopItem(ctx, characterId, itemId);
      }
    });

    this.bot.action(/^shop_inventory_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      if (characterId) {
        await this.callbackHandler.handleShopInventory(ctx, characterId);
      }
    });

    // PvP handlers
    this.bot.action(/^pvp_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      if (characterId) {
        await this.callbackHandler.handlePvP(ctx, characterId);
      }
    });

    this.bot.action(/^pvp_challenge_(.+)_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      const opponentId = ctx.match?.[2];
      if (characterId && opponentId) {
        await this.callbackHandler.handlePvPChallenge(ctx, characterId, opponentId);
      }
    });

    this.bot.action(/^pvp_accept_(.+)$/, async (ctx) => {
      const matchId = ctx.match?.[1];
      if (matchId) {
        await this.callbackHandler.handlePvPAccept(ctx, matchId);
      }
    });

    this.bot.action(/^pvp_leaderboard_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      if (characterId) {
        await this.callbackHandler.handlePvPLeaderboard(ctx, characterId);
      }
    });

    // Inventory handlers
    this.bot.action(/^inventory_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      if (characterId) {
        await this.callbackHandler.handleInventory(ctx, characterId);
      }
    });

    this.bot.action(/^inventory_equip_(.+)_(.+)_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      const inventoryItemId = ctx.match?.[2];
      const slot = ctx.match?.[3];
      if (characterId && inventoryItemId && slot) {
        await this.callbackHandler.handleEquip(ctx, characterId, inventoryItemId, slot as 'weapon' | 'helmet' | 'armor' | 'boots' | 'accessory');
      }
    });

    this.bot.action(/^inventory_unequip_(.+)_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      const slot = ctx.match?.[2];
      if (characterId && slot) {
        await this.callbackHandler.handleUnequip(ctx, characterId, slot as 'weapon' | 'helmet' | 'armor' | 'boots' | 'accessory');
      }
    });

    // Payment handlers
    this.bot.action(/^payment_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      if (characterId) {
        await this.callbackHandler.handlePayment(ctx, characterId);
      }
    });

    this.bot.action(/^payment_buy_(.+)_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      const productId = ctx.match?.[2];
      if (characterId && productId) {
        await this.callbackHandler.handlePaymentBuy(ctx, characterId, productId);
      }
    });

    this.bot.action(/^payment_history_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      if (characterId) {
        await this.callbackHandler.handlePaymentHistory(ctx, characterId);
      }
    });

    // Boss battle handlers
    this.bot.action(/^boss_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      if (characterId) {
        await this.callbackHandler.handleBoss(ctx, characterId);
      }
    });

    this.bot.action(/^boss_start_(.+)_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      const bossId = ctx.match?.[2];
      if (characterId && bossId) {
        await this.callbackHandler.handleBossStart(ctx, characterId, bossId);
      }
    });

    this.bot.action(/^boss_action_(.+)_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      const action = ctx.match?.[2];
      if (characterId && action) {
        await this.callbackHandler.handleBossAction(ctx, characterId, action);
      }
    });

    // Text input for character name
    this.bot.on('text', async (ctx) => {
      if (ctx.session.characterClass && !ctx.message.text.startsWith('/')) {
        await this.callbackHandler.handleNameInput(ctx, ctx.message.text.trim());
      }
    });
  }

  public async start(): Promise<void> {
    try {
      await this.bot.launch();
      console.log('🤖 Bot started successfully!');
    } catch (error) {
      console.error('Failed to start bot:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.bot.stop();
      console.log('🤖 Bot stopped successfully!');
    } catch (error) {
      console.error('Failed to stop bot:', error);
      throw error;
    }
  }
}