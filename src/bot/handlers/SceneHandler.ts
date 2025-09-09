import { Scenes } from 'telegraf';
import { CharacterClass } from '@prisma/client';
import { BotContext } from '../types';

export class SceneHandler {
  static createCharacterCreationScene(): Scenes.BaseScene<BotContext> {
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
        ctx.session.characterClass = characterClass;
      }
      
      await ctx.editMessageText(
        `Great choice! You selected ${characterClass}.\n\n` +
        'Now enter your character\'s name:'
      );
      
      ctx.scene.leave();
    });

    return characterCreationScene;
  }

  static createCombatScene(): Scenes.BaseScene<BotContext> {
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

    return combatScene;
  }
}
