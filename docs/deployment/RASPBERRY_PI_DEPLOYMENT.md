/** Copyright (c) 2026 e2kd7n. All rights reserved. */

# Raspberry Pi Deployment Guide

**Last Updated:** 2026-05-20
**Target:** Raspberry Pi 4B Rev 1.4 — **2GB RAM**, aarch64, Raspberry Pi OS 64-bit

Complete guide for building and deploying the Meal Planner application on Raspberry Pi using Podman containers.

---

## 🎯 Quick Start

### Prerequisites Checklist
- ✅ Raspberry Pi 4B running Raspberry Pi OS **64-bit** (aarch64)
- ✅ Podman installed on Pi
- ✅ Development machine with Podman/Docker
- ✅ Network connectivity between dev machine and Pi
- ✅ At least 5GB free disk space on Pi
- ✅ `secrets/` directory populated (run `./scripts/generate-secrets.sh` first time)

### Fast Track (3 Steps)
```bash
# 1. On Development Machine: Build backend image + frontend static files
./scripts/build-for-pi.sh

# 2. Transfer to Pi (two files: backend image + frontend static files)
scp pi-images/meals-backend.tar pi-images/frontend-dist.tar.gz \
    pi@192.168.4.110:~/mealplanner/pi-images/

# 3. On Pi: Load and deploy
cd ~/mealplanner
./scripts/load-pi-images.sh
./scripts/pi-run.sh
```

---

## 📐 Architecture Overview

### Container Structure

The Pi production deployment runs **4 containers** on the Pi 4B (2GB RAM):

1. **`meals-postgres`** (160MB) — PostgreSQL 16 Alpine
   - Persistent volume storage, tuned for SD card (conservative WAL)
   - Port 5432 (internal only)

2. **`meals-redis`** (32MB) — Redis 7 Alpine
   - JWT/session cache, LRU eviction (28MB maxmemory)
   - Port 6379 (internal only)

3. **`meals-backend`** (320MB) — Node.js 20 Alpine
   - Express API, Prisma ORM
   - Acts as fallback when ClusterHAT Zero W nodes are unavailable
   - Port 3000 (internal)
   - Node.js heap capped at 256MB via `--max-old-space-size`

4. **`meals-nginx`** (48MB) — Nginx Alpine
   - Serves the React PWA as **static files** from `./data/frontend-dist/`
   - Load balances `/api/` requests to ClusterHAT Zero W nodes (ports 3001), with Pi 4B backend as fallback
   - Exposed on port 8080

**Total: ~560MB** — leaves ~1.44GB for OS + buffers

**No separate frontend container** — the React PWA is pre-built static files served by Nginx directly, saving ~100MB RAM.

### Network Flow

```
Browser → http://192.168.4.110:8080
                    │
    ┌───────────────▼───────────────────────┐
    │  meals-nginx  (48MB)                  │
    │  Serves ./data/frontend-dist/ (PWA)   │
    │  Proxies /api/ → ClusterHAT Zeros     │
    └────────┬──────────────────────────────┘
             │ /api/  (least_conn)
    ┌────────▼──────────────────────────────┐
    │  ClusterHAT Zero W cluster            │
    │  172.19.180.1–4:3001  (primary)       │
    │  meals-backend:3000   (backup/local)  │
    └────────┬──────────────────────────────┘
             │
    ┌────────▼──────────────────────────────┐
    │  meals-postgres  (160MB)              │
    │  PostgreSQL 16, port 5432 (internal)  │
    └───────────────────────────────────────┘
    ┌───────────────────────────────────────┐
    │  meals-redis  (32MB)                  │
    │  Redis 7, port 6379 (internal)        │
    └───────────────────────────────────────┘
```

### Data Persistence

Volumes are used for persistent data:
- `postgres_data`: Database files (Docker volume)
- `./data/uploads`: User-uploaded files
- `./data/images`: Recipe images
- `./data/backups`: Database backups
- `./data/frontend-dist`: React PWA static files

---

## 🚀 Deployment Workflows

### Recommended: Build on Development Machine (Works from macOS)

**Pros:** No cross-compilation issues, faster builds on powerful machine, works from macOS
**Cons:** Requires image transfer (~400MB)

This is the **recommended approach** because:
- macOS cross-compilation to ARM64 has limitations
- Development machines are faster for building
- Simpler workflow with reliable results

### Alternative: Build Directly on Pi

**Pros:** No image transfer needed, automatic cache management
**Cons:** First build is slow (~2 hours), uses Pi resources during build

**Note:** After the initial 2-hour build, incremental builds take only 5-10 minutes due to build cache.

---

## 📋 Detailed Deployment Steps

### Phase 1: Build Images (Development Machine)

