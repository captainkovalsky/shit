// CharacterClass will be imported from the correct location
import { config } from '@/config/index';
import { IUserService } from '@/database/services/UserService';
import { ICharacterService, CharacterStats } from '@/database/services/CharacterService';
import { IQuestService } from '@/database/services/QuestService';
import { IShopService } from '@/database/services/ShopService';
import { IEquipmentService } from '@/database/services/EquipmentService';
import { IPaymentService } from '@/database/services/PaymentService';
import { IPvPService } from '@/game/services/PvPService';
import { IPvEService } from '@/game/services/PvEService';
import { IBossService } from '@/game/services/BossService';
import { LevelingService } from '@/game/services/LevelingService';
import { ImageService } from '@/image/ImageService';
import { BotContext } from '../types';

export class CallbackHandler {
  constructor(
    private userService: IUserService,
    private characterService: ICharacterService,
    private questService: IQuestService,
    private shopService: IShopService,
    private equipmentService: IEquipmentService,
    private paymentService: IPaymentService,
    private pvpService: IPvPService,
    private pveService: IPvEService,
    private bossService: IBossService,
    private imageService: ImageService
  ) {}

  async handleClassSelection(ctx: BotContext, characterClass: string): Promise<void> {
    const classEnum = characterClass.toUpperCase() as 'WARRIOR' | 'MAGE' | 'ROGUE';
    if (classEnum) {
      ctx.session.characterClass = classEnum;
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
      character,
      character.spriteUrl || ''
    );

    const stats = character.stats as CharacterStats;
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

    const availableEnemies = this.pveService.getAvailableEnemies(character.level);
    
    if (availableEnemies.length === 0) {
      await ctx.answerCbQuery('No enemies available at your level!');
      return;
    }

    const enemySpawn = this.pveService.spawnEnemy('forest', character.level);
    if (!enemySpawn) {
      await ctx.answerCbQuery('Failed to spawn enemy!');
      return;
    }

    try {
      const battleResult = await this.pveService.startBattle(characterId, enemySpawn.type, enemySpawn.level);
      
      await ctx.scene.enter('combat');
      ctx.session.battleId = battleResult.battle.id;
      ctx.session.characterId = characterId;

      const battle = battleResult.battle;
      const state = battle.state as { enemyHp?: number; characterHp?: number; characterMp?: number };
      const enemyHp = state?.enemyHp || 100;
      const characterHp = state?.characterHp || (character.stats as CharacterStats).hp;
      const characterMp = state?.characterMp || (character.stats as CharacterStats).mp;

      await ctx.editMessageText(
        `⚔️ Battle Started!\n\n` +
        `Enemy: ${enemySpawn.type} (Level ${enemySpawn.level})\n` +
        `Enemy HP: ${enemyHp}\n\n` +
        `Your HP: ${characterHp}\n` +
        `Your MP: ${characterMp}\n\n` +
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
    } catch (error) {
      console.error('Error starting battle:', error);
      await ctx.answerCbQuery('Failed to start battle. Please try again.');
    }
  }

  async handleBattleAction(ctx: BotContext, action: string): Promise<void> {
    const battleId = ctx.session.battleId;
    const characterId = ctx.session.characterId;

    if (!battleId || !characterId) {
      await ctx.answerCbQuery('No active battle found!');
      return;
    }

    if (action === 'run') {
      await ctx.editMessageText('🏃 You fled from battle!');
      await ctx.scene.leave();
      return;
    }

    try {
      const turnResult = await this.pveService.takeTurn(battleId, action as 'attack' | 'skill' | 'item' | 'run');
      
      const battle = await this.pveService.getBattle(battleId);
      if (!battle) {
        await ctx.answerCbQuery('Battle not found!');
        return;
      }

      const enemy = battle.enemy as { type: string; level: number; hp: number; attack: number; defense: number };

      let message = `⚔️ Battle Update\n\n`;
      message += `Enemy HP: ${turnResult.enemyHp}\n`;
      message += `Your HP: ${turnResult.characterHp}\n`;
      message += `Your MP: ${turnResult.characterMp}\n\n`;
      
      if (turnResult.damageDealt > 0) {
        message += `You dealt ${turnResult.damageDealt} damage!\n`;
      }
      if (turnResult.damageTaken && turnResult.damageTaken > 0) {
        message += `You took ${turnResult.damageTaken} damage!\n`;
      }
      if (turnResult.mpUsed > 0) {
        message += `Used ${turnResult.mpUsed} MP!\n`;
      }
      message += '\n';

      if (turnResult.enemyHp <= 0) {
        message += `🎉 Victory! Enemy defeated!\n`;
        message += `Battle completed successfully!\n`;

        // Update quest progress for enemy kills
        try {
          if (enemy && enemy.name) {
            await this.pveService.updateQuestProgress(characterId, enemy.name, 1);
          }
        } catch (error) {
          console.error('Error updating quest progress:', error);
        }

        await ctx.editMessageText(message, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Back to Menu', callback_data: `select_char_${characterId}` }]
            ]
          }
        });
        await ctx.scene.leave();
      } else if (turnResult.characterHp <= 0) {
        message += `💀 Defeat! You were defeated!\n`;
        
        await ctx.editMessageText(message, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Back to Menu', callback_data: `select_char_${characterId}` }]
            ]
          }
        });
        await ctx.scene.leave();
      } else {
        message += `Choose your next action:`;
        
        await ctx.editMessageText(message, {
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
        });
      }
    } catch (error) {
      console.error('Error executing battle action:', error);
      await ctx.answerCbQuery('Failed to execute action. Please try again.');
    }
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

    const stats = LevelingService.createBaseStats(ctx.session.characterClass!);
    const equipment = {};
    
    const character = await this.characterService.createCharacter(
      user.id,
      name,
      ctx.session.characterClass!,
      stats,
      equipment
    );

    const spriteUrl = await this.imageService.generateCharacterSprite(character);
    await this.characterService.updateSpriteUrl(character.id, spriteUrl);

    const cardUrl = await this.imageService.generateCharacterCard(character, spriteUrl);

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
        const objective = quest.objective as { target: string; count: number };
        const progress = quest.progress as { [key: string]: { count: number } };
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
      
      const objective = quest.objective as { type: string; target: string; count: number };
      const rewards = quest.rewards as { xp: number; gold: number; items: string[] };
      
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

      const objective = quest.objective as { target: string; count: number };
      const progress = characterQuest.progress as { [key: string]: { count: number } };
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

      const objective = quest.objective as { target: string; count: number };
      const progress = characterQuest.progress as { [key: string]: { count: number } };
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
        character.stats as CharacterStats
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

  async handleShop(ctx: BotContext, characterId: string): Promise<void> {
    try {
      const character = await this.characterService.getCharacterById(characterId);
      if (!character) {
        await ctx.answerCbQuery('Character not found!');
        return;
      }

      const user = await this.userService.getUserById(character.userId);
      if (!user) {
        await ctx.answerCbQuery('User not found!');
        return;
      }

      const shopItems = await this.shopService.getShopItems({ minLevel: 1, maxLevel: character.level });
      const categories = [...new Set(shopItems.map(item => item.type))];

      let message = `🏪 Shop - ${character.name}\n\n`;
      message += `💰 Gold: ${user.gold}\n`;
      message += `💎 Gems: ${user.gems}\n\n`;
      message += `Available Items (${shopItems.length}):\n\n`;

      const keyboard = [];
      
      for (const category of categories) {
        const categoryItems = shopItems.filter(item => item.type === category);
        const categoryName = category.charAt(0) + category.slice(1).toLowerCase();
        
        message += `📦 ${categoryName} (${categoryItems.length} items)\n`;
        
        keyboard.push([{ 
          text: `📦 ${categoryName}`, 
          callback_data: `shop_category_${characterId}_${category}` 
        }]);
      }

      keyboard.push([{ text: '🎒 My Inventory', callback_data: `shop_inventory_${characterId}` }]);
      keyboard.push([{ text: '🔙 Back to Menu', callback_data: `select_char_${characterId}` }]);

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    } catch (error) {
      console.error('Error showing shop:', error);
      await ctx.answerCbQuery('Failed to load shop. Please try again.');
    }
  }

  async handleShopBuy(ctx: BotContext, characterId: string, itemId: string, currency: 'gold' | 'gems'): Promise<void> {
    try {
      const character = await this.characterService.getCharacterById(characterId);
      if (!character) {
        await ctx.answerCbQuery('Character not found!');
        return;
      }

      const item = await this.shopService.getItemById(itemId);
      if (!item) {
        await ctx.answerCbQuery('Item not found!');
        return;
      }

      const canAfford = await this.shopService.canAfford(characterId, itemId, currency);
      if (!canAfford) {
        const cost = currency === 'gold' ? item.priceGold : item.priceGems;
        await ctx.answerCbQuery(`Insufficient ${currency}! Need ${cost} ${currency}.`);
        return;
      }

      const result = currency === 'gold' 
        ? await this.shopService.purchaseWithGold(characterId, itemId, 1)
        : await this.shopService.purchaseWithGems(characterId, itemId, 1);

      if (!result.success) {
        await ctx.answerCbQuery(`Purchase failed: ${result.error}`);
        return;
      }

      const remainingCurrency = currency === 'gold' ? result.remainingGold : result.remainingGems;

      let message = `✅ Purchase Successful!\n\n`;
      message += `Item: ${item.name}\n`;
      message += `Type: ${item.type}\n`;
      message += `Rarity: ${item.rarity}\n`;
      message += `Cost: ${currency === 'gold' ? item.priceGold : item.priceGems} ${currency}\n`;
      message += `Remaining ${currency}: ${remainingCurrency}\n\n`;
      message += `Item added to your inventory!`;

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎒 View Inventory', callback_data: `shop_inventory_${characterId}` }],
            [{ text: '🏪 Back to Shop', callback_data: `shop_${characterId}` }]
          ]
        }
      });
    } catch (error) {
      console.error('Error purchasing item:', error);
      await ctx.answerCbQuery('Failed to purchase item. Please try again.');
    }
  }

  async handleShopItem(ctx: BotContext, characterId: string, itemId: string): Promise<void> {
    try {
      const character = await this.characterService.getCharacterById(characterId);
      if (!character) {
        await ctx.answerCbQuery('Character not found!');
        return;
      }

      const item = await this.shopService.getItemById(itemId);
      if (!item) {
        await ctx.answerCbQuery('Item not found!');
        return;
      }

      const user = await this.userService.getUserById(character.userId);
      if (!user) {
        await ctx.answerCbQuery('User not found!');
        return;
      }

      let message = `🛍️ Item Details\n\n`;
      message += `**${item.name}**\n`;
      message += `${item.description}\n\n`;
      message += `Type: ${item.type}\n`;
      message += `Rarity: ${item.rarity}\n`;
      message += `Stackable: ${item.stackable ? 'Yes' : 'No'}\n\n`;

      if (item.stats) {
        message += `**Stats:**\n`;
        Object.entries(item.stats as Record<string, number>).forEach(([stat, value]) => {
          message += `• ${stat}: ${value}\n`;
        });
        message += '\n';
      }

      message += `**Pricing:**\n`;
      if (item.priceGold > 0) {
        message += `💰 Gold: ${item.priceGold}\n`;
      }
      if (item.priceGems && item.priceGems > 0) {
        message += `💎 Gems: ${item.priceGems}\n`;
      }

      message += `\nYour Resources:\n`;
      message += `💰 Gold: ${user.gold}\n`;
      message += `💎 Gems: ${user.gems}`;

      const keyboard = [];
      
      if (item.priceGold > 0 && user.gold >= item.priceGold) {
        keyboard.push([{ 
          text: `💰 Buy with Gold (${item.priceGold})`, 
          callback_data: `shop_buy_${characterId}_${itemId}_gold` 
        }]);
      }
      
      if (item.priceGems && item.priceGems > 0 && user.gems >= item.priceGems) {
        keyboard.push([{ 
          text: `💎 Buy with Gems (${item.priceGems})`, 
          callback_data: `shop_buy_${characterId}_${itemId}_gems` 
        }]);
      }

      keyboard.push([{ text: '🔙 Back to Shop', callback_data: `shop_${characterId}` }]);

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    } catch (error) {
      console.error('Error showing item details:', error);
      await ctx.answerCbQuery('Failed to load item details. Please try again.');
    }
  }

  async handleShopInventory(ctx: BotContext, characterId: string): Promise<void> {
    try {
      const character = await this.characterService.getCharacterById(characterId);
      if (!character) {
        await ctx.answerCbQuery('Character not found!');
        return;
      }

      const inventory = await this.shopService.getCharacterInventory(characterId);
      const slots = await this.shopService.getInventorySlots(characterId);

      let message = `🎒 Inventory - ${character.name}\n\n`;
      message += `Slots: ${slots.current}/${slots.max}\n\n`;

      if (inventory.length === 0) {
        message += 'Your inventory is empty.';
      } else {
        message += `Items (${inventory.length}):\n\n`;
        
        inventory.forEach((invItem) => {
          const item = invItem.item;
          const equipped = invItem.isEquipped ? ' ⚔️' : '';
          message += `• ${item.name}${equipped} (${invItem.qty})\n`;
        });
      }

      const keyboard = [];
      
      if (inventory.length > 0) {
        inventory.forEach((invItem) => {
          if (!invItem.isEquipped) {
            keyboard.push([{ 
              text: `⚔️ Equip ${invItem.item.name}`, 
              callback_data: `inventory_equip_${characterId}_${invItem.id}_${invItem.item.type.toLowerCase()}` 
            }]);
          } else {
            keyboard.push([{ 
              text: `🔓 Unequip ${invItem.item.name}`, 
              callback_data: `inventory_unequip_${characterId}_${invItem.item.type.toLowerCase()}` 
            }]);
          }
        });
      }

      keyboard.push([{ text: '🔙 Back to Shop', callback_data: `shop_${characterId}` }]);

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    } catch (error) {
      console.error('Error showing inventory:', error);
      await ctx.answerCbQuery('Failed to load inventory. Please try again.');
    }
  }

  async handlePvP(ctx: BotContext, characterId: string): Promise<void> {
    try {
      const character = await this.characterService.getCharacterById(characterId);
      if (!character) {
        await ctx.answerCbQuery('Character not found!');
        return;
      }

      const rating = await this.pvpService.getCharacterRating(characterId);
      const activeMatches = await this.pvpService.getActiveMatches(characterId);

      let message = `⚔️ PvP Arena - ${character.name}\n\n`;
      message += `Rating: ${rating?.rating || 1000}\n`;
      message += `Wins: ${rating?.wins || 0}\n`;
      message += `Losses: ${rating?.losses || 0}\n\n`;

      if (activeMatches.length > 0) {
        message += `Active Matches (${activeMatches.length}):\n`;
        for (const match of activeMatches) {
          const opponentId = match.challengerId === characterId ? match.opponentId : match.challengerId;
          const opponent = await this.characterService.getCharacterById(opponentId);
          message += `• vs ${opponent?.name || 'Unknown'} (${match.status})\n`;
        }
        message += '\n';
      }

      const keyboard = [
        [{ text: '🎯 Find Opponent', callback_data: `pvp_find_${characterId}` }],
        [{ text: '📊 Leaderboard', callback_data: `pvp_leaderboard_${characterId}` }],
        [{ text: '🔙 Back to Menu', callback_data: `select_char_${characterId}` }]
      ];

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    } catch (error) {
      console.error('Error showing PvP arena:', error);
      await ctx.answerCbQuery('Failed to load PvP arena. Please try again.');
    }
  }

  async handlePvPChallenge(ctx: BotContext, characterId: string, opponentId: string): Promise<void> {
    try {
      const character = await this.characterService.getCharacterById(characterId);
      const opponent = await this.characterService.getCharacterById(opponentId);
      
      if (!character || !opponent) {
        await ctx.answerCbQuery('Character not found!');
        return;
      }

      if (characterId === opponentId) {
        await ctx.answerCbQuery('Cannot challenge yourself!');
        return;
      }

      const match = await this.pvpService.createMatch(characterId, opponentId);
      
      let message = `⚔️ Challenge Sent!\n\n`;
      message += `Challenger: ${character.name}\n`;
      message += `Opponent: ${opponent.name}\n`;
      message += `Match ID: ${match.id}\n\n`;
      message += `Waiting for opponent to accept...`;

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to PvP', callback_data: `pvp_${characterId}` }]
          ]
        }
      });
    } catch (error) {
      console.error('Error creating PvP challenge:', error);
      await ctx.answerCbQuery('Failed to create challenge. Please try again.');
    }
  }

  async handlePvPAccept(ctx: BotContext, matchId: string): Promise<void> {
    try {
      const match = await this.pvpService.acceptMatch(matchId);
      const challenger = await this.characterService.getCharacterById(match.challengerId);
      const opponent = await this.characterService.getCharacterById(match.opponentId);
      
      let message = `⚔️ Match Accepted!\n\n`;
      message += `Challenger: ${challenger?.name || 'Unknown'}\n`;
      message += `Opponent: ${opponent?.name || 'Unknown'}\n`;
      message += `Status: ${match.status}\n\n`;
      message += `Battle begins now!`;

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '⚔️ Start Battle', callback_data: `pvp_battle_${matchId}` }]
          ]
        }
      });
    } catch (error) {
      console.error('Error accepting PvP match:', error);
      await ctx.answerCbQuery('Failed to accept match. Please try again.');
    }
  }

  async handlePvPLeaderboard(ctx: BotContext, characterId: string): Promise<void> {
    try {
      const leaderboard = await this.pvpService.getLeaderboard('2025-01', 10);
      
      let message = `🏆 PvP Leaderboard\n\n`;
      
      for (let i = 0; i < leaderboard.length; i++) {
        const entry = leaderboard[i];
        if (entry) {
          const character = await this.characterService.getCharacterById(entry.characterId);
          message += `${i + 1}. ${character?.name || 'Unknown'} (${character?.class || 'Unknown'})\n`;
          message += `   Rating: ${entry.rating} | W/L: ${entry.wins}/${entry.losses}\n\n`;
        }
      }

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to PvP', callback_data: `pvp_${characterId}` }]
          ]
        }
      });
    } catch (error) {
      console.error('Error showing leaderboard:', error);
      await ctx.answerCbQuery('Failed to load leaderboard. Please try again.');
    }
  }

  async handleInventory(ctx: BotContext, characterId: string): Promise<void> {
    try {
      const character = await this.characterService.getCharacterById(characterId);
      if (!character) {
        await ctx.answerCbQuery('Character not found!');
        return;
      }

      const inventory = await this.shopService.getCharacterInventory(characterId);
      const slots = await this.shopService.getInventorySlots(characterId);

      let message = `🎒 Inventory - ${character.name}\n\n`;
      message += `Slots: ${slots.current}/${slots.max}\n\n`;

      if (inventory.length === 0) {
        message += 'Your inventory is empty.';
      } else {
        message += `Items (${inventory.length}):\n\n`;
        
        inventory.forEach((invItem) => {
          const item = invItem.item;
          const equipped = invItem.isEquipped ? ' ⚔️' : '';
          message += `• ${item.name}${equipped} (${invItem.qty})\n`;
        });
      }

      const keyboard = [];
      
      if (inventory.length > 0) {
        inventory.forEach((invItem) => {
          if (!invItem.isEquipped) {
            keyboard.push([{ 
              text: `⚔️ Equip ${invItem.item.name}`, 
              callback_data: `inventory_equip_${characterId}_${invItem.id}_${invItem.item.type.toLowerCase()}` 
            }]);
          } else {
            keyboard.push([{ 
              text: `🔓 Unequip ${invItem.item.name}`, 
              callback_data: `inventory_unequip_${characterId}_${invItem.item.type.toLowerCase()}` 
            }]);
          }
        });
      }

      keyboard.push([{ text: '🔙 Back to Menu', callback_data: `select_char_${characterId}` }]);

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    } catch (error) {
      console.error('Error showing inventory:', error);
      await ctx.answerCbQuery('Failed to load inventory. Please try again.');
    }
  }

  async handleEquip(ctx: BotContext, characterId: string, inventoryItemId: string, slot: string): Promise<void> {
    try {
      const result = await this.equipmentService.equipItem(characterId, inventoryItemId, slot as 'weapon' | 'helmet' | 'armor' | 'boots' | 'accessory');
      
      if (!result.success) {
        await ctx.answerCbQuery(`Failed to equip item: ${result.error}`);
        return;
      }

      let message = `✅ Item Equipped!\n\n`;
      message += `Item equipped in ${slot} slot.\n`;
      message += `Character stats updated.`;

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎒 Back to Inventory', callback_data: `inventory_${characterId}` }]
          ]
        }
      });
    } catch (error) {
      console.error('Error equipping item:', error);
      await ctx.answerCbQuery('Failed to equip item. Please try again.');
    }
  }

  async handleUnequip(ctx: BotContext, characterId: string, slot: string): Promise<void> {
    try {
      const result = await this.equipmentService.unequipItem(characterId, slot as 'weapon' | 'helmet' | 'armor' | 'boots' | 'accessory');
      
      if (!result.success) {
        await ctx.answerCbQuery(`Failed to unequip item: ${result.error}`);
        return;
      }

      let message = `✅ Item Unequipped!\n\n`;
      message += `Item removed from ${slot} slot.\n`;
      message += `Character stats updated.`;

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎒 Back to Inventory', callback_data: `inventory_${characterId}` }]
          ]
        }
      });
    } catch (error) {
      console.error('Error unequipping item:', error);
      await ctx.answerCbQuery('Failed to unequip item. Please try again.');
    }
  }

  async handlePayment(ctx: BotContext, characterId: string): Promise<void> {
    try {
      const character = await this.characterService.getCharacterById(characterId);
      if (!character) {
        await ctx.answerCbQuery('Character not found!');
        return;
      }

      const user = await this.userService.getUserById(character.userId);
      if (!user) {
        await ctx.answerCbQuery('User not found!');
        return;
      }

      const products = this.paymentService.getAvailableProducts();

      let message = `💳 Payment Center - ${character.name}\n\n`;
      message += `Current Gems: ${user.gems}\n\n`;
      message += `Available Packages:\n\n`;

      const keyboard = [];
      
      products.forEach(product => {
        message += `💎 ${product.name}\n`;
        message += `${product.description}\n`;
        message += `$${(product.amountMinor / 100).toFixed(2)} - ${product.gems} Gems\n\n`;
        
        keyboard.push([{ 
          text: `💎 ${product.name} - $${(product.amountMinor / 100).toFixed(2)}`, 
          callback_data: `payment_buy_${characterId}_${product.id}` 
        }]);
      });

      keyboard.push([{ text: '📜 Payment History', callback_data: `payment_history_${characterId}` }]);
      keyboard.push([{ text: '🔙 Back to Menu', callback_data: `select_char_${characterId}` }]);

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    } catch (error) {
      console.error('Error showing payment center:', error);
      await ctx.answerCbQuery('Failed to load payment center. Please try again.');
    }
  }

  async handlePaymentBuy(ctx: BotContext, characterId: string, productId: string): Promise<void> {
    try {
      const character = await this.characterService.getCharacterById(characterId);
      if (!character) {
        await ctx.answerCbQuery('Character not found!');
        return;
      }

      const result = await this.paymentService.createPaymentIntent(character.userId, productId);
      
      if (!result.success) {
        await ctx.answerCbQuery(`Failed to create payment: ${result.error}`);
        return;
      }

      const paymentIntent = result.paymentIntent!;
      const products = this.paymentService.getAvailableProducts();
      const product = products.find(p => p.id === productId);

      let message = `💳 Payment Created!\n\n`;
      message += `Product: ${product?.name}\n`;
      message += `Gems: ${product?.gems}\n`;
      message += `Amount: $${(product?.amountMinor! / 100).toFixed(2)}\n\n`;
      message += `Payment ID: ${paymentIntent.id}\n`;
      message += `Status: ${paymentIntent.status}\n\n`;
      message += `Click the link below to complete payment:`;

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💳 Pay Now', url: paymentIntent.confirmationUrl || '#' }],
            [{ text: '🔙 Back to Payment', callback_data: `payment_${characterId}` }]
          ]
        }
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      await ctx.answerCbQuery('Failed to create payment. Please try again.');
    }
  }

  async handlePaymentHistory(ctx: BotContext, characterId: string): Promise<void> {
    try {
      const character = await this.characterService.getCharacterById(characterId);
      if (!character) {
        await ctx.answerCbQuery('Character not found!');
        return;
      }

      const history = await this.paymentService.getUserPaymentHistory(character.userId);

      let message = `📜 Payment History - ${character.name}\n\n`;

      if (history.length === 0) {
        message += 'No payment history found.';
      } else {
        history.slice(0, 10).forEach((payment, index) => {
          const date = new Date(payment.createdAt).toLocaleDateString();
          const amount = (payment.amountMinor / 100).toFixed(2);
          message += `${index + 1}. ${payment.product} - $${amount}\n`;
          message += `   Status: ${payment.status} | Date: ${date}\n\n`;
        });
      }

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Back to Payment', callback_data: `payment_${characterId}` }]
          ]
        }
      });
    } catch (error) {
      console.error('Error showing payment history:', error);
      await ctx.answerCbQuery('Failed to load payment history. Please try again.');
    }
  }

  async handleBoss(ctx: BotContext, characterId: string): Promise<void> {
    try {
      const character = await this.characterService.getCharacterById(characterId);
      if (!character) {
        await ctx.answerCbQuery('Character not found!');
        return;
      }

      const availableBosses = this.bossService.getAllBosses().filter(boss => boss.level <= character.level);

      let message = `👹 Boss Battles - ${character.name}\n\n`;
      message += `Level: ${character.level}\n`;
      message += `Available Bosses: ${availableBosses.length}\n\n`;

      if (availableBosses.length === 0) {
        message += 'No bosses available at your level.';
      } else {
        message += `Bosses:\n\n`;
        availableBosses.forEach((boss: any, index: number) => {
          message += `${index + 1}. ${boss.name}\n`;
          message += `   Level: ${boss.level} | HP: ${boss.hp}\n`;
          message += `   Rewards: ${boss.rewards.xp} XP, ${boss.rewards.gold} Gold\n\n`;
        });
      }

      const keyboard = [];
      
      availableBosses.forEach((boss: any) => {
        keyboard.push([{ 
          text: `👹 Fight ${boss.name}`, 
          callback_data: `boss_start_${characterId}_${boss.id}` 
        }]);
      });

      keyboard.push([{ text: '🔙 Back to Menu', callback_data: `select_char_${characterId}` }]);

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    } catch (error) {
      console.error('Error showing boss battles:', error);
      await ctx.answerCbQuery('Failed to load boss battles. Please try again.');
    }
  }

  async handleBossStart(ctx: BotContext, characterId: string, bossId: string): Promise<void> {
    try {
      const character = await this.characterService.getCharacterById(characterId);
      if (!character) {
        await ctx.answerCbQuery('Character not found!');
        return;
      }

      const boss = await this.bossService.getBossById(bossId);
      if (!boss) {
        await ctx.answerCbQuery('Boss not found!');
        return;
      }

      const battle = await this.bossService.createBossBattle(characterId, bossId);
      
      // Store battle state in session
      (ctx.session as any).bossBattleState = battle;
      
      let message = `👹 Boss Battle Started!\n\n`;
      message += `Boss: ${boss.name}\n`;
      message += `Level: ${boss.level}\n`;
      message += `HP: ${battle.bossHp}/${boss.hp}\n\n`;
      message += `Your HP: ${battle.characterHp}\n`;
      message += `Your MP: ${battle.characterMp}\n\n`;
      message += `Choose your action:`;

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '⚔️ Attack', callback_data: `boss_action_${characterId}_attack` },
              { text: '🔮 Skill', callback_data: `boss_action_${characterId}_skill` }
            ],
            [
              { text: '🏃 Run', callback_data: `boss_action_${characterId}_run` }
            ]
          ]
        }
      });
    } catch (error) {
      console.error('Error starting boss battle:', error);
      await ctx.answerCbQuery('Failed to start boss battle. Please try again.');
    }
  }

  async handleBossAction(ctx: BotContext, characterId: string, action: string): Promise<void> {
    try {
      if (action === 'run') {
        await ctx.editMessageText('🏃 You fled from the boss battle!');
        return;
      }

      const battleState = (ctx.session as any).bossBattleState;
      if (!battleState) {
        await ctx.answerCbQuery('No active boss battle found!');
        return;
      }

      // Execute the character's turn
      const updatedBattleState = { ...battleState };
      
      // Simple turn logic for now - in a real implementation this would use the combat service
      if (action === 'attack') {
        const damage = Math.max(1, updatedBattleState.character.attack - updatedBattleState.boss.defense);
        updatedBattleState.bossHp = Math.max(0, updatedBattleState.bossHp - damage);
        updatedBattleState.log.push(`${updatedBattleState.character.name} attacks for ${damage} damage!`);
      } else if (action === 'skill') {
        const damage = Math.max(1, (updatedBattleState.character.attack * 1.5) - updatedBattleState.boss.defense);
        updatedBattleState.bossHp = Math.max(0, updatedBattleState.bossHp - damage);
        updatedBattleState.characterMp = Math.max(0, updatedBattleState.characterMp - 10);
        updatedBattleState.log.push(`${updatedBattleState.character.name} uses a skill for ${damage} damage!`);
      }

      // Check if boss is defeated
      if (updatedBattleState.bossHp <= 0) {
        const rewards = this.bossService.calculateBossRewards(updatedBattleState.boss, updatedBattleState.character.level);
        
        // Update quest progress for boss kills
        try {
          await this.pveService.updateQuestProgress(characterId, updatedBattleState.boss.name, 1);
        } catch (error) {
          console.error('Error updating quest progress for boss kill:', error);
        }
        
        let message = `🎉 Victory! You defeated ${updatedBattleState.boss.name}!\n\n`;
        message += `Rewards:\n`;
        message += `• XP: ${rewards.xp}\n`;
        message += `• Gold: ${rewards.gold}\n`;
        if (rewards.items.length > 0) {
          message += `• Items: ${rewards.items.join(', ')}\n`;
        }

        await ctx.editMessageText(message, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Back to Bosses', callback_data: `boss_${characterId}` }]
            ]
          }
        });
        
        (ctx.session as any).bossBattleState = null;
        return;
      }

      // Boss turn
      const bossDamage = Math.max(1, updatedBattleState.boss.attack - updatedBattleState.character.defense);
      updatedBattleState.characterHp = Math.max(0, updatedBattleState.characterHp - bossDamage);
      updatedBattleState.log.push(`${updatedBattleState.boss.name} attacks for ${bossDamage} damage!`);

      // Check if character is defeated
      if (updatedBattleState.characterHp <= 0) {
        let message = `💀 Defeat! ${updatedBattleState.boss.name} was too strong!\n\n`;
        message += `You were defeated in battle.`;

        await ctx.editMessageText(message, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Back to Bosses', callback_data: `boss_${characterId}` }]
            ]
          }
        });
        
        (ctx.session as any).bossBattleState = null;
        return;
      }

      // Update session with new battle state
      (ctx.session as any).bossBattleState = updatedBattleState;

      let message = `👹 Boss Battle\n\n`;
      message += `Boss: ${updatedBattleState.boss.name}\n`;
      message += `Boss HP: ${updatedBattleState.bossHp}/${updatedBattleState.boss.maxHp}\n\n`;
      message += `Your HP: ${updatedBattleState.characterHp}\n`;
      message += `Your MP: ${updatedBattleState.characterMp}\n\n`;
      
      message += `Battle Log:\n`;
      updatedBattleState.log.slice(-3).forEach((logEntry: string) => {
        message += `• ${logEntry}\n`;
      });
      message += '\n';
      message += `Choose your next action:`;

      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '⚔️ Attack', callback_data: `boss_action_${characterId}_attack` },
              { text: '🔮 Skill', callback_data: `boss_action_${characterId}_skill` }
            ],
            [
              { text: '🏃 Run', callback_data: `boss_action_${characterId}_run` }
            ]
          ]
        }
      });
    } catch (error) {
      console.error('Error executing boss action:', error);
      await ctx.answerCbQuery('Failed to execute action. Please try again.');
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
