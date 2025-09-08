"""
Integration tests for database module
"""

import pytest
import json
from datetime import datetime
from database import Database, init_database
from models import CharacterStats, Equipment, CharacterClass

class TestDatabaseIntegration:
    """Test database integration"""
    
    @pytest.mark.integration
    @pytest.mark.database
    async def test_database_connection(self, test_db):
        """Test database connection"""
        assert test_db.pool is not None
        
        # Test basic query
        result = await test_db.fetch_one("SELECT 1 as test")
        assert result['test'] == 1
    
    @pytest.mark.integration
    @pytest.mark.database
    async def test_database_tables_creation(self, test_db):
        """Test that all tables are created"""
        tables = [
            'users', 'characters', 'items', 'inventory', 'quests',
            'character_quests', 'pve_battles', 'pvp_matches',
            'character_ratings', 'payment_intents', 'render_jobs'
        ]
        
        for table in tables:
            result = await test_db.fetch_one(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)",
                table
            )
            assert result['exists'] is True
    
    @pytest.mark.integration
    @pytest.mark.database
    async def test_user_crud_operations(self, clean_db):
        """Test user CRUD operations"""
        # Create user
        user_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username, gold, gems) VALUES ($1, $2, $3, $4) RETURNING id",
            123456789, "testuser", 1000, 50
        )
        
        assert user_id['id'] is not None
        
        # Read user
        user = await clean_db.fetch_one(
            "SELECT * FROM users WHERE id = $1", user_id['id']
        )
        
        assert user['telegram_id'] == 123456789
        assert user['username'] == "testuser"
        assert user['gold'] == 1000
        assert user['gems'] == 50
        
        # Update user
        await clean_db.execute(
            "UPDATE users SET gold = $1 WHERE id = $2",
            1500, user_id['id']
        )
        
        updated_user = await clean_db.fetch_one(
            "SELECT * FROM users WHERE id = $1", user_id['id']
        )
        
        assert updated_user['gold'] == 1500
        
        # Delete user
        await clean_db.execute("DELETE FROM users WHERE id = $1", user_id['id'])
        
        deleted_user = await clean_db.fetch_one(
            "SELECT * FROM users WHERE id = $1", user_id['id']
        )
        
        assert deleted_user is None
    
    @pytest.mark.integration
    @pytest.mark.database
    async def test_character_crud_operations(self, clean_db):
        """Test character CRUD operations"""
        # Create user first
        user_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username) VALUES ($1, $2) RETURNING id",
            123456789, "testuser"
        )
        
        # Create character
        stats = CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1)
        equipment = Equipment()
        
        char_id = await clean_db.fetch_one(
            """INSERT INTO characters (user_id, name, class, level, xp, stats, equipment) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id""",
            user_id['id'], "TestHero", "Warrior", 1, 0,
            json.dumps(stats.to_dict()), json.dumps(equipment.to_dict())
        )
        
        assert char_id['id'] is not None
        
        # Read character
        character = await clean_db.fetch_one(
            "SELECT * FROM characters WHERE id = $1", char_id['id']
        )
        
        assert character['name'] == "TestHero"
        assert character['class'] == "Warrior"
        assert character['level'] == 1
        assert character['xp'] == 0
        
        # Update character
        await clean_db.execute(
            "UPDATE characters SET level = $1, xp = $2 WHERE id = $3",
            2, 100, char_id['id']
        )
        
        updated_character = await clean_db.fetch_one(
            "SELECT * FROM characters WHERE id = $1", char_id['id']
        )
        
        assert updated_character['level'] == 2
        assert updated_character['xp'] == 100
        
        # Delete character
        await clean_db.execute("DELETE FROM characters WHERE id = $1", char_id['id'])
        
        deleted_character = await clean_db.fetch_one(
            "SELECT * FROM characters WHERE id = $1", char_id['id']
        )
        
        assert deleted_character is None
    
    @pytest.mark.integration
    @pytest.mark.database
    async def test_item_crud_operations(self, clean_db):
        """Test item CRUD operations"""
        # Create item
        item_id = await clean_db.fetch_one(
            """INSERT INTO items (id, type, rarity, name, description, stats, price_gold, stackable, overlay_layer) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id""",
            "itm_test_sword", "Weapon", "Rare", "Test Sword", "A test sword",
            json.dumps({"attack": 12, "crit_chance": 0.05}), 200, False, "weapon"
        )
        
        assert item_id['id'] == "itm_test_sword"
        
        # Read item
        item = await clean_db.fetch_one(
            "SELECT * FROM items WHERE id = $1", "itm_test_sword"
        )
        
        assert item['name'] == "Test Sword"
        assert item['type'] == "Weapon"
        assert item['rarity'] == "Rare"
        assert item['price_gold'] == 200
        
        # Update item
        await clean_db.execute(
            "UPDATE items SET price_gold = $1 WHERE id = $2",
            250, "itm_test_sword"
        )
        
        updated_item = await clean_db.fetch_one(
            "SELECT * FROM items WHERE id = $1", "itm_test_sword"
        )
        
        assert updated_item['price_gold'] == 250
        
        # Delete item
        await clean_db.execute("DELETE FROM items WHERE id = $1", "itm_test_sword")
        
        deleted_item = await clean_db.fetch_one(
            "SELECT * FROM items WHERE id = $1", "itm_test_sword"
        )
        
        assert deleted_item is None
    
    @pytest.mark.integration
    @pytest.mark.database
    async def test_inventory_operations(self, clean_db):
        """Test inventory operations"""
        # Create user and character
        user_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username) VALUES ($1, $2) RETURNING id",
            123456789, "testuser"
        )
        
        char_id = await clean_db.fetch_one(
            """INSERT INTO characters (user_id, name, class, level, xp, stats, equipment) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id""",
            user_id['id'], "TestHero", "Warrior", 1, 0,
            json.dumps(CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1).to_dict()),
            json.dumps(Equipment().to_dict())
        )
        
        # Create item
        await clean_db.execute(
            """INSERT INTO items (id, type, rarity, name, description, stats, price_gold, stackable, overlay_layer) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
            "itm_test_sword", "Weapon", "Rare", "Test Sword", "A test sword",
            json.dumps({"attack": 12}), 200, False, "weapon"
        )
        
        # Add item to inventory
        inv_id = await clean_db.fetch_one(
            "INSERT INTO inventory (character_id, item_id, qty, is_equipped) VALUES ($1, $2, $3, $4) RETURNING id",
            char_id['id'], "itm_test_sword", 1, False
        )
        
        assert inv_id['id'] is not None
        
        # Read inventory
        inventory = await clean_db.fetch_all(
            """SELECT i.*, inv.qty, inv.is_equipped 
               FROM inventory inv 
               JOIN items i ON inv.item_id = i.id 
               WHERE inv.character_id = $1""",
            char_id['id']
        )
        
        assert len(inventory) == 1
        assert inventory[0]['name'] == "Test Sword"
        assert inventory[0]['qty'] == 1
        assert inventory[0]['is_equipped'] is False
        
        # Update inventory (equip item)
        await clean_db.execute(
            "UPDATE inventory SET is_equipped = true WHERE id = $1",
            inv_id['id']
        )
        
        updated_inventory = await clean_db.fetch_all(
            """SELECT i.*, inv.qty, inv.is_equipped 
               FROM inventory inv 
               JOIN items i ON inv.item_id = i.id 
               WHERE inv.character_id = $1""",
            char_id['id']
        )
        
        assert updated_inventory[0]['is_equipped'] is True
    
    @pytest.mark.integration
    @pytest.mark.database
    async def test_quest_operations(self, clean_db):
        """Test quest operations"""
        # Create quest
        quest_id = await clean_db.fetch_one(
            """INSERT INTO quests (id, type, level_req, title, description, objective, rewards) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id""",
            "q_test_quest", "Story", 1, "Test Quest", "A test quest",
            json.dumps({"kill": {"enemy": "Goblin", "count": 5}}),
            json.dumps({"xp": 100, "gold": 50})
        )
        
        assert quest_id['id'] == "q_test_quest"
        
        # Create user and character
        user_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username) VALUES ($1, $2) RETURNING id",
            123456789, "testuser"
        )
        
        char_id = await clean_db.fetch_one(
            """INSERT INTO characters (user_id, name, class, level, xp, stats, equipment) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id""",
            user_id['id'], "TestHero", "Warrior", 1, 0,
            json.dumps(CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1).to_dict()),
            json.dumps(Equipment().to_dict())
        )
        
        # Accept quest
        char_quest_id = await clean_db.fetch_one(
            """INSERT INTO character_quests (character_id, quest_id, status, progress) 
               VALUES ($1, $2, $3, $4) RETURNING id""",
            char_id['id'], "q_test_quest", "in_progress", json.dumps({"kill": {"Goblin": 0}})
        )
        
        assert char_quest_id['id'] is not None
        
        # Update quest progress
        await clean_db.execute(
            """UPDATE character_quests SET progress = $1 WHERE id = $2""",
            json.dumps({"kill": {"Goblin": 3}}), char_quest_id['id']
        )
        
        # Check quest progress
        quest_progress = await clean_db.fetch_one(
            "SELECT progress FROM character_quests WHERE id = $1",
            char_quest_id['id']
        )
        
        progress_data = json.loads(quest_progress['progress'])
        assert progress_data['kill']['Goblin'] == 3
    
    @pytest.mark.integration
    @pytest.mark.database
    async def test_battle_operations(self, clean_db):
        """Test battle operations"""
        # Create user and character
        user_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username) VALUES ($1, $2) RETURNING id",
            123456789, "testuser"
        )
        
        char_id = await clean_db.fetch_one(
            """INSERT INTO characters (user_id, name, class, level, xp, stats, equipment) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id""",
            user_id['id'], "TestHero", "Warrior", 1, 0,
            json.dumps(CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1).to_dict()),
            json.dumps(Equipment().to_dict())
        )
        
        # Create battle
        enemy_data = {
            "name": "Goblin",
            "level": 1,
            "hp": 50,
            "attack": 8,
            "defense": 2
        }
        
        battle_state = {
            "turn": 1,
            "character_hp": 100,
            "character_mp": 50,
            "enemy_hp": 50,
            "log": []
        }
        
        battle_id = await clean_db.fetch_one(
            """INSERT INTO pve_battles (character_id, enemy, state) 
               VALUES ($1, $2, $3) RETURNING id""",
            char_id['id'], json.dumps(enemy_data), json.dumps(battle_state)
        )
        
        assert battle_id['id'] is not None
        
        # Update battle state
        updated_state = {
            "turn": 2,
            "character_hp": 90,
            "character_mp": 45,
            "enemy_hp": 30,
            "log": ["Player attacked for 20 damage", "Enemy attacked for 10 damage"]
        }
        
        await clean_db.execute(
            "UPDATE pve_battles SET state = $1 WHERE id = $2",
            json.dumps(updated_state), battle_id['id']
        )
        
        # Check battle state
        battle = await clean_db.fetch_one(
            "SELECT state FROM pve_battles WHERE id = $1",
            battle_id['id']
        )
        
        state_data = json.loads(battle['state'])
        assert state_data['turn'] == 2
        assert state_data['character_hp'] == 90
        assert state_data['enemy_hp'] == 30
        assert len(state_data['log']) == 2
    
    @pytest.mark.integration
    @pytest.mark.database
    async def test_pvp_operations(self, clean_db):
        """Test PvP operations"""
        # Create users and characters
        user1_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username) VALUES ($1, $2) RETURNING id",
            123456789, "player1"
        )
        
        user2_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username) VALUES ($1, $2) RETURNING id",
            987654321, "player2"
        )
        
        char1_id = await clean_db.fetch_one(
            """INSERT INTO characters (user_id, name, class, level, xp, stats, equipment) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id""",
            user1_id['id'], "Player1Hero", "Warrior", 1, 0,
            json.dumps(CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1).to_dict()),
            json.dumps(Equipment().to_dict())
        )
        
        char2_id = await clean_db.fetch_one(
            """INSERT INTO characters (user_id, name, class, level, xp, stats, equipment) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id""",
            user2_id['id'], "Player2Hero", "Mage", 1, 0,
            json.dumps(CharacterStats.create_base_stats(CharacterClass.MAGE, 1).to_dict()),
            json.dumps(Equipment().to_dict())
        )
        
        # Create PvP match
        match_id = await clean_db.fetch_one(
            """INSERT INTO pvp_matches (challenger_id, opponent_id, status, round, log) 
               VALUES ($1, $2, $3, $4, $5) RETURNING id""",
            char1_id['id'], char2_id['id'], "active", 1, json.dumps([])
        )
        
        assert match_id['id'] is not None
        
        # Update match
        await clean_db.execute(
            """UPDATE pvp_matches SET round = $1, log = $2, winner_id = $3 WHERE id = $4""",
            3, json.dumps(["Player1 attacked", "Player2 cast fireball", "Player1 won"]),
            char1_id['id'], match_id['id']
        )
        
        # Check match
        match = await clean_db.fetch_one(
            "SELECT * FROM pvp_matches WHERE id = $1",
            match_id['id']
        )
        
        assert match['round'] == 3
        assert match['winner_id'] == char1_id['id']
        assert len(json.loads(match['log'])) == 3
    
    @pytest.mark.integration
    @pytest.mark.database
    async def test_payment_operations(self, clean_db):
        """Test payment operations"""
        # Create user
        user_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username) VALUES ($1, $2) RETURNING id",
            123456789, "testuser"
        )
        
        # Create payment intent
        payment_id = await clean_db.fetch_one(
            """INSERT INTO payment_intents (user_id, product, amount_minor, currency, status, provider) 
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING id""",
            user_id['id'], "gems_pack_100", 299, "USD", "pending", "telegram"
        )
        
        assert payment_id['id'] is not None
        
        # Update payment status
        await clean_db.execute(
            "UPDATE payment_intents SET status = $1 WHERE id = $2",
            "succeeded", payment_id['id']
        )
        
        # Update user gems
        await clean_db.execute(
            "UPDATE users SET gems = gems + $1 WHERE id = $2",
            100, user_id['id']
        )
        
        # Check payment and user
        payment = await clean_db.fetch_one(
            "SELECT * FROM payment_intents WHERE id = $1",
            payment_id['id']
        )
        
        user = await clean_db.fetch_one(
            "SELECT * FROM users WHERE id = $1",
            user_id['id']
        )
        
        assert payment['status'] == "succeeded"
        assert user['gems'] == 100
    
    @pytest.mark.integration
    @pytest.mark.database
    async def test_render_job_operations(self, clean_db):
        """Test render job operations"""
        # Create user and character
        user_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username) VALUES ($1, $2) RETURNING id",
            123456789, "testuser"
        )
        
        char_id = await clean_db.fetch_one(
            """INSERT INTO characters (user_id, name, class, level, xp, stats, equipment) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id""",
            user_id['id'], "TestHero", "Warrior", 1, 0,
            json.dumps(CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1).to_dict()),
            json.dumps(Equipment().to_dict())
        )
        
        # Create render job
        layers = [
            {"asset": "base/warrior_m.png"},
            {"asset": "weapon/iron_sword.png"},
            {"asset": "armor/chain_mail.png"}
        ]
        
        render_id = await clean_db.fetch_one(
            """INSERT INTO render_jobs (character_id, layers, status) 
               VALUES ($1, $2, $3) RETURNING id""",
            char_id['id'], json.dumps(layers), "queued"
        )
        
        assert render_id['id'] is not None
        
        # Update render job
        await clean_db.execute(
            """UPDATE render_jobs SET status = $1, result_url = $2 WHERE id = $3""",
            "done", "https://example.com/sprite.png", render_id['id']
        )
        
        # Check render job
        render_job = await clean_db.fetch_one(
            "SELECT * FROM render_jobs WHERE id = $1",
            render_id['id']
        )
        
        assert render_job['status'] == "done"
        assert render_job['result_url'] == "https://example.com/sprite.png"
        assert len(json.loads(render_job['layers'])) == 3
    
    @pytest.mark.integration
    @pytest.mark.database
    async def test_foreign_key_constraints(self, clean_db):
        """Test foreign key constraints"""
        # Try to create character without user
        with pytest.raises(Exception):  # Should raise foreign key constraint error
            await clean_db.execute(
                """INSERT INTO characters (user_id, name, class, level, xp, stats, equipment) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7)""",
                "nonexistent_user", "TestHero", "Warrior", 1, 0,
                json.dumps(CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1).to_dict()),
                json.dumps(Equipment().to_dict())
            )
        
        # Try to create inventory item without character
        with pytest.raises(Exception):  # Should raise foreign key constraint error
            await clean_db.execute(
                "INSERT INTO inventory (character_id, item_id, qty) VALUES ($1, $2, $3)",
                "nonexistent_character", "itm_test", 1
            )
    
    @pytest.mark.integration
    @pytest.mark.database
    async def test_cascade_deletes(self, clean_db):
        """Test cascade delete operations"""
        # Create user
        user_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username) VALUES ($1, $2) RETURNING id",
            123456789, "testuser"
        )
        
        # Create character
        char_id = await clean_db.fetch_one(
            """INSERT INTO characters (user_id, name, class, level, xp, stats, equipment) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id""",
            user_id['id'], "TestHero", "Warrior", 1, 0,
            json.dumps(CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1).to_dict()),
            json.dumps(Equipment().to_dict())
        )
        
        # Create item
        await clean_db.execute(
            """INSERT INTO items (id, type, rarity, name, description, stats, price_gold, stackable, overlay_layer) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
            "itm_test_sword", "Weapon", "Rare", "Test Sword", "A test sword",
            json.dumps({"attack": 12}), 200, False, "weapon"
        )
        
        # Add item to inventory
        await clean_db.execute(
            "INSERT INTO inventory (character_id, item_id, qty) VALUES ($1, $2, $3)",
            char_id['id'], "itm_test_sword", 1
        )
        
        # Delete user (should cascade to character and inventory)
        await clean_db.execute("DELETE FROM users WHERE id = $1", user_id['id'])
        
        # Check that character was deleted
        character = await clean_db.fetch_one(
            "SELECT * FROM characters WHERE id = $1", char_id['id']
        )
        assert character is None
        
        # Check that inventory was deleted
        inventory = await clean_db.fetch_all(
            "SELECT * FROM inventory WHERE character_id = $1", char_id['id']
        )
        assert len(inventory) == 0
