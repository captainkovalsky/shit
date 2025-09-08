import random
import math
from typing import Dict, Any, List, Optional, Tuple
from models import Character, CharacterStats, CharacterClass, Item, ItemRarity, Quest, QuestStatus
from config import Config

class CombatSystem:
    """Handles turn-based combat logic"""
    
    @staticmethod
    def calculate_damage(attacker_stats: CharacterStats, defender_stats: CharacterStats, 
                        skill_multiplier: float = 1.0, is_crit: bool = False) -> int:
        """Calculate damage dealt in combat"""
        base_damage = attacker_stats.attack * skill_multiplier
        
        # Apply critical hit
        if is_crit:
            base_damage *= 2.0
        
        # Apply defense reduction
        defense_reduction = defender_stats.defense * 0.5
        final_damage = max(1, int(base_damage - defense_reduction))
        
        return final_damage
    
    @staticmethod
    def is_critical_hit(crit_chance: float) -> bool:
        """Check if attack is a critical hit"""
        return random.random() < crit_chance
    
    @staticmethod
    def simulate_turn(character: Character, enemy: Dict[str, Any], 
                     action: str, skill_id: Optional[str] = None) -> Dict[str, Any]:
        """Simulate one turn of combat"""
        char_stats = character.stats
        enemy_hp = enemy.get('hp', 100)
        enemy_attack = enemy.get('attack', 10)
        
        # Character's turn
        char_damage = 0
        char_mp_cost = 0
        
        if action == "attack":
            is_crit = CombatSystem.is_critical_hit(char_stats.crit_chance)
            char_damage = CombatSystem.calculate_damage(char_stats, char_stats, 1.0, is_crit)
            char_mp_cost = 0
        elif action == "skill" and skill_id:
            skill_data = CombatSystem.get_skill_data(character.character_class, skill_id)
            if char_stats.mp >= skill_data['mp_cost']:
                is_crit = CombatSystem.is_critical_hit(char_stats.crit_chance + skill_data.get('crit_bonus', 0))
                char_damage = CombatSystem.calculate_damage(char_stats, char_stats, skill_data['damage_multiplier'], is_crit)
                char_mp_cost = skill_data['mp_cost']
            else:
                return {"error": "Not enough MP"}
        
        # Apply character damage to enemy
        enemy_hp = max(0, enemy_hp - char_damage)
        
        # Check if enemy is defeated
        if enemy_hp <= 0:
            return {
                "character_hp": char_stats.hp,
                "character_mp": char_stats.mp - char_mp_cost,
                "enemy_hp": 0,
                "damage_dealt": char_damage,
                "mp_used": char_mp_cost,
                "result": "win",
                "log": f"You dealt {char_damage} damage to {enemy.get('name', 'Enemy')}"
            }
        
        # Enemy's turn
        enemy_damage = CombatSystem.calculate_damage(
            CharacterStats(enemy_attack, 0, enemy_attack, 0, 0, 0, 0, 0, 0),
            char_stats, 1.0, False
        )
        char_hp = max(0, char_stats.hp - enemy_damage)
        
        # Check if character is defeated
        if char_hp <= 0:
            return {
                "character_hp": 0,
                "character_mp": char_stats.mp - char_mp_cost,
                "enemy_hp": enemy_hp,
                "damage_dealt": char_damage,
                "damage_taken": enemy_damage,
                "mp_used": char_mp_cost,
                "result": "lose",
                "log": f"You dealt {char_damage} damage, but {enemy.get('name', 'Enemy')} dealt {enemy_damage} damage to you"
            }
        
        return {
            "character_hp": char_hp,
            "character_mp": char_stats.mp - char_mp_cost,
            "enemy_hp": enemy_hp,
            "damage_dealt": char_damage,
            "damage_taken": enemy_damage,
            "mp_used": char_mp_cost,
            "result": None,
            "log": f"You dealt {char_damage} damage, {enemy.get('name', 'Enemy')} dealt {enemy_damage} damage to you"
        }
    
    @staticmethod
    def get_skill_data(character_class: CharacterClass, skill_id: str) -> Dict[str, Any]:
        """Get skill data for a character class"""
        skills = {
            CharacterClass.WARRIOR: {
                "shield_slam": {"damage_multiplier": 1.2, "mp_cost": 10, "stun_chance": 0.3},
                "battle_cry": {"damage_multiplier": 0, "mp_cost": 15, "buff_attack": 0.2, "duration": 3},
                "whirlwind": {"damage_multiplier": 0.8, "mp_cost": 25, "aoe": True}
            },
            CharacterClass.MAGE: {
                "fireball": {"damage_multiplier": 1.5, "mp_cost": 12, "element": "fire"},
                "ice_barrier": {"damage_multiplier": 0, "mp_cost": 20, "absorb_damage": 0.3, "duration": 2},
                "lightning_storm": {"damage_multiplier": 1.0, "mp_cost": 30, "aoe": True, "stun_chance": 0.1}
            },
            CharacterClass.ROGUE: {
                "backstab": {"damage_multiplier": 2.0, "mp_cost": 8, "crit_bonus": 0.5},
                "smoke_bomb": {"damage_multiplier": 0, "mp_cost": 12, "dodge_chance": 0.5},
                "blade_dance": {"damage_multiplier": 0.7, "mp_cost": 18, "multi_hit": 3}
            }
        }
        
        return skills.get(character_class, {}).get(skill_id, {"damage_multiplier": 1.0, "mp_cost": 0})

