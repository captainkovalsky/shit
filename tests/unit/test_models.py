"""
Unit tests for models module
"""

import pytest
from datetime import datetime
from models import (
    CharacterStats, CharacterClass, Equipment, User, Character, Item, ItemType, ItemRarity,
    InventoryItem, Quest, QuestType, QuestStatus, PvEBattle, PvPMatch, BattleStatus,
    CharacterRating, PaymentIntent, PaymentStatus, RenderJob, RenderStatus
)

class TestCharacterStats:
    """Test CharacterStats model"""
    
    @pytest.mark.unit
    def test_character_stats_creation(self):
        """Test creating CharacterStats instance"""
        stats = CharacterStats(
            hp=100, mp=50, attack=10, defense=5, speed=5.0,
            crit_chance=0.05, strength=8, agility=6, intelligence=4
        )
        
        assert stats.hp == 100
        assert stats.mp == 50
        assert stats.attack == 10
        assert stats.defense == 5
        assert stats.speed == 5.0
        assert stats.crit_chance == 0.05
        assert stats.strength == 8
        assert stats.agility == 6
        assert stats.intelligence == 4
    
    @pytest.mark.unit
    def test_character_stats_to_dict(self):
        """Test converting CharacterStats to dictionary"""
        stats = CharacterStats(
            hp=100, mp=50, attack=10, defense=5, speed=5.0,
            crit_chance=0.05, strength=8, agility=6, intelligence=4
        )
        
        stats_dict = stats.to_dict()
        
        assert isinstance(stats_dict, dict)
        assert stats_dict['hp'] == 100
        assert stats_dict['mp'] == 50
        assert stats_dict['attack'] == 10
        assert stats_dict['defense'] == 5
        assert stats_dict['speed'] == 5.0
        assert stats_dict['crit_chance'] == 0.05
        assert stats_dict['strength'] == 8
        assert stats_dict['agility'] == 6
        assert stats_dict['intelligence'] == 4
    
    @pytest.mark.unit
    def test_character_stats_from_dict(self):
        """Test creating CharacterStats from dictionary"""
        stats_dict = {
            'hp': 100, 'mp': 50, 'attack': 10, 'defense': 5, 'speed': 5.0,
            'crit_chance': 0.05, 'strength': 8, 'agility': 6, 'intelligence': 4
        }
        
        stats = CharacterStats.from_dict(stats_dict)
        
        assert stats.hp == 100
        assert stats.mp == 50
        assert stats.attack == 10
        assert stats.defense == 5
        assert stats.speed == 5.0
        assert stats.crit_chance == 0.05
        assert stats.strength == 8
        assert stats.agility == 6
        assert stats.intelligence == 4
    
    @pytest.mark.unit
    def test_create_base_stats_warrior(self):
        """Test creating base stats for Warrior class"""
        stats = CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1)
        
        assert stats.hp >= 100  # Base HP + Warrior bonus
        assert stats.mp >= 50
        assert stats.attack >= 10
        assert stats.defense >= 5
        assert stats.strength >= 8  # Warrior should have higher strength
        assert stats.agility >= 5
        assert stats.intelligence >= 3
    
    @pytest.mark.unit
    def test_create_base_stats_mage(self):
        """Test creating base stats for Mage class"""
        stats = CharacterStats.create_base_stats(CharacterClass.MAGE, 1)
        
        assert stats.hp >= 100
        assert stats.mp >= 50
        assert stats.attack >= 10
        assert stats.defense >= 5
        assert stats.strength >= 3  # Mage should have lower strength
        assert stats.agility >= 5
        assert stats.intelligence >= 8  # Mage should have higher intelligence
    
    @pytest.mark.unit
    def test_create_base_stats_rogue(self):
        """Test creating base stats for Rogue class"""
        stats = CharacterStats.create_base_stats(CharacterClass.ROGUE, 1)
        
        assert stats.hp >= 100
        assert stats.mp >= 50
        assert stats.attack >= 10
        assert stats.defense >= 5
        assert stats.strength >= 5
        assert stats.agility >= 8  # Rogue should have higher agility
        assert stats.intelligence >= 5
    
    @pytest.mark.unit
    def test_create_base_stats_level_scaling(self):
        """Test that base stats scale with level"""
        stats_level_1 = CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1)
        stats_level_5 = CharacterStats.create_base_stats(CharacterClass.WARRIOR, 5)
        
        assert stats_level_5.hp > stats_level_1.hp
        assert stats_level_5.mp > stats_level_1.mp
        assert stats_level_5.attack > stats_level_1.attack
        assert stats_level_5.defense > stats_level_1.defense
        assert stats_level_5.speed > stats_level_1.speed
        assert stats_level_5.crit_chance > stats_level_1.crit_chance

