# 🎮 Legends of the Realm - MMO RPG Telegram Bot

A comprehensive MMO RPG game built as a Telegram bot with TypeScript, featuring character progression, combat, quests, PvP, and monetization features.

> **Note**: This project has been migrated from Python to TypeScript. See [README-TYPESCRIPT.md](README-TYPESCRIPT.md) for the current TypeScript implementation.

## 🌟 Features

### Core Gameplay
- **Character System**: Create and customize characters with different classes (Warrior, Mage, Rogue)
- **Turn-based Combat**: Strategic PvE battles with skills and equipment
- **Quest System**: Story quests, side quests, and daily challenges
- **Inventory & Equipment**: Collect and equip weapons, armor, and accessories
- **Character Progression**: Level up, gain stats, and unlock new abilities

### Advanced Features
- **PvP Arena**: Duel other players and climb the leaderboards
- **Dynamic Character Sprites**: Auto-generated character images with equipment layering
- **Economy System**: Gold and premium currency (Gems) with in-app purchases
- **Guild System**: (Phase 2) Create and join guilds for cooperative gameplay
- **Real-time Updates**: Live character stats and battle results

### Technical Features
- **RESTful API**: Complete API for web clients and admin panels
- **Webhook Support**: Real-time notifications and payment processing
- **Image Generation**: Dynamic character sprite creation with PIL
- **Database**: PostgreSQL with async support for scalability
- **Payment Integration**: Telegram Payments API for premium currency

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis (optional, for caching)
- Telegram Bot Token

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mmorpg-telegram-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure your environment**
   - Update `.env` file with your bot token and database credentials
   - Set up your PostgreSQL database
   - Configure payment provider tokens

4. **Set up database**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start the services**
   ```bash
   npm run dev
   ```

### Manual Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up database**
   ```bash
   createdb mmorpg_bot
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize database**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start the bot**
   ```bash
   npm run dev
   ```

## 🎯 Game Commands

### Basic Commands
- `/start` - Start the game and create your first character
- `/menu` - Access the main game menu
- `/help` - Show help information

### Character Management
- Create characters with different classes
- View character stats and equipment
- Level up and gain new abilities

### Combat
- Start PvE battles against monsters
- Use skills and items strategically
- Earn XP, gold, and loot

### Quests
- Accept story and side quests
- Complete objectives to earn rewards
- Progress through the game's storyline

### PvP
- Challenge other players to duels
- Climb the arena leaderboards
- Earn ranking rewards

## 🏗️ Architecture

### Core Components

```
├── src/
│   ├── bot/            # Telegram bot implementation
│   ├── api/            # REST API and webhooks
│   ├── database/       # Database models and services
│   ├── game/           # Game logic and services
│   ├── image/          # Character sprite generation
│   ├── config/         # Configuration management
│   └── utils/          # Utility functions
├── prisma/             # Database schema
├── tests/              # Test suite
└── package.json        # Dependencies and scripts
```

### Database Schema

- **users**: Player accounts and currency
- **characters**: Character data and stats
- **items**: Item definitions and properties
- **inventory**: Character item ownership
- **quests**: Quest definitions and objectives
- **character_quests**: Player quest progress
- **pve_battles**: PvE combat sessions
- **pvp_matches**: PvP combat sessions
- **payment_intents**: In-app purchase tracking
- **render_jobs**: Character sprite generation queue

## 🔧 Configuration

### Environment Variables

```bash
# Telegram Bot
BOT_TOKEN=your_bot_token_here
WEBHOOK_URL=https://yourdomain.com/webhook

# Database
DATABASE_URL=postgresql://user:pass@localhost/mmorpg_bot
REDIS_URL=redis://localhost:6379/0

# Payments
TELEGRAM_PAYMENT_PROVIDER_TOKEN=your_payment_token

# Security
JWT_SECRET_KEY=your_jwt_secret
WEBHOOK_SECRET_KEY=your_webhook_secret

