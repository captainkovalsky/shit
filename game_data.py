"""
Game data including items, quests, enemies, and other static content
"""

from typing import Dict, Any, List
from models import Item, ItemType, ItemRarity, Quest, QuestType

# Base items data
BASE_ITEMS = [
    # Weapons
    {
        "id": "itm_wpn_rusty_sword",
        "type": "Weapon",
        "rarity": "Common",
        "name": "Rusty Sword",
        "description": "An old, rusty sword that has seen better days.",
        "stats": {"attack": 5},
        "price_gold": 50,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "weapon"
    },
    {
        "id": "itm_wpn_iron_sword",
        "type": "Weapon",
        "rarity": "Rare",
        "name": "Iron Sword",
        "description": "A sturdy iron sword with good balance.",
        "stats": {"attack": 12, "crit_chance": 0.05},
        "price_gold": 200,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "weapon"
    },
    {
        "id": "itm_wpn_steel_sword",
        "type": "Weapon",
        "rarity": "Epic",
        "name": "Steel Sword",
        "description": "A finely crafted steel sword with excellent edge retention.",
        "stats": {"attack": 20, "crit_chance": 0.1, "strength": 2},
        "price_gold": 800,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "weapon"
    },
    {
        "id": "itm_wpn_apprentice_staff",
        "type": "Weapon",
        "rarity": "Common",
        "name": "Apprentice Staff",
        "description": "A simple wooden staff used by novice mages.",
        "stats": {"attack": 3, "intelligence": 2},
        "price_gold": 60,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "weapon"
    },
    {
        "id": "itm_wpn_mystic_staff",
        "type": "Weapon",
        "rarity": "Epic",
        "name": "Mystic Staff",
        "description": "A staff imbued with magical energy.",
        "stats": {"attack": 8, "intelligence": 5, "mp": 20},
        "price_gold": 1000,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "weapon"
    },
    {
        "id": "itm_wpn_rusty_dagger",
        "type": "Weapon",
        "rarity": "Common",
        "name": "Rusty Dagger",
        "description": "A small, rusty dagger favored by rogues.",
        "stats": {"attack": 4, "speed": 1},
        "price_gold": 40,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "weapon"
    },
    {
        "id": "itm_wpn_shadow_blade",
        "type": "Weapon",
        "rarity": "Epic",
        "name": "Shadow Blade",
        "description": "A dagger that seems to absorb light.",
        "stats": {"attack": 15, "speed": 2, "crit_chance": 0.15, "agility": 3},
        "price_gold": 1200,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "weapon"
    },
    
    # Armor
    {
        "id": "itm_arm_leather_armor",
        "type": "Armor",
        "rarity": "Common",
        "name": "Leather Armor",
        "description": "Basic leather armor providing minimal protection.",
        "stats": {"defense": 3, "hp": 10},
        "price_gold": 80,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "armor"
    },
    {
        "id": "itm_arm_chain_mail",
        "type": "Armor",
        "rarity": "Rare",
        "name": "Chain Mail",
        "description": "Interlocked metal rings providing good protection.",
        "stats": {"defense": 8, "hp": 25, "strength": 1},
        "price_gold": 300,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "armor"
    },
    {
        "id": "itm_arm_plate_armor",
        "type": "Armor",
        "rarity": "Epic",
        "name": "Plate Armor",
        "description": "Heavy metal plates offering excellent protection.",
        "stats": {"defense": 15, "hp": 50, "strength": 3, "speed": -1},
        "price_gold": 1500,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "armor"
    },
    {
        "id": "itm_arm_mystic_robe",
        "type": "Armor",
        "rarity": "Rare",
        "name": "Mystic Robe",
        "description": "Silken robes infused with latent mana.",
        "stats": {"defense": 5, "hp": 20, "intelligence": 3, "mp": 15},
        "price_gold": 400,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "armor"
    },
    {
        "id": "itm_arm_shadow_cloak",
        "type": "Armor",
        "rarity": "Epic",
        "name": "Shadow Cloak",
        "description": "A cloak that seems to blend with shadows.",
        "stats": {"defense": 8, "hp": 30, "agility": 4, "speed": 2},
        "price_gold": 1000,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "armor"
    },
    
    # Helmets
    {
        "id": "itm_hel_leather_cap",
        "type": "Helmet",
        "rarity": "Common",
        "name": "Leather Cap",
        "description": "A simple leather cap.",
        "stats": {"defense": 1, "hp": 5},
        "price_gold": 30,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "helmet"
    },
    {
        "id": "itm_hel_iron_helmet",
        "type": "Helmet",
        "rarity": "Rare",
        "name": "Iron Helmet",
        "description": "A sturdy iron helmet.",
        "stats": {"defense": 4, "hp": 15},
        "price_gold": 150,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "helmet"
    },
    {
        "id": "itm_hel_apprentice_hood",
        "type": "Helmet",
        "rarity": "Common",
        "name": "Apprentice Hood",
        "description": "A hood worn by novice mages.",
        "stats": {"defense": 1, "intelligence": 1, "mp": 5},
        "price_gold": 40,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "helmet"
    },
    
    # Boots
    {
        "id": "itm_boo_leather_boots",
        "type": "Boots",
        "rarity": "Common",
        "name": "Leather Boots",
        "description": "Basic leather boots.",
        "stats": {"defense": 1, "speed": 0.5},
        "price_gold": 25,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "boots"
    },
    {
        "id": "itm_boo_iron_boots",
        "type": "Boots",
        "rarity": "Rare",
        "name": "Iron Boots",
        "description": "Heavy iron boots.",
        "stats": {"defense": 3, "hp": 10, "speed": -0.5},
        "price_gold": 120,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "boots"
    },
    {
        "id": "itm_boo_soft_leather",
        "type": "Boots",
        "rarity": "Common",
        "name": "Soft Leather Boots",
        "description": "Light and comfortable leather boots.",
        "stats": {"defense": 1, "speed": 1, "agility": 1},
        "price_gold": 50,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "boots"
    },
    
    # Accessories
    {
        "id": "itm_acc_mana_ring",
        "type": "Accessory",
        "rarity": "Rare",
        "name": "Mana Ring",
        "description": "A ring that enhances magical power.",
        "stats": {"intelligence": 2, "mp": 20},
        "price_gold": 200,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "accessory"
    },
    {
        "id": "itm_acc_strength_ring",
        "type": "Accessory",
        "rarity": "Rare",
        "name": "Ring of Strength",
        "description": "A ring that enhances physical power.",
        "stats": {"strength": 2, "attack": 3},
        "price_gold": 180,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "accessory"
    },
    {
        "id": "itm_acc_agility_amulet",
        "type": "Accessory",
        "rarity": "Rare",
        "name": "Amulet of Agility",
        "description": "An amulet that enhances speed and reflexes.",
        "stats": {"agility": 2, "speed": 1, "crit_chance": 0.05},
        "price_gold": 250,
        "price_gems": None,
        "stackable": False,
        "overlay_layer": "accessory"
    },
    
    # Consumables
    {
        "id": "itm_pot_heal_s",
        "type": "Consumable",
        "rarity": "Common",
        "name": "Small Health Potion",
        "description": "Restores 50 HP.",
        "stats": {"heal": 50},
        "price_gold": 25,
        "price_gems": None,
        "stackable": True,
        "overlay_layer": None
    },
    {
        "id": "itm_pot_heal_m",
        "type": "Consumable",
        "rarity": "Rare",
        "name": "Medium Health Potion",
        "description": "Restores 150 HP.",
        "stats": {"heal": 150},
        "price_gold": 75,
        "price_gems": None,
        "stackable": True,
        "overlay_layer": None
    },
    {
        "id": "itm_pot_mana_s",
        "type": "Consumable",
        "rarity": "Common",
        "name": "Small Mana Potion",
        "description": "Restores 30 MP.",
        "stats": {"mana": 30},
        "price_gold": 20,
        "price_gems": None,
        "stackable": True,
        "overlay_layer": None
    },
    {
        "id": "itm_pot_mana_m",
        "type": "Consumable",
        "rarity": "Rare",
        "name": "Medium Mana Potion",
        "description": "Restores 80 MP.",
        "stats": {"mana": 80},
        "price_gold": 60,
        "price_gems": None,
        "stackable": True,
        "overlay_layer": None
    }
]