**Why build on dev machine?** Building on the Pi is slow and can cause out-of-memory errors. Build on a more powerful machine and transfer the images.

```bash
# Navigate to project directory
cd ~/dev/mealplanner

# Build ARM64 backend image + extract frontend static files (native build)
./scripts/build-for-pi.sh

# For compressed transfer (recommended for slow connections):
./scripts/build-for-pi.sh --compress
```

**Expected Output:**
- `pi-images/meals-backend.tar` (~400-500MB uncompressed) or `meals-backend.tar.gz` (~150-250MB compressed)
- `pi-images/frontend-dist.tar.gz` (~5-15MB) — architecture-independent React static files
- Total transfer: ~15MB compressed frontend + ~150-250MB compressed backend (or ~400MB uncompressed)

**Note:** The frontend static files are built natively (HTML/CSS/JS is architecture-independent) and do not need to be cross-compiled. Only the backend image targets ARM64.

**Troubleshooting:**
- If build fails, ensure Podman/Docker is running
- On macOS: `podman machine start`
- Check disk space: `df -h`
- If you see platform mismatch warnings during deployment, rebuild with the correct architecture flag

---

### Phase 2: Transfer Images to Pi

**Option A: SCP (Simple)**
```bash
# From development machine — transfer backend image + frontend static files
scp pi-images/meals-backend.tar pi-images/frontend-dist.tar.gz \
    pi@192.168.4.110:~/mealplanner/pi-images/

# If you built with --compress, transfer the .gz variant instead:
scp pi-images/meals-backend.tar.gz pi-images/frontend-dist.tar.gz \
    pi@192.168.4.110:~/mealplanner/pi-images/
```

**Option B: Rsync (Resumable, Recommended for slow connections)**
```bash
rsync -avz --progress \
    pi-images/meals-backend.tar pi-images/frontend-dist.tar.gz \
    pi@192.168.4.110:~/mealplanner/pi-images/
```

**Transfer Time Estimates:**
- Gigabit Ethernet: ~30 seconds
- WiFi (good signal): 1-2 minutes
- WiFi (poor signal): 3-5 minutes

---

### Phase 3: Prepare Raspberry Pi

**SSH into your Pi:**
```bash
ssh pi@pihole.local
# or
ssh pi@192.168.1.x
```

**Check System Health:**
```bash
cd ~/mealplanner
./scripts/pi-diagnostics.sh
```

**Review Key Metrics:**
- Disk usage should be <70%
- Memory usage should be <80%
- CPU temperature should be <65°C

**If disk space is low (>70%):**
```bash
./scripts/cleanup-pi.sh
```

**Verify Podman Installation:**
```bash
podman --version
# Should show: podman version 3.x or higher

podman-compose --version
# Should show: podman-compose version 1.x or higher
```

**If Podman is not installed:**
```bash
sudo apt-get update
sudo apt-get install -y podman
pip3 install podman-compose
```

**Generate Secrets (first time only):**
```bash
./scripts/generate-secrets.sh
```

---

### Phase 4: Load Images on Pi

```bash
cd ~/mealplanner
./scripts/load-pi-images.sh
```

**What this does:**
1. Automatically detects compressed (.tar.gz) or uncompressed (.tar) files
2. Decompresses on-the-fly (no manual unzip needed)
3. Loads `meals-backend.tar` (or `.tar.gz`) into Podman
4. Extracts `frontend-dist.tar.gz` → `./data/frontend-dist/` (Nginx serves these directly)
5. Cleans up transferred files to save disk space
6. Shows disk usage before and after

**Expected Duration:** 3-5 minutes

**Verify Assets Loaded:**
```bash
podman images | grep meals-backend
ls ./data/frontend-dist/
```

**Expected Output:**
```
localhost/meals-backend   latest   xxx   xxx ago   xxx MB
# and ./data/frontend-dist/ contains: index.html, assets/, ...
```

---

### Phase 5: Deploy Application

```bash
cd ~/mealplanner
./scripts/pi-run.sh
```

**What this does:**
1. Checks `meals-backend` image exists
2. Checks `./data/frontend-dist/index.html` exists
3. Generates secrets if not present
4. Stops existing containers
5. Starts all services via `podman-compose -f podman-compose.pi.yml up -d`
6. Runs database migrations automatically
7. Waits for health checks, then reports status

**Expected Duration:** 2-3 minutes

**Verify Deployment:**
```bash
# Check container status
podman ps

# Should show 4 containers running:
# - meals-postgres  (PostgreSQL 16, 160MB)
# - meals-redis     (Redis 7, 32MB)
# - meals-backend   (Node.js API, 320MB)
# - meals-nginx     (Nginx + static PWA, 48MB)
```

---

### Phase 6: Verify Application

