# **Game Design Document (GDD) – Telegram MMO RPG Bot (in progress)**

## **1\. Game Overview**

- **Title (in progress):** _Legends of the Realm  
    _
- **Platform:** Telegram Bot (mobile & desktop Telegram clients)  

- **Genre:** MMO RPG (text + image based)  

- **Monetization:** Free-to-play with in-bot purchases (Telegram Payments API)  

- **Target Audience:** 16+ casual & mid-core players, fans of RPGs, anime-style visuals, and collectible progression.  

## **2\. Core Gameplay Loop**

1. **Questing & Exploration** → Player starts quests, fights monsters, completes objectives.  

2. **Rewards & Progression** → Earn XP, gold, loot, storyline progress.  

3. **Customization** → Equip items, see updated character image, unlock skills.  

4. **PvP Competition** → Duel other players or climb Arena leaderboards.  

5. **Community & Economy** → Guilds, trading (Phase 2).  

6. **Monetization & Retention** → Daily login, premium currency, cosmetic purchases.  

## **3\. Systems & Features**

### **3.1 Characters**

- **Attributes:**

| **Attribute** | **Description** | **Example Scaling per Level** |
| --- | --- | --- |
| HP  | Health Points, damage capacity | +20 per level |
| --- | --- | --- |
| MP  | Mana Points, used for skills | +10 per level |
| --- | --- | --- |
| Attack | Physical damage dealt | +2 per level |
| --- | --- | --- |
| Defense | Reduces incoming physical damage | +1.5 per level |
| --- | --- | --- |
| Speed | Determines turn order in combat | +0.5 per level |
| --- | --- | --- |
| Crit Chance | % chance for double damage | +0.2% per level |
| --- | --- | --- |
| Strength | Increases melee attack & HP | +1 → +5 Attack, +10 HP |
| --- | --- | --- |
| Agility | Increases speed, dodge, crit chance | +1 → +0.5 Speed, +0.5% Crit |
| --- | --- | --- |
| Intelligence | Increases magic attack & MP | +1 → +5 Magic Damage, +10 MP |
| --- | --- | --- |

- **Classes:  
    **

| **Class** | **Skill Name** | **Level Unlock** | **Effect** |
| --- | --- | --- | --- |
| Warrior | **Shield Slam** | 1   | Deal 120% ATK, 30% chance to stun. |
| --- | --- | --- | --- |
| Warrior | **Battle Cry** | 5   | Buff +20% ATK to self for 3 turns. |
| --- | --- | --- | --- |
| Warrior | **Whirlwind** | 10  | AoE: 80% ATK to all enemies. |
| --- | --- | --- | --- |
| Mage | **Fireball** | 1   | Deal 150% INT as fire dmg. |
| --- | --- | --- | --- |
| Mage | **Ice Barrier** | 5   | Absorb 30% damage for 2 turns. |
| --- | --- | --- | --- |
| Mage | **Lightning Storm** | 10  | AoE: 100% INT dmg + 10% stun chance. |
| --- | --- | --- | --- |
| Rogue | **Backstab** | 1   | Deal 200% ATK, +50% crit chance if first turn. |
| --- | --- | --- | --- |
| Rogue | **Smoke Bomb** | 5   | 50% chance to dodge next attack. |
| --- | --- | --- | --- |
| Rogue | **Blade Dance** | 10  | Multi-hit: 3×70% ATK. |
| --- | --- | --- | --- |

- - (Future: Healer, Ranger, Paladin).  

- **Progression:  
    **
  - XP → Level up → Stat increase + Skill unlocks.  

  - Max Level (Season 1): Level 50.  

### **3.2 Inventory & Equipment**

- **Slots:** Weapon, Helmet, Armor, Boots, Accessory (ring/amulet).  

- **Item Rarity:** Common → Rare → Epic → Legendary.  

- **Acquisition:** Loot, Quests, Shop, PvP rewards.  

- **Inventory Limit:** 30 slots (expandable with Gems).  

### **3.3 Economy**

- **Gold (basic currency):  
    **
  - Earned from quests, monsters, PvP rewards.  

  - Used for equipment, potions, skill upgrades.  

- **Gems (premium currency):  
    **
  - Bought via Telegram Payments.  

  - Used for gold packs, rare items, cosmetic skins, inventory expansion.  

- **Drop Rates (example):  
    **
  - Common: 60%  

  - Rare: 25%  

  - Epic: 10%  

  - Legendary: 5%  

