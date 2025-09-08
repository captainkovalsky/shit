import { Telegraf, Context, Scenes } from 'telegraf';
import { CharacterClass } from '@prisma/client';
import { config } from '@/config';
import { UserService } from '@/database/services/UserService';
import { CharacterService } from '@/database/services/CharacterService';
import { LevelingService } from '@/game/services/LevelingService';
import { ImageService } from '@/image/ImageService';

interface CombatSession extends Scenes.SceneSessionData {
  battleId?: string;
  characterId?: string;
  characterClass?: CharacterClass;
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
    this.bot.use((ctx, next) => {
      ctx.userService = this.userService;
      ctx.characterService = this.characterService;
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
      const characterClass = ctx.match?.[1]?.toUpperCase() as CharacterClass;
      if (characterClass) {
        (ctx.session as any).characterClass = characterClass;
      }
      
      await ctx.editMessageText(
        `Great choice! You selected ${characterClass}.\n\n` +
        'Now enter your character\'s name:'
      );
      
      ctx.scene.leave();
    });

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
    this.bot.start(async (ctx) => {
      const telegramId = BigInt(ctx.from.id);
      const username = ctx.from.username || ctx.from.first_name || 'Unknown';

      let user = await this.userService.getUserByTelegramId(telegramId);
      if (!user) {
        user = await this.userService.createUser(telegramId, username);
      }

      const characters = await this.characterService.getCharactersByUserId(user.id);

      if (characters.length === 0) {
        await ctx.scene.enter('character_creation');
      } else {
        await this.showMainMenu(ctx, user, characters);
      }
    });

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
    this.bot.action(/^class_(.+)$/, async (ctx) => {
      const characterClass = ctx.match?.[1]?.toUpperCase() as CharacterClass;
      if (characterClass) {
        (ctx.session as any).characterClass = characterClass;
      }
      
      await ctx.editMessageText(
        `Great choice! You selected ${characterClass}.\n\n` +
        'Now enter your character\'s name:'
      );
    });

    this.bot.on('text', async (ctx) => {
      if ((ctx.session as any).characterClass && !ctx.message.text.startsWith('/')) {
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

        const characterCount = await this.characterService.getCharacterCount(user.id);
        if (characterCount >= config.game.maxCharactersPerUser) {
          await ctx.reply(`You can only have ${config.game.maxCharactersPerUser} characters.`);
          return;
        }

        const existingCharacter = await this.characterService.getCharacterByName(user.id, name);
        if (existingCharacter) {
          await ctx.reply('This name is already taken. Please choose another.');
          return;
        }

        const stats = LevelingService.createBaseStats((ctx.session as any).characterClass);
        const equipment = {};
        
        const character = await this.characterService.createCharacter(
          user.id,
          name,
          (ctx.session as any).characterClass,
          stats,
          equipment
        );

        const spriteUrl = await this.imageService.generateCharacterSprite(character as any);
        await this.characterService.updateSpriteUrl(character.id, spriteUrl);

        const cardUrl = await this.imageService.generateCharacterCard(character as any, spriteUrl);

        await ctx.replyWithPhoto(
          { url: cardUrl },
          {
            caption: `🎉 Character created successfully!\n\n` +
                    `Name: ${name}\n` +
                    `Class: ${(ctx.session as any).characterClass}\n` +
                    `Level: 1\n\n` +
                    `Use /menu to access the main menu.`
          }
        );

        (ctx.session as any).characterClass = undefined;
      }
    });

    this.bot.action(/^select_char_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      if (!characterId) return;
      const character = await this.characterService.getCharacterById(characterId);
      
      if (character) {
        await this.showCharacterMenu(ctx, character);
      } else {
        await ctx.answerCbQuery('Character not found!');
      }
    });

    this.bot.action(/^char_info_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      if (!characterId) return;
      const character = await this.characterService.getCharacterById(characterId);
      
      if (!character) {
        await ctx.answerCbQuery('Character not found!');
        return;
      }

      const cardUrl = await this.imageService.generateCharacterCard(
        character as any,
        character.spriteUrl || ''
      );

      const stats = character.stats as any;
      await ctx.replyWithPhoto(
        { url: cardUrl },
        {
          caption: `📊 Character Information\n\n` +
                  `Name: ${character.name}\n` +
                  `Class: ${character.class}\n` +
                  `Level: ${character.level}\n` +
                  `XP: ${character.xp}\n\n` +
                  `Stats:\n` +
                  `❤️ HP: ${stats.hp}\n` +
                  `💙 MP: ${stats.mp}\n` +
                  `⚔️ Attack: ${stats.attack}\n` +
                  `🛡️ Defense: ${stats.defense}\n` +
                  `🏃 Speed: ${stats.speed}\n` +
                  `💥 Crit Chance: ${(stats.critChance * 100).toFixed(1)}%\n` +
                  `💪 Strength: ${stats.strength}\n` +
                  `🏃 Agility: ${stats.agility}\n` +
                  `🧠 Intelligence: ${stats.intelligence}`
        }
      );
    });

    this.bot.action(/^battle_(.+)$/, async (ctx) => {
      const characterId = ctx.match?.[1];
      if (!characterId) return;
      const character = await this.characterService.getCharacterById(characterId);
      
      if (!character) {
        await ctx.answerCbQuery('Character not found!');
        return;
      }

      await ctx.scene.enter('combat');
      (ctx.session as any).battleId = 'battle_' + Date.now();
      (ctx.session as any).characterId = characterId;

      await ctx.editMessageText(
        `⚔️ Battle Started!\n\n` +
        `Enemy: Goblin (Level ${character.level})\n` +
        `Enemy HP: ${50 + character.level * 10}\n\n` +
        `Your HP: ${(character.stats as any).hp}\n` +
        `Your MP: ${(character.stats as any).mp}\n\n` +
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

    this.bot.action(/^action_(.+)$/, async (ctx) => {
      const action = ctx.match[1];
      
      if (action === 'run') {
        await ctx.editMessageText('🏃 You fled from battle!');
        await ctx.scene.leave();
        return;
      }

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