class TestEquipment:
    """Test Equipment model"""
    
    @pytest.mark.unit
    def test_equipment_creation(self):
        """Test creating Equipment instance"""
        equipment = Equipment(
            weapon="sword", helmet="helmet", armor="armor", 
            boots="boots", accessory="ring"
        )
        
        assert equipment.weapon == "sword"
        assert equipment.helmet == "helmet"
        assert equipment.armor == "armor"
        assert equipment.boots == "boots"
        assert equipment.accessory == "ring"
    
    @pytest.mark.unit
    def test_equipment_default_values(self):
        """Test Equipment with default values"""
        equipment = Equipment()
        
        assert equipment.weapon is None
        assert equipment.helmet is None
        assert equipment.armor is None
        assert equipment.boots is None
        assert equipment.accessory is None
    
    @pytest.mark.unit
    def test_equipment_to_dict(self):
        """Test converting Equipment to dictionary"""
        equipment = Equipment(
            weapon="sword", helmet="helmet", armor="armor", 
            boots="boots", accessory="ring"
        )
        
        equipment_dict = equipment.to_dict()
        
        assert isinstance(equipment_dict, dict)
        assert equipment_dict['weapon'] == "sword"
        assert equipment_dict['helmet'] == "helmet"
        assert equipment_dict['armor'] == "armor"
        assert equipment_dict['boots'] == "boots"
        assert equipment_dict['accessory'] == "ring"
    
    @pytest.mark.unit
    def test_equipment_from_dict(self):
        """Test creating Equipment from dictionary"""
        equipment_dict = {
            'weapon': 'sword', 'helmet': 'helmet', 'armor': 'armor',
            'boots': 'boots', 'accessory': 'ring'
        }
        
        equipment = Equipment.from_dict(equipment_dict)
        
        assert equipment.weapon == "sword"
        assert equipment.helmet == "helmet"
        assert equipment.armor == "armor"
        assert equipment.boots == "boots"
        assert equipment.accessory == "ring"

class TestUser:
    """Test User model"""
    
    @pytest.mark.unit
    def test_user_creation(self):
        """Test creating User instance"""
        user = User(
            id="usr_123",
            telegram_id=123456789,
            username="testuser",
            gold=1000,
            gems=50,
            created_at="2025-01-01T00:00:00Z",
            updated_at="2025-01-01T00:00:00Z"
        )
        
        assert user.id == "usr_123"
        assert user.telegram_id == 123456789
        assert user.username == "testuser"
        assert user.gold == 1000
        assert user.gems == 50
        assert user.created_at == "2025-01-01T00:00:00Z"
        assert user.updated_at == "2025-01-01T00:00:00Z"
    
    @pytest.mark.unit
    def test_user_to_dict(self):
        """Test converting User to dictionary"""
        user = User(
            id="usr_123",
            telegram_id=123456789,
            username="testuser",
            gold=1000,
            gems=50,
            created_at="2025-01-01T00:00:00Z",
            updated_at="2025-01-01T00:00:00Z"
        )
        
        user_dict = user.to_dict()
        
        assert isinstance(user_dict, dict)
        assert user_dict['id'] == "usr_123"
        assert user_dict['telegram_id'] == 123456789
        assert user_dict['username'] == "testuser"
        assert user_dict['gold'] == 1000
        assert user_dict['gems'] == 50

