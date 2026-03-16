# Family Meal Planner & Grocery Shopping App

**Version:** 1.0.0 (MVP) - ✅ Production Ready
**Release Date:** March 16, 2026

A Progressive Web App (PWA) designed for families to simplify meal planning and grocery shopping with smart recommendations, budget optimization, and offline functionality.

## 🎯 Project Overview

This application helps families (like a family of 4 with 2 adults and 2 teenagers) to:
- Plan weekly meals with recipe search and filtering
- Generate grocery lists from meal plans
- Track pantry inventory and expiration dates
- Manage dietary restrictions and preferences
- Import recipes from popular cooking websites
- Assign cooking responsibilities to family members
- Work offline with full PWA capabilities

**MVP Status:** All core workflows are functional and tested. See [MVP_RELEASE_SUMMARY.md](./MVP_RELEASE_SUMMARY.md) for complete feature list and testing results.

## ✨ Key Features (MVP v1.0.0)

### Recipe Management ✅
- **Create & Edit Recipes**: Full CRUD operations with comprehensive form
  - Bulk instruction entry with intelligent parsing
  - Multiple meal type support (breakfast, lunch, dinner, snack, dessert)
  - Auto-create ingredients during recipe creation
  - Cleanup score rating (0-10 scale)
- **Import from URLs**: Automatically scrape recipes from popular websites (NY Times Cooking, Delish, Jewel-Osco, etc.)
- **Image Proxy**: Backend proxy eliminates CORS errors for external images
- **Smart Search & Filtering**:
  - Filter by meal type, difficulty, prep time, kid-friendly
  - Cleanup score filter
  - Recipe search with autocomplete

### Meal Planning ✅
- Weekly meal calendar interface
- Add meals to specific dates and meal types
- **Cook Assignment**: Assign family members to meals (perfect for families where kids cook certain nights)
- Recipe search integration in meal planner
- "Add to Meal Plan" from recipe detail page with date/time selection

### Grocery Shopping ✅
- Auto-generated shopping lists from meal plans
- "Add to Grocery List" from recipe detail page with list selection
- Manual item addition and management
- Check off items while shopping
- Multiple grocery list support

### Pantry Management ✅
- Track pantry inventory with quantities
- Location tracking (pantry, fridge, freezer)
- Expiration date tracking
- Low stock and expiring soon alerts

### Security & Performance ✅
- JWT-based authentication with refresh tokens
- **Proactive token refresh** (prevents session interruptions)
- Redis caching for improved performance
- Rate limiting and security headers
- Comprehensive logging and monitoring
- Input validation with Zod schemas

### User Experience Enhancements ✅
- Recipe card tooltips showing prep/cook time breakdown
- Required field indicators on forms
- Comprehensive error handling
- Responsive Material-UI design

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Vite (build tool)
- Material-UI (MUI) for components
- Redux Toolkit with RTK Query
- React Router v6
- Workbox (PWA/Service Workers)

**Backend:**
- Node.js with Express.js
- TypeScript
- Prisma ORM
- PostgreSQL (primary database)
- Redis (caching & sessions)
- JWT authentication

**DevOps:**
- Docker & Docker Compose (or Podman & Podman Compose)
- Nginx (reverse proxy)
- Self-hosted deployment ready (Raspberry Pi compatible)

## 📋 Prerequisites

### For Development:
- Node.js 20+ LTS
- pnpm 8+
- PostgreSQL 16+
- Redis 7+
- Git

### For Production (Raspberry Pi):
- Podman & podman-compose
- Git
- Python 3 & pip3

See [SETUP.md](./SETUP.md) for detailed installation instructions.

## 🚀 Quick Start

### Development Mode (Local)

### 1. Clone the repository (if not already done)
```bash
git clone <repository-url>
cd meals
```

### 2. Install dependencies

**Frontend:**
```bash
cd frontend
pnpm install
```

**Backend:**
```bash
cd backend
pnpm install
```

### 3. Set up environment variables

**Backend (.env):**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

**Frontend (.env):**
```bash
cd frontend
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start database services
```bash
# Using Docker
docker-compose up -d postgres redis

