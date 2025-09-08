import { Telegraf, Context, Scenes } from 'telegraf';
import { config } from '@/config';
import { UserService } from '@/database/services/UserService';
import { CharacterService } from '@/database/services/CharacterService';
import { CharacterClass, CharacterStats, Equipment } from '@/types';
import { LevelingService } from '@/game/services/LevelingService';
import { ImageService } from '@/image/ImageService';

// Scene definitions
interface CharacterCreationSession extends Scenes.SceneSessionData {
  characterClass?: CharacterClass;
  characterName?: string;
}

interface CombatSession extends Scenes.SceneSessionData {
  battleId?: string;
  characterId?: string;
}

interface BotContext extends Context {
  session: Scenes.SceneSession<CombatSession>;
  scene: Scenes.SceneContextScene<BotContext, CombatSession>;
  userService: UserService;
  characterService: CharacterService;
  imageService: ImageService;
}

export class Bot {
  private bot: Telegraf<BotContext>;
  private userService: UserService;
  private characterService: CharacterService;
  private imageService: ImageService;

  constructor() {
    this.bot = new Telegraf<BotContext>(config.bot.token);
    this.userService = new UserService();
    this.characterService = new CharacterService();
    this.imageService = new ImageService();

    this.setupMiddleware();
    this.setupScenes();
    this.setupCommands();
    this.setupCallbacks();
  }

  private setupMiddleware(): void {
    // Add services to context
    this.bot.use((ctx, next) => {
      ctx.userService = this.userService;
      ctx.characterService = this.characterService;
      ctx.imageService = this.imageService;
      return next();
    });

    // Logging middleware
    this.bot.use((ctx, next) => {
      console.log(`Received message from ${ctx.from?.username || ctx.from?.id}: ${ctx.message}`);
      return next();
    });
  }

