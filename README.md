# Family Meal Planner & Grocery Shopping App

**Version:** 1.0.0 (MVP) - ✅ Production Ready
**Release Date:** May 17, 2026

A Progressive Web App (PWA) designed for families to simplify meal planning and grocery shopping with smart recommendations, budget optimization, and offline functionality.

---

## Contents

- [Quick Start](#-quick-start) — one command to set up any target
- [Project Overview](#-project-overview)
- [Architecture](#️-architecture)
- [Prerequisites](#-prerequisites)
- [Local Development](#-development-quick-start) — hot-reload, Postgres in container
  - [Container Mode](#option-b-container-mode-port-8080) — all services in Podman
  - [Raspberry Pi Deployment](#production-deployment-raspberry-pi-4b--clusterhat)
- [Project Structure](#-project-structure)
- [Testing](#-testing)
- [Building for Production](#-building-for-production)
- [Documentation](#-documentation)
- [Contributing](#-contributing)

---

## 🚀 Quick Start

**First time setup? Run this one command:**

```bash
./scripts/first-time-setup.sh
```

This interactive script guides you to the right setup for your target:

| Option | What it sets up | Time |
|--------|----------------|------|
| **1. Local development** | Hot-reload, Postgres in container | ~2 min |
| **2. Local container mode** | All services in Podman | ~5 min |
| **3. Raspberry Pi — GHCR registry** | Pull prebuilt ARM64 image (recommended) | ~5 min |
| **4. Raspberry Pi — build on Pi** | Compile from source on Pi | ~2 hrs first run |

📖 **Detailed Setup Guide:** [docs/SETUP.md](./docs/SETUP.md)
🔒 **Security Guide:** [docs/SECURITY_SETUP.md](./docs/SECURITY_SETUP.md)

---

## 🎯 Project Overview

This application helps families (like a family of 4 with 2 adults and 2 teenagers) to:
- Plan weekly meals with recipe search and filtering
- Generate grocery lists from meal plans
- Track pantry inventory and expiration dates
- Manage dietary restrictions and preferences
- Import recipes from popular cooking websites
- Assign cooking responsibilities to family members
- Work offline with full PWA capabilities

**MVP Status:** All core workflows are functional and tested. See [MVP_RELEASE_SUMMARY.md](./docs/releases/beta-launch/MVP_RELEASE_SUMMARY.md) for complete feature list and testing results.
## 📋 Issue Tracking

All bugs, features, and improvements are tracked in [GitHub Issues](https://github.com/e2kd7n/mealplanner/issues).

- **Priorities**: See [ISSUE_PRIORITIES.md](./ISSUE_PRIORITIES.md) for current sprint priorities
- **Current Sprint**: Focus on HIGH priority issues (#1, #6)


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
- React 19+ with TypeScript
- Vite (build tool)
- Material-UI (MUI) for components
- Redux Toolkit with createAsyncThunk
- React Router v7
- Workbox (PWA/Service Workers)

**Backend:**
- Node.js 20 LTS with Express.js
- TypeScript
- Prisma ORM
- PostgreSQL 16 (primary database)
- node-cache (in-memory caching)
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
- Git

### For Production (Raspberry Pi):
- Podman & podman-compose
- Git
- Python 3 & pip3

See [docs/SETUP.md](./docs/SETUP.md) for detailed installation instructions.

## 🚀 Development Quick Start

### 1. Clone the repository (if not already done)
```bash
git clone <repository-url>
cd mealplanner
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
# Using Podman
podman-compose up -d postgres

# OR using Docker
docker-compose up -d postgres
```

### 5. Initialize database
```bash
cd backend
pnpm prisma migrate dev
pnpm prisma db seed
```

### 6. Choose Your Deployment Mode

The application supports two deployment modes: Local and Containerized.
**Use the interactive menu for guided setup:**

```bash
./scripts/menu.sh
```

The menu will:
- ✅ Show current deployment status
- 📊 Display resource usage
- 🎯 Guide you to the right mode
- 🔄 Handle mode switching automatically

#### Option A: Local Development Mode (Port 5173)

**Use when:** Actively developing features, need hot reload

**Resources:** ~2GB RAM, Node.js + dependencies required

```bash
./scripts/local-run.sh
# or use menu option 1
```

**Access at:** http://localhost:5173

**Features:**
- Hot reload - changes appear instantly
- Direct access to logs
- Easier debugging with source maps
- Fast iteration cycle

#### Option B: Container Mode (Port 8080)

**Use when:** Testing production setup, preparing for deployment

**Resources:** ~3GB RAM, Docker/Podman required

```bash
./scripts/deploy-podman.sh
# or use menu option 2
```

**Access at:** http://localhost:8080

**Features:**
- Production-like environment
- Isolated from host system
- Tests full stack including nginx
- Reproducible across machines

### 7. Verify Deployment

Check which mode is running and get the correct access URL:

```bash
./scripts/check-deployment-mode.sh
# or use menu option 8
```

This will show you:
- ✅ Which mode is active
- 📱 The correct URL to access the application
- 🛑 How to stop the services

### 8. Common Issues

**"Nothing loads at localhost:5173"**
- You're running container mode. Access at http://localhost:8080 instead.
- Or switch modes using `./scripts/menu.sh`

**"Nothing loads at localhost:8080"**
- You're running local dev mode. Access at http://localhost:5173 instead.
- Or switch modes using `./scripts/menu.sh`

**"I don't know what's running"**
- Run `./scripts/menu.sh` to see current status and switch modes
- Or run `./scripts/check-deployment-mode.sh` for quick check

📖 **Complete Guide:** See [docs/QUICK_START.md](./docs/QUICK_START.md) for detailed instructions

📖 **Port Reference:** See [docs/PORT_STANDARDIZATION.md](./docs/PORT_STANDARDIZATION.md) for complete port configuration

### Production Deployment (Raspberry Pi 4B + ClusterHAT)

For deploying to Raspberry Pi with Podman, see:
- **Full Guide**: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- **Detailed Steps**: [docs/RASPBERRY_PI_DEPLOYMENT_GUIDE.md](./docs/RASPBERRY_PI_DEPLOYMENT_GUIDE.md)

**TL;DR — pull from GHCR registry (recommended, ~5 min):**
```bash
# On your Raspberry Pi (192.168.4.110)
git clone <your-repo-url> mealplanner
cd mealplanner
./scripts/first-time-setup.sh   # choose option 3 (Pi - registry)
./scripts/pi-deploy-registry.sh
# Access at http://192.168.4.110:8080
```

GitHub Actions builds and pushes a prebuilt `linux/arm64` image to GHCR on every push to `main`. The deploy script pulls it, extracts the compiled frontend, and starts all services.

**Fallback — build directly on Pi (~2 hrs first run):**
```bash
# On your Raspberry Pi
git clone <your-repo-url> mealplanner
cd mealplanner
./scripts/first-time-setup.sh   # choose option 4 (Pi - build)
./scripts/build-on-pi.sh        # first build ~2 hrs, subsequent ~5-10 min
./scripts/pi-run.sh
```

## 📁 Project Structure

```
mealplanner/
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
├── podman-compose.yml  # Podman services configuration
├── .gitignore
├── LICENSE
├── README.md
└── CLAUDE.md           # AI assistant guidance for this repo
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
- ✅ Pantry inventory management
- ✅ Recipe import from URL
- ⏳ Advanced recommendation algorithm
- ⏳ Multi-store price comparison
- ⏳ Budget tracking

### Phase 3 (Advanced Features)
- ⏳ Recipe sharing and discovery
- ⏳ Analytics dashboard
- ⏳ Push notifications
- ⏳ Voice assistant integration

## 🧪 Testing

### End-to-End Tests (Playwright)

```bash
cd frontend
pnpm test:e2e          # Run all E2E tests
pnpm test:e2e:ui       # Interactive UI mode (recommended)
pnpm test:e2e:headed   # Run with visible browser
pnpm test:e2e:debug    # Debug mode
pnpm test:e2e:report   # View test report
```

**Documentation:**
- 📘 [E2E Testing Implementation Plan](docs/archive/E2E_TESTING_IMPLEMENTATION_PLAN.md) - Complete implementation guide
- 🚀 [E2E Testing Quick Start](docs/archive/E2E_TESTING_QUICK_START.md) - Quick reference for developers
- 🏗️ [E2E Testing Architecture](docs/archive/E2E_TESTING_ARCHITECTURE.md) - Visual architecture diagrams

### Unit & Integration Tests

```bash
# Frontend tests
cd frontend
pnpm test              # Run unit tests (coming soon)

# Backend tests
cd backend
pnpm test              # Run unit tests (coming soon)
pnpm test:integration  # Run integration tests (coming soon)
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
podman-compose build
```

## 🚢 Deployment

### Raspberry Pi Deployment

1. **Prepare Raspberry Pi:**
   - Raspberry Pi 4B (2GB RAM minimum)
   - Raspberry Pi OS (64-bit)
   - Podman installed

2. **Build ARM images:**
```bash
podman build --platform linux/arm64 -t meal-planner-frontend:latest ./frontend
podman build --platform linux/arm64 -t meal-planner-backend:latest ./backend
```

3. **Deploy:**
```bash
# Copy podman-compose.yml to Raspberry Pi
scp podman-compose.yml pi@raspberrypi.local:~/meal-planner/

# SSH into Raspberry Pi
ssh pi@raspberrypi.local

# Start services
cd ~/meal-planner
podman-compose up -d
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

### Workflow & Development
- [Issue Priorities](./ISSUE_PRIORITIES.md) - Current issue priorities

### Setup & Deployment
- [Setup Guide](./docs/SETUP.md) - Development environment setup
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment
- [Raspberry Pi Guide](./docs/RASPBERRY_PI_DEPLOYMENT_GUIDE.md) - Pi-specific deployment
- [Security Setup](./docs/SECURITY_SETUP.md) - Security configuration
- [Database Backup](./docs/DATABASE_BACKUP.md) - Backup procedures

### Architecture & Technical
- [System Architecture](./docs/ARCHITECTURE.md) - Complete architecture documentation
- [Database Schema](./backend/prisma/schema.prisma) - Prisma schema
- [Docling Integration](./docs/DOCLING_INTEGRATION.md) - Document handling and recipe import
- [API Documentation](http://localhost:3000/api-docs) - Interactive API docs (when running)

## 🤝 Contributing

This is a private family project, but contributions are welcome from family members:

1. Follow the development workflow above
2. Ensure all tests pass
3. Update documentation as needed
4. Follow TypeScript and ESLint conventions

## 📄 License

This project is proprietary software for personal/family use. See [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

See [ATTRIBUTION.md](./docs/archive/ATTRIBUTION.md) for third-party licenses and attributions.

## 📞 Support

For issues or questions:
1. Check existing [GitHub Issues](https://github.com/e2kd7n/mealplanner/issues)
2. Create a new issue with detailed description
3. Contact the development team

## 🗺️ Roadmap

See [GitHub Issues](https://github.com/e2kd7n/mealplanner/issues) for the current backlog and sprint priorities.

**Current Phase:** Phase 1 - MVP Development (Weeks 1-10)

---

Built with ❤️ for family meal planning