class LevelingSystem:
    """Handles character leveling and XP calculations"""
    
    @staticmethod
    def calculate_xp_for_level(level: int) -> int:
        """Calculate XP required for a specific level"""
        return int(100 * (level ** 1.5))
    
    @staticmethod
    def calculate_total_xp_for_level(level: int) -> int:
        """Calculate total XP required to reach a level"""
        total = 0
        for i in range(1, level):
            total += LevelingSystem.calculate_xp_for_level(i)
        return total
    
    @staticmethod
    def add_xp(character: Character, xp_gained: int) -> Dict[str, Any]:
        """Add XP to character and check for level up"""
        old_level = character.level
        character.xp += xp_gained
        
        # Check for level ups
        levels_gained = 0
        while character.xp >= LevelingSystem.calculate_total_xp_for_level(character.level + 1):
            character.level += 1
            levels_gained += 1
        
        # Apply stat increases for level ups
        if levels_gained > 0:
            LevelingSystem.apply_level_up_stats(character, levels_gained)
        
        return {
            "old_level": old_level,
            "new_level": character.level,
            "levels_gained": levels_gained,
            "xp_gained": xp_gained,
            "total_xp": character.xp
        }
    
    @staticmethod
    def apply_level_up_stats(character: Character, levels_gained: int):
        """Apply stat increases when character levels up"""
        stats = character.stats
        
        # Base stat increases per level
        stats.hp += Config.BASE_HP_PER_LEVEL * levels_gained
        stats.mp += Config.BASE_MP_PER_LEVEL * levels_gained
        stats.attack += Config.BASE_ATTACK_PER_LEVEL * levels_gained
        stats.defense += Config.BASE_DEFENSE_PER_LEVEL * levels_gained
        stats.speed += Config.BASE_SPEED_PER_LEVEL * levels_gained
        stats.crit_chance += Config.BASE_CRIT_CHANCE_PER_LEVEL * levels_gained
        
        # Class-specific bonuses
        class_bonuses = Config.CLASS_STAT_BONUSES.get(character.character_class.value, {})
        for stat, bonus in class_bonuses.items():
            if hasattr(stats, stat):
                current_value = getattr(stats, stat)
                if isinstance(current_value, int):
                    setattr(stats, stat, current_value + bonus * levels_gained)
                elif isinstance(current_value, float):
                    setattr(stats, stat, current_value + bonus * levels_gained)

