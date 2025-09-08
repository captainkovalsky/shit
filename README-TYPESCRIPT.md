# 🎮 MMO RPG Telegram Bot - TypeScript Edition

A comprehensive MMO RPG Telegram Bot built with TypeScript, featuring turn-based combat, character progression, quests, PvP battles, and dynamic sprite generation.

## 🚀 Features

### ✅ Implemented Core Features
- **Character Creation & Management**: Create warriors, mages, and rogues with unique stats
- **Turn-Based Combat Logic**: Strategic battle calculations with skills, critical hits, and status effects
- **Character Progression**: Level up system with stat increases and class-specific bonuses
- **Database Models**: Complete data models for all game systems
- **Dynamic Sprites**: Auto-generated character sprites with equipment layering
- **Bot Interface**: Telegram bot with scene-based character creation and menu system
- **API Infrastructure**: RESTful API with authentication and error handling
- **Comprehensive Testing**: Unit, integration, and API tests with 80%+ coverage

### 🔧 Partially Implemented
- **Equipment System**: Database models ready, equipping logic in progress
- **Inventory Management**: Database structure complete, management interface pending
- **PvE Battles**: Combat logic implemented, battle execution pending

### 📋 Planned Features
- **Quest System**: Story, side, daily, and weekly quests
- **PvP Arena**: Battle other players with rating system
- **Economy System**: Gold/gems earning and spending
- **Shop System**: Item purchasing with gold and gems
- **Monetization**: Telegram Payments integration

> 📊 **Feature Status**: See [FEATURE_STATUS.md](FEATURE_STATUS.md) for detailed implementation analysis

### Technical Features
- **TypeScript**: Full type safety and modern JavaScript features
- **Prisma ORM**: Type-safe database operations
- **Telegraf**: Modern Telegram Bot framework
- **Express API**: RESTful API with comprehensive endpoints
- **Canvas Image Generation**: Dynamic sprite and card generation
- **Redis Caching**: High-performance caching layer
- **Docker Support**: Containerized deployment
- **Comprehensive Testing**: Unit, integration, and API tests

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3+
- **Bot Framework**: Telegraf 4.15+
- **Web Framework**: Express 4.18+
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5.7+
- **Cache**: Redis 7+
- **Image Processing**: Canvas 2.11+
- **Testing**: Jest 29.7+
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd mmorpg-telegram-bot
npm install
```

### 2. Environment Setup

Create a `.env` file:

```env
# Bot Configuration
BOT_TOKEN=your_telegram_bot_token
JWT_SECRET_KEY=your_jwt_secret_key

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/mmorpg_bot

# Redis
REDIS_URL=redis://localhost:6379/0

# Payment
TELEGRAM_PAYMENT_PROVIDER_TOKEN=your_payment_provider_token

# CDN
CDN_BASE_URL=https://your-cdn.com
SPRITE_BASE_PATH=/sprites
ASSETS_PATH=assets/sprites

# Game Configuration
MAX_CHARACTERS_PER_USER=3
MAX_INVENTORY_SLOTS=30
BASE_INVENTORY_SLOTS=20

# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database (optional)
npm run db:seed
```

### 4. Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

### 5. Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Docker Build

```bash
# Build image
docker build -t mmorpg-bot .

# Run container
docker run -p 3000:3000 \
  -e BOT_TOKEN=your_token \
  -e DATABASE_URL=your_db_url \
  mmorpg-bot
```

## 🎮 Game Mechanics

### Character Classes

#### Warrior ⚔️
- **Strengths**: High HP, Attack, Defense
- **Skills**: Shield Slam, Battle Cry, Whirlwind
- **Stat Bonuses**: +2 Strength, +20 HP per level

#### Mage 🔮
- **Strengths**: High MP, Intelligence, Magic Damage
- **Skills**: Fireball, Ice Barrier, Lightning Storm
- **Stat Bonuses**: +2 Intelligence, +20 MP per level

#### Rogue 🗡️
- **Strengths**: High Speed, Critical Chance, Agility
- **Skills**: Backstab, Smoke Bomb, Blade Dance
- **Stat Bonuses**: +2 Agility, +1 Speed, +1% Crit Chance per level

### Combat System

- **Turn-Based**: Strategic combat with action selection
- **Skills**: Class-specific abilities with MP costs
- **Critical Hits**: Chance-based critical damage
- **Status Effects**: Buffs, debuffs, and special conditions
- **Equipment Bonuses**: Stats from equipped items

### Progression System

- **Leveling**: Gain XP through battles and quests
- **Stat Growth**: Automatic stat increases per level
- **Skill Unlocks**: New abilities at certain levels
- **Equipment**: Better gear for higher levels

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login with Telegram
- `POST /api/v1/auth/refresh` - Refresh JWT token

### Users
- `GET /api/v1/users/me` - Get current user info
- `PUT /api/v1/users/me` - Update user profile

### Characters
- `GET /api/v1/characters` - List user's characters
- `POST /api/v1/characters` - Create new character
- `GET /api/v1/characters/:id` - Get character details
- `PUT /api/v1/characters/:id` - Update character
- `DELETE /api/v1/characters/:id` - Delete character

### Inventory
- `GET /api/v1/characters/:id/inventory` - Get character inventory
- `POST /api/v1/characters/:id/inventory/equip` - Equip item
- `POST /api/v1/characters/:id/inventory/unequip` - Unequip item

### Battles
- `POST /api/v1/battles/pve` - Start PvE battle
- `POST /api/v1/battles/:id/turns` - Take battle turn
- `GET /api/v1/battles/:id` - Get battle status

### Quests
- `GET /api/v1/quests` - List available quests
- `POST /api/v1/quests/:id/accept` - Accept quest
- `POST /api/v1/quests/:id/complete` - Complete quest

### Shop
- `GET /api/v1/shop/items` - List shop items
- `POST /api/v1/shop/buy/gold` - Buy with gold
- `POST /api/v1/shop/buy/gems` - Buy with gems

### Payments
- `POST /api/v1/payments/intents` - Create payment intent
- `GET /api/v1/payments/intents/:id` - Get payment status

## 🧪 Testing

### Test Structure
```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── bot/           # Bot functionality tests
├── api/           # API endpoint tests
└── setup.ts       # Test configuration
```

### Running Tests

```bash
# All tests
npm test

