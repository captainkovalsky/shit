from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from enum import Enum
import json

class CharacterClass(Enum):
    WARRIOR = "Warrior"
    MAGE = "Mage"
    ROGUE = "Rogue"

class ItemType(Enum):
    WEAPON = "Weapon"
    ARMOR = "Armor"
    HELMET = "Helmet"
    BOOTS = "Boots"
    ACCESSORY = "Accessory"
    CONSUMABLE = "Consumable"

class ItemRarity(Enum):
    COMMON = "Common"
    RARE = "Rare"
    EPIC = "Epic"
    LEGENDARY = "Legendary"

class QuestType(Enum):
    STORY = "Story"
    SIDE = "Side"
    DAILY = "Daily"
    WEEKLY = "Weekly"

class QuestStatus(Enum):
    AVAILABLE = "available"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class BattleStatus(Enum):
    PENDING = "pending"
    ACTIVE = "active"
    FINISHED = "finished"

class PaymentStatus(Enum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELED = "canceled"

class RenderStatus(Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"

@dataclass
class CharacterStats:
    hp: int
    mp: int
    attack: int
    defense: int
    speed: float
    crit_chance: float
    strength: int
    agility: int
    intelligence: int
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CharacterStats':
        return cls(**data)
    
    @classmethod
    def create_base_stats(cls, character_class: CharacterClass, level: int = 1) -> 'CharacterStats':
        """Create base stats for a character based on class and level"""
        base_hp = 100 + (level - 1) * 20
        base_mp = 50 + (level - 1) * 10
        base_attack = 10 + (level - 1) * 2
        base_defense = 5 + (level - 1) * 1.5
        base_speed = 5.0 + (level - 1) * 0.5
        base_crit_chance = 0.05 + (level - 1) * 0.002
        
        # Class-specific bonuses
        if character_class == CharacterClass.WARRIOR:
            strength = 8 + level
            agility = 5 + level
            intelligence = 3 + level
            hp_bonus = 20
            attack_bonus = 5
        elif character_class == CharacterClass.MAGE:
            strength = 3 + level
            agility = 5 + level
            intelligence = 8 + level
            hp_bonus = 0
            attack_bonus = 0
        else:  # ROGUE
            strength = 5 + level
            agility = 8 + level
            intelligence = 5 + level
            hp_bonus = 0
            attack_bonus = 0
        
        return cls(
            hp=base_hp + hp_bonus,
            mp=base_mp,
            attack=base_attack + attack_bonus,
            defense=base_defense,
            speed=base_speed,
            crit_chance=base_crit_chance,
            strength=strength,
            agility=agility,
            intelligence=intelligence
        )

@dataclass
class Equipment:
    weapon: Optional[str] = None
    helmet: Optional[str] = None
    armor: Optional[str] = None
    boots: Optional[str] = None
    accessory: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Equipment':
        return cls(**data)

@dataclass
class User:
    id: str
    telegram_id: int
    username: Optional[str]
    gold: int
    gems: int
    created_at: str
    updated_at: str
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class Character:
    id: str
    user_id: str
    name: str
    character_class: CharacterClass
    level: int
    xp: int
    stats: CharacterStats
    equipment: Equipment
    sprite_url: Optional[str]
    created_at: str
    updated_at: str
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['class'] = self.character_class.value
        data['stats'] = self.stats.to_dict()
        data['equipment'] = self.equipment.to_dict()
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Character':
        return cls(
            id=data['id'],
            user_id=data['user_id'],
            name=data['name'],
            character_class=CharacterClass(data['class']),
            level=data['level'],
            xp=data['xp'],
            stats=CharacterStats.from_dict(data['stats']),
            equipment=Equipment.from_dict(data['equipment']),
            sprite_url=data.get('sprite_url'),
            created_at=data['created_at'],
            updated_at=data['updated_at']
        )

@dataclass
class Item:
    id: str
    item_type: ItemType
    rarity: ItemRarity
    name: str
    description: str
    stats: Dict[str, Any]
    price_gold: int
    price_gems: Optional[int]
    stackable: bool
    icon_url: Optional[str]
    overlay_layer: Optional[str]
    created_at: str
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['type'] = self.item_type.value
        data['rarity'] = self.rarity.value
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Item':
        return cls(
            id=data['id'],
            item_type=ItemType(data['type']),
            rarity=ItemRarity(data['rarity']),
            name=data['name'],
            description=data['description'],
            stats=data['stats'],
            price_gold=data['price_gold'],
            price_gems=data.get('price_gems'),
            stackable=data['stackable'],
            icon_url=data.get('icon_url'),
            overlay_layer=data.get('overlay_layer'),
            created_at=data['created_at']
        )

@dataclass
class InventoryItem:
    id: str
    character_id: str
    item_id: str
    qty: int
    is_equipped: bool
    created_at: str
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class Quest:
    id: str
    quest_type: QuestType
    level_req: int
    title: str
    description: str
    objective: Dict[str, Any]
    rewards: Dict[str, Any]
    created_at: str
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['type'] = self.quest_type.value
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Quest':
        return cls(
            id=data['id'],
            quest_type=QuestType(data['type']),
            level_req=data['level_req'],
            title=data['title'],
            description=data['description'],
            objective=data['objective'],
            rewards=data['rewards'],
            created_at=data['created_at']
        )

@dataclass
class CharacterQuest:
    id: str
    character_id: str
    quest_id: str
    status: QuestStatus
    progress: Dict[str, Any]
    created_at: str
    updated_at: str
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['status'] = self.status.value
        return data

@dataclass
class PvEBattle:
    id: str
    character_id: str
    enemy: Dict[str, Any]
    state: Dict[str, Any]
    result: Optional[str]
    created_at: str
    updated_at: str
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class PvPMatch:
    id: str
    challenger_id: str
    opponent_id: str
    status: BattleStatus
    round: int
    log: List[str]
    winner_id: Optional[str]
    rating_delta: int
    created_at: str
    updated_at: str
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['status'] = self.status.value
        return data

@dataclass
class CharacterRating:
    character_id: str
    rating: int
    season: str
    wins: int
    losses: int
    created_at: str
    updated_at: str
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class PaymentIntent:
    id: str
    user_id: str
    product: str
    amount_minor: int
    currency: str
    status: PaymentStatus
    provider: str
    metadata: Dict[str, Any]
    confirmation_url: Optional[str]
    created_at: str
    updated_at: str
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['status'] = self.status.value
        return data

@dataclass
class RenderJob:
    id: str
    character_id: str
    layers: List[Dict[str, str]]
    status: RenderStatus
    result_url: Optional[str]
    created_at: str
    updated_at: str
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['status'] = self.status.value
        return data