### **3.4 Quests & Storyline**

- **Story Quests:  
    **
  - Structured into Chapters (Season 1 = 5 Chapters, 20 quests each).  

  - Unlocks lore, cutscene text, boss fights.  

- **Side Quests:** Repeatable tasks (kill 10 goblins, collect herbs).  

- **Daily/Weekly Quests:** Encourage retention (daily login, arena battles).  

- **Boss Fights:** Require party/guild in Phase 2.  

### **3.5 PvE (Player vs Environment)**

- **Combat:  
    **
  - Turn-based battle in chat.  

  - Player selects **Attack / Skill / Item / Run**.  

  - Telegram bot responds with combat text + updated stats + enemy HP bar (emoji/ASCII).  

- **Monsters:  
    **
  - Categories: Common, Elite, Boss.  

  - Example:  
    - Goblin (HP 100, Atk 10) → drops gold + leather.  

    - Dragon (HP 5000, Atk 150) → boss fight.  

### **3.6 PvP (Player vs Player)**

- **Duel Command:** /duel @username  

- **Arena:** Ranked matchmaking system (ELO).  

- **Seasons:** Reset every 30 days.  

- **Rewards:** Gems, gold, exclusive cosmetics.  

- **Anti-cheat:** Cooldowns on challenges.  

### **3.7 Guilds & Social (Phase 2)**

- Create/join guilds.  

- Guild chat.  

- Shared storage.  

- Guild Wars (PvP team battles).  

## **4\. Visual System**

- **Character Sprite Generation:  
    **
  - Base character model (per class + gender).  

  - Equipment layered dynamically (weapon, armor, helmet, accessories).  

  - Image rendering via **PIL (Python)** or **node-canvas (Node.js)**.  

  - Output: PNG/JPEG sent in Telegram message with stats.  

- **Example Flow:  
    **
  - Player equips sword → Bot generates new sprite → Sends updated image.  

## **5\. Monetization**

1. **Premium Currency (Gems):  
    **
    - Starter Pack: 100 Gems = $2.99  

    - Big Pack: 1000 Gems = $19.99  

2. **Cosmetic Skins:  
    **
    - Seasonal skins (Halloween, Christmas).  

    - Guild-exclusive skins.  

3. **Inventory Expansion:  
    **
    - +10 slots = 100 Gems.  

4. **Battle Pass (Phase 2):  
    **
    - Exclusive rewards for seasonal progress.  

## **6\. Technical Specification**

- **Bot Framework (in progress):** Python (Aiogram) / Node.js (Telegraf).  

- **Database:** PostgreSQL (structured data, transactions).
- **Database Schema (simplified):  
    **
  - users: id, telegram_id, gems, gold, level, class.  

  - characters: user_id, stats, equipped_items.  

  - inventory: char_id, item_id, qty.  

  - quests: char_id, quest_id, progress.  

  - pvp_matches: match_id, player1, player2, result.  

- **Scaling:** Redis caching for active battles, async job queues for PvE combat.  

- **Image Processing:** PIL (Python) or node-canvas.  

- **Hosting:** VPS (DigitalOcean, AWS EC2).  

- **Payments:** Telegram Payments API (Stripe/PayPal support).

## **7\. Retention & Engagement**

- **Daily Login Rewards** (gold, potions, Gems).  

- **Events:** Seasonal quests, time-limited bosses.  

- **Leaderboard Competitions:** PvP + PvE achievements.  

- **Push Notifications:** Quest reminders, event alerts.  

## **8\. Example User Flow**

1. Player types /start.  

2. Chooses class → Bot generates initial character image.  

3. Starts first quest → Fights goblins → Gains gold & XP.  

4. Visits Shop → Buys sword → Character image updates.  

5. Joins PvP Arena → Climbs ranks → Wins Gems.  

6. Purchases skin with Gems → Updated sprite sent.  

## **9\. API Example**

# **API Overview**

- **Base URL:** <https://api.example.com/v1>  

- **Auth:  
    **
  - **Bot → Backend:** shared secret via X-Bot-Token (webhook).  

  - **Client apps / Admin panel:** JWT Bearer tokens after Telegram Login verification.  

- **Format:** JSON only, application/json  

- **Idempotency:** Use Idempotency-Key header for POST/PUT with side effects.  

- **Pagination:** Cursor-based — ?limit=20&cursor=abc123  

