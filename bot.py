import asyncio
import logging
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery
from aiogram.utils.keyboard import InlineKeyboardBuilder
from typing import Dict, Any, List, Optional
import json
from datetime import datetime

from config import Config
from database import db
from models import *
from game_logic import CombatSystem, LevelingSystem, LootSystem, QuestSystem
from image_generator import sprite_generator, card_generator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize bot and dispatcher
bot = Bot(token=Config.BOT_TOKEN)
storage = MemoryStorage()
dp = Dispatcher(storage=storage)

# FSM States
class CharacterCreation(StatesGroup):
    choosing_class = State()
    entering_name = State()

class Combat(StatesGroup):
    in_battle = State()
    choosing_action = State()

class QuestMenu(StatesGroup):
    viewing_quests = State()
    viewing_quest_details = State()

# Helper functions
def get_user_id(message: types.Message) -> int:
    """Get user ID from message"""
    return message.from_user.id

def get_username(message: types.Message) -> str:
    """Get username from message"""
    return message.from_user.username or message.from_user.first_name or "Unknown"

async def get_or_create_user(telegram_id: int, username: str) -> User:
    """Get existing user or create new one"""
    user_data = await db.fetch_one(
        "SELECT * FROM users WHERE telegram_id = $1", telegram_id
    )
    
    if user_data:
        return User(
            id=user_data['id'],
            telegram_id=user_data['telegram_id'],
            username=user_data['username'],
            gold=user_data['gold'],
            gems=user_data['gems'],
            created_at=str(user_data['created_at']),
            updated_at=str(user_data['updated_at'])
        )
    else:
        # Create new user
        user_id = await db.fetch_one(
            "INSERT INTO users (telegram_id, username) VALUES ($1, $2) RETURNING id",
            telegram_id, username
        )
        return User(
            id=user_id['id'],
            telegram_id=telegram_id,
            username=username,
            gold=0,
            gems=0,
            created_at=str(datetime.now()),
            updated_at=str(datetime.now())
        )

async def get_user_characters(user_id: str) -> List[Character]:
    """Get all characters for a user"""
    characters_data = await db.fetch_all(
        "SELECT * FROM characters WHERE user_id = $1 ORDER BY created_at",
        user_id
    )
    
    characters = []
    for char_data in characters_data:
        character = Character.from_dict(dict(char_data))
        characters.append(character)
    
    return characters

async def get_character(character_id: str) -> Optional[Character]:
    """Get character by ID"""
    char_data = await db.fetch_one(
        "SELECT * FROM characters WHERE id = $1", character_id
    )
    
    if char_data:
        return Character.from_dict(dict(char_data))
    return None

# Command handlers
@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    """Handle /start command"""
    user = await get_or_create_user(get_user_id(message), get_username(message))
    
    characters = await get_user_characters(user.id)
    
    if not characters:
        await message.answer(
            "🎮 Welcome to Legends of the Realm!\n\n"
            "You don't have any characters yet. Let's create your first hero!",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="Create Character", callback_data="create_character")]
            ])
        )
    else:
        await show_main_menu(message, user, characters)

@dp.callback_query(F.data == "create_character")
async def callback_create_character(callback: CallbackQuery, state: FSMContext):
    """Start character creation process"""
    await callback.message.edit_text(
        "Choose your character class:",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="⚔️ Warrior", callback_data="class_warrior")],
            [InlineKeyboardButton(text="🔮 Mage", callback_data="class_mage")],
            [InlineKeyboardButton(text="🗡️ Rogue", callback_data="class_rogue")]
        ])
    )
    await state.set_state(CharacterCreation.choosing_class)

@dp.callback_query(F.data.startswith("class_"))
async def callback_choose_class(callback: CallbackQuery, state: FSMContext):
    """Handle class selection"""
    class_name = callback.data.split("_")[1].title()
    await state.update_data(character_class=class_name)
    
    await callback.message.edit_text(
        f"Great choice! You selected {class_name}.\n\n"
        "Now enter your character's name:"
    )
    await state.set_state(CharacterCreation.entering_name)

