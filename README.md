# Family Meal Planner

A self-hosted Progressive Web App for a family of four to plan meals, build grocery lists, and track pantry inventory. Designed to run on a Raspberry Pi 4B with a ClusterHAT of Pi Zero W nodes as backend workers.

**Status:** Production-ready MVP — all core workflows functional and tested.

---

## What it does

- **Recipes** — create, edit, import from cooking websites by URL, search and filter by type/difficulty/dietary needs
- **Meal planner** — weekly calendar with cook assignment so family members can own specific meals
- **Grocery lists** — auto-generated from planned meals, with manual additions and in-store check-off
- **Pantry** — track inventory by location (fridge/pantry/freezer) with expiration date alerts
- **Offline-capable** — full PWA with service worker, works without a connection

---

## Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, TypeScript, Vite, Material-UI, Redux Toolkit |
| Backend | Node.js 20, Express, Prisma ORM, PostgreSQL 16, Redis 7 |
| Infrastructure | Podman, Nginx, Raspberry Pi 4B + ClusterHAT (4× Pi Zero W) |

CI builds a `linux/arm64` container image on every push to `main` and pushes it to GHCR — no cross-compilation needed on the Pi.

---

## Getting started

```bash
git clone <repo-url>
cd mealplanner
./scripts/first-time-setup.sh
```

The setup script asks where you're deploying and guides you from there:

| Option | What it sets up | Time |
|--------|----------------|------|
| 1. Local development | Hot-reload, Postgres in container | ~2 min |
| 2. Local container mode | All services in Podman | ~5 min |
| 3. Raspberry Pi — registry | Pull prebuilt ARM64 image (recommended) | ~5 min |
| 4. Raspberry Pi — build on Pi | Compile from source | ~2 hrs first run |

---

## Documentation

| Topic | |
|-------|-|
| Development environment | [docs/development/SETUP.md](./docs/development/SETUP.md) |
| Pi deployment | [docs/deployment/RASPBERRY_PI_DEPLOYMENT.md](./docs/deployment/RASPBERRY_PI_DEPLOYMENT.md) |
| Deployment guide | [docs/deployment/DEPLOYMENT.md](./docs/deployment/DEPLOYMENT.md) |
| Security & secrets | [docs/security/SECURITY_SETUP.md](./docs/security/SECURITY_SETUP.md) |
| System architecture | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) |
| Database backups | [docs/infrastructure/DATABASE_BACKUP.md](./docs/infrastructure/DATABASE_BACKUP.md) |
| E2E tests | [docs/testing/TESTING_ENVIRONMENT.md](./docs/testing/TESTING_ENVIRONMENT.md) |

---

## Issues & roadmap

Tracked in [GitHub Issues](https://github.com/e2kd7n/mealplanner/issues). Current sprint priorities in [ISSUE_PRIORITIES.md](./ISSUE_PRIORITIES.md).

---

## License

Proprietary — personal/family use only. See [LICENSE](./LICENSE) and [ATTRIBUTION.md](./docs/archive/ATTRIBUTION.md) for third-party credits.

---

Built with ❤️ for family meal planning
