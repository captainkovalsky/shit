import { IUserService } from '@/database/services/UserService';
import { ICharacterService } from '@/database/services/CharacterService';
import { BotContext } from '../types';

export class CommandHandler {
  constructor(
    private userService: IUserService,
    private characterService: ICharacterService
  ) {}

  async handleStart(ctx: BotContext): Promise<void> {
    if (!ctx.from) return;
    
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
  }

  async handleMenu(ctx: BotContext): Promise<void> {
    if (!ctx.from) return;
    
    const telegramId = BigInt(ctx.from.id);
    const user = await this.userService.getUserByTelegramId(telegramId);
    
    if (!user) {
      await ctx.reply('Please use /start to begin.');
      return;
    }

    const characters = await this.characterService.getCharactersByUserId(user.id);
    await this.showMainMenu(ctx, user, characters);
  }

  async handleHelp(ctx: BotContext): Promise<void> {
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
  }

  private async showMainMenu(ctx: BotContext, user: any, characters: any[]): Promise<void> {
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

  private async showCharacterMenu(ctx: BotContext, character: any): Promise<void> {
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
}
