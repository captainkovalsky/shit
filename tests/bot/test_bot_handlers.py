"""
Tests for Telegram bot handlers
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from aiogram.types import User, Chat, Message, CallbackQuery, Update
from aiogram.fsm.context import FSMContext
from datetime import datetime

from bot import (
    get_user_id, get_username, get_or_create_user, get_user_characters,
    get_character, cmd_start, callback_create_character, callback_choose_class,
    process_character_name, callback_select_character, callback_character_info,
    callback_start_battle, callback_battle_action, callback_quests,
    callback_quest_details, callback_accept_quest
)

class TestBotHelpers:
    """Test bot helper functions"""
    
    @pytest.mark.bot
    def test_get_user_id(self, mock_message):
        """Test getting user ID from message"""
        user_id = get_user_id(mock_message)
        assert user_id == 123456789
    
    @pytest.mark.bot
    def test_get_username(self, mock_message):
        """Test getting username from message"""
        username = get_username(mock_message)
        assert username == "testuser"
    
    @pytest.mark.bot
    async def test_get_or_create_user_existing(self, clean_db, mock_message):
        """Test getting existing user"""
        # Create user first
        await clean_db.execute(
            "INSERT INTO users (telegram_id, username, gold, gems) VALUES ($1, $2, $3, $4)",
            123456789, "testuser", 1000, 50
        )
        
        user = await get_or_create_user(get_user_id(mock_message), get_username(mock_message))
        
        assert user.telegram_id == 123456789
        assert user.username == "testuser"
        assert user.gold == 1000
        assert user.gems == 50
    
    @pytest.mark.bot
    async def test_get_or_create_user_new(self, clean_db, mock_message):
        """Test creating new user"""
        user = await get_or_create_user(get_user_id(mock_message), get_username(mock_message))
        
        assert user.telegram_id == 123456789
        assert user.username == "testuser"
        assert user.gold == 0
        assert user.gems == 0
    
    @pytest.mark.bot
    async def test_get_user_characters(self, clean_db, sample_user_data, sample_character_data):
        """Test getting user characters"""
        # Create user
        user_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username) VALUES ($1, $2) RETURNING id",
            sample_user_data["telegram_id"], sample_user_data["username"]
        )
        
        # Create character
        await clean_db.execute(
            """INSERT INTO characters (user_id, name, class, level, xp, stats, equipment) 
               VALUES ($1, $2, $3, $4, $5, $6, $7)""",
            user_id['id'], sample_character_data["name"], sample_character_data["class"],
            sample_character_data["level"], sample_character_data["xp"],
            sample_character_data["stats"], sample_character_data["equipment"]
        )
        
        characters = await get_user_characters(user_id['id'])
        
        assert len(characters) == 1
        assert characters[0].name == sample_character_data["name"]
        assert characters[0].character_class.value == sample_character_data["class"]
    
    @pytest.mark.bot
    async def test_get_character(self, clean_db, sample_character_data):
        """Test getting character by ID"""
        # Create user first
        user_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username) VALUES ($1, $2) RETURNING id",
            123456789, "testuser"
        )
        
        # Create character
        char_id = await clean_db.fetch_one(
            """INSERT INTO characters (user_id, name, class, level, xp, stats, equipment) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id""",
            user_id['id'], sample_character_data["name"], sample_character_data["class"],
            sample_character_data["level"], sample_character_data["xp"],
            sample_character_data["stats"], sample_character_data["equipment"]
        )
        
        character = await get_character(char_id['id'])
        
        assert character is not None
        assert character.name == sample_character_data["name"]
        assert character.character_class.value == sample_character_data["class"]
    
    @pytest.mark.bot
    async def test_get_character_not_found(self, clean_db):
        """Test getting non-existent character"""
        character = await get_character("nonexistent_id")
        assert character is None

class TestBotCommands:
    """Test bot command handlers"""
    
    @pytest.mark.bot
    async def test_cmd_start_no_characters(self, mock_message, clean_db):
        """Test /start command with no characters"""
        with patch('bot.get_or_create_user') as mock_get_user:
            mock_user = MagicMock()
            mock_user.id = "usr_test"
            mock_get_user.return_value = mock_user
            
            with patch('bot.get_user_characters') as mock_get_chars:
                mock_get_chars.return_value = []
                
                with patch('bot.InlineKeyboardMarkup') as mock_keyboard:
                    await cmd_start(mock_message)
                    
                    # Should call answer with character creation message
                    mock_message.answer.assert_called_once()
                    call_args = mock_message.answer.call_args
                    assert "Welcome to Legends of the Realm" in call_args[0][0]
                    assert "Create Character" in str(call_args[1])
    
    @pytest.mark.bot
    async def test_cmd_start_with_characters(self, mock_message, clean_db):
        """Test /start command with existing characters"""
        with patch('bot.get_or_create_user') as mock_get_user:
            mock_user = MagicMock()
            mock_user.id = "usr_test"
            mock_get_user.return_value = mock_user
            
            with patch('bot.get_user_characters') as mock_get_chars:
                mock_character = MagicMock()
                mock_character.name = "TestHero"
                mock_character.character_class.value = "Warrior"
                mock_character.level = 5
                mock_get_chars.return_value = [mock_character]
                
                with patch('bot.show_main_menu') as mock_show_menu:
                    await cmd_start(mock_message)
                    
                    mock_show_menu.assert_called_once_with(mock_message, mock_user, [mock_character])
    
    @pytest.mark.bot
    async def test_callback_create_character(self, mock_callback_query, mock_dispatcher):
        """Test character creation callback"""
        with patch('bot.CharacterCreation.choosing_class') as mock_state:
            await callback_create_character(mock_callback_query, mock_dispatcher)
            
            mock_callback_query.message.edit_text.assert_called_once()
            call_args = mock_callback_query.message.edit_text.call_args
            assert "Choose your character class" in call_args[0][0]
    
    @pytest.mark.bot
    async def test_callback_choose_class(self, mock_callback_query, mock_dispatcher):
        """Test class selection callback"""
        mock_callback_query.data = "class_warrior"
        
        with patch('bot.CharacterCreation.choosing_class') as mock_state:
            with patch('bot.CharacterCreation.entering_name') as mock_next_state:
                await callback_choose_class(mock_callback_query, mock_dispatcher)
                
                mock_callback_query.message.edit_text.assert_called_once()
                call_args = mock_callback_query.message.edit_text.call_args
                assert "Warrior" in call_args[0][0]
    
    @pytest.mark.bot
    async def test_process_character_name_valid(self, mock_message, mock_dispatcher, clean_db):
        """Test processing valid character name"""
        mock_message.text = "TestHero"
        
        with patch('bot.CharacterCreation.entering_name') as mock_state:
            with patch('bot.get_or_create_user') as mock_get_user:
                mock_user = MagicMock()
                mock_user.id = "usr_test"
                mock_get_user.return_value = mock_user
                
                with patch('bot.get_user_characters') as mock_get_chars:
                    mock_get_chars.return_value = []  # Under character limit
                    
                    with patch('bot.db.fetch_one') as mock_fetch:
                        mock_fetch.return_value = {'id': 'ch_test'}
                        
                        with patch('bot.sprite_generator.generate_character_sprite') as mock_sprite:
                            mock_sprite.return_value = "https://example.com/sprite.png"
                            
                            with patch('bot.card_generator.generate_character_card') as mock_card:
                                mock_card.return_value = "https://example.com/card.png"
                                
                                await process_character_name(mock_message, mock_dispatcher)
                                
                                mock_message.answer_photo.assert_called_once()
    
    @pytest.mark.bot
    async def test_process_character_name_invalid(self, mock_message, mock_dispatcher):
        """Test processing invalid character name"""
        mock_message.text = "X"  # Too short
        
        with patch('bot.CharacterCreation.entering_name') as mock_state:
            await process_character_name(mock_message, mock_dispatcher)
            
            mock_message.answer.assert_called_once()
            call_args = mock_message.answer.call_args
            assert "Name must be between 2 and 20 characters" in call_args[0][0]
    
    @pytest.mark.bot
    async def test_process_character_name_too_long(self, mock_message, mock_dispatcher):
        """Test processing character name that's too long"""
        mock_message.text = "X" * 25  # Too long
        
        with patch('bot.CharacterCreation.entering_name') as mock_state:
            await process_character_name(mock_message, mock_dispatcher)
            
            mock_message.answer.assert_called_once()
            call_args = mock_message.answer.call_args
            assert "Name must be between 2 and 20 characters" in call_args[0][0]
    
    @pytest.mark.bot
    async def test_process_character_name_character_limit(self, mock_message, mock_dispatcher, clean_db):
        """Test processing character name when at character limit"""
        mock_message.text = "TestHero"
        
        with patch('bot.CharacterCreation.entering_name') as mock_state:
            with patch('bot.get_or_create_user') as mock_get_user:
                mock_user = MagicMock()
                mock_user.id = "usr_test"
                mock_get_user.return_value = mock_user
                
                with patch('bot.get_user_characters') as mock_get_chars:
                    # Return max characters
                    mock_chars = [MagicMock() for _ in range(3)]
                    mock_get_chars.return_value = mock_chars
                    
                    await process_character_name(mock_message, mock_dispatcher)
                    
                    mock_message.answer.assert_called_once()
                    call_args = mock_message.answer.call_args
                    assert "You can only have" in call_args[0][0]

