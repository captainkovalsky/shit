"""
Pytest configuration and fixtures for MMO RPG Telegram Bot tests
"""

import pytest
import asyncio
import os
import tempfile
import json
from typing import Dict, Any, List, Optional
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

# Set test environment
os.environ['TESTING'] = 'true'
os.environ['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test_mmorpg_bot'

import asyncpg
from aiogram import Bot, Dispatcher
from aiogram.types import User, Chat, Message, CallbackQuery, Update
from aiogram.fsm.storage.memory import MemoryStorage

from database import Database, init_database
from models import *
from game_logic import CombatSystem, LevelingSystem, LootSystem, QuestSystem
from config import Config

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def test_db():
    """Create a test database connection"""
    db = Database("postgresql://test:test@localhost:5432/test_mmorpg_bot")
    await db.connect()
    await db.init_tables()
    yield db
    await db.close()

@pytest.fixture
async def clean_db(test_db):
    """Clean database before each test"""
    # Clean all tables
    tables = [
        'render_jobs', 'payment_intents', 'character_ratings', 'pvp_matches',
        'pve_battles', 'character_quests', 'quests', 'inventory', 'items',
        'characters', 'users'
    ]
    
    for table in tables:
        try:
            await test_db.execute(f"DELETE FROM {table}")
        except:
            pass  # Table might not exist yet
    
    yield test_db

@pytest.fixture
def mock_user():
    """Create a mock Telegram user"""
    return User(
        id=123456789,
        is_bot=False,
        first_name="Test",
        last_name="User",
        username="testuser",
        language_code="en"
    )

@pytest.fixture
def mock_chat():
    """Create a mock Telegram chat"""
    return Chat(
        id=123456789,
        type="private",
        first_name="Test",
        username="testuser"
    )

@pytest.fixture
def mock_message(mock_user, mock_chat):
    """Create a mock Telegram message"""
    return Message(
        message_id=1,
        date=datetime.now(),
        chat=mock_chat,
        from_user=mock_user,
        text="/start"
    )

@pytest.fixture
def mock_callback_query(mock_user, mock_chat):
    """Create a mock Telegram callback query"""
    return CallbackQuery(
        id="test_callback",
        from_user=mock_user,
        chat_instance="test_chat",
        data="test_data"
    )

@pytest.fixture
def mock_bot():
    """Create a mock Telegram bot"""
    bot = MagicMock(spec=Bot)
    bot.token = "test_token"
    bot.get_me = AsyncMock()
    bot.send_message = AsyncMock()
    bot.send_photo = AsyncMock()
    bot.answer_callback_query = AsyncMock()
    bot.edit_message_text = AsyncMock()
    bot.edit_message_reply_markup = AsyncMock()
    return bot

@pytest.fixture
def mock_dispatcher():
    """Create a mock dispatcher"""
    storage = MemoryStorage()
    return Dispatcher(storage=storage)

@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        "id": "usr_test123",
        "telegram_id": 123456789,
        "username": "testuser",
        "gold": 1000,
        "gems": 50,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
    }

@pytest.fixture
def sample_character_data():
    """Sample character data for testing"""
    return {
        "id": "ch_test123",
        "user_id": "usr_test123",
        "name": "TestHero",
        "class": "Warrior",
        "level": 5,
        "xp": 500,
        "stats": {
            "hp": 200,
            "mp": 100,
            "attack": 25,
            "defense": 15,
            "speed": 7.5,
            "crit_chance": 0.1,
            "strength": 10,
            "agility": 8,
            "intelligence": 5
        },
        "equipment": {
            "weapon": "itm_wpn_iron_sword",
            "helmet": "itm_hel_iron_helmet",
            "armor": "itm_arm_chain_mail",
            "boots": "itm_boo_leather_boots",
            "accessory": None
        },
        "sprite_url": "https://example.com/sprite.png",
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
    }

@pytest.fixture
def sample_item_data():
    """Sample item data for testing"""
    return {
        "id": "itm_wpn_iron_sword",
        "type": "Weapon",
        "rarity": "Rare",
        "name": "Iron Sword",
        "description": "A sturdy iron sword",
        "stats": {"attack": 12, "crit_chance": 0.05},
        "price_gold": 200,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "weapon",
        "created_at": "2025-01-01T00:00:00Z"
    }

@pytest.fixture
def sample_enemy_data():
    """Sample enemy data for testing"""
    return {
        "name": "Goblin",
        "level": 3,
        "hp": 80,
        "attack": 12,
        "defense": 4,
        "speed": 6.5,
        "xp_reward": 20,
        "gold_reward": (8, 15),
        "loot_chance": 0.3,
        "description": "Small, aggressive humanoid"
    }

@pytest.fixture
def sample_quest_data():
    """Sample quest data for testing"""
    return {
        "id": "q_test_quest",
        "type": "Story",
        "level_req": 1,
        "title": "Test Quest",
        "description": "A test quest for testing",
        "objective": {"kill": {"enemy": "Goblin", "count": 5}},
        "rewards": {"xp": 100, "gold": 50, "items": ["itm_pot_heal_s"]},
        "created_at": "2025-01-01T00:00:00Z"
    }

@pytest.fixture
def sample_battle_data():
    """Sample battle data for testing"""
    return {
        "id": "battle_test123",
        "character_id": "ch_test123",
        "enemy": {
            "name": "Goblin",
            "level": 3,
            "hp": 80,
            "attack": 12,
            "defense": 4
        },
        "state": {
            "turn": 1,
            "character_hp": 200,
            "character_mp": 100,
            "enemy_hp": 80,
            "log": []
        },
        "result": None,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
    }

