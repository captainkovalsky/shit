"""
Tests for web server API endpoints
"""

import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch
from aiohttp import web, ClientSession
from aiohttp.test_utils import make_mocked_request
from datetime import datetime

from web_server import WebServer
from models import CharacterStats, Equipment, CharacterClass

class TestWebServer:
    """Test WebServer class"""
    
    @pytest.fixture
    def web_server(self):
        """Create web server instance"""
        return WebServer()
    
    @pytest.fixture
    def mock_request(self):
        """Create mock request"""
        return make_mocked_request('GET', '/test')
    
    @pytest.mark.api
    async def test_health_check(self, web_server, mock_request):
        """Test health check endpoint"""
        response = await web_server.health_check(mock_request)
        
        assert response.status == 200
        data = json.loads(response.text)
        assert data['status'] == 'healthy'
        assert 'timestamp' in data
    
    @pytest.mark.api
    async def test_telegram_payment_webhook_success(self, web_server, clean_db):
        """Test Telegram payment webhook success"""
        # Create user
        user_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username) VALUES ($1, $2) RETURNING id",
            123456789, "testuser"
        )
        
        # Create payment intent
        payment_id = await clean_db.fetch_one(
            """INSERT INTO payment_intents (user_id, product, amount_minor, currency, status) 
               VALUES ($1, $2, $3, $4, $5) RETURNING id""",
            user_id['id'], "gems_pack_100", 299, "USD", "pending"
        )
        
        webhook_data = {
            "event": "payment.succeeded",
            "payment_intent_id": payment_id['id'],
            "provider": "telegram",
            "amount_minor": 299,
            "currency": "USD",
            "user": {"telegram_id": 123456789}
        }
        
        request = make_mocked_request('POST', '/webhook/telegram/payments', json=webhook_data)
        
        with patch('web_server.db.fetch_one') as mock_fetch:
            mock_fetch.return_value = payment_id
            
            with patch('web_server.db.execute') as mock_execute:
                response = await web_server.telegram_payment_webhook(request)
                
                assert response.status == 200
                data = json.loads(response.text)
                assert data['ok'] is True
    
    @pytest.mark.api
    async def test_get_user_info_success(self, web_server, clean_db):
        """Test get user info endpoint success"""
        # Create user
        user_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username, gold, gems) VALUES ($1, $2, $3, $4) RETURNING id",
            123456789, "testuser", 1000, 50
        )
        
        # Create character
        await clean_db.execute(
            """INSERT INTO characters (user_id, name, class, level, xp, stats, equipment) 
               VALUES ($1, $2, $3, $4, $5, $6, $7)""",
            user_id['id'], "TestHero", "Warrior", 1, 0,
            json.dumps(CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1).to_dict()),
            json.dumps(Equipment().to_dict())
        )
        
        request = make_mocked_request('GET', '/api/v1/me')
        request.headers = {'X-Telegram-User-ID': '123456789'}
        
        response = await web_server.get_user_info(request)
        
        assert response.status == 200
        data = json.loads(response.text)
        assert 'user' in data
        assert 'characters' in data
        assert data['user']['telegram_id'] == 123456789
        assert data['user']['gold'] == 1000
        assert data['user']['gems'] == 50
        assert len(data['characters']) == 1
        assert data['characters'][0]['name'] == "TestHero"
    
    @pytest.mark.api
    async def test_get_user_info_unauthorized(self, web_server):
        """Test get user info endpoint unauthorized"""
        request = make_mocked_request('GET', '/api/v1/me')
        request.headers = {}
        
        response = await web_server.get_user_info(request)
        
        assert response.status == 401
        data = json.loads(response.text)
        assert 'error' in data
        assert data['error'] == 'Unauthorized'
    
    @pytest.mark.api
    async def test_get_user_info_not_found(self, web_server):
        """Test get user info endpoint user not found"""
        request = make_mocked_request('GET', '/api/v1/me')
        request.headers = {'X-Telegram-User-ID': '999999999'}
        
        response = await web_server.get_user_info(request)
        
        assert response.status == 404
        data = json.loads(response.text)
        assert 'error' in data
        assert data['error'] == 'User not found'
    
    @pytest.mark.api
    async def test_get_characters_success(self, web_server, clean_db):
        """Test get characters endpoint success"""
        # Create user
        user_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username) VALUES ($1, $2) RETURNING id",
            123456789, "testuser"
        )
        
        # Create characters
        await clean_db.execute(
            """INSERT INTO characters (user_id, name, class, level, xp, stats, equipment) 
               VALUES ($1, $2, $3, $4, $5, $6, $7)""",
            user_id['id'], "Hero1", "Warrior", 1, 0,
            json.dumps(CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1).to_dict()),
            json.dumps(Equipment().to_dict())
        )
        
        await clean_db.execute(
            """INSERT INTO characters (user_id, name, class, level, xp, stats, equipment) 
               VALUES ($1, $2, $3, $4, $5, $6, $7)""",
            user_id['id'], "Hero2", "Mage", 2, 100,
            json.dumps(CharacterStats.create_base_stats(CharacterClass.MAGE, 2).to_dict()),
            json.dumps(Equipment().to_dict())
        )
        
        request = make_mocked_request('GET', '/api/v1/characters')
        request.headers = {'X-Telegram-User-ID': '123456789'}
        
        response = await web_server.get_characters(request)
        
        assert response.status == 200
        data = json.loads(response.text)
        assert 'characters' in data
        assert len(data['characters']) == 2
        assert data['characters'][0]['name'] == "Hero1"
        assert data['characters'][1]['name'] == "Hero2"
    
    @pytest.mark.api
    async def test_create_character_success(self, web_server, clean_db):
        """Test create character endpoint success"""
        # Create user
        user_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username) VALUES ($1, $2) RETURNING id",
            123456789, "testuser"
        )
        
        character_data = {
            "name": "NewHero",
            "class": "Rogue"
        }
        
        request = make_mocked_request('POST', '/api/v1/characters', json=character_data)
        request.headers = {'X-Telegram-User-ID': '123456789'}
        
        with patch('web_server.sprite_generator.generate_character_sprite') as mock_sprite:
            mock_sprite.return_value = "https://example.com/sprite.png"
            
            response = await web_server.create_character(request)
            
            assert response.status == 201
            data = json.loads(response.text)
            assert 'character' in data
            assert data['character']['name'] == "NewHero"
            assert data['character']['class'] == "Rogue"
            assert data['character']['level'] == 1
            assert data['character']['xp'] == 0
    
    @pytest.mark.api
    async def test_create_character_missing_fields(self, web_server):
        """Test create character endpoint missing fields"""
        character_data = {
            "name": "NewHero"
            # Missing class
        }
        
        request = make_mocked_request('POST', '/api/v1/characters', json=character_data)
        request.headers = {'X-Telegram-User-ID': '123456789'}
        
        response = await web_server.create_character(request)
        
        assert response.status == 400
        data = json.loads(response.text)
        assert 'error' in data
        assert 'required' in data['error']
    
    @pytest.mark.api
    async def test_create_character_limit_reached(self, web_server, clean_db):
        """Test create character endpoint character limit reached"""
        # Create user
        user_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username) VALUES ($1, $2) RETURNING id",
            123456789, "testuser"
        )
        
        # Create max characters
        for i in range(3):
            await clean_db.execute(
                """INSERT INTO characters (user_id, name, class, level, xp, stats, equipment) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7)""",
                user_id['id'], f"Hero{i}", "Warrior", 1, 0,
                json.dumps(CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1).to_dict()),
                json.dumps(Equipment().to_dict())
            )
        
        character_data = {
            "name": "NewHero",
            "class": "Rogue"
        }
        
        request = make_mocked_request('POST', '/api/v1/characters', json=character_data)
        request.headers = {'X-Telegram-User-ID': '123456789'}
        
        response = await web_server.create_character(request)
        
        assert response.status == 400
        data = json.loads(response.text)
        assert 'error' in data
        assert 'limit' in data['error']
    
    @pytest.mark.api
    async def test_get_character_success(self, web_server, clean_db):
        """Test get character endpoint success"""
        # Create user
        user_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username) VALUES ($1, $2) RETURNING id",
            123456789, "testuser"
        )
        
        # Create character
        char_id = await clean_db.fetch_one(
            """INSERT INTO characters (user_id, name, class, level, xp, stats, equipment) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id""",
            user_id['id'], "TestHero", "Warrior", 5, 500,
            json.dumps(CharacterStats.create_base_stats(CharacterClass.WARRIOR, 5).to_dict()),
            json.dumps(Equipment().to_dict())
        )
        
        request = make_mocked_request('GET', f'/api/v1/characters/{char_id["id"]}')
        
        response = await web_server.get_character(request)
        
        assert response.status == 200
        data = json.loads(response.text)
        assert 'character' in data
        assert data['character']['name'] == "TestHero"
        assert data['character']['class'] == "Warrior"
        assert data['character']['level'] == 5
        assert data['character']['xp'] == 500
    
    @pytest.mark.api
    async def test_get_character_not_found(self, web_server):
        """Test get character endpoint character not found"""
        request = make_mocked_request('GET', '/api/v1/characters/nonexistent')
        
        response = await web_server.get_character(request)
        
        assert response.status == 404
        data = json.loads(response.text)
        assert 'error' in data
        assert data['error'] == 'Character not found'
    
    @pytest.mark.api
    async def test_get_inventory_success(self, web_server, clean_db):
        """Test get inventory endpoint success"""
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
        await clean_db.execute(
            "INSERT INTO inventory (character_id, item_id, qty, is_equipped) VALUES ($1, $2, $3, $4)",
            char_id['id'], "itm_test_sword", 1, False
        )
        
        request = make_mocked_request('GET', f'/api/v1/characters/{char_id["id"]}/inventory')
        
        response = await web_server.get_inventory(request)
        
        assert response.status == 200
        data = json.loads(response.text)
        assert 'items' in data
        assert len(data['items']) == 1
        assert data['items'][0]['name'] == "Test Sword"
        assert data['items'][0]['qty'] == 1
        assert data['items'][0]['is_equipped'] is False
    
    @pytest.mark.api
    async def test_equip_item_success(self, web_server, clean_db):
        """Test equip item endpoint success"""
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
        
        equip_data = {
            "inventory_item_id": inv_id['id'],
            "slot": "weapon"
        }
        
        request = make_mocked_request('POST', f'/api/v1/characters/{char_id["id"]}/equipment/equip', json=equip_data)
        
        response = await web_server.equip_item(request)
        
        assert response.status == 200
        data = json.loads(response.text)
        assert 'character' in data
        assert 'render_job' in data
        assert data['render_job']['status'] == 'queued'
    
    @pytest.mark.api
    async def test_equip_item_missing_fields(self, web_server):
        """Test equip item endpoint missing fields"""
        equip_data = {
            "inventory_item_id": "inv_test"
            # Missing slot
        }
        
        request = make_mocked_request('POST', '/api/v1/characters/ch_test/equipment/equip', json=equip_data)
        
        response = await web_server.equip_item(request)
        
        assert response.status == 400
        data = json.loads(response.text)
        assert 'error' in data
        assert 'Missing required fields' in data['error']
    
    @pytest.mark.api
    async def test_unequip_item_success(self, web_server, clean_db):
        """Test unequip item endpoint success"""
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
        
        unequip_data = {
            "slot": "weapon"
        }
        
        request = make_mocked_request('POST', f'/api/v1/characters/{char_id["id"]}/equipment/unequip', json=unequip_data)
        
        response = await web_server.unequip_item(request)
        
        assert response.status == 200
        data = json.loads(response.text)
        assert 'character' in data
    
    @pytest.mark.api
    async def test_start_pve_battle_success(self, web_server, clean_db):
        """Test start PvE battle endpoint success"""
        battle_data = {
            "character_id": "ch_test",
            "enemy_type": "Goblin",
            "enemy_level": 3
        }
        
        request = make_mocked_request('POST', '/api/v1/pve/battles', json=battle_data)
        
        with patch('web_server.get_enemy_stats') as mock_enemy:
            mock_enemy.return_value = {
                "name": "Goblin",
                "level": 3,
                "hp": 80,
                "attack": 12,
                "defense": 4
            }
            
            response = await web_server.start_pve_battle(request)
            
            assert response.status == 201
            data = json.loads(response.text)
            assert 'battle' in data
            assert data['battle']['character_id'] == "ch_test"
            assert data['battle']['enemy']['name'] == "Goblin"
            assert data['battle']['enemy']['level'] == 3
    
    @pytest.mark.api
    async def test_start_pve_battle_missing_character_id(self, web_server):
        """Test start PvE battle endpoint missing character ID"""
        battle_data = {
            "enemy_type": "Goblin",
            "enemy_level": 3
            # Missing character_id
        }
        
        request = make_mocked_request('POST', '/api/v1/pve/battles', json=battle_data)
        
        response = await web_server.start_pve_battle(request)
        
        assert response.status == 400
        data = json.loads(response.text)
        assert 'error' in data
        assert 'Character ID required' in data['error']
    
    @pytest.mark.api
    async def test_take_pve_turn_success(self, web_server, clean_db):
        """Test take PvE turn endpoint success"""
        # Create battle
        battle_id = await clean_db.fetch_one(
            """INSERT INTO pve_battles (character_id, enemy, state) 
               VALUES ($1, $2, $3) RETURNING id""",
            "ch_test", json.dumps({"name": "Goblin", "level": 1, "hp": 50, "attack": 8, "defense": 2}),
            json.dumps({"turn": 1, "character_hp": 100, "character_mp": 50, "enemy_hp": 50, "log": []})
        )
        
        turn_data = {
            "action": "attack"
        }
        
        request = make_mocked_request('POST', f'/api/v1/pve/battles/{battle_id["id"]}/turns', json=turn_data)
        
        with patch('web_server.get_character') as mock_get_char:
            mock_character = MagicMock()
            mock_character.id = "ch_test"
            mock_character.stats.hp = 100
            mock_character.stats.mp = 50
            mock_get_char.return_value = mock_character
            
            with patch('web_server.CombatSystem.simulate_turn') as mock_simulate:
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
                
                response = await web_server.take_pve_turn(request)
                
                assert response.status == 200
                data = json.loads(response.text)
                assert 'battle' in data
                assert data['battle']['state']['character_hp'] == 90
                assert data['battle']['state']['enemy_hp'] == 30
    
    @pytest.mark.api
    async def test_take_pve_turn_missing_action(self, web_server):
        """Test take PvE turn endpoint missing action"""
        turn_data = {
            # Missing action
        }
        
        request = make_mocked_request('POST', '/api/v1/pve/battles/battle_test/turns', json=turn_data)
        
        response = await web_server.take_pve_turn(request)
        
        assert response.status == 400
        data = json.loads(response.text)
        assert 'error' in data
        assert 'Action required' in data['error']
    
    @pytest.mark.api
    async def test_get_items_success(self, web_server, clean_db):
        """Test get items endpoint success"""
        # Create items
        await clean_db.execute(
            """INSERT INTO items (id, type, rarity, name, description, stats, price_gold, stackable, overlay_layer) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
            "itm_sword1", "Weapon", "Common", "Iron Sword", "A basic sword",
            json.dumps({"attack": 10}), 100, False, "weapon"
        )
        
        await clean_db.execute(
            """INSERT INTO items (id, type, rarity, name, description, stats, price_gold, stackable, overlay_layer) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
            "itm_armor1", "Armor", "Rare", "Chain Mail", "Protective armor",
            json.dumps({"defense": 8}), 300, False, "armor"
        )
        
        request = make_mocked_request('GET', '/api/v1/items')
        
        response = await web_server.get_items(request)
        
        assert response.status == 200
        data = json.loads(response.text)
        assert 'items' in data
        assert len(data['items']) == 2
    
    @pytest.mark.api
    async def test_get_items_with_filters(self, web_server, clean_db):
        """Test get items endpoint with filters"""
        # Create items
        await clean_db.execute(
            """INSERT INTO items (id, type, rarity, name, description, stats, price_gold, stackable, overlay_layer) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
            "itm_sword1", "Weapon", "Common", "Iron Sword", "A basic sword",
            json.dumps({"attack": 10}), 100, False, "weapon"
        )
        
        await clean_db.execute(
            """INSERT INTO items (id, type, rarity, name, description, stats, price_gold, stackable, overlay_layer) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
            "itm_armor1", "Armor", "Rare", "Chain Mail", "Protective armor",
            json.dumps({"defense": 8}), 300, False, "armor"
        )
        
        request = make_mocked_request('GET', '/api/v1/items?type=Weapon&rarity=Common')
        
        response = await web_server.get_items(request)
        
        assert response.status == 200
        data = json.loads(response.text)
        assert 'items' in data
        assert len(data['items']) == 1
        assert data['items'][0]['type'] == "Weapon"
        assert data['items'][0]['rarity'] == "Common"
    
    @pytest.mark.api
    async def test_buy_with_gold_success(self, web_server, clean_db):
        """Test buy with gold endpoint success"""
        # Create user
        user_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username, gold) VALUES ($1, $2, $3) RETURNING id",
            123456789, "testuser", 1000
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
        
        buy_data = {
            "character_id": char_id['id'],
            "item_id": "itm_test_sword",
            "qty": 1
        }
        
        request = make_mocked_request('POST', '/api/v1/shop/buy/gold', json=buy_data)
        
        response = await web_server.buy_with_gold(request)
        
        assert response.status == 200
        data = json.loads(response.text)
        assert 'gold_spent' in data
        assert 'inventory_item' in data
        assert data['gold_spent'] == 200
        assert data['inventory_item']['item_id'] == "itm_test_sword"
        assert data['inventory_item']['qty'] == 1
    
    @pytest.mark.api
    async def test_buy_with_gold_insufficient_funds(self, web_server, clean_db):
        """Test buy with gold endpoint insufficient funds"""
        # Create user with low gold
        user_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username, gold) VALUES ($1, $2, $3) RETURNING id",
            123456789, "testuser", 50
        )
        
        # Create character
        char_id = await clean_db.fetch_one(
            """INSERT INTO characters (user_id, name, class, level, xp, stats, equipment) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id""",
            user_id['id'], "TestHero", "Warrior", 1, 0,
            json.dumps(CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1).to_dict()),
            json.dumps(Equipment().to_dict())
        )
        
        # Create expensive item
        await clean_db.execute(
            """INSERT INTO items (id, type, rarity, name, description, stats, price_gold, stackable, overlay_layer) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
            "itm_expensive_sword", "Weapon", "Legendary", "Expensive Sword", "A very expensive sword",
            json.dumps({"attack": 50}), 1000, False, "weapon"
        )
        
        buy_data = {
            "character_id": char_id['id'],
            "item_id": "itm_expensive_sword",
            "qty": 1
        }
        
        request = make_mocked_request('POST', '/api/v1/shop/buy/gold', json=buy_data)
        
        response = await web_server.buy_with_gold(request)
        
        assert response.status == 400
        data = json.loads(response.text)
        assert 'error' in data
        assert 'Insufficient gold' in data['error']
    
    @pytest.mark.api
    async def test_create_payment_intent_success(self, web_server, clean_db):
        """Test create payment intent endpoint success"""
        # Create user
        user_id = await clean_db.fetch_one(
            "INSERT INTO users (telegram_id, username) VALUES ($1, $2) RETURNING id",
            123456789, "testuser"
        )
        
        payment_data = {
            "product": "gems_pack_100",
            "currency": "USD"
        }
        
        request = make_mocked_request('POST', '/api/v1/payments/intents', json=payment_data)
        request.headers = {'X-Telegram-User-ID': '123456789'}
        
        response = await web_server.create_payment_intent(request)
        
        assert response.status == 201
        data = json.loads(response.text)
        assert 'payment_intent' in data
        assert data['payment_intent']['status'] == 'pending'
        assert 'confirmation_url' in data['payment_intent']
    
    @pytest.mark.api
    async def test_create_payment_intent_missing_product(self, web_server):
        """Test create payment intent endpoint missing product"""
        payment_data = {
            "currency": "USD"
            # Missing product
        }
        
        request = make_mocked_request('POST', '/api/v1/payments/intents', json=payment_data)
        request.headers = {'X-Telegram-User-ID': '123456789'}
        
        response = await web_server.create_payment_intent(request)
        
        assert response.status == 400
        data = json.loads(response.text)
        assert 'error' in data
        assert 'Product required' in data['error']
    
    @pytest.mark.api
    async def test_request_render_success(self, web_server, clean_db):
        """Test request render endpoint success"""
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
        
        request = make_mocked_request('POST', f'/api/v1/render/characters/{char_id["id"]}')
        
        with patch('web_server.sprite_generator.generate_character_sprite') as mock_sprite:
            mock_sprite.return_value = "https://example.com/sprite.png"
            
            response = await web_server.request_render(request)
            
            assert response.status == 201
            data = json.loads(response.text)
            assert 'render_job' in data
            assert data['render_job']['status'] == 'done'
            assert data['render_job']['result_url'] == "https://example.com/sprite.png"
    
    @pytest.mark.api
    async def test_request_render_character_not_found(self, web_server):
        """Test request render endpoint character not found"""
        request = make_mocked_request('POST', '/api/v1/render/characters/nonexistent')
        
        response = await web_server.request_render(request)
        
        assert response.status == 404
        data = json.loads(response.text)
        assert 'error' in data
        assert data['error'] == 'Character not found'
