import os
import asyncio
from PIL import Image, ImageDraw, ImageFont
from typing import Dict, Any, List, Optional, Tuple
import json
from models import Character, Equipment, CharacterClass
from config import Config

class CharacterSpriteGenerator:
    """Generates character sprites with equipment layering"""
    
    def __init__(self, assets_path: str = "assets/sprites"):
        self.assets_path = assets_path
        self.base_sprites = {
            CharacterClass.WARRIOR: {
                "male": "warrior_m.png",
                "female": "warrior_f.png"
            },
            CharacterClass.MAGE: {
                "male": "mage_m.png",
                "female": "mage_f.png"
            },
            CharacterClass.ROGUE: {
                "male": "rogue_m.png",
                "female": "rogue_f.png"
            }
        }
        
        # Equipment layer mapping
        self.equipment_layers = {
            "weapon": "weapons/",
            "helmet": "helmets/",
            "armor": "armor/",
            "boots": "boots/",
            "accessory": "accessories/"
        }
    
    async def generate_character_sprite(self, character: Character, 
                                      gender: str = "male") -> str:
        """Generate a character sprite with equipment"""
        try:
            # Load base character sprite
            base_sprite_path = os.path.join(
                self.assets_path, 
                self.base_sprites[character.character_class][gender]
            )
            
            if not os.path.exists(base_sprite_path):
                # Create a placeholder if base sprite doesn't exist
                base_image = self._create_placeholder_sprite(character.character_class, gender)
            else:
                base_image = Image.open(base_sprite_path).convert("RGBA")
            
            # Apply equipment layers
            final_image = await self._apply_equipment_layers(base_image, character.equipment)
            
            # Generate filename
            filename = f"character_{character.id}_{character.level}.png"
            output_path = os.path.join("generated_sprites", filename)
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Save the final image
            final_image.save(output_path, "PNG")
            
            # Return URL (in production, this would be uploaded to CDN)
            return f"{Config.CDN_BASE_URL}{Config.SPRITE_BASE_PATH}/{filename}"
            
        except Exception as e:
            print(f"Error generating sprite: {e}")
            return self._create_fallback_sprite(character)
    
    async def _apply_equipment_layers(self, base_image: Image.Image, 
                                    equipment: Equipment) -> Image.Image:
        """Apply equipment layers to base sprite"""
        result_image = base_image.copy()
        
        # Apply equipment in order (background to foreground)
        layer_order = ["boots", "armor", "helmet", "weapon", "accessory"]
        
        for layer in layer_order:
            equipment_id = getattr(equipment, layer, None)
            if equipment_id:
                equipment_image = await self._load_equipment_image(layer, equipment_id)
                if equipment_image:
                    result_image = self._blend_layers(result_image, equipment_image)
        
        return result_image
    
    async def _load_equipment_image(self, equipment_type: str, equipment_id: str) -> Optional[Image.Image]:
        """Load equipment image from assets"""
        try:
            equipment_path = os.path.join(
                self.assets_path,
                self.equipment_layers[equipment_type],
                f"{equipment_id}.png"
            )
            
            if os.path.exists(equipment_path):
                return Image.open(equipment_path).convert("RGBA")
            else:
                # Create placeholder equipment
                return self._create_equipment_placeholder(equipment_type, equipment_id)
                
        except Exception as e:
            print(f"Error loading equipment image {equipment_id}: {e}")
            return None
    
    def _blend_layers(self, base: Image.Image, overlay: Image.Image) -> Image.Image:
        """Blend overlay onto base image"""
        # Ensure both images are the same size
        if base.size != overlay.size:
            overlay = overlay.resize(base.size, Image.Resampling.LANCZOS)
        
        # Blend using alpha compositing
        return Image.alpha_composite(base, overlay)
    
    def _create_placeholder_sprite(self, character_class: CharacterClass, gender: str) -> Image.Image:
        """Create a placeholder sprite when base assets are missing"""
        # Create a simple colored rectangle as placeholder
        size = (64, 64)
        image = Image.new("RGBA", size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        
        # Color based on class
        colors = {
            CharacterClass.WARRIOR: (139, 69, 19),  # Brown
            CharacterClass.MAGE: (75, 0, 130),       # Purple
            CharacterClass.ROGUE: (0, 100, 0)       # Dark green
        }
        
        color = colors.get(character_class, (128, 128, 128))
        
        # Draw character silhouette
        draw.ellipse([8, 8, 56, 56], fill=color)
        draw.rectangle([20, 20, 44, 44], fill=(255, 255, 255, 100))
        
        return image
    
    def _create_equipment_placeholder(self, equipment_type: str, equipment_id: str) -> Image.Image:
        """Create placeholder equipment image"""
        size = (64, 64)
        image = Image.new("RGBA", size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        
        # Simple equipment representation
        if equipment_type == "weapon":
            draw.rectangle([30, 20, 34, 50], fill=(192, 192, 192))
        elif equipment_type == "helmet":
            draw.ellipse([20, 10, 44, 30], fill=(100, 100, 100))
        elif equipment_type == "armor":
            draw.rectangle([15, 25, 49, 45], fill=(50, 50, 50))
        elif equipment_type == "boots":
            draw.ellipse([20, 45, 28, 55], fill=(25, 25, 25))
            draw.ellipse([36, 45, 44, 55], fill=(25, 25, 25))
        elif equipment_type == "accessory":
            draw.ellipse([28, 15, 36, 23], fill=(255, 215, 0))
        
        return image
    
    def _create_fallback_sprite(self, character: Character) -> str:
        """Create a fallback sprite when generation fails"""
        # Create a simple text-based sprite
        size = (64, 64)
        image = Image.new("RGBA", size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        
        # Draw character class initial
        class_initial = character.character_class.value[0]
        try:
            font = ImageFont.truetype("arial.ttf", 24)
        except:
            font = ImageFont.load_default()
        
        draw.text((20, 20), class_initial, fill=(255, 255, 255), font=font)
        
        # Save fallback
        filename = f"fallback_{character.id}.png"
        output_path = os.path.join("generated_sprites", filename)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        image.save(output_path, "PNG")
        
        return f"{Config.CDN_BASE_URL}{Config.SPRITE_BASE_PATH}/{filename}"

class CharacterCardGenerator:
    """Generates character info cards with stats"""
    
    def __init__(self):
        self.card_size = (400, 600)
        self.background_color = (20, 20, 40)
        self.text_color = (255, 255, 255)
        self.accent_color = (100, 150, 255)
    
    async def generate_character_card(self, character: Character, 
                                   sprite_url: str) -> str:
        """Generate a character info card"""
        try:
            # Create card background
            card = Image.new("RGBA", self.card_size, self.background_color)
            draw = ImageDraw.Draw(card)
            
            # Load character sprite
            sprite_image = await self._load_sprite_image(sprite_url)
            if sprite_image:
                # Resize and position sprite
                sprite_image = sprite_image.resize((200, 200), Image.Resampling.LANCZOS)
                card.paste(sprite_image, (100, 50), sprite_image)
            
            # Add character info
            await self._add_character_info(card, character)
            
            # Add stats
            await self._add_character_stats(card, character)
            
            # Save card
            filename = f"card_{character.id}_{character.level}.png"
            output_path = os.path.join("generated_cards", filename)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            card.save(output_path, "PNG")
            
            return f"{Config.CDN_BASE_URL}/cards/{filename}"
            
        except Exception as e:
            print(f"Error generating character card: {e}")
            return self._create_fallback_card(character)
    
    async def _load_sprite_image(self, sprite_url: str) -> Optional[Image.Image]:
        """Load sprite image from URL or local path"""
        try:
            # In production, this would download from CDN
            # For now, try to load from local path
            local_path = sprite_url.replace(Config.CDN_BASE_URL, "generated_sprites")
            if os.path.exists(local_path):
                return Image.open(local_path).convert("RGBA")
        except Exception as e:
            print(f"Error loading sprite: {e}")
        return None
    
    async def _add_character_info(self, card: Image.Image, character: Character):
        """Add character name, class, and level to card"""
        draw = ImageDraw.Draw(card)
        
        try:
            title_font = ImageFont.truetype("arial.ttf", 24)
            info_font = ImageFont.truetype("arial.ttf", 16)
        except:
            title_font = ImageFont.load_default()
            info_font = ImageFont.load_default()
        
        # Character name
        draw.text((200, 270), character.name, fill=self.text_color, 
                 font=title_font, anchor="mm")
        
        # Class and level
        class_level_text = f"{character.character_class.value} - Level {character.level}"
        draw.text((200, 300), class_level_text, fill=self.accent_color, 
                 font=info_font, anchor="mm")
        
        # XP progress
        xp_text = f"XP: {character.xp}"
        draw.text((200, 320), xp_text, fill=self.text_color, 
                 font=info_font, anchor="mm")
    
    async def _add_character_stats(self, card: Image.Image, character: Character):
        """Add character stats to card"""
        draw = ImageDraw.Draw(card)
        
        try:
            stat_font = ImageFont.truetype("arial.ttf", 14)
        except:
            stat_font = ImageFont.load_default()
        
        stats = character.stats
        y_start = 350
        
        # Stat rows
        stat_rows = [
            ("HP", stats.hp),
            ("MP", stats.mp),
            ("Attack", stats.attack),
            ("Defense", stats.defense),
            ("Speed", f"{stats.speed:.1f}"),
            ("Crit Chance", f"{stats.crit_chance:.1%}"),
            ("Strength", stats.strength),
            ("Agility", stats.agility),
            ("Intelligence", stats.intelligence)
        ]
        
        for i, (stat_name, stat_value) in enumerate(stat_rows):
            y_pos = y_start + (i * 20)
            stat_text = f"{stat_name}: {stat_value}"
            draw.text((50, y_pos), stat_text, fill=self.text_color, font=stat_font)
    
    def _create_fallback_card(self, character: Character) -> str:
        """Create a fallback character card"""
        card = Image.new("RGBA", self.card_size, self.background_color)
        draw = ImageDraw.Draw(card)
        
        try:
            font = ImageFont.truetype("arial.ttf", 20)
        except:
            font = ImageFont.load_default()
        
        # Simple text-based card
        draw.text((200, 300), character.name, fill=self.text_color, 
                 font=font, anchor="mm")
        draw.text((200, 330), f"{character.character_class.value} - Level {character.level}", 
                 fill=self.accent_color, font=font, anchor="mm")
        
        filename = f"fallback_card_{character.id}.png"
        output_path = os.path.join("generated_cards", filename)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        card.save(output_path, "PNG")
        
        return f"{Config.CDN_BASE_URL}/cards/{filename}"

# Global instances
sprite_generator = CharacterSpriteGenerator()
card_generator = CharacterCardGenerator()