# Quest data
QUEST_DATA = [
    {
        "id": "q_goblin_hunt_01",
        "type": "Story",
        "level_req": 1,
        "title": "Goblin Hunt",
        "description": "The village is being harassed by goblins. Prove your worth by defeating them.",
        "objective": {"kill": {"enemy": "Goblin", "count": 5}},
        "rewards": {"xp": 100, "gold": 50, "items": ["itm_pot_heal_s"]}
    },
    {
        "id": "q_wolf_pack_01",
        "type": "Side",
        "level_req": 3,
        "title": "Wolf Pack Threat",
        "description": "A pack of wolves has been terrorizing travelers. Clear them out.",
        "objective": {"kill": {"enemy": "Wolf", "count": 3}},
        "rewards": {"xp": 150, "gold": 75}
    },
    {
        "id": "q_orc_raiders_01",
        "type": "Story",
        "level_req": 5,
        "title": "Orc Raiders",
        "description": "Orc raiders have been attacking merchant caravans. Stop their raids.",
        "objective": {"kill": {"enemy": "Orc", "count": 4}},
        "rewards": {"xp": 250, "gold": 120, "items": ["itm_wpn_iron_sword"]}
    },
    {
        "id": "q_spider_cave_01",
        "type": "Side",
        "level_req": 7,
        "title": "Spider Cave",
        "description": "A cave full of giant spiders needs to be cleared.",
        "objective": {"kill": {"enemy": "Giant Spider", "count": 6}},
        "rewards": {"xp": 300, "gold": 150, "items": ["itm_arm_leather_armor"]}
    },
    {
        "id": "q_daily_goblin_01",
        "type": "Daily",
        "level_req": 1,
        "title": "Daily Goblin Hunt",
        "description": "Daily quest: Defeat 3 goblins.",
        "objective": {"kill": {"enemy": "Goblin", "count": 3}},
        "rewards": {"xp": 50, "gold": 25}
    }
]

