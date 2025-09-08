"""
Unit tests for game_logic module
"""

import pytest
from unittest.mock import patch, MagicMock
from models import Character, CharacterStats, CharacterClass, Equipment
from game_logic import CombatSystem, LevelingSystem, LootSystem, QuestSystem

class TestCombatSystem:
    """Test CombatSystem class"""
    
    @pytest.mark.unit
    def test_calculate_damage_basic(self):
        """Test basic damage calculation"""
        attacker_stats = CharacterStats(
            hp=100, mp=50, attack=20, defense=5, speed=5.0,
            crit_chance=0.05, strength=10, agility=8, intelligence=6
        )
        defender_stats = CharacterStats(
            hp=100, mp=50, attack=15, defense=8, speed=5.0,
            crit_chance=0.05, strength=8, agility=6, intelligence=4
        )
        
        damage = CombatSystem.calculate_damage(attacker_stats, defender_stats)
        
        assert isinstance(damage, int)
        assert damage > 0
        assert damage <= attacker_stats.attack  # Should not exceed base attack
    
    @pytest.mark.unit
    def test_calculate_damage_with_skill_multiplier(self):
        """Test damage calculation with skill multiplier"""
        attacker_stats = CharacterStats(
            hp=100, mp=50, attack=20, defense=5, speed=5.0,
            crit_chance=0.05, strength=10, agility=8, intelligence=6
        )
        defender_stats = CharacterStats(
            hp=100, mp=50, attack=15, defense=8, speed=5.0,
            crit_chance=0.05, strength=8, agility=6, intelligence=4
        )
        
        damage_normal = CombatSystem.calculate_damage(attacker_stats, defender_stats, 1.0)
        damage_skill = CombatSystem.calculate_damage(attacker_stats, defender_stats, 1.5)
        
        assert damage_skill > damage_normal
        assert damage_skill >= damage_normal * 1.2  # Should be significantly higher
    
    @pytest.mark.unit
    def test_calculate_damage_with_crit(self):
        """Test damage calculation with critical hit"""
        attacker_stats = CharacterStats(
            hp=100, mp=50, attack=20, defense=5, speed=5.0,
            crit_chance=0.05, strength=10, agility=8, intelligence=6
        )
        defender_stats = CharacterStats(
            hp=100, mp=50, attack=15, defense=8, speed=5.0,
            crit_chance=0.05, strength=8, agility=6, intelligence=4
        )
        
        damage_normal = CombatSystem.calculate_damage(attacker_stats, defender_stats, 1.0, False)
        damage_crit = CombatSystem.calculate_damage(attacker_stats, defender_stats, 1.0, True)
        
        assert damage_crit > damage_normal
        assert damage_crit >= damage_normal * 1.8  # Critical should be ~2x damage
    
    @pytest.mark.unit
    def test_is_critical_hit(self):
        """Test critical hit probability"""
        # Test with 100% crit chance
        assert CombatSystem.is_critical_hit(1.0) is True
        
        # Test with 0% crit chance
        assert CombatSystem.is_critical_hit(0.0) is False
        
        # Test with 50% crit chance (should be random, but we can test the function exists)
        result = CombatSystem.is_critical_hit(0.5)
        assert isinstance(result, bool)
    
    @pytest.mark.unit
    def test_get_skill_data_warrior(self):
        """Test getting skill data for Warrior class"""
        skills = CombatSystem.get_skill_data(CharacterClass.WARRIOR, "shield_slam")
        
        assert isinstance(skills, dict)
        assert "damage_multiplier" in skills
        assert "mp_cost" in skills
        assert skills["damage_multiplier"] > 1.0
        assert skills["mp_cost"] > 0
    
    @pytest.mark.unit
    def test_get_skill_data_mage(self):
        """Test getting skill data for Mage class"""
        skills = CombatSystem.get_skill_data(CharacterClass.MAGE, "fireball")
        
        assert isinstance(skills, dict)
        assert "damage_multiplier" in skills
        assert "mp_cost" in skills
        assert skills["damage_multiplier"] > 1.0
        assert skills["mp_cost"] > 0
    
    @pytest.mark.unit
    def test_get_skill_data_rogue(self):
        """Test getting skill data for Rogue class"""
        skills = CombatSystem.get_skill_data(CharacterClass.ROGUE, "backstab")
        
        assert isinstance(skills, dict)
        assert "damage_multiplier" in skills
        assert "mp_cost" in skills
        assert skills["damage_multiplier"] > 1.0
        assert skills["mp_cost"] > 0
    
    @pytest.mark.unit
    def test_get_skill_data_invalid(self):
        """Test getting skill data for invalid skill"""
        skills = CombatSystem.get_skill_data(CharacterClass.WARRIOR, "invalid_skill")
        
        assert isinstance(skills, dict)
        assert skills["damage_multiplier"] == 1.0
        assert skills["mp_cost"] == 0
    
    @pytest.mark.unit
    def test_simulate_turn_attack(self):
        """Test simulating a turn with attack action"""
        character = Character(
            id="ch_test",
            user_id="usr_test",
            name="TestHero",
            character_class=CharacterClass.WARRIOR,
            level=1,
            xp=0,
            stats=CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1),
            equipment=Equipment(),
            sprite_url=None,
            created_at="2025-01-01T00:00:00Z",
            updated_at="2025-01-01T00:00:00Z"
        )
        
        enemy = {
            "name": "Goblin",
            "level": 1,
            "hp": 50,
            "attack": 8,
            "defense": 2
        }
        
        result = CombatSystem.simulate_turn(character, enemy, "attack")
        
        assert isinstance(result, dict)
        assert "character_hp" in result
        assert "character_mp" in result
        assert "enemy_hp" in result
        assert "damage_dealt" in result
        assert "log" in result
        assert result["character_hp"] >= 0
        assert result["character_mp"] >= 0
        assert result["enemy_hp"] >= 0
        assert result["damage_dealt"] > 0
    
    @pytest.mark.unit
    def test_simulate_turn_skill(self):
        """Test simulating a turn with skill action"""
        character = Character(
            id="ch_test",
            user_id="usr_test",
            name="TestHero",
            character_class=CharacterClass.MAGE,
            level=1,
            xp=0,
            stats=CharacterStats.create_base_stats(CharacterClass.MAGE, 1),
            equipment=Equipment(),
            sprite_url=None,
            created_at="2025-01-01T00:00:00Z",
            updated_at="2025-01-01T00:00:00Z"
        )
        
        enemy = {
            "name": "Goblin",
            "level": 1,
            "hp": 50,
            "attack": 8,
            "defense": 2
        }
        
        result = CombatSystem.simulate_turn(character, enemy, "skill", "fireball")
        
        assert isinstance(result, dict)
        assert "character_hp" in result
        assert "character_mp" in result
        assert "enemy_hp" in result
        assert "damage_dealt" in result
        assert "mp_used" in result
        assert "log" in result
        assert result["character_hp"] >= 0
        assert result["character_mp"] >= 0
        assert result["enemy_hp"] >= 0
        assert result["damage_dealt"] > 0
        assert result["mp_used"] > 0
    
    @pytest.mark.unit
    def test_simulate_turn_insufficient_mp(self):
        """Test simulating a turn with insufficient MP"""
        character = Character(
            id="ch_test",
            user_id="usr_test",
            name="TestHero",
            character_class=CharacterClass.MAGE,
            level=1,
            xp=0,
            stats=CharacterStats.create_base_stats(CharacterClass.MAGE, 1),
            equipment=Equipment(),
            sprite_url=None,
            created_at="2025-01-01T00:00:00Z",
            updated_at="2025-01-01T00:00:00Z"
        )
        
        # Set MP to 0
        character.stats.mp = 0
        
        enemy = {
            "name": "Goblin",
            "level": 1,
            "hp": 50,
            "attack": 8,
            "defense": 2
        }
        
        result = CombatSystem.simulate_turn(character, enemy, "skill", "fireball")
        
        assert "error" in result
        assert "Not enough MP" in result["error"]