@dp.message(StateFilter(CharacterCreation.entering_name))
async def process_character_name(message: types.Message, state: FSMContext):
    """Process character name input"""
    name = message.text.strip()
    
    if len(name) < 2 or len(name) > 20:
        await message.answer("Name must be between 2 and 20 characters long.")
        return
    
    data = await state.get_data()
    character_class = CharacterClass(data['character_class'])
    
    # Create character
    user = await get_or_create_user(get_user_id(message), get_username(message))
    
    # Check character limit
    existing_chars = await get_user_characters(user.id)
    if len(existing_chars) >= Config.MAX_CHARACTERS_PER_USER:
        await message.answer(f"You can only have {Config.MAX_CHARACTERS_PER_USER} characters.")
        await state.clear()
        return
    
    # Create character stats
    stats = CharacterStats.create_base_stats(character_class)
    equipment = Equipment()
    
    # Insert character into database
    char_id = await db.fetch_one(
        """INSERT INTO characters (user_id, name, class, stats, equipment) 
           VALUES ($1, $2, $3, $4, $5) RETURNING id""",
        user.id, name, character_class.value, json.dumps(stats.to_dict()), json.dumps(equipment.to_dict())
    )
    
    # Generate character sprite
    character = Character(
        id=char_id['id'],
        user_id=user.id,
        name=name,
        character_class=character_class,
        level=1,
        xp=0,
        stats=stats,
        equipment=equipment,
        sprite_url=None,
        created_at=str(datetime.now()),
        updated_at=str(datetime.now())
    )
    
    sprite_url = await sprite_generator.generate_character_sprite(character)
    
    # Update character with sprite URL
    await db.execute(
        "UPDATE characters SET sprite_url = $1 WHERE id = $2",
        sprite_url, char_id['id']
    )
    character.sprite_url = sprite_url
    
    await state.clear()
    
    # Send character card
    card_url = await card_generator.generate_character_card(character, sprite_url)
    
    await message.answer_photo(
        photo=card_url,
        caption=f"🎉 Character created successfully!\n\n"
                f"Name: {name}\n"
                f"Class: {character_class.value}\n"
                f"Level: 1\n\n"
                f"Use /menu to access the main menu."
    )

@dp.message(Command("menu"))
async def cmd_menu(message: types.Message):
    """Show main menu"""
    user = await get_or_create_user(get_user_id(message), get_username(message))
    characters = await get_user_characters(user.id)
    
    if not characters:
        await message.answer("You don't have any characters. Use /start to create one.")
        return
    
    await show_main_menu(message, user, characters)

async def show_main_menu(message: types.Message, user: User, characters: List[Character]):
    """Show the main game menu"""
    if len(characters) == 1:
        character = characters[0]
        await show_character_menu(message, character)
    else:
        # Show character selection
        keyboard = InlineKeyboardBuilder()
        for char in characters:
            keyboard.add(InlineKeyboardButton(
                text=f"{char.name} ({char.character_class.value}) - Level {char.level}",
                callback_data=f"select_char_{char.id}"
            ))
        keyboard.add(InlineKeyboardButton(text="Create New Character", callback_data="create_character"))
        
        await message.answer(
            f"💰 Gold: {user.gold} | 💎 Gems: {user.gems}\n\n"
            "Select a character:",
            reply_markup=keyboard.as_markup()
        )

@dp.callback_query(F.data.startswith("select_char_"))
async def callback_select_character(callback: CallbackQuery):
    """Handle character selection"""
    character_id = callback.data.split("_")[2]
    character = await get_character(character_id)
    
    if character:
        await show_character_menu(callback.message, character)
    else:
        await callback.answer("Character not found!")

async def show_character_menu(message: types.Message, character: Character):
    """Show character-specific menu"""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📊 Character Info", callback_data=f"char_info_{character.id}")],
        [InlineKeyboardButton(text="🎒 Inventory", callback_data=f"inventory_{character.id}")],
        [InlineKeyboardButton(text="⚔️ Battle", callback_data=f"battle_{character.id}")],
        [InlineKeyboardButton(text="📜 Quests", callback_data=f"quests_{character.id}")],
        [InlineKeyboardButton(text="🏪 Shop", callback_data=f"shop_{character.id}")],
        [InlineKeyboardButton(text="⚔️ PvP Arena", callback_data=f"pvp_{character.id}")]
    ])
    
    await message.answer(
        f"🎮 {character.name} - {character.character_class.value} (Level {character.level})\n\n"
        f"Choose an action:",
        reply_markup=keyboard
    )

@dp.callback_query(F.data.startswith("char_info_"))
async def callback_character_info(callback: CallbackQuery):
    """Show character information"""
    character_id = callback.data.split("_")[2]
    character = await get_character(character_id)
    
    if not character:
        await callback.answer("Character not found!")
        return
    
    # Generate character card
    card_url = await card_generator.generate_character_card(character, character.sprite_url or "")
    
    await callback.message.answer_photo(
        photo=card_url,
        caption=f"📊 Character Information\n\n"
                f"Name: {character.name}\n"
                f"Class: {character.character_class.value}\n"
                f"Level: {character.level}\n"
                f"XP: {character.xp}\n\n"
                f"Stats:\n"
                f"❤️ HP: {character.stats.hp}\n"
                f"💙 MP: {character.stats.mp}\n"
                f"⚔️ Attack: {character.stats.attack}\n"
                f"🛡️ Defense: {character.stats.defense}\n"
                f"🏃 Speed: {character.stats.speed}\n"
                f"💥 Crit Chance: {character.stats.crit_chance:.1%}\n"
                f"💪 Strength: {character.stats.strength}\n"
                f"🏃 Agility: {character.stats.agility}\n"
                f"🧠 Intelligence: {character.stats.intelligence}"
    )

