# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

Family meal planning PWA for a household of 4. Core features: recipe management, weekly
meal planning, grocery list generation, pantry tracking, and cook assignment for family
members. Built as a self-hosted app deployed on a Raspberry Pi 4B.

**Stack:** React 19 + TypeScript + Vite (frontend), Node.js 20 + Express + Prisma (backend),
PostgreSQL 16, Redis 7, Nginx (reverse proxy), Podman (container runtime).

---

## Repository Structure

```
mealplanner/
├── frontend/          # React PWA (Vite, MUI, Redux Toolkit)
├── backend/           # Express API (Prisma ORM, JWT auth, Zod validation)
├── nginx/
│   └── default.conf   # Nginx config - includes ClusterHAT upstream block
├── database/init/     # Postgres init scripts
├── data/
│   ├── images/        # Recipe images
│   ├── uploads/       # User uploads
│   ├── backups/       # DB backups
│   └── frontend-dist/ # Pre-built PWA static assets (served by Nginx on Pi)
├── scripts/           # Setup, deploy, backup scripts (46 files — use menu.sh for overview)
├── secrets/           # Runtime secrets (gitignored - never commit)
├── podman-compose.yml         # Development/local compose
└── podman-compose.pi.yml      # Pi production compose (see Pi Deployment below)
```

---

## Development Commands

### Running the App

```bash
# Local dev — only Postgres runs in container; frontend/backend run as host processes
./scripts/local-run.sh    # Frontend: http://localhost:5173, Backend: http://localhost:3000

# Container mode — all services in Podman (production-like)
./scripts/deploy-podman.sh    # Access: http://localhost:8080

# Interactive menu for all operations
./scripts/menu.sh

# Check which mode is currently running
./scripts/check-deployment-mode.sh
```

### Frontend (`frontend/`)

```bash
npm run dev       # Vite dev server (port 5173, hot reload)
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint (flat config: eslint.config.js)
npm run test:e2e      # Playwright e2e tests (headless, sequential)
npm run test:e2e:ui   # Playwright UI mode (debug)
```

### Backend (`backend/`)

```bash
npm run dev       # nodemon with ts-node (port 3000)
npm run build     # tsc → dist/
npm run start     # node dist/index.js (production)
npm run lint      # ESLint

# Prisma
npm run prisma:migrate       # prisma migrate dev (interactive, dev only)
npm run prisma:migrate:safe  # Wrapped with pre-migration backup (use in prod)
npm run prisma:studio        # Prisma UI for data exploration
npm run prisma:seed          # ts-node prisma/seed.ts
```

> **No unit/integration tests exist** for either frontend or backend. The only automated
> tests are Playwright e2e tests in `frontend/e2e/`.

### E2E Testing

Tests run **sequentially** (`workers: 1`) to avoid triggering auth rate limiting. A global
setup in `e2e/global-setup.ts` pre-authenticates once before the suite. Configure the
target with `BASE_URL` env var (defaults to `http://localhost:5173`).

---

## Architecture

### Frontend Data Flow

State management uses **Redux Toolkit with `createAsyncThunk`** — not RTK Query. There
is no RTK Query in this codebase. Each domain (auth, recipes, meal plans, grocery lists,
pantry, recipe browse) has a Redux slice in `src/store/slices/`.

Axios instance (`src/services/api.ts`) handles:
- JWT Bearer token injected from `localStorage` on every request
- CSRF token fetched once on app init from `/api/csrf-token`, injected as a header
- Preventive token refresh: if access token expires in < 120s, refresh before the request
- Shared refresh promise (`refreshPromise`) prevents race conditions when multiple
  requests trigger refresh simultaneously
- Single retry on 401 after refresh

Token storage split is intentional:
- **Access token → `localStorage`** (survives page reload; needed for API calls)
- **Refresh token → `sessionStorage`** (cleared when the browser session ends)

`AuthContext` (`src/contexts/AuthContext.tsx`) runs the initial refresh on mount.

### Backend Route Structure

Every domain follows the same pattern: `src/routes/` → `src/controllers/` → `src/validation/`
(Zod schemas). Middleware applied in this order:

1. Helmet → CORS → body parser (10MB) → cookie parser
2. Winston request logger → metrics tracking
3. Rate limiter on `/api/*` (stricter `registerRateLimiter` for signup)
4. `conditionalCsrfProtection` on `/api/*` (skips GET, HEAD, OPTIONS)
5. Domain routes
6. CSRF error handler → global `AppError` error handler

Protected routes use `authenticate` middleware (sets `req.user` with both `userId` and
`id` aliases). `requireAdmin` guards admin-only endpoints (allows `admin` and `superadmin`
roles). Use `optionalAuthenticate` for public-but-auth-aware endpoints.

