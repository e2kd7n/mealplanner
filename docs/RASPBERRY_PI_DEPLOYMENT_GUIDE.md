# Raspberry Pi Deployment Guide

**Last Updated:** 2026-05-15
**Target:** Raspberry Pi 4B Rev 1.4 — **2GB RAM**, aarch64, Raspberry Pi OS 64-bit

---

## 🎯 Quick Start

### Prerequisites Checklist
- ✅ Raspberry Pi 4B running Raspberry Pi OS **64-bit** (aarch64)
- ✅ Podman installed on Pi
- ✅ Development machine with Podman/Docker
- ✅ Network connectivity between dev machine and Pi
- ✅ At least 5GB free disk space on Pi
- ✅ `secrets/` directory populated (run `./scripts/generate-secrets.sh` first time)

### Architecture: Pi 4B + ClusterHAT
This deployment runs **4 containers** on the Pi 4B (2GB RAM):
- `meals-postgres` (160MB) — PostgreSQL 16
- `meals-redis` (32MB) — Redis 7
- `meals-backend` (320MB) — Node.js API (fallback; primary API load goes to Zero W cluster)
- `meals-nginx` (48MB) — Nginx serving static PWA + proxying `/api/` to cluster

The React PWA is **not** a container. It is pre-built static files served directly by Nginx from `./data/frontend-dist/` — this saves ~100MB RAM vs running a separate container.

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

## 📋 Detailed Deployment Steps

### Phase 1: Build Images (Development Machine)

**Why build on dev machine?** Building on the Pi is slow and can cause out-of-memory errors. Build on a more powerful machine and transfer the images.

```bash
# Navigate to project directory
cd ~/dev/mealplanner

# Build ARM64 backend image + extract frontend static files (native build)
./scripts/build-for-pi.sh

# For 32-bit ARM (only if your Pi runs 32-bit OS — unusual):
./scripts/build-for-pi.sh  # defaults to arm64/v8 now; pass --arm64 if needed
```

**Expected Output:**
- `pi-images/meals-backend.tar` (~400-500MB uncompressed) or `meals-backend.tar.gz` with `--compress`
- `pi-images/frontend-dist.tar.gz` (~5-15MB) — architecture-independent React static files
- Total transfer: ~15MB compressed frontend + ~400MB backend

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
1. Loads `meals-backend.tar` (or `.tar.gz`) into Podman
2. Extracts `frontend-dist.tar.gz` → `./data/frontend-dist/` (Nginx serves these directly)
3. Cleans up transferred files to save disk space

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
3. Starts all services via `podman-compose -f podman-compose.pi.yml up -d`
4. Waits for health checks, then reports status

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

## 🚨 Troubleshooting

### Issue: Platform Mismatch Warnings

**Symptoms:** Warnings like `image platform ({arm64 linux [] v8}) does not match the expected platform ({arm linux [] })`

**Cause:** Images were built for wrong architecture (64-bit vs 32-bit)

**Solutions:**
```bash
# 1. Check your Pi's architecture
uname -m   # should print: aarch64

# 2. On dev machine, rebuild for ARM64:
./scripts/build-for-pi.sh   # defaults to linux/arm64/v8

# 3. Transfer and reload
scp pi-images/meals-backend.tar pi-images/frontend-dist.tar.gz \
    pi@192.168.4.110:~/mealplanner/pi-images/
ssh pi@192.168.4.110
cd ~/mealplanner
./scripts/load-pi-images.sh
./scripts/pi-run.sh
```

---

### Issue: Deployment Hangs or Times Out

**Symptoms:** `deploy-podman.sh` hangs for 2 minutes then times out

**Cause:** Usually platform mismatch or podman-compose blocking on health checks

**Solutions:**
```bash
# 1. Check if containers were created but not started
podman ps -a

# 2. Try starting containers manually
podman start meals-postgres
sleep 5
podman logs meals-postgres

# 3. If platform mismatch, rebuild images for correct architecture
./scripts/check-platform.sh  # Check your architecture
# Then rebuild on dev machine with correct flag

# 4. Clean up and redeploy
podman-compose -f podman-compose.pi.yml down
podman rm -f meals-postgres meals-redis meals-backend meals-nginx 2>/dev/null || true
./scripts/pi-run.sh
```

---

### Issue: Containers Won't Start

**Symptoms:** `podman ps` shows no containers or containers keep restarting

**Solutions:**
```bash
# 1. Check logs for errors
podman-compose -f podman-compose.pi.yml logs

# 2. Verify images exist and check architecture
podman images | grep meals
./scripts/check-platform.sh

# 3. Check disk space
df -h /

# 4. If disk is full, cleanup
./scripts/cleanup-pi.sh

# 5. Try redeploying
./scripts/pi-run.sh
```

---

### Issue: Out of Memory

**Symptoms:** Containers crash, system becomes unresponsive

**Solutions:**
```bash
# 1. Check memory usage
free -h
podman stats

# 2. Restart containers to clear memory
./scripts/pi-bounce.sh

# 3. Increase swap (if needed)
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# 4. Verify swap
free -h
```

---

### Issue: High CPU Load

**Symptoms:** System is slow, CPU temperature high

**Solutions:**
```bash
# 1. Check CPU usage
top
htop  # if installed

# 2. Check temperature
vcgencmd measure_temp

# 3. Identify CPU-heavy processes
ps aux --sort=-%cpu | head -10

# 4. If temperature >70°C, improve cooling
# - Add heatsink
# - Add fan
# - Improve ventilation
```

---

### Issue: Database Connection Errors

**Symptoms:** Backend logs show "Cannot connect to database"

**Solutions:**
```bash
# 1. Check if postgres container is running
podman ps | grep postgres

# 2. Check postgres logs
podman logs meals-postgres

# 3. Verify database is healthy
podman exec meals-postgres pg_isready -U mealplanner

# 4. If not healthy, restart postgres
podman restart meals-postgres

# 5. Wait 10 seconds, then restart backend
sleep 10
podman restart meals-backend
```

---

### Issue: Port Already in Use

**Symptoms:** "Port 8080 already in use" error

**Solutions:**
```bash
# 1. Check what's using port 8080
sudo lsof -i :8080
# or
sudo netstat -tulpn | grep 8080

# 2. Option A: Stop the conflicting service
sudo systemctl stop <service-name>

# 3. Option B: Change port in podman-compose.pi.yml
# Edit the nginx ports section:
# ports:
#   - "8081:80"  # Change 8080 to 8081
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

## 📞 Support and Resources

### Documentation
- [Main README](../README.md)
- [Pi Optimization Proposal](PI_OPTIMIZATION_PROPOSAL.md)
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

## 🎓 Understanding the Architecture

### Container Structure (Pi Production)

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

Note: No frontend container. The React PWA is pre-built static
files in ./data/frontend-dist/, served directly by Nginx.
```

### Data Persistence

Volumes are used for persistent data:
- `postgres_data`: Database files
- `./data/uploads`: User-uploaded files
- `./data/images`: Recipe images
- `./data/backups`: Database backups

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

**Made with Bob** 🤖