  private setupScenes(): void {
    const stage = new Scenes.Stage<BotContext>();

    // Character creation scene
    const characterCreationScene = new Scenes.BaseScene<BotContext>('character_creation');
    
    characterCreationScene.enter(async (ctx) => {
      await ctx.reply(
        '🎮 Welcome to Legends of the Realm!\n\n' +
        'Choose your character class:',
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '⚔️ Warrior', callback_data: 'class_warrior' },
                { text: '🔮 Mage', callback_data: 'class_mage' },
                { text: '🗡️ Rogue', callback_data: 'class_rogue' }
              ]
            ]
          }
        }
      );
    });

    characterCreationScene.action(/^class_(.+)$/, async (ctx) => {
      const characterClass = ctx.match[1].toUpperCase() as CharacterClass;
      ctx.session.characterClass = characterClass;
      
      await ctx.editMessageText(
        `Great choice! You selected ${characterClass}.\n\n` +
        'Now enter your character\'s name:'
      );
      
      ctx.scene.leave();
    });

    // Combat scene
    const combatScene = new Scenes.BaseScene<BotContext>('combat');
    
    combatScene.enter(async (ctx) => {
      await ctx.reply(
        '⚔️ Battle Started!\n\n' +
        'Choose your action:',
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '⚔️ Attack', callback_data: 'action_attack' },
                { text: '🔮 Skills', callback_data: 'action_skills' }
              ],
              [
                { text: '🏃 Run', callback_data: 'action_run' }
              ]
            ]
          }
        }
      );
    });

    stage.register(characterCreationScene);
    stage.register(combatScene);

    this.bot.use(stage.middleware());
  }

  private setupCommands(): void {
    // Start command
    this.bot.start(async (ctx) => {
      const telegramId = BigInt(ctx.from.id);
      const username = ctx.from.username || ctx.from.first_name || 'Unknown';

      // Get or create user
      let user = await this.userService.getUserByTelegramId(telegramId);
      if (!user) {
        user = await this.userService.createUser(telegramId, username);
      }

      // Get user's characters
      const characters = await this.characterService.getCharactersByUserId(user.id);

      if (characters.length === 0) {
        await ctx.scene.enter('character_creation');
      } else {
        await this.showMainMenu(ctx, user, characters);
      }
    });

    // Menu command
    this.bot.command('menu', async (ctx) => {
      const telegramId = BigInt(ctx.from.id);
      const user = await this.userService.getUserByTelegramId(telegramId);
      
      if (!user) {
        await ctx.reply('Please use /start to begin.');
        return;
      }

      const characters = await this.characterService.getCharactersByUserId(user.id);
      await this.showMainMenu(ctx, user, characters);
    });

    // Help command
    this.bot.command('help', async (ctx) => {
      await ctx.reply(
        '🎮 Legends of the Realm - Help\n\n' +
        'Commands:\n' +
        '/start - Start the game\n' +
        '/menu - Open main menu\n' +
        '/help - Show this help\n\n' +
        'Game Features:\n' +
        '• Create and customize characters\n' +
        '• Battle monsters and other players\n' +
        '• Complete quests and level up\n' +
        '• Collect and equip items\n' +
        '• Join guilds and compete\n\n' +
        'Use the menu buttons to navigate the game!'
      );
    });
  }

  private setupCallbacks(): void {
    // Character creation callbacks
    this.bot.action(/^class_(.+)$/, async (ctx) => {
      const characterClass = ctx.match[1].toUpperCase() as CharacterClass;
      ctx.session.characterClass = characterClass;
      
      await ctx.editMessageText(
        `Great choice! You selected ${characterClass}.\n\n` +
        'Now enter your character\'s name:'
      );
    });

    // Handle character name input
    this.bot.on('text', async (ctx) => {
      if (ctx.session.characterClass && !ctx.message.text.startsWith('/')) {
        const name = ctx.message.text.trim();
        
        if (name.length < 2 || name.length > 20) {
          await ctx.reply('Name must be between 2 and 20 characters long.');
          return;
        }

        const telegramId = BigInt(ctx.from.id);
        const user = await this.userService.getUserByTelegramId(telegramId);
        
        if (!user) {
          await ctx.reply('Please use /start to begin.');
          return;
        }

        // Check character limit
        const characterCount = await this.characterService.getCharacterCount(user.id);
        if (characterCount >= config.game.maxCharactersPerUser) {
          await ctx.reply(`You can only have ${config.game.maxCharactersPerUser} characters.`);
          return;
        }

        // Check if name is already taken
        const existingCharacter = await this.characterService.getCharacterByName(user.id, name);
        if (existingCharacter) {
          await ctx.reply('This name is already taken. Please choose another.');
          return;
        }

        // Create character
        const stats = LevelingService.createBaseStats(ctx.session.characterClass);
        const equipment: Equipment = {};
        
        const character = await this.characterService.createCharacter(
          user.id,
          name,
          ctx.session.characterClass,
          stats,
          equipment
        );

        // Generate character sprite
        const spriteUrl = await this.imageService.generateCharacterSprite(character);
        await this.characterService.updateSpriteUrl(character.id, spriteUrl);

        // Generate character card
        const cardUrl = await this.imageService.generateCharacterCard(character, spriteUrl);

        await ctx.replyWithPhoto(
          { url: cardUrl },
          {
            caption: `🎉 Character created successfully!\n\n` +
                    `Name: ${name}\n` +
                    `Class: ${ctx.session.characterClass}\n` +
                    `Level: 1\n\n` +
                    `Use /menu to access the main menu.`
          }
        );

        // Clear session
        ctx.session.characterClass = undefined;
      }
    });

    // Character selection callbacks
    this.bot.action(/^select_char_(.+)$/, async (ctx) => {
      const characterId = ctx.match[1];
      const character = await this.characterService.getCharacterById(characterId);
      
      if (character) {
        await this.showCharacterMenu(ctx, character);
      } else {
        await ctx.answerCbQuery('Character not found!');
      }
    });

    // Character info callback
    this.bot.action(/^char_info_(.+)$/, async (ctx) => {
      const characterId = ctx.match[1];
      const character = await this.characterService.getCharacterById(characterId);
      
      if (!character) {
        await ctx.answerCbQuery('Character not found!');
        return;
      }

      const cardUrl = await this.imageService.generateCharacterCard(
        character,
        character.spriteUrl || ''
      );

      await ctx.replyWithPhoto(
        { url: cardUrl },
        {
          caption: `📊 Character Information\n\n` +
                  `Name: ${character.name}\n` +
                  `Class: ${character.class}\n` +
                  `Level: ${character.level}\n` +
                  `XP: ${character.xp}\n\n` +
                  `Stats:\n` +
                  `❤️ HP: ${character.stats.hp}\n` +
                  `💙 MP: ${character.stats.mp}\n` +
                  `⚔️ Attack: ${character.stats.attack}\n` +
                  `🛡️ Defense: ${character.stats.defense}\n` +
                  `🏃 Speed: ${character.stats.speed}\n` +
                  `💥 Crit Chance: ${(character.stats.critChance * 100).toFixed(1)}%\n` +
                  `💪 Strength: ${character.stats.strength}\n` +
                  `🏃 Agility: ${character.stats.agility}\n` +
                  `🧠 Intelligence: ${character.stats.intelligence}`
        }
      );
    });

    // Battle callbacks
    this.bot.action(/^battle_(.+)$/, async (ctx) => {
      const characterId = ctx.match[1];
      const character = await this.characterService.getCharacterById(characterId);
      
      if (!character) {
        await ctx.answerCbQuery('Character not found!');
        return;
      }

      await ctx.scene.enter('combat');
      ctx.session.battleId = 'battle_' + Date.now();
      ctx.session.characterId = characterId;

      await ctx.editMessageText(
        `⚔️ Battle Started!\n\n` +
        `Enemy: Goblin (Level ${character.level})\n` +
        `Enemy HP: ${50 + character.level * 10}\n\n` +
        `Your HP: ${character.stats.hp}\n` +
        `Your MP: ${character.stats.mp}\n\n` +
        `Choose your action:`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '⚔️ Attack', callback_data: 'action_attack' },
                { text: '🔮 Skills', callback_data: 'action_skills' }
              ],
              [
                { text: '🏃 Run', callback_data: 'action_run' }
              ]
            ]
          }
        }
      );
    });

    // Battle action callbacks
    this.bot.action(/^action_(.+)$/, async (ctx) => {
      const action = ctx.match[1];
      
      if (action === 'run') {
        await ctx.editMessageText('🏃 You fled from battle!');
        await ctx.scene.leave();
        return;
      }

      // Handle other battle actions
      await ctx.editMessageText('Battle action executed!');
    });
  }

  private async showMainMenu(ctx: Context, user: any, characters: any[]): Promise<void> {
    if (characters.length === 1) {
      await this.showCharacterMenu(ctx, characters[0]);
    } else {
      const keyboard = characters.map(char => [
        {
          text: `${char.name} (${char.class}) - Level ${char.level}`,
          callback_data: `select_char_${char.id}`
        }
      ]);
      
      keyboard.push([{ text: 'Create New Character', callback_data: 'create_character' }]);

      await ctx.reply(
        `💰 Gold: ${user.gold} | 💎 Gems: ${user.gems}\n\n` +
        'Select a character:',
        {
          reply_markup: {
            inline_keyboard: keyboard
          }
        }
      );
    }
  }

  private async showCharacterMenu(ctx: Context, character: any): Promise<void> {
    await ctx.reply(
      `🎮 ${character.name} - ${character.class} (Level ${character.level})\n\n` +
      'Choose an action:',
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 Character Info', callback_data: `char_info_${character.id}` },
              { text: '🎒 Inventory', callback_data: `inventory_${character.id}` }
            ],
            [
              { text: '⚔️ Battle', callback_data: `battle_${character.id}` },
              { text: '📜 Quests', callback_data: `quests_${character.id}` }
            ],
            [
              { text: '🏪 Shop', callback_data: `shop_${character.id}` },
              { text: '⚔️ PvP Arena', callback_data: `pvp_${character.id}` }
            ]
          ]
        }
      }
    );
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