# Specific test suites
npm run test:unit
npm run test:integration
npm run test:bot
npm run test:api

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Coverage
- **Target**: 80%+ coverage
- **Reports**: HTML, LCOV, JSON formats
- **Thresholds**: Branches, functions, lines, statements

## 📊 Monitoring & Logging

### Logging
- **Winston**: Structured logging with multiple transports
- **Daily Rotation**: Automatic log file rotation
- **Levels**: Error, Warn, Info, Debug
- **Formats**: JSON (production), Colored (development)

### Health Checks
- `GET /health` - Application health status
- Database connection status
- Redis connection status
- Bot connection status

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BOT_TOKEN` | Telegram bot token | Required |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `JWT_SECRET_KEY` | JWT signing secret | Required |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |

### Game Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `MAX_CHARACTERS_PER_USER` | Max characters per user | `3` |
| `MAX_INVENTORY_SLOTS` | Max inventory slots | `30` |
| `BASE_INVENTORY_SLOTS` | Base inventory slots | `20` |
| `BASE_HP_PER_LEVEL` | HP increase per level | `20` |
| `BASE_MP_PER_LEVEL` | MP increase per level | `10` |

## 🚀 Deployment

### Production Checklist

1. **Environment Setup**
   - Set `NODE_ENV=production`
   - Configure production database
   - Set up Redis instance
   - Configure CDN for assets

2. **Security**
   - Use strong JWT secret
   - Enable HTTPS
   - Configure CORS properly
   - Set up rate limiting

3. **Performance**
   - Enable Redis caching
   - Configure connection pooling
   - Set up load balancing
   - Monitor resource usage

4. **Monitoring**
   - Set up logging aggregation
   - Configure health checks
   - Set up error tracking
   - Monitor bot performance

### Deployment Options

#### Traditional Server
```bash
# Build and start
npm run build
npm start

# Use PM2 for process management
pm2 start dist/index.js --name mmorpg-bot
```

#### Docker
```bash
# Build and run
docker build -t mmorpg-bot .
docker run -d --name mmorpg-bot mmorpg-bot
```

#### Kubernetes
```yaml
# Example deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mmorpg-bot
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mmorpg-bot
  template:
    metadata:
      labels:
        app: mmorpg-bot
    spec:
      containers:
      - name: mmorpg-bot
        image: mmorpg-bot:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Install dependencies: `npm install`
4. Set up environment: Copy `.env.example` to `.env`
5. Run tests: `npm test`
6. Make changes and test
7. Submit a pull request

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with TypeScript rules
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Conventional Commits**: Commit message format

### Pull Request Process

1. Ensure tests pass: `npm test`
2. Check code quality: `npm run lint`
3. Format code: `npm run format`
4. Update documentation if needed
5. Submit PR with clear description

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

#### Bot Not Responding
- Check bot token validity
- Verify webhook configuration
- Check server logs for errors

#### Database Connection Issues
- Verify DATABASE_URL format
- Check PostgreSQL service status
- Ensure database exists

#### Image Generation Fails
- Install canvas dependencies
- Check assets directory permissions
- Verify CDN configuration

### Getting Help

- **Issues**: Create GitHub issue
- **Discussions**: Use GitHub Discussions
- **Documentation**: Check this README
- **Examples**: See `/examples` directory

## 🎯 Roadmap

### Version 1.1
- [ ] Guild system
- [ ] Raid battles
- [ ] More character classes
- [ ] Advanced quest system

### Version 1.2
- [ ] Mobile app integration
- [ ] Real-time notifications
- [ ] Advanced PvP modes
- [ ] Seasonal events

### Version 2.0
- [ ] 3D character models
- [ ] Voice chat integration
- [ ] Cross-platform play
- [ ] Advanced AI opponents

---

**Happy Gaming! 🎮**

For more information, visit our [documentation](docs/) or join our [community](https://discord.gg/mmorpg-bot).