# Enemy data
ENEMY_DATA = {
    "Goblin": {
        "base_hp": 50,
        "base_attack": 8,
        "base_defense": 2,
        "base_speed": 5,
        "xp_reward": 15,
        "gold_reward": (5, 15),
        "loot_chance": 0.3,
        "description": "Small, aggressive humanoid creatures"
    },
    "Wolf": {
        "base_hp": 80,
        "base_attack": 12,
        "base_defense": 3,
        "base_speed": 7,
        "xp_reward": 25,
        "gold_reward": (8, 20),
        "loot_chance": 0.4,
        "description": "Pack hunters with sharp teeth and claws"
    },
    "Orc": {
        "base_hp": 120,
        "base_attack": 18,
        "base_defense": 5,
        "base_speed": 4,
        "xp_reward": 40,
        "gold_reward": (15, 35),
        "loot_chance": 0.5,
        "description": "Large, brutish humanoids with crude weapons"
    },
    "Giant Spider": {
        "base_hp": 100,
        "base_attack": 15,
        "base_defense": 4,
        "base_speed": 8,
        "xp_reward": 35,
        "gold_reward": (12, 28),
        "loot_chance": 0.45,
        "description": "Massive arachnids with venomous bites"
    },
    "Skeleton": {
        "base_hp": 90,
        "base_attack": 14,
        "base_defense": 6,
        "base_speed": 6,
        "xp_reward": 30,
        "gold_reward": (10, 25),
        "loot_chance": 0.35,
        "description": "Undead warriors with rusty weapons"
    },
    "Troll": {
        "base_hp": 200,
        "base_attack": 25,
        "base_defense": 8,
        "base_speed": 3,
        "xp_reward": 60,
        "gold_reward": (25, 50),
        "loot_chance": 0.6,
        "description": "Massive creatures with incredible strength"
    }
}

