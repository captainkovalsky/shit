import asyncpg
import asyncio
from typing import Optional, Dict, Any, List
import json
from datetime import datetime
import uuid

class Database:
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.pool: Optional[asyncpg.Pool] = None
    
    async def connect(self):
        """Create database connection pool"""
        self.pool = await asyncpg.create_pool(
            self.database_url,
            min_size=5,
            max_size=20,
            command_timeout=60
        )
    
    async def close(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
    
    async def execute(self, query: str, *args):
        """Execute a query"""
        async with self.pool.acquire() as conn:
            return await conn.execute(query, *args)
    
    async def fetch_one(self, query: str, *args):
        """Fetch one row"""
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(query, *args)
    
    async def fetch_all(self, query: str, *args):
        """Fetch all rows"""
        async with self.pool.acquire() as conn:
            return await conn.fetch(query, *args)
    
    async def init_tables(self):
        """Initialize database tables"""
        queries = [
            # Users table
            """
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                telegram_id BIGINT UNIQUE NOT NULL,
                username VARCHAR(255),
                gold INTEGER DEFAULT 0,
                gems INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # Characters table
            """
            CREATE TABLE IF NOT EXISTS characters (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(50) NOT NULL,
                class VARCHAR(20) NOT NULL CHECK (class IN ('Warrior', 'Mage', 'Rogue')),
                level INTEGER DEFAULT 1,
                xp INTEGER DEFAULT 0,
                stats JSONB NOT NULL DEFAULT '{}',
                equipment JSONB NOT NULL DEFAULT '{}',
                sprite_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, name)
            )
            """,
            
            # Items table
            """
            CREATE TABLE IF NOT EXISTS items (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                type VARCHAR(20) NOT NULL CHECK (type IN ('Weapon', 'Armor', 'Helmet', 'Boots', 'Accessory', 'Consumable')),
                rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('Common', 'Rare', 'Epic', 'Legendary')),
                name VARCHAR(100) NOT NULL,
                description TEXT,
                stats JSONB DEFAULT '{}',
                price_gold INTEGER DEFAULT 0,
                price_gems INTEGER DEFAULT NULL,
                stackable BOOLEAN DEFAULT FALSE,
                icon_url TEXT,
                overlay_layer VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # Inventory table
            """
            CREATE TABLE IF NOT EXISTS inventory (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                character_id VARCHAR(36) REFERENCES characters(id) ON DELETE CASCADE,
                item_id VARCHAR(36) REFERENCES items(id),
                qty INTEGER DEFAULT 1,
                is_equipped BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # Quests table
            """
            CREATE TABLE IF NOT EXISTS quests (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                type VARCHAR(20) NOT NULL CHECK (type IN ('Story', 'Side', 'Daily', 'Weekly')),
                level_req INTEGER DEFAULT 1,
                title VARCHAR(100) NOT NULL,
                description TEXT,
                objective JSONB NOT NULL,
                rewards JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # Character quests table
            """
            CREATE TABLE IF NOT EXISTS character_quests (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                character_id VARCHAR(36) REFERENCES characters(id) ON DELETE CASCADE,
                quest_id VARCHAR(36) REFERENCES quests(id),
                status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'in_progress', 'completed')),
                progress JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(character_id, quest_id)
            )
            """,
            
            # PvE battles table
            """
            CREATE TABLE IF NOT EXISTS pve_battles (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                character_id VARCHAR(36) REFERENCES characters(id) ON DELETE CASCADE,
                enemy JSONB NOT NULL,
                state JSONB NOT NULL,
                result VARCHAR(10) CHECK (result IN ('win', 'lose', 'fled')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # PvP matches table
            """
            CREATE TABLE IF NOT EXISTS pvp_matches (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                challenger_id VARCHAR(36) REFERENCES characters(id) ON DELETE CASCADE,
                opponent_id VARCHAR(36) REFERENCES characters(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'finished')),
                round INTEGER DEFAULT 1,
                log JSONB DEFAULT '[]',
                winner_id VARCHAR(36) REFERENCES characters(id),
                rating_delta INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # Character ratings table
            """
            CREATE TABLE IF NOT EXISTS character_ratings (
                character_id VARCHAR(36) PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
                rating INTEGER DEFAULT 1000,
                season VARCHAR(20) DEFAULT '2025-01',
                wins INTEGER DEFAULT 0,
                losses INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # Payment intents table
            """
            CREATE TABLE IF NOT EXISTS payment_intents (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
                product VARCHAR(50) NOT NULL,
                amount_minor INTEGER NOT NULL,
                currency VARCHAR(3) DEFAULT 'USD',
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
                provider VARCHAR(20) DEFAULT 'telegram',
                metadata JSONB DEFAULT '{}',
                confirmation_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # Render jobs table
            """
            CREATE TABLE IF NOT EXISTS render_jobs (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                character_id VARCHAR(36) REFERENCES characters(id) ON DELETE CASCADE,
                layers JSONB NOT NULL,
                status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'done', 'failed')),
                result_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            
            # Create indexes
            """
            CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
            CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
            CREATE INDEX IF NOT EXISTS idx_inventory_character_id ON inventory(character_id);
            CREATE INDEX IF NOT EXISTS idx_character_quests_character_id ON character_quests(character_id);
            CREATE INDEX IF NOT EXISTS idx_pve_battles_character_id ON pve_battles(character_id);
            CREATE INDEX IF NOT EXISTS idx_pvp_matches_challenger ON pvp_matches(challenger_id);
            CREATE INDEX IF NOT EXISTS idx_pvp_matches_opponent ON pvp_matches(opponent_id);
            CREATE INDEX IF NOT EXISTS idx_payment_intents_user_id ON payment_intents(user_id);
            CREATE INDEX IF NOT EXISTS idx_render_jobs_character_id ON render_jobs(character_id);
            """
        ]
        
        for query in queries:
            await self.execute(query)
        
        print("Database tables initialized successfully!")

# Global database instance
db = Database("")

async def init_database(database_url: str):
    """Initialize database connection and tables"""
    global db
    db = Database(database_url)
    await db.connect()
    await db.init_tables()
