import { Telegraf, Scenes } from 'telegraf';
import { config } from '@/config/index';
import { UserService, IUserService } from '@/database/services/UserService';
import { CharacterService, ICharacterService } from '@/database/services/CharacterService';
import { QuestService, IQuestService } from '@/database/services/QuestService';
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
  private imageService: ImageService;
  private commandHandler: CommandHandler;
  private callbackHandler: CallbackHandler;

  constructor() {
    this.bot = new Telegraf<BotContext>(config.bot.token);
    this.userService = new UserService();
    this.characterService = new CharacterService();
    this.questService = new QuestService();
    this.imageService = new ImageService();
    
    this.commandHandler = new CommandHandler(
      this.userService,
      this.characterService
    );
    this.callbackHandler = new CallbackHandler(
      this.userService,
      this.characterService,
      this.questService,
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

    // Text input for character name
    this.bot.on('text', async (ctx) => {
      if ((ctx.session as any).characterClass && !ctx.message.text.startsWith('/')) {
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