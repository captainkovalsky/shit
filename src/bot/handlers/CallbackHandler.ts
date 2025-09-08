import { CharacterClass } from '@prisma/client';
import { config } from '@/config/index';
import { IUserService } from '@/database/services/UserService';
import { ICharacterService } from '@/database/services/CharacterService';
import { IQuestService } from '@/database/services/QuestService';
import { LevelingService } from '@/game/services/LevelingService';
import { ImageService } from '@/image/ImageService';
import { BotContext } from '../types';

export class CallbackHandler {
  constructor(
    private userService: IUserService,
    private characterService: ICharacterService,
    private questService: IQuestService,
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

  async handleQuests(ctx: BotContext, characterId: string): Promise<void> {
    const character = await this.characterService.getCharacterById(characterId);
    
    if (!character) {
      await ctx.answerCbQuery('Character not found!');
      return;
    }

    const availableQuests = await this.questService.getAvailableQuests(character.level);
    const characterQuests = await this.questService.getCharacterQuests(characterId);
    
    const questsWithStatus = availableQuests.map(quest => {
      const characterQuest = characterQuests.find(cq => cq.questId === quest.id);
      return {
        ...quest,
        status: characterQuest?.status || 'AVAILABLE',
        progress: characterQuest?.progress || {},
      };
    });

    const availableQuestsList = questsWithStatus.filter(q => q.status === 'AVAILABLE');
    const inProgressQuests = questsWithStatus.filter(q => q.status === 'IN_PROGRESS');
    const completedQuests = questsWithStatus.filter(q => q.status === 'COMPLETED');

    let message = `📜 Quest Journal - ${character.name}\n\n`;
    
    if (availableQuestsList.length > 0) {
      message += `🆕 Available Quests (${availableQuestsList.length}):\n`;
      availableQuestsList.forEach(quest => {
        message += `• ${quest.title} (Level ${quest.levelReq})\n`;
      });
      message += '\n';
    }

    if (inProgressQuests.length > 0) {
      message += `🔄 In Progress (${inProgressQuests.length}):\n`;
      inProgressQuests.forEach(quest => {
        const objective = quest.objective as any;
        const progress = quest.progress as any;
        const progressKey = `kill_${objective.target}`;
        const currentCount = progress[progressKey]?.count || 0;
        message += `• ${quest.title} - ${currentCount}/${objective.count} ${objective.target}s\n`;
      });
      message += '\n';
    }

    if (completedQuests.length > 0) {
      message += `✅ Completed (${completedQuests.length}):\n`;
      completedQuests.forEach(quest => {
        message += `• ${quest.title}\n`;
      });
    }

    if (availableQuestsList.length === 0 && inProgressQuests.length === 0 && completedQuests.length === 0) {
      message += 'No quests available at your level.';
    }

    const keyboard = [];
    
    if (availableQuestsList.length > 0) {
      availableQuestsList.forEach(quest => {
        keyboard.push([{ 
          text: `📜 ${quest.title}`, 
          callback_data: `quest_accept_${characterId}_${quest.id}` 
        }]);
      });
    }

    if (inProgressQuests.length > 0) {
      inProgressQuests.forEach(quest => {
        keyboard.push([{ 
          text: `🔄 ${quest.title}`, 
          callback_data: `quest_progress_${characterId}_${quest.id}` 
        }]);
      });
    }

    if (completedQuests.length > 0) {
      completedQuests.forEach(quest => {
        keyboard.push([{ 
          text: `✅ ${quest.title}`, 
          callback_data: `quest_complete_${characterId}_${quest.id}` 
        }]);
      });
    }

    keyboard.push([{ text: '🔙 Back to Menu', callback_data: `select_char_${characterId}` }]);

    await ctx.editMessageText(message, {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  }

  async handleQuestAccept(ctx: BotContext, characterId: string, questId: string): Promise<void> {
    try {
      const character = await this.characterService.getCharacterById(characterId);
      if (!character) {
        await ctx.answerCbQuery('Character not found!');
        return;
      }

      const quest = await this.questService.getQuestById(questId);
      if (!quest) {
        await ctx.answerCbQuery('Quest not found!');
        return;
      }

      const requirements = await this.questService.checkQuestRequirements(characterId, questId);
      if (!requirements.canAccept) {
        await ctx.answerCbQuery(`Cannot accept quest: ${requirements.reason}`);
        return;
      }

      await this.questService.acceptQuest(characterId, questId);
      
      const objective = quest.objective as any;
      const rewards = quest.rewards as any;
      
      let message = `📜 Quest Accepted!\n\n`;
      message += `**${quest.title}**\n`;
      message += `${quest.description}\n\n`;
      message += `**Objective:**\n`;
      message += `• ${objective.type}: ${objective.target} (${objective.count})\n\n`;
      message += `**Rewards:**\n`;
      message += `• XP: ${rewards.xp}\n`;
      message += `• Gold: ${rewards.gold}\n`;
      if (rewards.items && rewards.items.length > 0) {
        message += `• Items: ${rewards.items.join(', ')}\n`;
      }

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 View Progress', callback_data: `quest_progress_${characterId}_${questId}` }],
            [{ text: '📜 Back to Quests', callback_data: `quests_${characterId}` }]
          ]
        }
      });
    } catch (error) {
      console.error('Error accepting quest:', error);
      await ctx.answerCbQuery('Failed to accept quest. Please try again.');
    }
  }

  async handleQuestProgress(ctx: BotContext, characterId: string, questId: string): Promise<void> {
    try {
      const character = await this.characterService.getCharacterById(characterId);
      if (!character) {
        await ctx.answerCbQuery('Character not found!');
        return;
      }

      const quest = await this.questService.getQuestById(questId);
      if (!quest) {
        await ctx.answerCbQuery('Quest not found!');
        return;
      }

      const characterQuests = await this.questService.getCharacterQuests(characterId);
      const characterQuest = characterQuests.find(cq => cq.questId === questId);
      
      if (!characterQuest || characterQuest.status !== 'IN_PROGRESS') {
        await ctx.answerCbQuery('Quest not in progress!');
        return;
      }

      const objective = quest.objective as any;
      const progress = characterQuest.progress as any;
      const progressKey = `kill_${objective.target}`;
      const currentCount = progress[progressKey]?.count || 0;
      const isCompleted = currentCount >= objective.count;

      let message = `🔄 Quest Progress\n\n`;
      message += `**${quest.title}**\n`;
      message += `${quest.description}\n\n`;
      message += `**Objective:**\n`;
      message += `• ${objective.type}: ${objective.target} (${currentCount}/${objective.count})\n\n`;
      
      if (isCompleted) {
        message += `✅ **Quest Complete!**\n`;
        message += `You can now claim your rewards.`;
      } else {
        const remaining = objective.count - currentCount;
        message += `Progress: ${currentCount}/${objective.count} (${remaining} remaining)\n`;
        message += `Keep fighting ${objective.target}s to complete this quest!`;
      }

      const keyboard = [];
      if (isCompleted) {
        keyboard.push([{ text: '🎁 Claim Rewards', callback_data: `quest_complete_${characterId}_${questId}` }]);
      }
      keyboard.push([{ text: '📜 Back to Quests', callback_data: `quests_${characterId}` }]);

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    } catch (error) {
      console.error('Error viewing quest progress:', error);
      await ctx.answerCbQuery('Failed to load quest progress. Please try again.');
    }
  }

  async handleQuestComplete(ctx: BotContext, characterId: string, questId: string): Promise<void> {
    try {
      const character = await this.characterService.getCharacterById(characterId);
      if (!character) {
        await ctx.answerCbQuery('Character not found!');
        return;
      }

      const quest = await this.questService.getQuestById(questId);
      if (!quest) {
        await ctx.answerCbQuery('Quest not found!');
        return;
      }

      const characterQuests = await this.questService.getCharacterQuests(characterId);
      const characterQuest = characterQuests.find(cq => cq.questId === questId);
      
      if (!characterQuest || characterQuest.status !== 'IN_PROGRESS') {
        await ctx.answerCbQuery('Quest not in progress!');
        return;
      }

      const objective = quest.objective as any;
      const progress = characterQuest.progress as any;
      const progressKey = `kill_${objective.target}`;
      const currentCount = progress[progressKey]?.count || 0;
      
      if (currentCount < objective.count) {
        await ctx.answerCbQuery('Quest not yet complete!');
        return;
      }

      const { rewards } = await this.questService.completeQuest(characterId, questId);
      
      const user = await this.userService.getUserById(character.userId);
      if (!user) {
        await ctx.answerCbQuery('User not found!');
        return;
      }

      await this.userService.addGold(user.id, rewards.gold);
      
      const levelUpResult = LevelingService.addXp(
        character.level,
        character.xp,
        rewards.xp,
        character.class,
        character.stats as any
      );

      if (levelUpResult.levelsGained > 0) {
        await this.characterService.levelUp(character.id, levelUpResult.newLevel, levelUpResult.newStats!);
      } else {
        await this.characterService.addXp(character.id, rewards.xp);
      }

      let message = `🎉 Quest Completed!\n\n`;
      message += `**${quest.title}**\n\n`;
      message += `**Rewards Received:**\n`;
      message += `• XP: +${rewards.xp}\n`;
      message += `• Gold: +${rewards.gold}\n`;
      if (rewards.items && rewards.items.length > 0) {
        message += `• Items: ${rewards.items.join(', ')}\n`;
      }

      if (levelUpResult.levelsGained > 0) {
        message += `\n🎊 **LEVEL UP!**\n`;
        message += `Level ${character.level} → Level ${levelUpResult.newLevel}\n`;
        message += `+${levelUpResult.levelsGained} level(s) gained!\n`;
        message += `\n**New Stats:**\n`;
        Object.entries(levelUpResult.newStats!).forEach(([stat, value]) => {
          message += `• ${stat}: ${value}\n`;
        });
      }

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📜 Back to Quests', callback_data: `quests_${characterId}` }],
            [{ text: '🔙 Back to Menu', callback_data: `select_char_${characterId}` }]
          ]
        }
      });
    } catch (error) {
      console.error('Error completing quest:', error);
      await ctx.answerCbQuery('Failed to complete quest. Please try again.');
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