@dp.callback_query(F.data.startswith("battle_"))
async def callback_start_battle(callback: CallbackQuery, state: FSMContext):
    """Start PvE battle"""
    character_id = callback.data.split("_")[1]
    character = await get_character(character_id)
    
    if not character:
        await callback.answer("Character not found!")
        return
    
    # Create a simple enemy
    enemy = {
        "name": "Goblin",
        "level": character.level,
        "hp": 50 + character.level * 10,
        "attack": 8 + character.level * 2,
        "defense": 2 + character.level
    }
    
    # Create battle record
    battle_id = await db.fetch_one(
        """INSERT INTO pve_battles (character_id, enemy, state) 
           VALUES ($1, $2, $3) RETURNING id""",
        character_id, json.dumps(enemy), json.dumps({
            "turn": 1,
            "character_hp": character.stats.hp,
            "character_mp": character.stats.mp,
            "enemy_hp": enemy["hp"],
            "log": []
        })
    )
    
    await state.update_data(battle_id=battle_id['id'], character_id=character_id)
    await state.set_state(Combat.in_battle)
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⚔️ Attack", callback_data="action_attack")],
        [InlineKeyboardButton(text="🔮 Skills", callback_data="action_skills")],
        [InlineKeyboardButton(text="🏃 Run", callback_data="action_run")]
    ])
    
    await callback.message.edit_text(
        f"⚔️ Battle Started!\n\n"
        f"Enemy: {enemy['name']} (Level {enemy['level']})\n"
        f"Enemy HP: {enemy['hp']}\n\n"
        f"Your HP: {character.stats.hp}\n"
        f"Your MP: {character.stats.mp}\n\n"
        f"Choose your action:",
        reply_markup=keyboard
    )

@dp.callback_query(F.data.startswith("action_"), StateFilter(Combat.in_battle))
async def callback_battle_action(callback: CallbackQuery, state: FSMContext):
    """Handle battle action"""
    action = callback.data.split("_")[1]
    data = await state.get_data()
    battle_id = data['battle_id']
    character_id = data['character_id']
    
    character = await get_character(character_id)
    if not character:
        await callback.answer("Character not found!")
        return
    
    # Get battle data
    battle_data = await db.fetch_one(
        "SELECT * FROM pve_battles WHERE id = $1", battle_id
    )
    
    if not battle_data:
        await callback.answer("Battle not found!")
        return
    
    enemy = battle_data['enemy']
    battle_state = battle_data['state']
    
    if action == "run":
        await db.execute(
            "UPDATE pve_battles SET result = 'fled' WHERE id = $1", battle_id
        )
        await callback.message.edit_text("🏃 You fled from battle!")
        await state.clear()
        return
    
    # Simulate turn
    turn_result = CombatSystem.simulate_turn(character, enemy, action)
    
    if "error" in turn_result:
        await callback.answer(turn_result["error"])
        return
    
    # Update battle state
    battle_state['turn'] += 1
    battle_state['character_hp'] = turn_result['character_hp']
    battle_state['character_mp'] = turn_result['character_mp']
    battle_state['enemy_hp'] = turn_result['enemy_hp']
    battle_state['log'].append(turn_result['log'])
    
    # Update character stats
    await db.execute(
        """UPDATE characters SET stats = $1 WHERE id = $2""",
        json.dumps({
            **character.stats.to_dict(),
            'hp': turn_result['character_hp'],
            'mp': turn_result['character_mp']
        }),
        character_id
    )
    
    if turn_result['result']:
        # Battle ended
        await db.execute(
            "UPDATE pve_battles SET result = $1, state = $2 WHERE id = $3",
            turn_result['result'], json.dumps(battle_state), battle_id
        )
        
        if turn_result['result'] == 'win':
            # Generate loot
            loot = LootSystem.generate_loot(enemy['level'], enemy['name'])
            
            # Add XP and gold to character
            level_result = LevelingSystem.add_xp(character, loot['xp'])
            
            await db.execute(
                """UPDATE characters SET level = $1, xp = $2, stats = $3 WHERE id = $4""",
                character.level, character.xp, json.dumps(character.stats.to_dict()), character_id
            )
            
            # Add gold to user
            user = await get_or_create_user(callback.from_user.id, callback.from_user.username or "Unknown")
            await db.execute(
                "UPDATE users SET gold = gold + $1 WHERE id = $2",
                loot['gold'], user.id
            )
            
            level_text = ""
            if level_result['levels_gained'] > 0:
                level_text = f"\n🎉 Level up! You are now level {level_result['new_level']}!"
            
            await callback.message.edit_text(
                f"🎉 Victory!\n\n"
                f"Rewards:\n"
                f"💰 Gold: +{loot['gold']}\n"
                f"⭐ XP: +{loot['xp']}{level_text}\n\n"
                f"Battle log:\n" + "\n".join(battle_state['log'])
            )
        else:
            await callback.message.edit_text(
                f"💀 Defeat!\n\n"
                f"Battle log:\n" + "\n".join(battle_state['log'])
            )
        
        await state.clear()
    else:
        # Continue battle
        await db.execute(
            "UPDATE pve_battles SET state = $1 WHERE id = $2",
            json.dumps(battle_state), battle_id
        )
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="⚔️ Attack", callback_data="action_attack")],
            [InlineKeyboardButton(text="🔮 Skills", callback_data="action_skills")],
            [InlineKeyboardButton(text="🏃 Run", callback_data="action_run")]
        ])
        
        await callback.message.edit_text(
            f"⚔️ Battle continues...\n\n"
            f"Enemy HP: {turn_result['enemy_hp']}\n"
            f"Your HP: {turn_result['character_hp']}\n"
            f"Your MP: {turn_result['character_mp']}\n\n"
            f"Last action: {turn_result['log']}\n\n"
            f"Choose your next action:",
            reply_markup=keyboard
        )