### Key Backend Services

- **`src/services/recipeImport.service.ts`** — URL scraper using `@rethora/url-recipe-scraper`
- **`src/services/spoonacular.service.ts`** — External recipe API integration
- **`src/services/websocket.service.ts`** — Socket.io real-time updates (initialized on server start)
- **`src/utils/cache.ts`** — In-memory cache (node-cache)
- **`src/utils/logPruner.ts`** — Auto-prunes `ClientLog` entries after 24 hours

### Database Schema (Prisma)

Schema at `backend/prisma/schema.prisma`. `relationMode = "prisma"` — no DB-level foreign
key constraints; Prisma enforces them. Key models: `User`, `FamilyMember`, `Recipe`,
`Ingredient`, `RecipeIngredient`, `MealPlan`, `PlannedMeal`, `GroceryList`,
`GroceryListItem`, `PantryInventory`, `RecipeRating`, `UserPreferences`, `ClientLog`
(frontend error logs), `UserFeedback`.

Recipes have GIN trigram indexes on `title`, `cuisineType`, `description` for fast
full-text search. Migrations: use `prisma:migrate` in dev, `prisma:migrate:safe` in prod.

### Vite Build Optimizations (Pi)

`vite.config.ts` splits bundles aggressively for the Pi's limited RAM (500KB chunk limit):
React core, React Router, MUI core/icons, Redux, React Hook Form + Zod, date-fns,
Recharts, HTML2Canvas, and Socket.io each get their own chunk. ES2015 target, esbuild
minifier.

---

## Security Rules

- **Never commit `.env` files, `.env.backup.*` files, or anything in `secrets/`** — all
  are gitignored. Secrets are injected via Podman secrets from `./secrets/*.txt` files.
- JWT secrets must be generated with `./scripts/generate-secrets.sh` — never use defaults.
- CORS is explicitly locked to known origins in `podman-compose.pi.yml`.
- The `secrets/redis_password.txt` file must exist before running the Pi compose.

---

## Pi Deployment Architecture

### Hardware

- **Orchestrator:** Raspberry Pi 4B Rev 1.4 — **2GB RAM** (not 4GB — confirmed via
  `/proc/meminfo`). Running Raspberry Pi OS 64-bit (aarch64, kernel 6.12).
- **Cluster:** ClusterHAT v2.6 with 4× Pi Zero W nodes (512MB RAM each).
- **Storage:** SD card only (no USB SSD yet). SD card is at ~62% capacity.
- **Network:** Pi 4B at `192.168.4.110` on LAN. ClusterHAT bridge (`br0`) at `172.19.181.254/24`.

### Service Layout

| Service | Runs on | Memory limit | Notes |
|---|---|---|---|
| Nginx | Pi 4B | 48MB | Reverse proxy, static PWA, image serving |
| PostgreSQL 16 | Pi 4B | 160MB | Primary DB, tuned for 2GB RAM + SD card |
| Redis 7 | Pi 4B | 32MB | JWT/session cache, LRU eviction |
| Node.js backend | Each Zero W | ~120MB | API workers, arm/v6, port **3001** |

The frontend is **not** a separate container on the Pi. The React PWA is pre-built and
served directly by Nginx from `./data/frontend-dist/`. This saves 100MB RAM vs running
a dedicated frontend container.

### ClusterHAT Networking

- Mode: **CBRIDGE** (not CNAT)
- Bridge interfaces: `brint` (`172.19.180.254/24`) and `br0` (`172.19.181.254/24`)
- Zero W IP addresses: `172.19.181.1` (p1) through `172.19.181.4` (p4) — Zeros come up
  on `br0`, not `brint`. Confirmed via `ip neigh show dev br0` after first boot.
- Zeros appear as hotplug interfaces: `ethpi1` through `ethpi4` when booted
- Nginx load balances across Zeros using `least_conn` with Pi 4B local backend as fallback

### Current Zero W Status (as of May 2026)

**All four Zeros are booting and reachable.** Resolved issues:
- `config.txt` had duplicate/conflicting ClusterHAT overlay entries — cleaned up
- `clusterctrl-rpiboot.service` was running and intercepting USB enumeration — disabled
- SD cards were originally flashed on Windows (incomplete ext4 partition) — reflashed
  using Raspberry Pi Imager with per-slot 8086.net CBRIDGE armhf images
- p4 original SD card was faulty; replaced with a higher-speed card (same armhf-p4 image)

**Remaining work:** Backend not yet deployed to Zero W nodes. Use `./scripts/pi-run.sh --clusterhat`
to deploy. Requires SSH access to each Zero W and `backend/dist/` to be built on the Pi 4B.

### Pi 4B Config (verified clean state)

