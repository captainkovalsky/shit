"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
const telegraf_1 = require("telegraf");
const config_1 = require("@/config");
const UserService_1 = require("@/database/services/UserService");
const CharacterService_1 = require("@/database/services/CharacterService");
const LevelingService_1 = require("@/game/services/LevelingService");
const ImageService_1 = require("@/image/ImageService");
class Bot {
    bot;
    userService;
    characterService;
    imageService;
    constructor() {
        this.bot = new telegraf_1.Telegraf(config_1.config.bot.token);
        this.userService = new UserService_1.UserService();
        this.characterService = new CharacterService_1.CharacterService();
        this.imageService = new ImageService_1.ImageService();
        this.setupMiddleware();
        this.setupScenes();
        this.setupCommands();
        this.setupCallbacks();
    }
    setupMiddleware() {
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
    setupScenes() {
        const stage = new telegraf_1.Scenes.Stage();
        const characterCreationScene = new telegraf_1.Scenes.BaseScene('character_creation');
        characterCreationScene.enter(async (ctx) => {
            await ctx.reply('🎮 Welcome to Legends of the Realm!\n\n' +
                'Choose your character class:', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '⚔️ Warrior', callback_data: 'class_warrior' },
                            { text: '🔮 Mage', callback_data: 'class_mage' },
                            { text: '🗡️ Rogue', callback_data: 'class_rogue' }
                        ]
                    ]
                }
            });
        });
        characterCreationScene.action(/^class_(.+)$/, async (ctx) => {
            const characterClass = ctx.match?.[1]?.toUpperCase();
            if (characterClass) {
                ctx.session.characterClass = characterClass;
            }
            await ctx.editMessageText(`Great choice! You selected ${characterClass}.\n\n` +
                'Now enter your character\'s name:');
            ctx.scene.leave();
        });
        const combatScene = new telegraf_1.Scenes.BaseScene('combat');
        combatScene.enter(async (ctx) => {
            await ctx.reply('⚔️ Battle Started!\n\n' +
                'Choose your action:', {
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
        });
        stage.register(characterCreationScene);
        stage.register(combatScene);
        this.bot.use(stage.middleware());
    }
    setupCommands() {
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
            }
            else {
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
            await ctx.reply('🎮 Legends of the Realm - Help\n\n' +
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
                'Use the menu buttons to navigate the game!');
        });
    }
    setupCallbacks() {
        this.bot.action(/^class_(.+)$/, async (ctx) => {
            const characterClass = ctx.match?.[1]?.toUpperCase();
            if (characterClass) {
                ctx.session.characterClass = characterClass;
            }
            await ctx.editMessageText(`Great choice! You selected ${characterClass}.\n\n` +
                'Now enter your character\'s name:');
        });
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
                const characterCount = await this.characterService.getCharacterCount(user.id);
                if (characterCount >= config_1.config.game.maxCharactersPerUser) {
                    await ctx.reply(`You can only have ${config_1.config.game.maxCharactersPerUser} characters.`);
                    return;
                }
                const existingCharacter = await this.characterService.getCharacterByName(user.id, name);
                if (existingCharacter) {
                    await ctx.reply('This name is already taken. Please choose another.');
                    return;
                }
                const stats = LevelingService_1.LevelingService.createBaseStats(ctx.session.characterClass);
                const equipment = {};
                const character = await this.characterService.createCharacter(user.id, name, ctx.session.characterClass, stats, equipment);
                const spriteUrl = await this.imageService.generateCharacterSprite(character);
                await this.characterService.updateSpriteUrl(character.id, spriteUrl);
                const cardUrl = await this.imageService.generateCharacterCard(character, spriteUrl);
                await ctx.replyWithPhoto({ url: cardUrl }, {
                    caption: `🎉 Character created successfully!\n\n` +
                        `Name: ${name}\n` +
                        `Class: ${ctx.session.characterClass}\n` +
                        `Level: 1\n\n` +
                        `Use /menu to access the main menu.`
                });
                ctx.session.characterClass = undefined;
            }
        });
        this.bot.action(/^select_char_(.+)$/, async (ctx) => {
            const characterId = ctx.match?.[1];
            if (!characterId)
                return;
            const character = await this.characterService.getCharacterById(characterId);
            if (character) {
                await this.showCharacterMenu(ctx, character);
            }
            else {
                await ctx.answerCbQuery('Character not found!');
            }
        });
        this.bot.action(/^char_info_(.+)$/, async (ctx) => {
            const characterId = ctx.match?.[1];
            if (!characterId)
                return;
            const character = await this.characterService.getCharacterById(characterId);
            if (!character) {
                await ctx.answerCbQuery('Character not found!');
                return;
            }
            const cardUrl = await this.imageService.generateCharacterCard(character, character.spriteUrl || '');
            const stats = character.stats;
            await ctx.replyWithPhoto({ url: cardUrl }, {
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
            });
        });
        this.bot.action(/^battle_(.+)$/, async (ctx) => {
            const characterId = ctx.match?.[1];
            if (!characterId)
                return;
            const character = await this.characterService.getCharacterById(characterId);
            if (!character) {
                await ctx.answerCbQuery('Character not found!');
                return;
            }
            await ctx.scene.enter('combat');
            ctx.session.battleId = 'battle_' + Date.now();
            ctx.session.characterId = characterId;
            await ctx.editMessageText(`⚔️ Battle Started!\n\n` +
                `Enemy: Goblin (Level ${character.level})\n` +
                `Enemy HP: ${50 + character.level * 10}\n\n` +
                `Your HP: ${character.stats.hp}\n` +
                `Your MP: ${character.stats.mp}\n\n` +
                `Choose your action:`, {
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
    async showMainMenu(ctx, user, characters) {
        if (characters.length === 1) {
            await this.showCharacterMenu(ctx, characters[0]);
        }
        else {
            const keyboard = characters.map(char => [
                {
                    text: `${char.name} (${char.class}) - Level ${char.level}`,
                    callback_data: `select_char_${char.id}`
                }
            ]);
            keyboard.push([{ text: 'Create New Character', callback_data: 'create_character' }]);
            await ctx.reply(`💰 Gold: ${user.gold} | 💎 Gems: ${user.gems}\n\n` +
                'Select a character:', {
                reply_markup: {
                    inline_keyboard: keyboard
                }
            });
        }
    }
    async showCharacterMenu(ctx, character) {
        await ctx.reply(`🎮 ${character.name} - ${character.class} (Level ${character.level})\n\n` +
            'Choose an action:', {
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
        });
    }
    async start() {
        try {
            await this.bot.launch();
            console.log('🤖 Bot started successfully!');
        }
        catch (error) {
            console.error('Failed to start bot:', error);
            throw error;
        }
    }
    async stop() {
        try {
            await this.bot.stop();
            console.log('🤖 Bot stopped successfully!');
        }
        catch (error) {
            console.error('Failed to stop bot:', error);
            throw error;
        }
    }
}
exports.Bot = Bot;
//# sourceMappingURL=Bot.js.map