class TestLevelingSystem:
    """Test LevelingSystem class"""
    
    @pytest.mark.unit
    def test_calculate_xp_for_level(self):
        """Test XP calculation for specific levels"""
        xp_level_1 = LevelingSystem.calculate_xp_for_level(1)
        xp_level_2 = LevelingSystem.calculate_xp_for_level(2)
        xp_level_5 = LevelingSystem.calculate_xp_for_level(5)
        
        assert xp_level_1 > 0
        assert xp_level_2 > xp_level_1
        assert xp_level_5 > xp_level_2
        assert isinstance(xp_level_1, int)
        assert isinstance(xp_level_2, int)
        assert isinstance(xp_level_5, int)
    
    @pytest.mark.unit
    def test_calculate_total_xp_for_level(self):
        """Test total XP calculation for reaching a level"""
        total_xp_level_2 = LevelingSystem.calculate_total_xp_for_level(2)
        total_xp_level_3 = LevelingSystem.calculate_total_xp_for_level(3)
        
        assert total_xp_level_2 > 0
        assert total_xp_level_3 > total_xp_level_2
        assert isinstance(total_xp_level_2, int)
        assert isinstance(total_xp_level_3, int)
    
    @pytest.mark.unit
    def test_add_xp_no_level_up(self):
        """Test adding XP without leveling up"""
        character = Character(
            id="ch_test",
            user_id="usr_test",
            name="TestHero",
            character_class=CharacterClass.WARRIOR,
            level=1,
            xp=0,
            stats=CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1),
            equipment=Equipment(),
            sprite_url=None,
            created_at="2025-01-01T00:00:00Z",
            updated_at="2025-01-01T00:00:00Z"
        )
        
        original_level = character.level
        original_hp = character.stats.hp
        
        result = LevelingSystem.add_xp(character, 50)
        
        assert result["old_level"] == original_level
        assert result["new_level"] == original_level  # Should not level up
        assert result["levels_gained"] == 0
        assert result["xp_gained"] == 50
        assert character.xp == 50
        assert character.level == original_level
        assert character.stats.hp == original_hp  # Stats should not change
    
    @pytest.mark.unit
    def test_add_xp_single_level_up(self):
        """Test adding XP with single level up"""
        character = Character(
            id="ch_test",
            user_id="usr_test",
            name="TestHero",
            character_class=CharacterClass.WARRIOR,
            level=1,
            xp=0,
            stats=CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1),
            equipment=Equipment(),
            sprite_url=None,
            created_at="2025-01-01T00:00:00Z",
            updated_at="2025-01-01T00:00:00Z"
        )
        
        original_level = character.level
        original_hp = character.stats.hp
        
        # Add enough XP to level up
        xp_needed = LevelingSystem.calculate_total_xp_for_level(2)
        result = LevelingSystem.add_xp(character, xp_needed)
        
        assert result["old_level"] == original_level
        assert result["new_level"] == original_level + 1
        assert result["levels_gained"] == 1
        assert result["xp_gained"] == xp_needed
        assert character.level == original_level + 1
        assert character.stats.hp > original_hp  # Stats should increase
    
    @pytest.mark.unit
    def test_add_xp_multiple_level_ups(self):
        """Test adding XP with multiple level ups"""
        character = Character(
            id="ch_test",
            user_id="usr_test",
            name="TestHero",
            character_class=CharacterClass.WARRIOR,
            level=1,
            xp=0,
            stats=CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1),
            equipment=Equipment(),
            sprite_url=None,
            created_at="2025-01-01T00:00:00Z",
            updated_at="2025-01-01T00:00:00Z"
        )
        
        original_level = character.level
        original_hp = character.stats.hp
        
        # Add enough XP to level up multiple times
        xp_needed = LevelingSystem.calculate_total_xp_for_level(4)
        result = LevelingSystem.add_xp(character, xp_needed)
        
        assert result["old_level"] == original_level
        assert result["new_level"] >= original_level + 2  # Should level up at least twice
        assert result["levels_gained"] >= 2
        assert result["xp_gained"] == xp_needed
        assert character.level >= original_level + 2
        assert character.stats.hp > original_hp  # Stats should increase significantly
    
    @pytest.mark.unit
    def test_apply_level_up_stats(self):
        """Test applying level up stat increases"""
        character = Character(
            id="ch_test",
            user_id="usr_test",
            name="TestHero",
            character_class=CharacterClass.WARRIOR,
            level=1,
            xp=0,
            stats=CharacterStats.create_base_stats(CharacterClass.WARRIOR, 1),
            equipment=Equipment(),
            sprite_url=None,
            created_at="2025-01-01T00:00:00Z",
            updated_at="2025-01-01T00:00:00Z"
        )
        
        original_hp = character.stats.hp
        original_mp = character.stats.mp
        original_attack = character.stats.attack
        original_defense = character.stats.defense
        original_speed = character.stats.speed
        original_crit_chance = character.stats.crit_chance
        
        LevelingSystem.apply_level_up_stats(character, 2)
        
        assert character.stats.hp > original_hp
        assert character.stats.mp > original_mp
        assert character.stats.attack > original_attack
        assert character.stats.defense > original_defense
        assert character.stats.speed > original_speed
        assert character.stats.crit_chance > original_crit_chance

