"""
Web server for handling webhooks and API endpoints
"""

import asyncio
import json
import logging
from aiohttp import web, ClientSession
from aiohttp.web import Request, Response
from typing import Dict, Any, Optional
import hmac
import hashlib
from datetime import datetime

from config import Config
from database import db
from models import *
from game_logic import CombatSystem, LevelingSystem, LootSystem, QuestSystem
from image_generator import sprite_generator, card_generator

logger = logging.getLogger(__name__)

class WebServer:
    def __init__(self):
        self.app = web.Application()
        self.setup_routes()
    
    def setup_routes(self):
        """Setup API routes"""
        # Health check
        self.app.router.add_get('/health', self.health_check)
        
        # Webhook endpoints
        self.app.router.add_post('/webhook/telegram/payments', self.telegram_payment_webhook)
        self.app.router.add_post('/webhook/render/completed', self.render_completed_webhook)
        
        # API endpoints
        self.app.router.add_get('/api/v1/me', self.get_user_info)
        self.app.router.add_get('/api/v1/characters', self.get_characters)
        self.app.router.add_post('/api/v1/characters', self.create_character)
        self.app.router.add_get('/api/v1/characters/{character_id}', self.get_character)
        self.app.router.add_get('/api/v1/characters/{character_id}/inventory', self.get_inventory)
        self.app.router.add_post('/api/v1/characters/{character_id}/equipment/equip', self.equip_item)
        self.app.router.add_post('/api/v1/characters/{character_id}/equipment/unequip', self.unequip_item)
        self.app.router.add_get('/api/v1/characters/{character_id}/quests', self.get_quests)
        self.app.router.add_post('/api/v1/characters/{character_id}/quests/{quest_id}/accept', self.accept_quest)
        self.app.router.add_post('/api/v1/pve/battles', self.start_pve_battle)
        self.app.router.add_post('/api/v1/pve/battles/{battle_id}/turns', self.take_pve_turn)
        self.app.router.add_get('/api/v1/items', self.get_items)
        self.app.router.add_post('/api/v1/shop/buy/gold', self.buy_with_gold)
        self.app.router.add_post('/api/v1/payments/intents', self.create_payment_intent)
        self.app.router.add_post('/api/v1/render/characters/{character_id}', self.request_render)
    
    async def health_check(self, request: Request) -> Response:
        """Health check endpoint"""
        return web.json_response({"status": "healthy", "timestamp": datetime.now().isoformat()})
    
    async def telegram_payment_webhook(self, request: Request) -> Response:
        """Handle Telegram payment webhooks"""
        try:
            data = await request.json()
            
            # Verify webhook signature (in production)
            # signature = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
            # if not self.verify_webhook_signature(data, signature):
            #     return web.json_response({"error": "Invalid signature"}, status=401)
            
            event_type = data.get('event')
            payment_intent_id = data.get('payment_intent_id')
            
            if event_type == 'payment.succeeded':
                # Update payment status
                await db.execute(
                    "UPDATE payment_intents SET status = 'succeeded' WHERE id = $1",
                    payment_intent_id
                )
                
                # Grant gems to user
                payment_data = await db.fetch_one(
                    "SELECT * FROM payment_intents WHERE id = $1", payment_intent_id
                )
                
                if payment_data:
                    # Find product and grant gems
                    product_id = payment_data['product']
                    gems_to_grant = self.get_gems_from_product(product_id)
                    
                    if gems_to_grant:
                        await db.execute(
                            "UPDATE users SET gems = gems + $1 WHERE id = $2",
                            gems_to_grant, payment_data['user_id']
                        )
                        
                        logger.info(f"Granted {gems_to_grant} gems to user {payment_data['user_id']}")
            
            return web.json_response({"ok": True})
            
        except Exception as e:
            logger.error(f"Payment webhook error: {e}")
            return web.json_response({"error": "Internal server error"}, status=500)
    
    async def render_completed_webhook(self, request: Request) -> Response:
        """Handle render completion webhooks"""
        try:
            data = await request.json()
            
            character_id = data.get('character_id')
            render_job_id = data.get('render_job_id')
            sprite_url = data.get('sprite_url')
            
            # Update character sprite URL
            await db.execute(
                "UPDATE characters SET sprite_url = $1 WHERE id = $2",
                sprite_url, character_id
            )
            
            # Update render job status
            await db.execute(
                "UPDATE render_jobs SET status = 'done', result_url = $1 WHERE id = $2",
                sprite_url, render_job_id
            )
            
            logger.info(f"Render completed for character {character_id}")
            return web.json_response({"ok": True})
            
        except Exception as e:
            logger.error(f"Render webhook error: {e}")
            return web.json_response({"error": "Internal server error"}, status=500)
    
    async def get_user_info(self, request: Request) -> Response:
        """Get user information"""
        try:
            # In production, this would verify JWT token
            telegram_id = int(request.headers.get('X-Telegram-User-ID', 0))
            
            if not telegram_id:
                return web.json_response({"error": "Unauthorized"}, status=401)
            
            user_data = await db.fetch_one(
                "SELECT * FROM users WHERE telegram_id = $1", telegram_id
            )
            
            if not user_data:
                return web.json_response({"error": "User not found"}, status=404)
            
            characters = await db.fetch_all(
                "SELECT * FROM characters WHERE user_id = $1", user_data['id']
            )
            
            return web.json_response({
                "user": {
                    "id": user_data['id'],
                    "telegram_id": user_data['telegram_id'],
                    "username": user_data['username'],
                    "gold": user_data['gold'],
                    "gems": user_data['gems']
                },
                "characters": [dict(char) for char in characters]
            })
            
        except Exception as e:
            logger.error(f"Get user info error: {e}")
            return web.json_response({"error": "Internal server error"}, status=500)
    
    async def get_characters(self, request: Request) -> Response:
        """Get user's characters"""
        try:
            telegram_id = int(request.headers.get('X-Telegram-User-ID', 0))
            
            if not telegram_id:
                return web.json_response({"error": "Unauthorized"}, status=401)
            
            user_data = await db.fetch_one(
                "SELECT * FROM users WHERE telegram_id = $1", telegram_id
            )
            
            if not user_data:
                return web.json_response({"error": "User not found"}, status=404)
            
            characters = await db.fetch_all(
                "SELECT * FROM characters WHERE user_id = $1 ORDER BY created_at",
                user_data['id']
            )
            
            return web.json_response({
                "characters": [dict(char) for char in characters]
            })
            
        except Exception as e:
            logger.error(f"Get characters error: {e}")
            return web.json_response({"error": "Internal server error"}, status=500)
    
    async def create_character(self, request: Request) -> Response:
        """Create a new character"""
        try:
            telegram_id = int(request.headers.get('X-Telegram-User-ID', 0))
            
            if not telegram_id:
                return web.json_response({"error": "Unauthorized"}, status=401)
            
            data = await request.json()
            name = data.get('name')
            character_class = data.get('class')
            
            if not name or not character_class:
                return web.json_response({"error": "Name and class required"}, status=400)
            
            # Get or create user
            user_data = await db.fetch_one(
                "SELECT * FROM users WHERE telegram_id = $1", telegram_id
            )
            
            if not user_data:
                return web.json_response({"error": "User not found"}, status=404)
            
            # Check character limit
            existing_chars = await db.fetch_all(
                "SELECT * FROM characters WHERE user_id = $1", user_data['id']
            )
            
            if len(existing_chars) >= Config.MAX_CHARACTERS_PER_USER:
                return web.json_response({"error": "Character limit reached"}, status=400)
            
            # Create character
            stats = CharacterStats.create_base_stats(CharacterClass(character_class))
            equipment = Equipment()
            
            char_id = await db.fetch_one(
                """INSERT INTO characters (user_id, name, class, stats, equipment) 
                   VALUES ($1, $2, $3, $4, $5) RETURNING id""",
                user_data['id'], name, character_class, 
                json.dumps(stats.to_dict()), json.dumps(equipment.to_dict())
            )
            
            # Generate sprite
            character = Character(
                id=char_id['id'],
                user_id=user_data['id'],
                name=name,
                character_class=CharacterClass(character_class),
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
            
            return web.json_response({
                "character": character.to_dict()
            }, status=201)
            
        except Exception as e:
            logger.error(f"Create character error: {e}")
            return web.json_response({"error": "Internal server error"}, status=500)
    
    async def get_character(self, request: Request) -> Response:
        """Get character by ID"""
        try:
            character_id = request.match_info['character_id']
            
            char_data = await db.fetch_one(
                "SELECT * FROM characters WHERE id = $1", character_id
            )
            
            if not char_data:
                return web.json_response({"error": "Character not found"}, status=404)
            
            return web.json_response({"character": dict(char_data)})
            
        except Exception as e:
            logger.error(f"Get character error: {e}")
            return web.json_response({"error": "Internal server error"}, status=500)
    
    async def get_inventory(self, request: Request) -> Response:
        """Get character inventory"""
        try:
            character_id = request.match_info['character_id']
            
            inventory_data = await db.fetch_all(
                """SELECT i.*, inv.qty, inv.is_equipped 
                   FROM inventory inv 
                   JOIN items i ON inv.item_id = i.id 
                   WHERE inv.character_id = $1""",
                character_id
            )
            
            return web.json_response({
                "items": [dict(item) for item in inventory_data]
            })
            
        except Exception as e:
            logger.error(f"Get inventory error: {e}")
            return web.json_response({"error": "Internal server error"}, status=500)
    
    async def equip_item(self, request: Request) -> Response:
        """Equip an item"""
        try:
            character_id = request.match_info['character_id']
            data = await request.json()
            
            inventory_item_id = data.get('inventory_item_id')
            slot = data.get('slot')
            
            if not inventory_item_id or not slot:
                return web.json_response({"error": "Missing required fields"}, status=400)
            
            # Get inventory item
            inv_item = await db.fetch_one(
                "SELECT * FROM inventory WHERE id = $1 AND character_id = $2",
                inventory_item_id, character_id
            )
            
            if not inv_item:
                return web.json_response({"error": "Item not found"}, status=404)
            
            # Get item details
            item_data = await db.fetch_one(
                "SELECT * FROM items WHERE id = $1", inv_item['item_id']
            )
            
            if not item_data:
                return web.json_response({"error": "Item data not found"}, status=404)
            
            # Update equipment
            char_data = await db.fetch_one(
                "SELECT * FROM characters WHERE id = $1", character_id
            )
            
            equipment = Equipment.from_dict(char_data['equipment'])
            setattr(equipment, slot, inv_item['item_id'])
            
            # Update character
            await db.execute(
                "UPDATE characters SET equipment = $1 WHERE id = $2",
                json.dumps(equipment.to_dict()), character_id
            )
            
            # Update inventory
            await db.execute(
                "UPDATE inventory SET is_equipped = true WHERE id = $1",
                inventory_item_id
            )
            
            # Request render
            render_job_id = await db.fetch_one(
                """INSERT INTO render_jobs (character_id, layers, status) 
                   VALUES ($1, $2, 'queued') RETURNING id""",
                character_id, json.dumps([{"asset": f"{slot}/{item_data['id']}.png"}])
            )
            
            return web.json_response({
                "character": dict(char_data),
                "render_job": {
                    "id": render_job_id['id'],
                    "status": "queued"
                }
            })
            
        except Exception as e:
            logger.error(f"Equip item error: {e}")
            return web.json_response({"error": "Internal server error"}, status=500)
    
    async def unequip_item(self, request: Request) -> Response:
        """Unequip an item"""
        try:
            character_id = request.match_info['character_id']
            data = await request.json()
            
            slot = data.get('slot')
            if not slot:
                return web.json_response({"error": "Slot required"}, status=400)
            
            # Get character
            char_data = await db.fetch_one(
                "SELECT * FROM characters WHERE id = $1", character_id
            )
            
            if not char_data:
                return web.json_response({"error": "Character not found"}, status=404)
            
            # Update equipment
            equipment = Equipment.from_dict(char_data['equipment'])
            setattr(equipment, slot, None)
            
            # Update character
            await db.execute(
                "UPDATE characters SET equipment = $1 WHERE id = $2",
                json.dumps(equipment.to_dict()), character_id
            )
            
            # Update inventory
            await db.execute(
                """UPDATE inventory SET is_equipped = false 
                   WHERE character_id = $1 AND item_id = $2""",
                character_id, getattr(equipment, slot)
            )
            
            return web.json_response({"character": dict(char_data)})
            
        except Exception as e:
            logger.error(f"Unequip item error: {e}")
            return web.json_response({"error": "Internal server error"}, status=500)
    
    async def get_quests(self, request: Request) -> Response:
        """Get character quests"""
        try:
            character_id = request.match_info['character_id']
            status = request.query.get('status', 'available')
            
            if status == 'available':
                # Get available quests for character level
                char_data = await db.fetch_one(
                    "SELECT level FROM characters WHERE id = $1", character_id
                )
                
                if not char_data:
                    return web.json_response({"error": "Character not found"}, status=404)
                
                available_quests = QuestSystem.get_available_quests(char_data['level'])
                
                return web.json_response({"quests": available_quests})
            else:
                # Get character's quests
                quests_data = await db.fetch_all(
                    """SELECT q.*, cq.status, cq.progress 
                       FROM character_quests cq 
                       JOIN quests q ON cq.quest_id = q.id 
                       WHERE cq.character_id = $1 AND cq.status = $2""",
                    character_id, status
                )
                
                return web.json_response({"quests": [dict(q) for q in quests_data]})
            
        except Exception as e:
            logger.error(f"Get quests error: {e}")
            return web.json_response({"error": "Internal server error"}, status=500)
    
    async def accept_quest(self, request: Request) -> Response:
        """Accept a quest"""
        try:
            character_id = request.match_info['character_id']
            quest_id = request.match_info['quest_id']
            
            # Check if already accepted
            existing = await db.fetch_one(
                "SELECT * FROM character_quests WHERE character_id = $1 AND quest_id = $2",
                character_id, quest_id
            )
            
            if existing:
                return web.json_response({"error": "Quest already accepted"}, status=400)
            
            # Accept quest
            await db.execute(
                """INSERT INTO character_quests (character_id, quest_id, status, progress) 
                   VALUES ($1, $2, 'in_progress', '{}')""",
                character_id, quest_id
            )
            
            return web.json_response({"message": "Quest accepted"})
            
        except Exception as e:
            logger.error(f"Accept quest error: {e}")
            return web.json_response({"error": "Internal server error"}, status=500)
    
    async def start_pve_battle(self, request: Request) -> Response:
        """Start a PvE battle"""
        try:
            data = await request.json()
            character_id = data.get('character_id')
            enemy_type = data.get('enemy_type', 'Goblin')
            enemy_level = data.get('enemy_level', 1)
            
            if not character_id:
                return web.json_response({"error": "Character ID required"}, status=400)
            
            # Create enemy
            from game_data import get_enemy_stats
            enemy = get_enemy_stats(enemy_type, enemy_level)
            
            # Create battle
            battle_id = await db.fetch_one(
                """INSERT INTO pve_battles (character_id, enemy, state) 
                   VALUES ($1, $2, $3) RETURNING id""",
                character_id, json.dumps(enemy), json.dumps({
                    "turn": 1,
                    "character_hp": 100,  # Will be updated with actual character HP
                    "character_mp": 50,   # Will be updated with actual character MP
                    "enemy_hp": enemy["hp"],
                    "log": []
                })
            )
            
            return web.json_response({
                "battle": {
                    "id": battle_id['id'],
                    "character_id": character_id,
                    "enemy": enemy,
                    "state": {
                        "turn": 1,
                        "enemy_hp": enemy["hp"],
                        "log": []
                    }
                }
            }, status=201)
            
        except Exception as e:
            logger.error(f"Start PvE battle error: {e}")
            return web.json_response({"error": "Internal server error"}, status=500)
    
    async def take_pve_turn(self, request: Request) -> Response:
        """Take a turn in PvE battle"""
        try:
            battle_id = request.match_info['battle_id']
            data = await request.json()
            
            action = data.get('action')
            skill_id = data.get('skill_id')
            
            if not action:
                return web.json_response({"error": "Action required"}, status=400)
            
            # Get battle data
            battle_data = await db.fetch_one(
                "SELECT * FROM pve_battles WHERE id = $1", battle_id
            )
            
            if not battle_data:
                return web.json_response({"error": "Battle not found"}, status=404)
            
            # Get character
            char_data = await db.fetch_one(
                "SELECT * FROM characters WHERE id = $1", battle_data['character_id']
            )
            
            if not char_data:
                return web.json_response({"error": "Character not found"}, status=404)
            
            character = Character.from_dict(dict(char_data))
            enemy = battle_data['enemy']
            
            # Simulate turn
            turn_result = CombatSystem.simulate_turn(character, enemy, action, skill_id)
            
            if "error" in turn_result:
                return web.json_response({"error": turn_result["error"]}, status=400)
            
            # Update battle state
            battle_state = battle_data['state']
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
                character.id
            )
            
            response_data = {
                "battle": {
                    "id": battle_id,
                    "state": battle_state,
                    "result": turn_result.get('result')
                }
            }
            
            if turn_result['result']:
                # Battle ended
                await db.execute(
                    "UPDATE pve_battles SET result = $1, state = $2 WHERE id = $3",
                    turn_result['result'], json.dumps(battle_state), battle_id
                )
                
                if turn_result['result'] == 'win':
                    # Generate loot
                    loot = LootSystem.generate_loot(enemy['level'], enemy['name'])
                    response_data['loot'] = loot
            
            return web.json_response(response_data)
            
        except Exception as e:
            logger.error(f"Take PvE turn error: {e}")
            return web.json_response({"error": "Internal server error"}, status=500)
    
    async def get_items(self, request: Request) -> Response:
        """Get items catalog"""
        try:
            item_type = request.query.get('type')
            rarity = request.query.get('rarity')
            limit = int(request.query.get('limit', 20))
            
            query = "SELECT * FROM items WHERE 1=1"
            params = []
            param_count = 0
            
            if item_type:
                param_count += 1
                query += f" AND type = ${param_count}"
                params.append(item_type)
            
            if rarity:
                param_count += 1
                query += f" AND rarity = ${param_count}"
                params.append(rarity)
            
            query += f" LIMIT ${param_count + 1}"
            params.append(limit)
            
            items_data = await db.fetch_all(query, *params)
            
            return web.json_response({
                "items": [dict(item) for item in items_data]
            })
            
        except Exception as e:
            logger.error(f"Get items error: {e}")
            return web.json_response({"error": "Internal server error"}, status=500)
    
    async def buy_with_gold(self, request: Request) -> Response:
        """Buy item with gold"""
        try:
            data = await request.json()
            character_id = data.get('character_id')
            item_id = data.get('item_id')
            qty = data.get('qty', 1)
            
            if not character_id or not item_id:
                return web.json_response({"error": "Character ID and item ID required"}, status=400)
            
            # Get item data
            item_data = await db.fetch_one(
                "SELECT * FROM items WHERE id = $1", item_id
            )
            
            if not item_data:
                return web.json_response({"error": "Item not found"}, status=404)
            
            # Get character and user
            char_data = await db.fetch_one(
                "SELECT * FROM characters WHERE id = $1", character_id
            )
            
            if not char_data:
                return web.json_response({"error": "Character not found"}, status=404)
            
            user_data = await db.fetch_one(
                "SELECT * FROM users WHERE id = $1", char_data['user_id']
            )
            
            if not user_data:
                return web.json_response({"error": "User not found"}, status=404)
            
            # Check if user has enough gold
            total_cost = item_data['price_gold'] * qty
            
            if user_data['gold'] < total_cost:
                return web.json_response({"error": "Insufficient gold"}, status=400)
            
            # Deduct gold
            await db.execute(
                "UPDATE users SET gold = gold - $1 WHERE id = $2",
                total_cost, user_data['id']
            )
            
            # Add item to inventory
            inv_id = await db.fetch_one(
                """INSERT INTO inventory (character_id, item_id, qty) 
                   VALUES ($1, $2, $3) RETURNING id""",
                character_id, item_id, qty
            )
            
            return web.json_response({
                "gold_spent": total_cost,
                "inventory_item": {
                    "id": inv_id['id'],
                    "item_id": item_id,
                    "qty": qty
                }
            })
            
        except Exception as e:
            logger.error(f"Buy with gold error: {e}")
            return web.json_response({"error": "Internal server error"}, status=500)
    
    async def create_payment_intent(self, request: Request) -> Response:
        """Create payment intent for gems"""
        try:
            telegram_id = int(request.headers.get('X-Telegram-User-ID', 0))
            
            if not telegram_id:
                return web.json_response({"error": "Unauthorized"}, status=401)
            
            data = await request.json()
            product = data.get('product')
            currency = data.get('currency', 'USD')
            
            if not product:
                return web.json_response({"error": "Product required"}, status=400)
            
            # Get user
            user_data = await db.fetch_one(
                "SELECT * FROM users WHERE telegram_id = $1", telegram_id
            )
            
            if not user_data:
                return web.json_response({"error": "User not found"}, status=404)
            
            # Get product details
            product_data = self.get_product_data(product)
            if not product_data:
                return web.json_response({"error": "Invalid product"}, status=400)
            
            # Create payment intent
            payment_id = await db.fetch_one(
                """INSERT INTO payment_intents (user_id, product, amount_minor, currency, status) 
                   VALUES ($1, $2, $3, $4, 'pending') RETURNING id""",
                user_data['id'], product, product_data['amount_minor'], currency
            )
            
            confirmation_url = f"https://t.me/YourBot?start=pay_{payment_id['id']}"
            
            await db.execute(
                "UPDATE payment_intents SET confirmation_url = $1 WHERE id = $2",
                confirmation_url, payment_id['id']
            )
            
            return web.json_response({
                "payment_intent": {
                    "id": payment_id['id'],
                    "status": "pending",
                    "confirmation_url": confirmation_url
                }
            }, status=201)
            
        except Exception as e:
            logger.error(f"Create payment intent error: {e}")
            return web.json_response({"error": "Internal server error"}, status=500)
    
    async def request_render(self, request: Request) -> Response:
        """Request character render"""
        try:
            character_id = request.match_info['character_id']
            
            # Get character
            char_data = await db.fetch_one(
                "SELECT * FROM characters WHERE id = $1", character_id
            )
            
            if not char_data:
                return web.json_response({"error": "Character not found"}, status=404)
            
            character = Character.from_dict(dict(char_data))
            
            # Generate sprite
            sprite_url = await sprite_generator.generate_character_sprite(character)
            
            # Create render job
            render_job_id = await db.fetch_one(
                """INSERT INTO render_jobs (character_id, layers, status, result_url) 
                   VALUES ($1, $2, 'done', $3) RETURNING id""",
                character_id, json.dumps([]), sprite_url
            )
            
            return web.json_response({
                "render_job": {
                    "id": render_job_id['id'],
                    "status": "done",
                    "result_url": sprite_url
                }
            }, status=201)
            
        except Exception as e:
            logger.error(f"Request render error: {e}")
            return web.json_response({"error": "Internal server error"}, status=500)
    
    def get_gems_from_product(self, product_id: str) -> Optional[int]:
        """Get gems amount from product ID"""
        from game_data import PAYMENT_PRODUCTS
        
        for product in PAYMENT_PRODUCTS:
            if product['id'] == product_id:
                return product['gems']
        return None
    
    def get_product_data(self, product_id: str) -> Optional[Dict[str, Any]]:
        """Get product data by ID"""
        from game_data import PAYMENT_PRODUCTS
        
        for product in PAYMENT_PRODUCTS:
            if product['id'] == product_id:
                return product
        return None
    
    def verify_webhook_signature(self, data: Dict[str, Any], signature: str) -> bool:
        """Verify webhook signature"""
        if not signature:
            return False
        
        # In production, implement proper signature verification
        # using HMAC with the webhook secret
        return True