# Boss enemies
BOSS_DATA = {
    "Goblin Chief": {
        "base_hp": 300,
        "base_attack": 20,
        "base_defense": 8,
        "base_speed": 6,
        "xp_reward": 100,
        "gold_reward": (50, 100),
        "loot_chance": 0.8,
        "description": "The leader of the goblin tribe",
        "special_abilities": ["Charge", "Battle Cry"]
    },
    "Ancient Dragon": {
        "base_hp": 1000,
        "base_attack": 50,
        "base_defense": 20,
        "base_speed": 10,
        "xp_reward": 500,
        "gold_reward": (200, 500),
        "loot_chance": 1.0,
        "description": "An ancient dragon with immense power",
        "special_abilities": ["Fire Breath", "Tail Swipe", "Wing Buffet"]
    }
}

# Shop categories
SHOP_CATEGORIES = {
    "weapons": {
        "name": "Weapons",
        "description": "Swords, staves, daggers, and other weapons",
        "items": [item for item in BASE_ITEMS if item["type"] == "Weapon"]
    },
    "armor": {
        "name": "Armor",
        "description": "Protective gear for your character",
        "items": [item for item in BASE_ITEMS if item["type"] in ["Armor", "Helmet", "Boots"]]
    },
    "accessories": {
        "name": "Accessories",
        "description": "Rings, amulets, and other magical items",
        "items": [item for item in BASE_ITEMS if item["type"] == "Accessory"]
    },
    "consumables": {
        "name": "Consumables",
        "description": "Potions and other consumable items",
        "items": [item for item in BASE_ITEMS if item["type"] == "Consumable"]
    }
}

# Payment products
PAYMENT_PRODUCTS = [
    {
        "id": "gems_pack_100",
        "name": "Small Gem Pack",
        "description": "100 Gems",
        "gems": 100,
        "amount_minor": 299,  # $2.99
        "currency": "USD"
    },
    {
        "id": "gems_pack_500",
        "name": "Medium Gem Pack",
        "description": "500 Gems",
        "gems": 500,
        "amount_minor": 999,  # $9.99
        "currency": "USD"
    },
    {
        "id": "gems_pack_1000",
        "name": "Large Gem Pack",
        "description": "1000 Gems",
        "gems": 1000,
        "amount_minor": 1999,  # $19.99
        "currency": "USD"
    },
    {
        "id": "gems_pack_2500",
        "name": "Mega Gem Pack",
        "description": "2500 Gems",
        "gems": 2500,
        "amount_minor": 4999,  # $49.99
        "currency": "USD"
    }
]

def get_enemy_stats(enemy_type: str, level: int) -> Dict[str, Any]:
    """Get enemy stats scaled by level"""
    enemy_data = ENEMY_DATA.get(enemy_type, ENEMY_DATA["Goblin"])
    
    return {
        "name": enemy_type,
        "level": level,
        "hp": enemy_data["base_hp"] + (level - 1) * 10,
        "attack": enemy_data["base_attack"] + (level - 1) * 2,
        "defense": enemy_data["base_defense"] + (level - 1),
        "speed": enemy_data["base_speed"] + (level - 1) * 0.5,
        "xp_reward": enemy_data["xp_reward"] + (level - 1) * 5,
        "gold_reward": enemy_data["gold_reward"],
        "loot_chance": enemy_data["loot_chance"],
        "description": enemy_data["description"]
    }

def get_boss_stats(boss_type: str, level: int) -> Dict[str, Any]:
    """Get boss stats scaled by level"""
    boss_data = BOSS_DATA.get(boss_type, BOSS_DATA["Goblin Chief"])
    
    return {
        "name": boss_type,
        "level": level,
        "hp": boss_data["base_hp"] + (level - 1) * 50,
        "attack": boss_data["base_attack"] + (level - 1) * 5,
        "defense": boss_data["base_defense"] + (level - 1) * 2,
        "speed": boss_data["base_speed"] + (level - 1) * 1,
        "xp_reward": boss_data["xp_reward"] + (level - 1) * 25,
        "gold_reward": boss_data["gold_reward"],
        "loot_chance": boss_data["loot_chance"],
        "description": boss_data["description"],
        "special_abilities": boss_data.get("special_abilities", [])
    }