class TestCharacter:
    """Test Character model"""
    
    @pytest.mark.unit
    def test_character_creation(self):
        """Test creating Character instance"""
        stats = CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1)
        equipment = Equipment()
        
        character = Character(
            id="ch_123",
            user_id="usr_123",
            name="TestHero",
            character_class=CharacterClass.WARRIOR,
            level=1,
            xp=0,
            stats=stats,
            equipment=equipment,
            sprite_url="https://example.com/sprite.png",
            created_at="2025-01-01T00:00:00Z",
            updated_at="2025-01-01T00:00:00Z"
        )
        
        assert character.id == "ch_123"
        assert character.user_id == "usr_123"
        assert character.name == "TestHero"
        assert character.character_class == CharacterClass.WARRIOR
        assert character.level == 1
        assert character.xp == 0
        assert isinstance(character.stats, CharacterStats)
        assert isinstance(character.equipment, Equipment)
        assert character.sprite_url == "https://example.com/sprite.png"
    
    @pytest.mark.unit
    def test_character_to_dict(self):
        """Test converting Character to dictionary"""
        stats = CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1)
        equipment = Equipment()
        
        character = Character(
            id="ch_123",
            user_id="usr_123",
            name="TestHero",
            character_class=CharacterClass.WARRIOR,
            level=1,
            xp=0,
            stats=stats,
            equipment=equipment,
            sprite_url="https://example.com/sprite.png",
            created_at="2025-01-01T00:00:00Z",
            updated_at="2025-01-01T00:00:00Z"
        )
        
        character_dict = character.to_dict()
        
        assert isinstance(character_dict, dict)
        assert character_dict['id'] == "ch_123"
        assert character_dict['user_id'] == "usr_123"
        assert character_dict['name'] == "TestHero"
        assert character_dict['class'] == "Warrior"
        assert character_dict['level'] == 1
        assert character_dict['xp'] == 0
        assert isinstance(character_dict['stats'], dict)
        assert isinstance(character_dict['equipment'], dict)
        assert character_dict['sprite_url'] == "https://example.com/sprite.png"
    
    @pytest.mark.unit
    def test_character_from_dict(self):
        """Test creating Character from dictionary"""
        character_dict = {
            "id": "ch_123",
            "user_id": "usr_123",
            "name": "TestHero",
            "class": "Warrior",
            "level": 1,
            "xp": 0,
            "stats": {
                "hp": 100, "mp": 50, "attack": 10, "defense": 5, "speed": 5.0,
                "crit_chance": 0.05, "strength": 8, "agility": 6, "intelligence": 4
            },
            "equipment": {
                "weapon": None, "helmet": None, "armor": None, "boots": None, "accessory": None
            },
            "sprite_url": "https://example.com/sprite.png",
            "created_at": "2025-01-01T00:00:00Z",
            "updated_at": "2025-01-01T00:00:00Z"
        }
        
        character = Character.from_dict(character_dict)
        
        assert character.id == "ch_123"
        assert character.user_id == "usr_123"
        assert character.name == "TestHero"
        assert character.character_class == CharacterClass.WARRIOR
        assert character.level == 1
        assert character.xp == 0
        assert isinstance(character.stats, CharacterStats)
        assert isinstance(character.equipment, Equipment)
        assert character.sprite_url == "https://example.com/sprite.png"

