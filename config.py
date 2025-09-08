import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Telegram Bot Configuration
    BOT_TOKEN = os.getenv("BOT_TOKEN")
    WEBHOOK_URL = os.getenv("WEBHOOK_URL")
    WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET")
    
    # Database Configuration
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://username:password@localhost:5432/mmorpg_bot")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Payment Configuration
    TELEGRAM_PAYMENT_PROVIDER_TOKEN = os.getenv("TELEGRAM_PAYMENT_PROVIDER_TOKEN")
    
    # Security
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your_jwt_secret_key_here")
    WEBHOOK_SECRET_KEY = os.getenv("WEBHOOK_SECRET_KEY", "your_webhook_secret_key")
    
    # CDN Configuration
    CDN_BASE_URL = os.getenv("CDN_BASE_URL", "https://cdn.yourdomain.com")
    SPRITE_BASE_PATH = os.getenv("SPRITE_BASE_PATH", "/sprites")
    
    # Game Configuration
    MAX_CHARACTERS_PER_USER = int(os.getenv("MAX_CHARACTERS_PER_USER", "3"))
    MAX_INVENTORY_SLOTS = int(os.getenv("MAX_INVENTORY_SLOTS", "30"))
    BASE_INVENTORY_SLOTS = int(os.getenv("BASE_INVENTORY_SLOTS", "20"))
    
    # Character Stats Configuration
    BASE_HP_PER_LEVEL = 20
    BASE_MP_PER_LEVEL = 10
    BASE_ATTACK_PER_LEVEL = 2
    BASE_DEFENSE_PER_LEVEL = 1.5
    BASE_SPEED_PER_LEVEL = 0.5
    BASE_CRIT_CHANCE_PER_LEVEL = 0.002
    
    # Class-specific stat bonuses
    CLASS_STAT_BONUSES = {
        "Warrior": {"strength": 2, "hp": 20},
        "Mage": {"intelligence": 2, "mp": 20},
        "Rogue": {"agility": 2, "speed": 1.0, "crit_chance": 0.01}
    }
    
    # Item rarity drop rates
    ITEM_DROP_RATES = {
        "Common": 0.60,
        "Rare": 0.25,
        "Epic": 0.10,
        "Legendary": 0.05
    }