class LootSystem:
    """Handles loot generation and item drops"""
    
    @staticmethod
    def generate_loot(enemy_level: int, enemy_type: str) -> Dict[str, Any]:
        """Generate loot from defeating an enemy"""
        loot = {
            "gold": random.randint(enemy_level * 2, enemy_level * 5),
            "xp": random.randint(enemy_level * 10, enemy_level * 20),
            "items": []
        }
        
        # Chance to drop items based on enemy level
        item_drop_chance = min(0.3 + (enemy_level * 0.05), 0.8)
        
        if random.random() < item_drop_chance:
            item = LootSystem.generate_random_item(enemy_level)
            if item:
                loot["items"].append(item)
        
        return loot
    
    @staticmethod
    def generate_random_item(level: int) -> Optional[Dict[str, Any]]:
        """Generate a random item based on level"""
        # Determine rarity based on level and drop rates
        rarity_roll = random.random()
        cumulative = 0
        
        for rarity, rate in Config.ITEM_DROP_RATES.items():
            cumulative += rate
            if rarity_roll <= cumulative:
                return LootSystem.create_item_by_rarity(rarity, level)
        
        return None
    
    @staticmethod
    def create_item_by_rarity(rarity: str, level: int) -> Dict[str, Any]:
        """Create an item based on rarity and level"""
        # This would typically pull from a database of items
        # For now, we'll create basic items
        item_templates = {
            "Common": {
                "name": f"Basic {random.choice(['Sword', 'Staff', 'Dagger'])}",
                "stats": {"attack": level * 2},
                "price_gold": level * 50
            },
            "Rare": {
                "name": f"Fine {random.choice(['Sword', 'Staff', 'Dagger'])}",
                "stats": {"attack": level * 3, "crit_chance": 0.05},
                "price_gold": level * 150
            },
            "Epic": {
                "name": f"Masterwork {random.choice(['Sword', 'Staff', 'Dagger'])}",
                "stats": {"attack": level * 4, "crit_chance": 0.1, "hp": level * 10},
                "price_gold": level * 500
            },
            "Legendary": {
                "name": f"Legendary {random.choice(['Sword', 'Staff', 'Dagger'])}",
                "stats": {"attack": level * 6, "crit_chance": 0.15, "hp": level * 20, "mp": level * 10},
                "price_gold": level * 2000
            }
        }
        
        template = item_templates.get(rarity, item_templates["Common"])
        return {
            "name": template["name"],
            "rarity": rarity,
            "stats": template["stats"],
            "price_gold": template["price_gold"]
        }

class QuestSystem:
    """Handles quest logic and progression"""
    
    @staticmethod
    def check_quest_completion(quest: Quest, progress: Dict[str, Any]) -> bool:
        """Check if a quest objective is completed"""
        objective = quest.objective
        
        if "kill" in objective:
            required = objective["kill"]["count"]
            current = progress.get("kill", {}).get(objective["kill"]["enemy"], 0)
            return current >= required
        
        if "collect" in objective:
            required = objective["collect"]["count"]
            current = progress.get("collect", {}).get(objective["collect"]["item"], 0)
            return current >= required
        
        return False
    
    @staticmethod
    def update_quest_progress(quest: Quest, progress: Dict[str, Any], 
                            action: str, target: str, amount: int = 1) -> Dict[str, Any]:
        """Update quest progress based on player actions"""
        objective = quest.objective
        new_progress = progress.copy()
        
        if action == "kill" and "kill" in objective:
            if objective["kill"]["enemy"] == target:
                current_kills = new_progress.get("kill", {}).get(target, 0)
                new_progress["kill"] = new_progress.get("kill", {})
                new_progress["kill"][target] = current_kills + amount
        
        elif action == "collect" and "collect" in objective:
            if objective["collect"]["item"] == target:
                current_items = new_progress.get("collect", {}).get(target, 0)
                new_progress["collect"] = new_progress.get("collect", {})
                new_progress["collect"][target] = current_items + amount
        
        return new_progress
    
    @staticmethod
    def get_available_quests(character_level: int) -> List[Dict[str, Any]]:
        """Get quests available for character level"""
        # This would typically query the database
        # For now, return some basic quests
        return [
            {
                "id": "q_goblin_hunt_01",
                "type": "Story",
                "level_req": 1,
                "title": "Goblin Hunt",
                "description": "Defeat 5 goblins to prove your worth",
                "objective": {"kill": {"enemy": "Goblin", "count": 5}},
                "rewards": {"xp": 100, "gold": 50}
            },
            {
                "id": "q_wolf_pack_01",
                "type": "Side",
                "level_req": 3,
                "title": "Wolf Pack Threat",
                "description": "Clear out the wolf pack threatening the village",
                "objective": {"kill": {"enemy": "Wolf", "count": 3}},
                "rewards": {"xp": 150, "gold": 75}
            }
        ]