- **Errors (uniform):  
    **

{

"error": {

"code": "RESOURCE_NOT_FOUND",

"message": "Character not found.",

"details": {"character_id":"ch_123"}

}

}

## **0) Core Schemas (JSON)**

### **0.1 User**

{

"id": "usr_9c3a",

"telegram_id": 123456789,

"username": "carpe_diem",

"gold": 2500,

"gems": 120,

"created_at": "2025-09-08T10:02:40Z",

"updated_at": "2025-09-08T10:02:40Z"

}

### **0.2 Character**

{

"id": "ch_123",

"user_id": "usr_9c3a",

"name": "Aria",

"class": "Mage",

"level": 7,

"xp": 1420,

"stats": {

"hp": 320,

"mp": 210,

"attack": 36,

"defense": 22,

"speed": 9.5,

"crit_chance": 0.07,

"strength": 8,

"agility": 10,

"intelligence": 24

},

"equipment": {

"weapon": "itm_wpn_steel_staff",

"helmet": "itm_hel_apprentice_hood",

"armor": "itm_arm_mystic_robe",

"boots": "itm_boo_soft_leather",

"accessory": "itm_acc_mana_ring"

},

"sprite_url": "<https://cdn.example.com/sprites/ch_123/v45.png>",

"created_at": "2025-09-01T09:00:00Z",

"updated_at": "2025-09-08T10:00:00Z"

}

### **0.3 Item**

{

"id": "itm_arm_mystic_robe",

"type": "Armor",

"rarity": "Rare",

"name": "Mystic Robe",

"description": "Silken robes infused with latent mana.",

"stats": {

"defense": 30,

"hp": 40,

"resist": {"fire": 0.1}

},

"price_gold": 800,

"price_gems": null,

"stackable": false,

"icon_url": "<https://cdn.example.com/items/itm_arm_mystic_robe.png>",

"overlay_layer": "armor" // used by renderer

}

### **0.4 Inventory Item**

{

"id": "inv_77a",

"character_id": "ch_123",

"item_id": "itm_pot_heal_s",

"qty": 5,

"is_equipped": false

}

### **0.5 Quest**

{

"id": "q_goblin_hunt_01",

"type": "Story",

"level_req": 1,

"objective": {"kill": {"enemy":"Goblin", "count":5}},

"rewards": {"xp": 100, "gold": 50, "items": \["itm_pot_heal_s"\]},

"status": "in_progress",

"progress": {"kill":{"enemy":"Goblin","count":2}}

}

### **0.6 PvE Battle**

{

"id": "pve_6df",

"character_id": "ch_123",

"enemy": {"type":"Goblin","level":3,"hp":100,"attack":10},

"state": {

"turn": 3,

"character_hp": 260,

"character_mp": 180,

"enemy_hp": 20,

"log": \[

"You cast Fireball (45 dmg)",

"Goblin hits (8 dmg)"

\]

},

"result": null, // "win" | "lose" | null (ongoing)

"created_at": "2025-09-08T10:00:04Z"

}

### **0.7 PvP Match**

{

"id": "pvp_9aa",

"challenger_id": "ch_123",

"opponent_id": "ch_555",

"status": "active", // "pending" | "active" | "finished"

"round": 2,

"log": \["Aria opens with Fireball (62 dmg)"\],

"winner_id": null,

"rating_delta": 0,

"created_at": "2025-09-08T10:05:00Z"

}

### **0.8 Payment Intent**

{

"id": "pay_42f",

"user_id": "usr_9c3a",

"product": "gems_pack_1000",

"amount_minor": 1999,

"currency": "USD",

"status": "pending", // "pending" | "succeeded" | "failed" | "canceled"

"provider": "telegram",

"metadata": {"source":"shop_screen","campaign":"SEPT25"},

"confirmation_url": "<https://t.me/YourBot?start=pay_42f>"

}

### **0.9 Render Job (Character Composite)**

{

"id": "rnd_88c",

"character_id": "ch_123",

"layers": \[

{"asset":"base/mage_f.png"},

{"asset":"armor/mystic_robe.png"},

{"asset":"helmet/apprentice_hood.png"},

{"asset":"weapon/steel_staff.png"}

\],

"status": "processing", // "queued" | "processing" | "done" | "failed"

"result_url": null,

"created_at": "2025-09-08T10:00:05Z"

}

# **Endpoints**

## **1) Auth**

### **1.1 Verify Telegram Login → Issue JWT**

