import { CharacterClass } from '@prisma/client';
import { config } from '@/config/index';
import { IUserService } from '@/database/services/UserService';
import { ICharacterService } from '@/database/services/CharacterService';
import { LevelingService } from '@/game/services/LevelingService';
import { ImageService } from '@/image/ImageService';
import { BotContext } from '../types';

export class CallbackHandler {
  constructor(
    private userService: IUserService,
    private characterService: ICharacterService,
    private imageService: ImageService
  ) {}

  async handleClassSelection(ctx: BotContext, characterClass: string): Promise<void> {
    const classEnum = characterClass.toUpperCase() as CharacterClass;
    if (classEnum) {
      (ctx.session as any).characterClass = classEnum;
    }
    
    await ctx.editMessageText(
      `Great choice! You selected ${classEnum}.\n\n` +
      'Now enter your character\'s name:'
    );
  }

  async handleCharacterSelection(ctx: BotContext, characterId: string): Promise<void> {
    const character = await this.characterService.getCharacterById(characterId);
    
    if (character) {
      await this.showCharacterMenu(ctx, character);
    } else {
      await ctx.answerCbQuery('Character not found!');
    }
  }

  async handleCharacterInfo(ctx: BotContext, characterId: string): Promise<void> {
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
  }

  async handleBattle(ctx: BotContext, characterId: string): Promise<void> {
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
  }

  async handleBattleAction(ctx: BotContext, action: string): Promise<void> {
    if (action === 'run') {
      await ctx.editMessageText('🏃 You fled from battle!');
      await ctx.scene.leave();
      return;
    }

    await ctx.editMessageText('Battle action executed!');
  }

  async handleNameInput(ctx: BotContext, name: string): Promise<void> {
    if (!ctx.from) return;
    
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