**Check Health Endpoints:**
```bash
# Backend health
curl http://localhost:3000/health

# Frontend (via nginx)
curl http://localhost:8080/health

# Full application
curl -I http://localhost:8080
```

**Access Application:**
- Local: http://localhost:8080
- Network: http://pihole.local:8080
- IP: http://192.168.1.x:8080

**Test Login:**
- Email: `test@example.com`
- Password: `TestPass123!`

---

## 🔧 Management Commands

### Start/Stop/Restart

```bash
# Start application
./scripts/pi-run.sh

# Stop application
./scripts/pi-stop.sh

# Restart application
./scripts/pi-bounce.sh
```

### View Logs

```bash
# All services
podman-compose -f podman-compose.pi.yml logs -f

# Specific service
podman-compose -f podman-compose.pi.yml logs -f backend
podman-compose -f podman-compose.pi.yml logs -f postgres
podman-compose -f podman-compose.pi.yml logs -f nginx
# Note: no separate frontend container — Nginx serves the static PWA directly
```

### Monitor Resources

```bash
# Container stats (live)
podman stats

# System health check
./scripts/pi-health-check.sh

# Full diagnostics
./scripts/pi-diagnostics.sh
```

---

## 🔄 Updating the Application

### Update Process

```bash
# 1. On development machine: Pull latest code
cd ~/dev/mealplanner
git pull

# 2. Rebuild backend image + frontend static files
./scripts/build-for-pi.sh

# 3. Transfer to Pi
scp pi-images/meals-backend.tar pi-images/frontend-dist.tar.gz \
    pi@192.168.4.110:~/mealplanner/pi-images/

# 4. On Pi: Stop application
cd ~/mealplanner
./scripts/pi-stop.sh

# 5. Remove old backend image
podman rmi meals-backend:latest

# 6. Load new image + static files
./scripts/load-pi-images.sh

# 7. Deploy
./scripts/pi-run.sh
```

---

## 🔐 Security Best Practices

### 1. Change Default Secrets

```bash
# Regenerate all secrets
cd ~/mealplanner
rm -rf secrets/*
./scripts/generate-secrets.sh

# Redeploy with new secrets
./scripts/pi-bounce.sh
```

### 2. Configure Firewall

```bash
# Install UFW
sudo apt-get install ufw

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow application port
sudo ufw allow 8080/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 3. Regular Updates

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Update Podman
sudo apt-get install --only-upgrade podman

# Reboot if kernel updated
sudo reboot
```

---

## 📊 Performance Optimization

### Memory Limits (Already Configured)

The `podman-compose.pi.yml` includes optimized memory limits for the 2GB Pi:
- PostgreSQL: 160MB (tuned for SD card — conservative WAL settings)
- Redis: 32MB (LRU eviction, 28MB maxmemory)
- Backend: 320MB (Node.js heap capped at 256MB via `--max-old-space-size`)
- Nginx: 48MB
- **Total: ~560MB** — leaves ~1.44GB for OS + buffers

### Database Optimization

PostgreSQL is pre-configured for low-memory environments. See `podman-compose.pi.yml` for details.

### Monitoring

```bash
# Set up health check cron job
crontab -e

# Add this line to run health check every 5 minutes:
*/5 * * * * /home/pi/mealplanner/scripts/pi-health-check.sh >> /home/pi/mealplanner/health.log 2>&1
```

---

## 🚀 Auto-Start on Boot

### Configure Auto-Start

```bash
cd ~/mealplanner
./scripts/pi-setup.sh
# Choose 'yes' when prompted for auto-start
```

### Manual Auto-Start Configuration

```bash
# Create systemd service
sudo nano /etc/systemd/system/mealplanner.service
```

Paste this content:
```ini
[Unit]
Description=Meal Planner Application
After=network-online.target
Wants=network-online.target
Requires=podman.socket

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/pi/mealplanner
ExecStart=/home/pi/mealplanner/scripts/pi-run.sh
ExecStop=/home/pi/mealplanner/scripts/pi-stop.sh
User=pi
Group=pi
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable mealplanner.service
sudo systemctl start mealplanner.service
```

---

## 💾 Backup and Restore

### Backup Database

```bash
# Create backup directory
mkdir -p ~/mealplanner/backups

# Backup database
podman exec meals-postgres pg_dump -U mealplanner meal_planner > \
  ~/mealplanner/backups/backup-$(date +%Y%m%d-%H%M%S).sql

# Compress backup
gzip ~/mealplanner/backups/backup-*.sql
```

### Restore Database

```bash
# Stop application
./scripts/pi-stop.sh

# Restore from backup
gunzip -c ~/mealplanner/backups/backup-YYYYMMDD-HHMMSS.sql.gz | \
  podman exec -i meals-postgres psql -U mealplanner -d meal_planner

# Start application
./scripts/pi-run.sh
```