`/boot/firmware/config.txt` key sections:
```ini
[pi4]
otg_mode=1
dtoverlay=i2c-gpio,bus=1,i2c_gpio_sda=2,i2c_gpio_scl=3

[all]
enable_uart=1
dtoverlay=gpio-fan,gpiopin=14,temp=70000
```
No `dwc2` overlay on Pi 4B (that's only for CM4/Zero). The xHCI controller handles the
ClusterHAT hub natively via `otg_mode=1`.

### Podman Image Cleanup Needed

`podman system df` showed 43.6GB of images with only 1 active container. Before
deploying run:
```bash
podman image prune -a
podman rm ride-optimizer
```

### Deploying to Pi

**Primary path — pull from GHCR (preferred):**
GitHub Actions builds `linux/arm64` images on every push to `main` and pushes to
`ghcr.io/e2kd7n/mealplanner-backend:latest`. On the Pi:

```bash
./scripts/pi-deploy-registry.sh          # pull latest (= current main)
./scripts/pi-deploy-registry.sh main-abc1234  # pull a specific SHA tag
```

This pulls the image, retags it as `meals-backend:latest`, extracts the compiled
frontend from `/app/public/` into `./data/frontend-dist/`, and calls `pi-run.sh`.
Check Actions tab to confirm the build finished before pulling.

**Fallback — build on Pi:**
Only needed if the registry image is unavailable or you're iterating without pushing.
Cross-compiling from macOS has known Vite toolchain issues; Linux dev machines can
cross-compile if needed.

```bash
# On Pi 4B
./scripts/build-on-pi.sh      # First build ~2hrs, subsequent ~5-10min
./scripts/pi-run.sh           # Standard start (Pi 4B services only)
./scripts/pi-run.sh --clusterhat              # Also deploy backend to Zero Ws
./scripts/pi-run.sh --clusterhat --zero-user=admin  # If SSH user isn't 'pi'
```

### Key Config Differences: `podman-compose.pi.yml` vs `podman-compose.yml`

- No frontend service (Nginx serves static files directly)
- Redis included (earlier Pi compose omitted it; backend may have silently used in-memory cache)
- Postgres tuned for 2GB RAM: `shared_buffers=64MB`, `min_wal_size=128MB`
- Backend platform: `linux/arm64/v8`
- All `depends_on` use `condition: service_healthy`

### Nginx Upstream

```nginx
upstream backend_cluster {
    least_conn;
    server 172.19.181.1:3001 max_fails=2 fail_timeout=10s;
    server 172.19.181.2:3001 max_fails=2 fail_timeout=10s;
    server 172.19.181.3:3001 max_fails=2 fail_timeout=10s;
    server 172.19.181.4:3001 max_fails=2 fail_timeout=10s;
    server backend:3000 backup;
    keepalive 8;
}
```

Zero W backends run as systemd services (not containers) on port **3001**. They connect
to Postgres and Redis via `172.19.181.254` (Pi 4B bridge IP), which is exposed when
running with `--clusterhat` via `podman-compose.pi.clusterhat.yml`.

---

## Database

- Migrations: `npm run prisma:migrate` (dev) / `npm run prisma:migrate:safe` (prod — runs backup first)
- Manual backup: `podman exec meals-postgres pg_dump -U mealplanner meal_planner > backup.sql`
- Automated backup script: `./scripts/backup.sh` — set up as a cron job on the Pi

---

## Known Issues & Constraints

- **2GB RAM is the hard limit** — don't increase service memory limits without re-checking
  total headroom. Current allocation leaves ~600MB for OS + buffers.
- **SD card is the reliability risk** — Postgres WAL tuned conservatively (`min_wal_size=128MB`)
  to reduce write amplification. USB SSD on the Pi 4B's USB 3.0 port is the recommended
  upgrade for the postgres data volume.
- **Zero W is ARMv6** — Node.js 20 supports it but JIT is limited. Keep backend images
  lean. Build targeting `linux/arm/v6` for the Zeros specifically.
- **`clusterctrl-rpiboot.service` must stay disabled** — re-enabling it will break SD boot
  on all Zeros by intercepting USB enumeration.
- **Prisma `relationMode = "prisma"`** — no DB-level FK constraints. Don't assume cascade
  deletes happen at the DB layer; Prisma handles them.
- **PSU headroom is tight under simultaneous load** — Pi 4B (~2A) + 4× Zero W (~350mA each)
  peaks at ~3.4A, which exceeds a standard 3A PSU. Running `apt full-upgrade` on all four
  Zeros in parallel while the Pi 4B is also upgrading triggered an undervoltage warning.
  Stagger heavy operations: upgrade Pi 4B first, then Zeros sequentially. A 5V/4A+ PSU
  is recommended. Undervoltage during SD card writes risks corruption.
