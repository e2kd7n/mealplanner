# CLAUDE.md — Project Context for AI Assistants

This file provides context for Claude Code and other AI tools working on this repository.
Keep it updated as the project evolves.

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
├── frontend/          # React PWA (Vite, MUI, Redux Toolkit, RTK Query)
├── backend/           # Express API (Prisma ORM, JWT auth, Zod validation)
├── nginx/
│   └── default.conf   # Nginx config - includes ClusterHAT upstream block
├── database/init/     # Postgres init scripts
├── data/
│   ├── images/        # Recipe images
│   ├── uploads/       # User uploads
│   ├── backups/       # DB backups
│   └── frontend-dist/ # Pre-built PWA static assets (served by Nginx on Pi)
├── scripts/           # Setup, deploy, backup scripts
├── secrets/           # Runtime secrets (gitignored - never commit)
├── podman-compose.yml         # Development/local compose
└── podman-compose.pi.yml      # Pi production compose (see Pi Deployment below)
```

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
- **Network:** Pi 4B at `192.168.4.110` on LAN. ClusterHAT bridge at `172.19.180.254/24`.

### Service Layout

| Service | Runs on | Memory limit | Notes |
|---|---|---|---|
| Nginx | Pi 4B | 48MB | Reverse proxy, static PWA, image serving |
| PostgreSQL 16 | Pi 4B | 160MB | Primary DB, tuned for 2GB RAM + SD card |
| Redis 7 | Pi 4B | 32MB | JWT/session cache, LRU eviction |
| Node.js backend | Each Zero W | ~120MB | API workers, arm/v6, port 3001 |

The frontend is **not** a separate container on the Pi. The React PWA is pre-built and
served directly by Nginx from `./data/frontend-dist/`. This saves 100MB RAM vs running
a dedicated frontend container.

### ClusterHAT Networking

- Mode: **CBRIDGE** (not CNAT)
- Bridge interfaces: `brint` (`172.19.180.254/24`) and `br0` (`172.19.181.254/24`)
- Zero W IP addresses: `172.19.180.1` (p1) through `172.19.180.4` (p4)
- Zeros appear as hotplug interfaces: `ethpi1` through `ethpi4` when booted
- Nginx load balances across Zeros using `least_conn` with local backend as fallback

### Current Zero W Status (as of May 2026)

**The Zeros are not yet booting.** Known issues found and resolved on Pi 4B side:
- `config.txt` had duplicate/conflicting ClusterHAT overlay entries — cleaned up
- `clusterctrl-rpiboot.service` was running (SD-cardless boot mode) and intercepting
  USB enumeration — disabled (`systemctl disable clusterctrl-rpiboot.service`)
- Platform in `podman-compose.pi.yml` was `arm/v7` — corrected to `arm64/v8`

**Remaining issue:** Zero W SD cards are not producing any USB signal on boot. Suspected
cause: SD cards were flashed on Windows which may have only written the FAT32 boot
partition, leaving the ext4 root partition incomplete. Cards need to be reflashed using
Raspberry Pi Imager (not Etcher/dd) with the correct 8086.net CBRIDGE image:
- p1 image → Zero in slot 1, p2 image → slot 2, etc. (per-slot images, not one image)
- After reflash, confirm with `dmesg -w` on Pi 4B watching for `cdc_ether` enumeration

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

---

## Key Configuration Files

### `podman-compose.pi.yml` — Production Pi Compose

What differs from `podman-compose.yml` (dev):
- No frontend service (Nginx serves static files directly)
- Redis added back (was missing from earlier Pi compose)
- Postgres tuned for 2GB RAM: `shared_buffers=64MB`, `min_wal_size=128MB`
- Backend platform: `linux/arm64/v8`
- All `depends_on` use `condition: service_healthy` (not `service_started`)
- Nginx memory capped at 48MB

### `nginx/default.conf`

Upstream block routes `/api/` to the 4 Zero W nodes with local fallback:
```nginx
upstream backend_cluster {
    least_conn;
    server 172.19.180.1:3001 max_fails=2 fail_timeout=10s;
    server 172.19.180.2:3001 max_fails=2 fail_timeout=10s;
    server 172.19.180.3:3001 max_fails=2 fail_timeout=10s;
    server 172.19.180.4:3001 max_fails=2 fail_timeout=10s;
    server backend:3000 backup;
    keepalive 8;
}
```
Port `3001` is what the Zero W backend containers expose — verify this matches the
backend's `PORT` env var in the Zero-specific compose/systemd unit when that's created.

---

## Development Workflow

```bash
# Local dev (hot reload, port 5173)
./scripts/local-run.sh

# Container mode (production-like, port 8080)
./scripts/deploy-podman.sh

# Check which mode is running
./scripts/check-deployment-mode.sh

# Interactive menu
./scripts/menu.sh
```

### Building for Pi

Build must happen **on the Pi 4B itself** (not cross-compiled from macOS — known issues).
Linux dev machines can cross-compile if needed:
```bash
# On Pi 4B
./scripts/build-on-pi.sh   # First build ~2hrs, subsequent ~5-10min
./scripts/pi-run.sh
```

---

## Database

- ORM: Prisma with PostgreSQL 16
- Migrations: `pnpm prisma migrate dev` (dev) / `pnpm prisma migrate deploy` (prod)
- Backups: `podman exec meals-postgres pg_dump -U mealplanner meal_planner > backup.sql`
- Automated backup script: `./scripts/backup.sh` — set up as a cron job on the Pi

---

## Outstanding TODOs (as of May 2026)

- [ ] Reflash Zero W SD cards with correct 8086.net CBRIDGE images using Pi Imager
- [ ] Verify Zero W backend port (confirm 3001 vs 3000 in Zero compose/systemd unit)
- [ ] Create Zero W systemd units (`podman generate systemd --new`) for reliable boot
- [ ] Move Postgres data volume to USB SSD when available (SD card longevity risk)
- [ ] Set up automated DB backup cron job on Pi 4B
- [ ] Run `podman image prune -a` on Pi 4B (43GB of stale images)
- [ ] Create `./data/frontend-dist/` and populate with built PWA before Pi deployment
- [ ] Add `secrets/redis_password.txt` to Pi secrets directory
- [ ] Remove `.env.backup.20260504_151747` from git history (script: `purge-env-backup-from-history.sh`)

---

## Known Issues & Constraints

- **2GB RAM is the hard limit** — don't increase service memory limits without re-checking
  total headroom. Current allocation leaves ~600MB for OS + buffers.
- **SD card is the reliability risk** — Postgres WAL is tuned conservatively (`min_wal_size=128MB`)
  to reduce write amplification. A USB SSD on the Pi 4B's USB 3.0 port is the recommended
  upgrade for the postgres data volume.
- **Zero W is ARMv6** — Node.js 20 supports it but JIT is limited. Keep backend images
  lean. Build on Pi 4B targeting `linux/arm/v6` for the Zeros specifically.
- **`clusterctrl-rpiboot.service` must stay disabled** — re-enabling it will break SD boot
  on all Zeros by intercepting USB enumeration.
- **No Redis in old Pi compose** — the original `podman-compose.pi.yml` omitted Redis.
  The backend may have been silently falling back to in-memory caching. Current file
  includes Redis; ensure backend `REDIS_HOST`/`REDIS_PORT` env vars are wired up.