# CDN
CDN_BASE_URL=https://cdn.yourdomain.com
```

### Game Configuration

- `MAX_CHARACTERS_PER_USER`: Maximum characters per player (default: 3)
- `MAX_INVENTORY_SLOTS`: Maximum inventory slots (default: 30)
- `BASE_INVENTORY_SLOTS`: Starting inventory slots (default: 20)

## 📊 API Endpoints

### Authentication
- `POST /auth/telegram/verify` - Verify Telegram login

### Characters
- `GET /api/v1/characters` - List user characters
- `POST /api/v1/characters` - Create new character
- `GET /api/v1/characters/{id}` - Get character details
- `GET /api/v1/characters/{id}/inventory` - Get character inventory

### Equipment
- `POST /api/v1/characters/{id}/equipment/equip` - Equip item
- `POST /api/v1/characters/{id}/equipment/unequip` - Unequip item

### Combat
- `POST /api/v1/pve/battles` - Start PvE battle
- `POST /api/v1/pve/battles/{id}/turns` - Take combat turn

### Quests
- `GET /api/v1/characters/{id}/quests` - Get character quests
- `POST /api/v1/characters/{id}/quests/{id}/accept` - Accept quest

### Shop
- `GET /api/v1/items` - Browse items
- `POST /api/v1/shop/buy/gold` - Buy item with gold

### Payments
- `POST /api/v1/payments/intents` - Create payment intent

## 🎨 Character Sprites

The bot generates dynamic character sprites by layering equipment on base character images:

1. **Base Character**: Class and gender-specific base sprite
2. **Equipment Layers**: Weapons, armor, helmets, boots, accessories
3. **Final Composite**: Blended image with all equipment visible

### Sprite Generation Process

```typescript
// Generate character sprite
const spriteUrl = await imageService.generateCharacterSprite(character);

// Create character card with stats
const cardUrl = await imageService.generateCharacterCard(character, spriteUrl);
```

## 💰 Monetization

### Premium Currency (Gems)
- Purchase gems with real money via Telegram Payments
- Use gems for rare items, inventory expansion, cosmetic skins
- Multiple gem pack sizes available

### Payment Flow
1. Player requests gem purchase
2. Bot creates payment intent
3. Telegram handles payment processing
4. Webhook confirms payment and grants gems

## 🚀 Deployment

### Production Deployment

1. **Set up server**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install nodejs npm postgresql redis-server
   ```

2. **Configure services**
   ```bash
   # PostgreSQL
   sudo -u postgres createdb mmorpg_bot
   sudo -u postgres createuser mmorpg_user
   
   # Redis
   sudo systemctl start redis-server
   ```

3. **Deploy application**
   ```bash
   git clone <repository>
   cd mmorpg-telegram-bot
   npm install
   npm run build
   npm start
   ```

4. **Set up webhook**
   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://yourdomain.com/webhook"}'
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📈 Monitoring

### Health Checks
- `GET /health` - Service health status
- Database connection monitoring
- Bot API status monitoring

### Logging
- Structured logging with timestamps
- Error tracking and debugging
- Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

## 🎮 Game Design

### Character Classes

**Warrior**
- High HP and physical attack
- Skills: Shield Slam, Battle Cry, Whirlwind
- Equipment: Swords, heavy armor

**Mage**
- High MP and magical attack
- Skills: Fireball, Ice Barrier, Lightning Storm
- Equipment: Staves, robes

**Rogue**
- High speed and critical hit chance
- Skills: Backstab, Smoke Bomb, Blade Dance
- Equipment: Daggers, light armor

### Progression System

- **Leveling**: Gain XP from battles and quests
- **Stats**: Automatic stat increases per level
- **Skills**: Unlock new abilities at specific levels
- **Equipment**: Find and equip better gear

### Economy

- **Gold**: Earned from battles and quests
- **Gems**: Premium currency for rare items
- **Items**: Various rarities with different stats
- **Shop**: Buy items with gold or gems

---

**Built with ❤️ for the Telegram gaming community**