class TestLootSystem:
    """Test LootSystem class"""
    
    @pytest.mark.unit
    def test_generate_loot(self):
        """Test loot generation"""
        loot = LootSystem.generate_loot(3, "Goblin")
        
        assert isinstance(loot, dict)
        assert "gold" in loot
        assert "xp" in loot
        assert "items" in loot
        assert isinstance(loot["gold"], int)
        assert isinstance(loot["xp"], int)
        assert isinstance(loot["items"], list)
        assert loot["gold"] > 0
        assert loot["xp"] > 0
    
    @pytest.mark.unit
    def test_generate_loot_scales_with_level(self):
        """Test that loot scales with enemy level"""
        loot_level_1 = LootSystem.generate_loot(1, "Goblin")
        loot_level_5 = LootSystem.generate_loot(5, "Goblin")
        
        assert loot_level_5["gold"] >= loot_level_1["gold"]
        assert loot_level_5["xp"] >= loot_level_1["xp"]
    
    @pytest.mark.unit
    def test_generate_random_item(self):
        """Test random item generation"""
        # Test multiple times to ensure randomness
        items = []
        for _ in range(10):
            item = LootSystem.generate_random_item(3)
            if item:
                items.append(item)
        
        # Should generate some items (not guaranteed due to randomness)
        if items:
            for item in items:
                assert isinstance(item, dict)
                assert "name" in item
                assert "rarity" in item
                assert "stats" in item
                assert "price_gold" in item
                assert item["rarity"] in ["Common", "Rare", "Epic", "Legendary"]
    
    @pytest.mark.unit
    def test_create_item_by_rarity(self):
        """Test item creation by rarity"""
        for rarity in ["Common", "Rare", "Epic", "Legendary"]:
            item = LootSystem.create_item_by_rarity(rarity, 3)
            
            assert isinstance(item, dict)
            assert "name" in item
            assert "rarity" in item
            assert "stats" in item
            assert "price_gold" in item
            assert item["rarity"] == rarity
            
            # Higher rarity should have better stats
            if rarity == "Legendary":
                assert item["price_gold"] > 1000
            elif rarity == "Epic":
                assert item["price_gold"] > 500
            elif rarity == "Rare":
                assert item["price_gold"] > 100