@dp.callback_query(F.data.startswith("quests_"))
async def callback_quests(callback: CallbackQuery):
    """Show available quests"""
    character_id = callback.data.split("_")[1]
    character = await get_character(character_id)
    
    if not character:
        await callback.answer("Character not found!")
        return
    
    # Get available quests
    available_quests = QuestSystem.get_available_quests(character.level)
    
    if not available_quests:
        await callback.message.edit_text("No quests available for your level.")
        return
    
    keyboard = InlineKeyboardBuilder()
    for quest in available_quests:
        keyboard.add(InlineKeyboardButton(
            text=f"{quest['title']} (Level {quest['level_req']})",
            callback_data=f"quest_{quest['id']}_{character_id}"
        ))
    
    await callback.message.edit_text(
        f"📜 Available Quests (Level {character.level}):\n\n"
        "Select a quest to view details:",
        reply_markup=keyboard.as_markup()
    )

@dp.callback_query(F.data.startswith("quest_"))
async def callback_quest_details(callback: CallbackQuery):
    """Show quest details and allow acceptance"""
    parts = callback.data.split("_")
    quest_id = parts[1]
    character_id = parts[2]
    
    # Get quest data (simplified - in production this would come from database)
    quest_data = {
        "q_goblin_hunt_01": {
            "title": "Goblin Hunt",
            "description": "Defeat 5 goblins to prove your worth",
            "objective": "Kill 5 Goblins",
            "rewards": "100 XP, 50 Gold"
        },
        "q_wolf_pack_01": {
            "title": "Wolf Pack Threat",
            "description": "Clear out the wolf pack threatening the village",
            "objective": "Kill 3 Wolves",
            "rewards": "150 XP, 75 Gold"
        }
    }
    
    quest = quest_data.get(quest_id, quest_data["q_goblin_hunt_01"])
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Accept Quest", callback_data=f"accept_quest_{quest_id}_{character_id}")],
        [InlineKeyboardButton(text="⬅️ Back to Quests", callback_data=f"quests_{character_id}")]
    ])
    
    await callback.message.edit_text(
        f"📜 {quest['title']}\n\n"
        f"Description: {quest['description']}\n\n"
        f"Objective: {quest['objective']}\n\n"
        f"Rewards: {quest['rewards']}",
        reply_markup=keyboard
    )

@dp.callback_query(F.data.startswith("accept_quest_"))
async def callback_accept_quest(callback: CallbackQuery):
    """Accept a quest"""
    parts = callback.data.split("_")
    quest_id = parts[2]
    character_id = parts[3]
    
    # Check if quest already accepted
    existing_quest = await db.fetch_one(
        "SELECT * FROM character_quests WHERE character_id = $1 AND quest_id = $2",
        character_id, quest_id
    )
    
    if existing_quest:
        await callback.answer("You have already accepted this quest!")
        return
    
    # Accept quest
    await db.execute(
        """INSERT INTO character_quests (character_id, quest_id, status, progress) 
           VALUES ($1, $2, 'in_progress', '{}')""",
        character_id, quest_id
    )
    
    await callback.message.edit_text(
        "✅ Quest accepted! You can now complete it by battling the required enemies."
    )

# Error handler
@dp.error()
async def error_handler(event, exception):
    """Handle errors"""
    logger.error(f"Error: {exception}")
    return True

async def main():
    """Main function to start the bot"""
    # Initialize database
    await db.connect()
    await db.init_tables()
    
    # Start bot
    logger.info("Starting bot...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