class TestItem:
    """Test Item model"""
    
    @pytest.mark.unit
    def test_item_creation(self):
        """Test creating Item instance"""
        item = Item(
            id="itm_sword",
            item_type=ItemType.WEAPON,
            rarity=ItemRarity.RARE,
            name="Iron Sword",
            description="A sturdy iron sword",
            stats={"attack": 12, "crit_chance": 0.05},
            price_gold=200,
            price_gems=None,
            stackable=False,
            icon_url="https://example.com/sword.png",
            overlay_layer="weapon",
            created_at="2025-01-01T00:00:00Z"
        )
        
        assert item.id == "itm_sword"
        assert item.item_type == ItemType.WEAPON
        assert item.rarity == ItemRarity.RARE
        assert item.name == "Iron Sword"
        assert item.description == "A sturdy iron sword"
        assert item.stats == {"attack": 12, "crit_chance": 0.05}
        assert item.price_gold == 200
        assert item.price_gems is None
        assert item.stackable is False
        assert item.icon_url == "https://example.com/sword.png"
        assert item.overlay_layer == "weapon"
    
    @pytest.mark.unit
    def test_item_to_dict(self):
        """Test converting Item to dictionary"""
        item = Item(
            id="itm_sword",
            item_type=ItemType.WEAPON,
            rarity=ItemRarity.RARE,
            name="Iron Sword",
            description="A sturdy iron sword",
            stats={"attack": 12, "crit_chance": 0.05},
            price_gold=200,
            price_gems=None,
            stackable=False,
            icon_url="https://example.com/sword.png",
            overlay_layer="weapon",
            created_at="2025-01-01T00:00:00Z"
        )
        
        item_dict = item.to_dict()
        
        assert isinstance(item_dict, dict)
        assert item_dict['id'] == "itm_sword"
        assert item_dict['type'] == "Weapon"
        assert item_dict['rarity'] == "Rare"
        assert item_dict['name'] == "Iron Sword"
        assert item_dict['description'] == "A sturdy iron sword"
        assert item_dict['stats'] == {"attack": 12, "crit_chance": 0.05}
        assert item_dict['price_gold'] == 200
        assert item_dict['price_gems'] is None
        assert item_dict['stackable'] is False
        assert item_dict['icon_url'] == "https://example.com/sword.png"
        assert item_dict['overlay_layer'] == "weapon"
    
    @pytest.mark.unit
    def test_item_from_dict(self):
        """Test creating Item from dictionary"""
        item_dict = {
            "id": "itm_sword",
            "type": "Weapon",
            "rarity": "Rare",
            "name": "Iron Sword",
            "description": "A sturdy iron sword",
            "stats": {"attack": 12, "crit_chance": 0.05},
            "price_gold": 200,
            "price_gems": None,
            "stackable": False,
            "icon_url": "https://example.com/sword.png",
            "overlay_layer": "weapon",
            "created_at": "2025-01-01T00:00:00Z"
        }
        
        item = Item.from_dict(item_dict)
        
        assert item.id == "itm_sword"
        assert item.item_type == ItemType.WEAPON
        assert item.rarity == ItemRarity.RARE
        assert item.name == "Iron Sword"
        assert item.description == "A sturdy iron sword"
        assert item.stats == {"attack": 12, "crit_chance": 0.05}
        assert item.price_gold == 200
        assert item.price_gems is None
        assert item.stackable is False
        assert item.icon_url == "https://example.com/sword.png"
        assert item.overlay_layer == "weapon"

class TestQuest:
    """Test Quest model"""
    
    @pytest.mark.unit
    def test_quest_creation(self):
        """Test creating Quest instance"""
        quest = Quest(
            id="q_test",
            quest_type=QuestType.STORY,
            level_req=1,
            title="Test Quest",
            description="A test quest",
            objective={"kill": {"enemy": "Goblin", "count": 5}},
            rewards={"xp": 100, "gold": 50},
            created_at="2025-01-01T00:00:00Z"
        )
        
        assert quest.id == "q_test"
        assert quest.quest_type == QuestType.STORY
        assert quest.level_req == 1
        assert quest.title == "Test Quest"
        assert quest.description == "A test quest"
        assert quest.objective == {"kill": {"enemy": "Goblin", "count": 5}}
        assert quest.rewards == {"xp": 100, "gold": 50}
    
    @pytest.mark.unit
    def test_quest_to_dict(self):
        """Test converting Quest to dictionary"""
        quest = Quest(
            id="q_test",
            quest_type=QuestType.STORY,
            level_req=1,
            title="Test Quest",
            description="A test quest",
            objective={"kill": {"enemy": "Goblin", "count": 5}},
            rewards={"xp": 100, "gold": 50},
            created_at="2025-01-01T00:00:00Z"
        )
        
        quest_dict = quest.to_dict()
        
        assert isinstance(quest_dict, dict)
        assert quest_dict['id'] == "q_test"
        assert quest_dict['type'] == "Story"
        assert quest_dict['level_req'] == 1
        assert quest_dict['title'] == "Test Quest"
        assert quest_dict['description'] == "A test quest"
        assert quest_dict['objective'] == {"kill": {"enemy": "Goblin", "count": 5}}
        assert quest_dict['rewards'] == {"xp": 100, "gold": 50}
    
    @pytest.mark.unit
    def test_quest_from_dict(self):
        """Test creating Quest from dictionary"""
        quest_dict = {
            "id": "q_test",
            "type": "Story",
            "level_req": 1,
            "title": "Test Quest",
            "description": "A test quest",
            "objective": {"kill": {"enemy": "Goblin", "count": 5}},
            "rewards": {"xp": 100, "gold": 50},
            "created_at": "2025-01-01T00:00:00Z"
        }
        
        quest = Quest.from_dict(quest_dict)
        
        assert quest.id == "q_test"
        assert quest.quest_type == QuestType.STORY
        assert quest.level_req == 1
        assert quest.title == "Test Quest"
        assert quest.description == "A test quest"
        assert quest.objective == {"kill": {"enemy": "Goblin", "count": 5}}
        assert quest.rewards == {"xp": 100, "gold": 50}