async def init_game_data():
    """Initialize game data in database"""
    from game_data import BASE_ITEMS, QUEST_DATA
    
    # Insert items
    for item in BASE_ITEMS:
        await db.execute(
            """INSERT INTO items (id, type, rarity, name, description, stats, price_gold, price_gems, stackable, overlay_layer) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
               ON CONFLICT (id) DO NOTHING""",
            item['id'], item['type'], item['rarity'], item['name'], item['description'],
            json.dumps(item['stats']), item['price_gold'], item['price_gems'],
            item['stackable'], item['overlay_layer']
        )
    
    # Insert quests
    for quest in QUEST_DATA:
        await db.execute(
            """INSERT INTO quests (id, type, level_req, title, description, objective, rewards) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) 
               ON CONFLICT (id) DO NOTHING""",
            quest['id'], quest['type'], quest['level_req'], quest['title'],
            quest['description'], json.dumps(quest['objective']), json.dumps(quest['rewards'])
        )
    
    logger.info("Game data initialized")

async def main():
    """Main function to start web server"""
    # Initialize database
    await db.connect()
    await db.init_tables()
    await init_game_data()
    
    # Create web server
    server = WebServer()
    
    # Start server
    runner = web.AppRunner(server.app)
    await runner.setup()
    
    site = web.TCPSite(runner, '0.0.0.0', 8080)
    await site.start()
    
    logger.info("Web server started on port 8080")
    
    # Keep running
    try:
        await asyncio.Future()
    except KeyboardInterrupt:
        logger.info("Shutting down web server...")
        await runner.cleanup()

if __name__ == "__main__":
    asyncio.run(main())
