# Raspberry Pi Deployment Guide

**Last Updated:** 2026-04-28
**Target:** Raspberry Pi 4 (1.8GB RAM minimum, 4GB+ recommended)

---

## 🎯 Quick Start

### Prerequisites Checklist
- ✅ Raspberry Pi 4 with Raspberry Pi OS (32-bit or 64-bit)
- ✅ Podman installed on Pi
- ✅ Development machine with Podman/Docker
- ✅ Network connectivity between dev machine and Pi
- ✅ At least 5GB free disk space on Pi

### Important: 32-bit vs 64-bit
Most Raspberry Pi systems run in **32-bit mode** even with 64-bit capable hardware. The build script defaults to 32-bit ARM (armv7) for maximum compatibility. Use `./scripts/check-platform.sh` on your Pi to verify your architecture.

### Fast Track (3 Steps)
```bash
# 1. On Development Machine: Build images
./scripts/build-for-pi.sh

# 2. Transfer to Pi
scp pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/

# 3. On Pi: Deploy
cd ~/mealplanner
./scripts/load-pi-images.sh
./scripts/deploy-podman.sh
```

---

## 📋 Detailed Deployment Steps

### Phase 1: Build Images (Development Machine)

**Why build on dev machine?** Building on the Pi is slow and can cause out-of-memory errors. Build on a more powerful machine and transfer the images.

```bash
# Navigate to project directory
cd ~/dev/mealplanner

# Build ARM images for Raspberry Pi (defaults to 32-bit)
./scripts/build-for-pi.sh

# Or explicitly build for 64-bit if your Pi runs 64-bit OS
./scripts/build-for-pi.sh --arm64
```

**Expected Output:**
- `pi-images/meals-backend.tar.gz` (~416MB compressed)
- `pi-images/meals-frontend.tar.gz` (~24MB compressed)
- Total transfer size: ~440MB

**Architecture Detection:**
The build script defaults to `linux/arm/v7` (32-bit ARM) for maximum compatibility. Most Raspberry Pi systems run in 32-bit mode even with 64-bit hardware. To verify your Pi's architecture:
```bash
# On your Pi
./scripts/check-platform.sh
```

**Troubleshooting:**
- If build fails, ensure Podman/Docker is running
- On macOS: `podman machine start`
- Check disk space: `df -h`
- If you see platform mismatch warnings during deployment, rebuild with the correct architecture flag

---

### Phase 2: Transfer Images to Pi

**Option A: SCP (Simple)**
```bash
# From development machine
scp pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/

# Or using IP address
scp pi-images/*.tar.gz pi@192.168.1.x:~/mealplanner/pi-images/
```

**Option B: Rsync (Resumable, Recommended for slow connections)**
```bash
rsync -avz --progress pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/
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
1. Decompresses tar.gz files
2. Loads images into Podman
3. Verifies images are loaded correctly
4. Cleans up tar files to save space

**Expected Duration:** 3-5 minutes

**Verify Images Loaded:**
```bash
podman images | grep meals
```

**Expected Output:**
```
localhost/meals-backend   latest   xxx   xxx ago   xxx MB
localhost/meals-frontend  latest   xxx   xxx ago   xxx MB
```

---

### Phase 5: Deploy Application

```bash
cd ~/mealplanner
./scripts/deploy-podman.sh
```

**What this does:**
1. Checks disk space
2. Stops any existing containers
3. Creates network if needed
4. Starts services incrementally (postgres → backend → frontend/nginx)
5. Waits for each service to be ready before starting the next
6. Runs database migrations
7. Verifies all containers are healthy

**Expected Duration:** 2-3 minutes

**New in v2:** The deployment script now starts services one at a time to avoid blocking issues with podman-compose. This provides better error reporting and prevents infinite hangs.

**Verify Deployment:**
```bash
# Check container status
podman ps

# Should show 4 containers running:
# - meals-postgres
# - meals-backend
# - meals-frontend
# - meals-nginx
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
podman-compose -f podman-compose.pi.yml logs -f frontend
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
./scripts/check-platform.sh

# 2. On dev machine, rebuild for correct architecture
# For 32-bit (most common):
./scripts/build-for-pi.sh

# For 64-bit:
./scripts/build-for-pi.sh --arm64

# 3. Transfer and reload images
scp pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/
ssh pi@pihole.local
cd ~/mealplanner
./scripts/load-pi-images.sh
./scripts/deploy-podman.sh
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
podman rm -f meals-postgres meals-backend meals-frontend meals-nginx
./scripts/deploy-podman.sh
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
./scripts/deploy-podman.sh
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

# 2. Rebuild images (use --arm64 if your Pi runs 64-bit OS)
./scripts/build-for-pi.sh

# 3. Transfer to Pi
scp pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/

# 4. On Pi: Stop application
cd ~/mealplanner
./scripts/pi-stop.sh

# 5. Remove old images
podman rmi meals-backend:latest meals-frontend:latest

# 6. Load new images
./scripts/load-pi-images.sh

# 7. Deploy
./scripts/deploy-podman.sh
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

The `podman-compose.pi.yml` includes optimized memory limits:
- PostgreSQL: 256MB
- Backend: 384MB (with Node.js heap limit: 256MB)
- Frontend: 128MB
- Nginx: 64MB

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
./scripts/deploy-podman.sh

# Health check
./scripts/pi-health-check.sh

# Full diagnostics
./scripts/pi-diagnostics.sh
```

---

## 🎓 Understanding the Architecture

### Container Structure

```
┌─────────────────────────────────────────┐
│           Nginx (Port 8080)             │
│  - Serves frontend static files         │
│  - Proxies API requests to backend      │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼────────┐
│   Frontend     │    │    Backend      │
│   (nginx)      │    │   (Node.js)     │
│   Port 80      │    │   Port 3000     │
└────────────────┘    └─────────┬───────┘
                                │
                      ┌─────────▼────────┐
                      │   PostgreSQL     │
                      │   Port 5432      │
                      └──────────────────┘
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

- [ ] Build images on dev machine
- [ ] Verify image sizes are reasonable
- [ ] Transfer images to Pi
- [ ] SSH into Pi
- [ ] Check disk space (should be <70%)
- [ ] Run cleanup if needed
- [ ] Verify Podman is installed
- [ ] Generate secrets (first time only)
- [ ] Load images
- [ ] Deploy application
- [ ] Verify all containers are running
- [ ] Test health endpoints
- [ ] Access application in browser
- [ ] Test login functionality
- [ ] Configure auto-start (optional)
- [ ] Set up monitoring (optional)

---

**Made with Bob** 🤖