@pytest.fixture
def mock_image():
    """Create a mock PIL Image for testing"""
    from PIL import Image
    return Image.new('RGBA', (64, 64), (255, 255, 255, 255))

@pytest.fixture
def temp_assets_dir():
    """Create temporary assets directory for testing"""
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create subdirectories
        os.makedirs(os.path.join(temp_dir, "sprites", "weapons"), exist_ok=True)
        os.makedirs(os.path.join(temp_dir, "sprites", "armor"), exist_ok=True)
        os.makedirs(os.path.join(temp_dir, "sprites", "helmets"), exist_ok=True)
        os.makedirs(os.path.join(temp_dir, "sprites", "boots"), exist_ok=True)
        os.makedirs(os.path.join(temp_dir, "sprites", "accessories"), exist_ok=True)
        
        yield temp_dir

@pytest.fixture
def mock_webhook_request():
    """Create a mock webhook request"""
    return {
        "event": "payment.succeeded",
        "payment_intent_id": "pay_test123",
        "provider": "telegram",
        "amount_minor": 299,
        "currency": "USD",
        "user": {"telegram_id": 123456789}
    }

@pytest.fixture
def mock_api_request():
    """Create a mock API request"""
    return {
        "headers": {"X-Telegram-User-ID": "123456789"},
        "json": {"name": "TestCharacter", "class": "Warrior"}
    }

# Async test utilities
@pytest.fixture
def async_mock():
    """Create an async mock"""
    return AsyncMock()

@pytest.fixture
def mock_asyncpg_connection():
    """Create a mock asyncpg connection"""
    connection = AsyncMock()
    connection.fetchrow = AsyncMock()
    connection.fetch = AsyncMock()
    connection.execute = AsyncMock()
    connection.close = AsyncMock()
    return connection

@pytest.fixture
def mock_asyncpg_pool():
    """Create a mock asyncpg pool"""
    pool = AsyncMock()
    pool.acquire = AsyncMock()
    pool.close = AsyncMock()
    return pool

# Test data factories
class TestDataFactory:
    """Factory for creating test data"""
    
    @staticmethod
    def create_user(telegram_id: int = 123456789, username: str = "testuser") -> Dict[str, Any]:
        """Create test user data"""
        return {
            "id": f"usr_{telegram_id}",
            "telegram_id": telegram_id,
            "username": username,
            "gold": 1000,
            "gems": 50,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    
    @staticmethod
    def create_character(user_id: str, name: str = "TestHero", 
                        character_class: str = "Warrior", level: int = 1) -> Dict[str, Any]:
        """Create test character data"""
        stats = CharacterStats.create_base_stats(CharacterClass(character_class), level)
        equipment = Equipment()
        
        return {
            "id": f"ch_{name.lower()}",
            "user_id": user_id,
            "name": name,
            "class": character_class,
            "level": level,
            "xp": 0,
            "stats": stats.to_dict(),
            "equipment": equipment.to_dict(),
            "sprite_url": None,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
    
    @staticmethod
    def create_item(item_id: str, item_type: str = "Weapon", 
                   rarity: str = "Common") -> Dict[str, Any]:
        """Create test item data"""
        return {
            "id": item_id,
            "type": item_type,
            "rarity": rarity,
            "name": f"Test {item_type}",
            "description": f"A test {item_type.lower()}",
            "stats": {"attack": 10} if item_type == "Weapon" else {"defense": 5},
            "price_gold": 100,
            "price_gems": None,
            "stackable": False,
            "overlay_layer": item_type.lower(),
            "created_at": datetime.now().isoformat()
        }
    
    @staticmethod
    def create_enemy(name: str = "Goblin", level: int = 1) -> Dict[str, Any]:
        """Create test enemy data"""
        return {
            "name": name,
            "level": level,
            "hp": 50 + (level - 1) * 10,
            "attack": 8 + (level - 1) * 2,
            "defense": 2 + (level - 1),
            "speed": 5.0 + (level - 1) * 0.5,
            "xp_reward": 15 + (level - 1) * 5,
            "gold_reward": (5, 15),
            "loot_chance": 0.3,
            "description": f"A level {level} {name.lower()}"
        }

@pytest.fixture
def test_data_factory():
    """Provide test data factory"""
    return TestDataFactory

# Configuration for tests
@pytest.fixture(autouse=True)
def setup_test_config():
    """Setup test configuration"""
    Config.MAX_CHARACTERS_PER_USER = 3
    Config.MAX_INVENTORY_SLOTS = 30
    Config.BASE_INVENTORY_SLOTS = 20
    Config.DATABASE_URL = "postgresql://test:test@localhost:5432/test_mmorpg_bot"
    Config.BOT_TOKEN = "test_token"
    Config.JWT_SECRET_KEY = "test_secret_key"
    Config.CDN_BASE_URL = "https://test-cdn.example.com"
    Config.SPRITE_BASE_PATH = "/test-sprites"

# Test markers
def pytest_configure(config):
    """Configure pytest markers"""
    config.addinivalue_line("markers", "unit: mark test as unit test")
    config.addinivalue_line("markers", "integration: mark test as integration test")
    config.addinivalue_line("markers", "slow: mark test as slow running")
    config.addinivalue_line("markers", "database: mark test as requiring database")
    config.addinivalue_line("markers", "bot: mark test as bot functionality test")
    config.addinivalue_line("markers", "api: mark test as API test")