POST /auth/telegram/verify

{

"init_data": "query_string_from_telegram_login_widget",

"expected_bot_username": "YourBot"

}

**200**

{

"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",

"user": {

"id": "usr_9c3a",

"telegram_id": 123456789,

"username": "carpe_diem"

}

}

Server validates HMAC per Telegram Login docs and issues short-lived JWT (e.g., 1h) + refresh token (optional).

## **2) Users & Characters**

### **2.1 Get Me**

GET /me (JWT)

**200**

{"user":{"id":"usr_9c3a","gold":2500,"gems":120},"characters":\[{...}\]}

### **2.2 Create Character**

POST /characters (JWT)

Headers: Idempotency-Key: 6f0e-...

{"name":"Aria","class":"Mage"}

**201**

{"character": { "...": "Character object" }}

### **2.3 Get Character**

GET /characters/{character_id}

### **2.4 List Characters**

GET /characters?limit=20&cursor=abc123

### **2.5 Delete Character**

DELETE /characters/{character_id}

## **3) Inventory & Equipment**

### **3.1 List Inventory**

GET /characters/{character_id}/inventory

**200**

{"items":\[{"id":"inv_77a","item_id":"itm_pot_heal_s","qty":5,"is_equipped":false}\]}

### **3.2 Equip Item**

POST /characters/{character_id}/equipment/equip

Headers: Idempotency-Key: ...

{"inventory_item_id":"inv_451","slot":"weapon"}

**200**

{

"character": { "...updated..." },

"render_job": { "id":"rnd_88c","status":"queued" }

}

### **3.3 Unequip Item**

POST /characters/{character_id}/equipment/unequip

{"slot":"weapon"}

### **3.4 Use Consumable**

POST /characters/{character_id}/inventory/use

{"inventory_item_id":"inv_77a","qty":1}

## **4) Items & Shop**

### **4.1 List Items (catalog)**

GET /items?type=Weapon&rarity=Rare&limit=20&cursor=...

### **4.2 Buy with Gold**

POST /shop/buy/gold

Headers: Idempotency-Key: ...

{"character_id":"ch_123","item_id":"itm_wpn_steel_sword","qty":1}

**200**

{"gold_spent":600,"inventory_item":{"id":"inv_999","item_id":"itm_wpn_steel_sword","qty":1}}

### **4.3 Create Payment Intent (Gems)**

POST /payments/intents

{"product":"gems_pack_1000","currency":"USD"}

**201**

{"payment_intent":{"id":"pay_42f","status":"pending","confirmation_url":"<https://t.me/YourBot?start=pay_42f"}}>

## **5) Quests**

### **5.1 List Available Quests**

GET /characters/{character_id}/quests?status=available

### **5.2 Accept Quest**

POST /characters/{character_id}/quests/{quest_id}/accept

Headers: Idempotency-Key: ...

**200**

{"quest":{"id":"q_goblin_hunt_01","status":"in_progress","progress":{"kill":{"enemy":"Goblin","count":0}}}}

### **5.3 Report Progress (server or bot calls this)**

POST /characters/{character_id}/quests/{quest_id}/progress

{"increment":{"kill":{"enemy":"Goblin","count":1}}}

### **5.4 Complete Quest**

POST /characters/{character_id}/quests/{quest_id}/complete

**200**

{"rewards":{"xp":100,"gold":50,"items":\["itm_pot_heal_s"\]},"character":{"level":2,"xp":20}}

## **6) PvE Battles**

### **6.1 Start Battle**

POST /pve/battles

Headers: Idempotency-Key: ...

{"character_id":"ch_123","enemy_type":"Goblin","enemy_level":3}

**201**

{"battle": { "...PvE Battle object..." }}

### **6.2 Take Turn (choose action)**

POST /pve/battles/{battle_id}/turns

{

"action": "skill", // "attack" | "skill" | "item" | "run"

"skill_id": "sk_fireball",

"target": "enemy"

}

**200**

{"battle":{"state":{"turn":4,"character_hp":248,"enemy_hp":0},"result":"win","loot":{"gold":12,"items":\["itm_leather_scrap"\]}}}

## **7) PvP**

### **7.1 Challenge Player**

POST /pvp/challenges

Headers: Idempotency-Key: ...

{"challenger_id":"ch_123","opponent_id":"ch_555","mode":"duel"}

**201**

{"match":{"id":"pvp_9aa","status":"pending"}}