class TestEnums:
    """Test enum classes"""
    
    @pytest.mark.unit
    def test_character_class_enum(self):
        """Test CharacterClass enum values"""
        assert CharacterClass.WARRIOR.value == "Warrior"
        assert CharacterClass.MAGE.value == "Mage"
        assert CharacterClass.ROGUE.value == "Rogue"
    
    @pytest.mark.unit
    def test_item_type_enum(self):
        """Test ItemType enum values"""
        assert ItemType.WEAPON.value == "Weapon"
        assert ItemType.ARMOR.value == "Armor"
        assert ItemType.HELMET.value == "Helmet"
        assert ItemType.BOOTS.value == "Boots"
        assert ItemType.ACCESSORY.value == "Accessory"
        assert ItemType.CONSUMABLE.value == "Consumable"
    
    @pytest.mark.unit
    def test_item_rarity_enum(self):
        """Test ItemRarity enum values"""
        assert ItemRarity.COMMON.value == "Common"
        assert ItemRarity.RARE.value == "Rare"
        assert ItemRarity.EPIC.value == "Epic"
        assert ItemRarity.LEGENDARY.value == "Legendary"
    
    @pytest.mark.unit
    def test_quest_type_enum(self):
        """Test QuestType enum values"""
        assert QuestType.STORY.value == "Story"
        assert QuestType.SIDE.value == "Side"
        assert QuestType.DAILY.value == "Daily"
        assert QuestType.WEEKLY.value == "Weekly"
    
    @pytest.mark.unit
    def test_quest_status_enum(self):
        """Test QuestStatus enum values"""
        assert QuestStatus.AVAILABLE.value == "available"
        assert QuestStatus.IN_PROGRESS.value == "in_progress"
        assert QuestStatus.COMPLETED.value == "completed"
    
    @pytest.mark.unit
    def test_battle_status_enum(self):
        """Test BattleStatus enum values"""
        assert BattleStatus.PENDING.value == "pending"
        assert BattleStatus.ACTIVE.value == "active"
        assert BattleStatus.FINISHED.value == "finished"
    
    @pytest.mark.unit
    def test_payment_status_enum(self):
        """Test PaymentStatus enum values"""
        assert PaymentStatus.PENDING.value == "pending"
        assert PaymentStatus.SUCCEEDED.value == "succeeded"
        assert PaymentStatus.FAILED.value == "failed"
        assert PaymentStatus.CANCELED.value == "canceled"
    
    @pytest.mark.unit
    def test_render_status_enum(self):
        """Test RenderStatus enum values"""
        assert RenderStatus.QUEUED.value == "queued"
        assert RenderStatus.PROCESSING.value == "processing"
        assert RenderStatus.DONE.value == "done"
        assert RenderStatus.FAILED.value == "failed"