class TestBotCallbacks:
    """Test bot callback handlers"""
    
    @pytest.mark.bot
    async def test_callback_select_character(self, mock_callback_query, clean_db):
        """Test character selection callback"""
        mock_callback_query.data = "select_char_ch_test"
        
        with patch('bot.get_character') as mock_get_char:
            mock_character = MagicMock()
            mock_character.name = "TestHero"
            mock_get_char.return_value = mock_character
            
            with patch('bot.show_character_menu') as mock_show_menu:
                await callback_select_character(mock_callback_query)
                
                mock_show_menu.assert_called_once_with(mock_callback_query.message, mock_character)
    
    @pytest.mark.bot
    async def test_callback_select_character_not_found(self, mock_callback_query, clean_db):
        """Test character selection callback with non-existent character"""
        mock_callback_query.data = "select_char_nonexistent"
        
        with patch('bot.get_character') as mock_get_char:
            mock_get_char.return_value = None
            
            await callback_select_character(mock_callback_query)
            
            mock_callback_query.answer.assert_called_once_with("Character not found!")
    
    @pytest.mark.bot
    async def test_callback_character_info(self, mock_callback_query, clean_db):
        """Test character info callback"""
        mock_callback_query.data = "char_info_ch_test"
        
        with patch('bot.get_character') as mock_get_char:
            mock_character = MagicMock()
            mock_character.name = "TestHero"
            mock_character.character_class.value = "Warrior"
            mock_character.level = 5
            mock_character.xp = 1000
            mock_character.stats.hp = 200
            mock_character.stats.mp = 100
            mock_character.stats.attack = 25
            mock_character.stats.defense = 15
            mock_character.stats.speed = 7.5
            mock_character.stats.crit_chance = 0.1
            mock_character.stats.strength = 10
            mock_character.stats.agility = 8
            mock_character.stats.intelligence = 5
            mock_character.sprite_url = "https://example.com/sprite.png"
            mock_get_char.return_value = mock_character
            
            with patch('bot.card_generator.generate_character_card') as mock_card:
                mock_card.return_value = "https://example.com/card.png"
                
                await callback_character_info(mock_callback_query)
                
                mock_callback_query.message.answer_photo.assert_called_once()
    
    @pytest.mark.bot
    async def test_callback_start_battle(self, mock_callback_query, mock_dispatcher, clean_db):
        """Test start battle callback"""
        mock_callback_query.data = "battle_ch_test"
        
        with patch('bot.get_character') as mock_get_char:
            mock_character = MagicMock()
            mock_character.id = "ch_test"
            mock_character.level = 3
            mock_character.stats.hp = 150
            mock_character.stats.mp = 75
            mock_get_char.return_value = mock_character
            
            with patch('bot.db.fetch_one') as mock_fetch:
                mock_fetch.return_value = {'id': 'battle_test'}
                
                await callback_start_battle(mock_callback_query, mock_dispatcher)
                
                mock_callback_query.message.edit_text.assert_called_once()
                call_args = mock_callback_query.message.edit_text.call_args
                assert "Battle Started!" in call_args[0][0]
                assert "Goblin" in call_args[0][0]
    
    @pytest.mark.bot
    async def test_callback_start_battle_character_not_found(self, mock_callback_query, mock_dispatcher, clean_db):
        """Test start battle callback with non-existent character"""
        mock_callback_query.data = "battle_nonexistent"
        
        with patch('bot.get_character') as mock_get_char:
            mock_get_char.return_value = None
            
            await callback_start_battle(mock_callback_query, mock_dispatcher)
            
            mock_callback_query.answer.assert_called_once_with("Character not found!")
    
    @pytest.mark.bot
    async def test_callback_battle_action_run(self, mock_callback_query, mock_dispatcher, clean_db):
        """Test battle action callback - run"""
        mock_callback_query.data = "action_run"
        
        with patch('bot.Combat.in_battle') as mock_state:
            with patch('bot.db.fetch_one') as mock_fetch:
                mock_fetch.return_value = {
                    'id': 'battle_test',
                    'character_id': 'ch_test',
                    'enemy': {'name': 'Goblin', 'level': 1, 'hp': 50, 'attack': 8, 'defense': 2},
                    'state': {'turn': 1, 'character_hp': 100, 'character_mp': 50, 'enemy_hp': 50, 'log': []}
                }
                
                await callback_battle_action(mock_callback_query, mock_dispatcher)
                
                mock_callback_query.message.edit_text.assert_called_once()
                call_args = mock_callback_query.message.edit_text.call_args
                assert "You fled from battle!" in call_args[0][0]
    
    @pytest.mark.bot
    async def test_callback_battle_action_attack(self, mock_callback_query, mock_dispatcher, clean_db):
        """Test battle action callback - attack"""
        mock_callback_query.data = "action_attack"
        
        with patch('bot.Combat.in_battle') as mock_state:
            with patch('bot.db.fetch_one') as mock_fetch:
                mock_fetch.return_value = {
                    'id': 'battle_test',
                    'character_id': 'ch_test',
                    'enemy': {'name': 'Goblin', 'level': 1, 'hp': 50, 'attack': 8, 'defense': 2},
                    'state': {'turn': 1, 'character_hp': 100, 'character_mp': 50, 'enemy_hp': 50, 'log': []}
                }
                
                with patch('bot.get_character') as mock_get_char:
                    mock_character = MagicMock()
                    mock_character.id = "ch_test"
                    mock_character.stats.hp = 100
                    mock_character.stats.mp = 50
                    mock_get_char.return_value = mock_character
                    
                    with patch('bot.CombatSystem.simulate_turn') as mock_simulate:
                        mock_simulate.return_value = {
                            'character_hp': 90,
                            'character_mp': 50,
                            'enemy_hp': 30,
                            'damage_dealt': 20,
                            'damage_taken': 10,
                            'mp_used': 0,
                            'result': None,
                            'log': 'You dealt 20 damage, Goblin dealt 10 damage to you'
                        }
                        
                        await callback_battle_action(mock_callback_query, mock_dispatcher)
                        
                        mock_callback_query.message.edit_text.assert_called_once()
    
    @pytest.mark.bot
    async def test_callback_quests(self, mock_callback_query, clean_db):
        """Test quests callback"""
        mock_callback_query.data = "quests_ch_test"
        
        with patch('bot.get_character') as mock_get_char:
            mock_character = MagicMock()
            mock_character.level = 3
            mock_get_char.return_value = mock_character
            
            with patch('bot.QuestSystem.get_available_quests') as mock_get_quests:
                mock_get_quests.return_value = [
                    {
                        'id': 'q_test',
                        'title': 'Test Quest',
                        'level_req': 1
                    }
                ]
                
                await callback_quests(mock_callback_query)
                
                mock_callback_query.message.edit_text.assert_called_once()
                call_args = mock_callback_query.message.edit_text.call_args
                assert "Available Quests" in call_args[0][0]
    
    @pytest.mark.bot
    async def test_callback_quest_details(self, mock_callback_query, clean_db):
        """Test quest details callback"""
        mock_callback_query.data = "quest_q_test_ch_test"
        
        await callback_quest_details(mock_callback_query)
        
        mock_callback_query.message.edit_text.assert_called_once()
        call_args = mock_callback_query.message.edit_text.call_args
        assert "Goblin Hunt" in call_args[0][0] or "Wolf Pack Threat" in call_args[0][0]
    
    @pytest.mark.bot
    async def test_callback_accept_quest(self, mock_callback_query, clean_db):
        """Test accept quest callback"""
        mock_callback_query.data = "accept_quest_q_test_ch_test"
        
        with patch('bot.db.fetch_one') as mock_fetch:
            mock_fetch.return_value = None  # Quest not already accepted
            
            await callback_accept_quest(mock_callback_query)
            
            mock_callback_query.message.edit_text.assert_called_once()
            call_args = mock_callback_query.message.edit_text.call_args
            assert "Quest accepted!" in call_args[0][0]
    
    @pytest.mark.bot
    async def test_callback_accept_quest_already_accepted(self, mock_callback_query, clean_db):
        """Test accept quest callback when already accepted"""
        mock_callback_query.data = "accept_quest_q_test_ch_test"
        
        with patch('bot.db.fetch_one') as mock_fetch:
            mock_fetch.return_value = {'id': 'existing_quest'}  # Quest already accepted
            
            await callback_accept_quest(mock_callback_query)
            
            mock_callback_query.answer.assert_called_once_with("You have already accepted this quest!")