### **7.2 Accept Challenge**

POST /pvp/matches/{match_id}/accept

### **7.3 Submit Turn**

POST /pvp/matches/{match_id}/turns

{"action":"attack"}

### **7.4 Get Match**

GET /pvp/matches/{match_id}

### **7.5 Leaderboard (Arena)**

GET /pvp/arena/leaderboard?season=2025-09&limit=100

**200**

{"season":"2025-09","entries":\[{"character_id":"ch_555","rating":1876}, {"character_id":"ch_123","rating":1832}\]}

## **8) Rendering (Character Image)**

### **8.1 Request Render (usually auto on equip)**

POST /render/characters/{character_id}

**201**

{"render_job":{"id":"rnd_88c","status":"queued"}}

### **8.2 Get Render Job**

GET /render/jobs/{render_job_id}

**200**

{"render_job":{"id":"rnd_88c","status":"done","result_url":"<https://cdn.example.com/sprites/ch_123/v46.png"}}>

## **9) Payments & Webhooks**

### **9.1 List Products**

GET /payments/products

{

"products": \[

{"id":"gems_pack_100","amount_minor":299,"currency":"USD","gems":100},

{"id":"gems_pack_1000","amount_minor":1999,"currency":"USD","gems":1000}

\]

}

### **9.2 Telegram Payment Webhook (server-to-server)**

POST /webhooks/telegram/payments (secured by IP/signature)

{

"event": "payment.succeeded",

"payment_intent_id": "pay_42f",

"provider": "telegram",

"provider_payload": {"invoice_payload":"...","telegram_payment_charge_id":"..."},

"amount_minor": 1999,

"currency": "USD",

"user": {"telegram_id": 123456789}

}

**200**

{"ok": true}

_Server side effects:_ mark pay_42f as succeeded, credit gems, emit internal event.

## **10) Webhooks (internal & bot)**

Your backend can also notify the bot or dashboards via webhooks.

### **10.1 Render Completed**

POST <https://bot.example.com/webhooks/render>

{

"event": "render.completed",

"character_id": "ch_123",

"render_job_id": "rnd_88c",

"sprite_url": "<https://cdn.example.com/sprites/ch_123/v46.png>"

}

### **10.2 PvP Match Finished**

POST <https://bot.example.com/webhooks/pvp>

{

"event": "pvp.match.finished",

"match_id": "pvp_9aa",

"winner_id": "ch_123",

"rating_delta": 18

}

## **11) Admin (optional but useful)**

### **11.1 Grant Currency**

POST /admin/users/{user_id}/grant

{"gold":10000,"gems":500,"reason":"compensation_bugfix_2025_09"}

### **11.2 Create/Update Item**

PUT /admin/items/{item_id}

{

"name":"Dragon Slayer",

"type":"Weapon",

"rarity":"Legendary",

"stats":{"attack":50,"crit_chance":0.1,"pve_multiplier":1.2},

"price_gold":5000

}

# **Security, Reliability & Ops Notes**

- **JWT** for user/admin APIs; short TTL + refresh or re-verify via Telegram Login.  

- **Idempotency** on purchase/equip/turn endpoints prevents double actions.  

- **Rate Limits:** e.g., X-RateLimit-Limit/Remaining/Reset headers; burst + sustained buckets.  

- **Validation:** reject actions if character in active battle, dead, or out of MP.  

- **Anti-cheat:** server authoritative combat resolution; cooldowns; audit trails.  

- **Observability:** structured logs (trace_id), metrics per endpoint, SLOs.  

- **CDN for sprites**; render jobs processed async (queue: e.g., Redis/Sidekiq/RQ).  

- **Migrations:** versioned content (items, quests) with content_version.  

# **Example Telegram Bot ↔ Backend Flow (Equip → Render → Update)**

1. Bot calls **Equip**:  

POST /characters/ch_123/equipment/equip

{"inventory_item_id":"inv_451","slot":"weapon"}

1. Backend returns render_job.  

2. Renderer builds composite → pushes **render.completed** webhook to Bot with sprite_url.  

3. Bot sends updated character card image to the player in Telegram.  

If you want, I can also generate:

- **OpenAPI (Swagger) YAML** for these endpoints, or  

- **DB schema (SQL)** for users, characters, inventory, items, quests, etc., or  

- **Sample bot handlers** (pseudo-code) for Aiogram/Telegraf wired to these APIs.