# OR using Podman
podman-compose -f podman-compose.yml up -d postgres redis
```

### 5. Initialize database
```bash
cd backend
pnpm prisma migrate dev
pnpm prisma db seed
```

### 6. Start development servers

**Backend:**
```bash
cd backend
pnpm dev
```

**Frontend (in a new terminal):**
```bash
cd frontend
pnpm dev
```

### 7. Access the application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Production Deployment (Raspberry Pi)

For deploying to Raspberry Pi with Podman, see:
- **Quick Start**: [RASPBERRY_PI_QUICKSTART.md](./RASPBERRY_PI_QUICKSTART.md)
- **Full Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)

**TL;DR:**
```bash
# On your Raspberry Pi
git clone <your-repo-url> meal-planner
cd meal-planner
./scripts/generate-secrets.sh
./scripts/deploy-podman.sh
# Access at http://raspberrypi.local:8080
```

## 📁 Project Structure

```
meals/
├── frontend/           # React PWA application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── features/      # Feature-based modules
│   │   ├── services/      # API services
│   │   ├── store/         # Redux store
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript types
│   └── public/
│
├── backend/            # Express API server
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── models/        # Data models
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript types
│   └── prisma/
│       ├── schema.prisma  # Database schema
│       └── migrations/    # Database migrations
│
├── database/           # Database initialization scripts
├── nginx/              # Nginx configuration
├── data/               # Persistent data storage
│   ├── images/         # Recipe images
│   ├── uploads/        # User uploads
│   └── backups/        # Database backups
│
├── docker-compose.yml  # Docker services configuration
├── .gitignore
├── LICENSE
├── README.md
├── SETUP.md            # Development setup guide
├── ATTRIBUTION.md      # Third-party licenses
└── meal-planner-app-plan.md  # Detailed technical plan
```

## 🎨 Key Features

### Phase 1 (MVP) - Current Focus
- ✅ Recipe management (CRUD, search, filter)
- ✅ Custom recipe creation
- ✅ Weekly meal planner with drag-and-drop
- ✅ Grocery list generation
- ✅ Family member profiles
- ✅ Allergen filtering
- ✅ Offline functionality (PWA)

### Phase 2 (Enhanced Features)
- 🔄 Pantry inventory management
- 🔄 Advanced recommendation algorithm
- 🔄 Multi-store price comparison
- 🔄 Budget tracking
- 🔄 Recipe import from URL

### Phase 3 (Advanced Features)
- ⏳ Recipe sharing and discovery
- ⏳ Analytics dashboard
- ⏳ Push notifications
- ⏳ Voice assistant integration

## 🧪 Testing

```bash
# Frontend tests
cd frontend
pnpm test              # Run unit tests
pnpm test:e2e          # Run end-to-end tests

# Backend tests
cd backend
pnpm test              # Run unit tests
pnpm test:integration  # Run integration tests
```

## 📦 Building for Production

```bash
# Build frontend
cd frontend
pnpm build

# Build backend
cd backend
pnpm build

# Build Podman images
podman-compose -f docker-compose.prod.yml build
```

## 🚢 Deployment

### Raspberry Pi Deployment

1. **Prepare Raspberry Pi:**
   - Raspberry Pi 4 (4GB+ RAM recommended)
   - Raspberry Pi OS (64-bit)
   - Podman installed

2. **Build ARM images:**
```bash
podman build --platform linux/arm64 -t meal-planner-frontend:latest ./frontend
podman build --platform linux/arm64 -t meal-planner-backend:latest ./backend
```

3. **Deploy:**
```bash
# Copy docker-compose.prod.yml to Raspberry Pi
scp docker-compose.prod.yml pi@raspberrypi.local:~/meal-planner/

# SSH into Raspberry Pi
ssh pi@raspberrypi.local

# Start services
cd ~/meal-planner
podman-compose -f docker-compose.prod.yml up -d
```

## 🔧 Development Workflow

1. **Create a feature branch:**
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes and test:**
```bash
pnpm test
pnpm lint
```

3. **Commit with conventional commits:**
```bash
git commit -m "feat: add recipe search functionality"
```

4. **Push and create pull request:**
```bash
git push origin feature/your-feature-name
```

## 📚 Documentation

- [System Architecture](./docs/ARCHITECTURE.md) - Complete architecture documentation
- [Technical Plan](./meal-planner-app-plan.md) - Comprehensive technical specification
- [Setup Guide](./SETUP.md) - Development environment setup
- [API Documentation](http://localhost:3000/api-docs) - Interactive API docs (when running)
- [Database Schema](./backend/prisma/schema.prisma) - Prisma schema
- [Docling Integration](./docs/DOCLING_INTEGRATION.md) - Document handling and recipe import
- [Issues & Roadmap](./ISSUES.md) - Feature requests and bug tracking
- [Issues Prioritization](./ISSUES_PRIORITIZATION.md) - Prioritized task list
- [Weekly Maintenance](./WEEKLY_MAINTENANCE.md) - Regular maintenance tasks and procedures

## 🤝 Contributing

This is a private family project, but contributions are welcome from family members:

1. Follow the development workflow above
2. Ensure all tests pass
3. Update documentation as needed
4. Follow TypeScript and ESLint conventions

## 📄 License

This project is proprietary software for personal/family use. See [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

See [ATTRIBUTION.md](./ATTRIBUTION.md) for third-party licenses and attributions.

## 📞 Support

For issues or questions:
1. Check existing [ISSUES.md](./ISSUES.md)
2. Create a new issue with detailed description
3. Contact the development team

## 🗺️ Roadmap

See the [Technical Plan](./meal-planner-app-plan.md) for the complete development roadmap.

**Current Phase:** Phase 1 - MVP Development (Weeks 1-10)

---

Built with ❤️ for family meal planning