### Automated Backups

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /home/pi/mealplanner/scripts/backup-database.sh
```

---

## 🌐 Network Configuration

### Access from Other Devices

To access from other devices on your network:

1. Find Pi's IP address:
```bash
hostname -I
```

2. Access via IP:
```
http://192.168.1.XXX:8080
```

3. Or configure DNS/hosts file for hostname resolution

### Port Forwarding

To access from internet (not recommended without HTTPS):

1. Configure router port forwarding: External 80 → Pi 8080
2. Set up dynamic DNS
3. Configure SSL certificates
4. Update CORS_ORIGIN in podman-compose.yml

---

## 🔍 Key Files and Compose Configuration

### podman-compose.pi.yml
**Purpose:** Pi-specific compose file that uses pre-built images only (no build directives)

**Why it exists:** The standard `podman-compose.yml` has `build:` sections that trigger image building. On Pi, we use pre-built images transferred from the development machine.

### podman-compose.yml
**Purpose:** Development/build compose file with build directives

**When to use:** On development machines where you can build images

### Secrets Management

Secrets are stored in `./secrets/` directory:
- `postgres_password.txt` - Database password
- `jwt_secret.txt` - JWT signing key
- `jwt_refresh_secret.txt` - JWT refresh token key
- `session_secret.txt` - Session encryption key

Generate secrets using:
```bash
./scripts/generate-secrets.sh
```

---

## ✅ Deployment Checklist

Use this checklist for each deployment:

- [ ] Build backend image + frontend static files (`./scripts/build-for-pi.sh`)
- [ ] Verify `pi-images/meals-backend.tar` and `pi-images/frontend-dist.tar.gz` exist
- [ ] Transfer both files to Pi
- [ ] SSH into Pi (`ssh pi@192.168.4.110`)
- [ ] Check disk space (should be <70%)
- [ ] Run cleanup if needed (`./scripts/cleanup-pi.sh`)
- [ ] Verify Podman is installed
- [ ] Generate secrets (first time only: `./scripts/generate-secrets.sh`)
- [ ] Load image + extract frontend (`./scripts/load-pi-images.sh`)
- [ ] Deploy (`./scripts/pi-run.sh`)
- [ ] Verify 4 containers running (postgres, redis, backend, nginx)
- [ ] Test health endpoints
- [ ] Access application in browser
- [ ] Test login functionality
- [ ] Configure auto-start (optional)
- [ ] Set up monitoring (optional)

---

## 📞 Support and Resources

### Documentation
- [Main README](../README.md)
- [Pi Optimization](PI_OPTIMIZATION.md)
- [Pi Troubleshooting](RASPBERRY_PI_TROUBLESHOOTING.md)
- [Deployment Guide](DEPLOYMENT.md)

### Useful Commands Reference

```bash
# Quick status check
podman ps
podman stats --no-stream
df -h /
free -h
vcgencmd measure_temp

# View all logs
podman-compose -f podman-compose.pi.yml logs -f

# Restart everything
./scripts/pi-bounce.sh

# Full cleanup and redeploy
./scripts/cleanup-pi.sh
./scripts/load-pi-images.sh
./scripts/pi-run.sh

# Health check
./scripts/pi-health-check.sh

# Full diagnostics
./scripts/pi-diagnostics.sh
```

---

## 🎓 Common Mistakes to Avoid

### ❌ DON'T: Use podman-compose.yml on Pi
```bash
# WRONG - This tries to build images with wrong compose file
podman-compose -f podman-compose.yml up -d
```

### ✅ DO: Use the right compose file
```bash
# CORRECT - Uses pre-built images
podman-compose -f podman-compose.pi.yml up -d
# Or simply use:
./scripts/pi-run.sh
```

### ❌ DON'T: Build on Pi without understanding the trade-offs
Building on Pi works but is slow (~2 hours first time). Use development machine builds for faster deployment.

### ✅ DO: Use build cache for development
If building on Pi:
```bash
# CORRECT - Fast incremental builds (5-10 minutes)
./scripts/build-on-pi.sh
```

---

## 📝 Summary

**The Golden Rule:** Build on a development machine and transfer pre-built images to Raspberry Pi for fastest, most reliable deployment.

This approach is:
- More reliable (no syscall issues)
- Faster (build once, deploy many times)
- More efficient (Pi resources saved for running, not building)
- Industry standard (CI/CD builds, production deploys)

---

**Last Updated:** 2026-05-20
**Version:** 3.0.0
**Tested on:** Raspberry Pi 4B (2GB), Raspberry Pi OS 64-bit

// Made with Bob