class TestQuestSystem:
    """Test QuestSystem class"""
    
    @pytest.mark.unit
    def test_check_quest_completion_kill_objective(self):
        """Test quest completion check for kill objectives"""
        quest = Quest(
            id="q_test",
            quest_type=QuestType.STORY,
            level_req=1,
            title="Test Quest",
            description="Kill goblins",
            objective={"kill": {"enemy": "Goblin", "count": 5}},
            rewards={"xp": 100, "gold": 50},
            created_at="2025-01-01T00:00:00Z"
        )
        
        # Not completed
        progress_not_complete = {"kill": {"Goblin": 3}}
        assert QuestSystem.check_quest_completion(quest, progress_not_complete) is False
        
        # Completed
        progress_complete = {"kill": {"Goblin": 5}}
        assert QuestSystem.check_quest_completion(quest, progress_complete) is True
        
        # Over-completed
        progress_over_complete = {"kill": {"Goblin": 7}}
        assert QuestSystem.check_quest_completion(quest, progress_over_complete) is True
    
    @pytest.mark.unit
    def test_check_quest_completion_collect_objective(self):
        """Test quest completion check for collect objectives"""
        quest = Quest(
            id="q_test",
            quest_type=QuestType.SIDE,
            level_req=1,
            title="Collect Quest",
            description="Collect herbs",
            objective={"collect": {"item": "Herb", "count": 10}},
            rewards={"xp": 50, "gold": 25},
            created_at="2025-01-01T00:00:00Z"
        )
        
        # Not completed
        progress_not_complete = {"collect": {"Herb": 7}}
        assert QuestSystem.check_quest_completion(quest, progress_not_complete) is False
        
        # Completed
        progress_complete = {"collect": {"Herb": 10}}
        assert QuestSystem.check_quest_completion(quest, progress_complete) is True
    
    @pytest.mark.unit
    def test_update_quest_progress_kill(self):
        """Test updating quest progress for kill actions"""
        quest = Quest(
            id="q_test",
            quest_type=QuestType.STORY,
            level_req=1,
            title="Test Quest",
            description="Kill goblins",
            objective={"kill": {"enemy": "Goblin", "count": 5}},
            rewards={"xp": 100, "gold": 50},
            created_at="2025-01-01T00:00:00Z"
        )
        
        progress = {"kill": {"Goblin": 2}}
        
        # Update progress
        new_progress = QuestSystem.update_quest_progress(quest, progress, "kill", "Goblin", 1)
        
        assert new_progress["kill"]["Goblin"] == 3
        
        # Update with multiple kills
        new_progress = QuestSystem.update_quest_progress(quest, new_progress, "kill", "Goblin", 2)
        
        assert new_progress["kill"]["Goblin"] == 5
    
    @pytest.mark.unit
    def test_update_quest_progress_collect(self):
        """Test updating quest progress for collect actions"""
        quest = Quest(
            id="q_test",
            quest_type=QuestType.SIDE,
            level_req=1,
            title="Collect Quest",
            description="Collect herbs",
            objective={"collect": {"item": "Herb", "count": 10}},
            rewards={"xp": 50, "gold": 25},
            created_at="2025-01-01T00:00:00Z"
        )
        
        progress = {"collect": {"Herb": 3}}
        
        # Update progress
        new_progress = QuestSystem.update_quest_progress(quest, progress, "collect", "Herb", 2)
        
        assert new_progress["collect"]["Herb"] == 5
    
    @pytest.mark.unit
    def test_update_quest_progress_wrong_target(self):
        """Test updating quest progress with wrong target"""
        quest = Quest(
            id="q_test",
            quest_type=QuestType.STORY,
            level_req=1,
            title="Test Quest",
            description="Kill goblins",
            objective={"kill": {"enemy": "Goblin", "count": 5}},
            rewards={"xp": 100, "gold": 50},
            created_at="2025-01-01T00:00:00Z"
        )
        
        progress = {"kill": {"Goblin": 2}}
        
        # Update progress with wrong target
        new_progress = QuestSystem.update_quest_progress(quest, progress, "kill", "Wolf", 1)
        
        # Progress should not change
        assert new_progress["kill"]["Goblin"] == 2
    
    @pytest.mark.unit
    def test_get_available_quests(self):
        """Test getting available quests for character level"""
        quests_level_1 = QuestSystem.get_available_quests(1)
        quests_level_5 = QuestSystem.get_available_quests(5)
        
        assert isinstance(quests_level_1, list)
        assert isinstance(quests_level_5, list)
        
        # Should have some quests available
        assert len(quests_level_1) > 0
        assert len(quests_level_5) > 0
        
        # Higher level should have more quests available
        assert len(quests_level_5) >= len(quests_level_1)
        
        # Check quest structure
        for quest in quests_level_1:
            assert isinstance(quest, dict)
            assert "id" in quest
            assert "type" in quest
            assert "level_req" in quest
            assert "title" in quest
            assert "description" in quest
            assert "objective" in quest
            assert "rewards" in quest
            assert quest["level_req"] <= 1
