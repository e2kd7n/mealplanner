# Raspberry Pi Deployment Guide - Complete Reference

**Last Updated:** April 25, 2026  
**Target Platform:** Raspberry Pi 4 (1.8GB+ RAM, ARM64)  
**Status:** Production Ready with Optimizations

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Deployment Workflow](#deployment-workflow)
4. [Performance Optimizations](#performance-optimizations)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Configuration](#advanced-configuration)

---

## Quick Start

**For experienced users who have already built images:**

```bash
# On Raspberry Pi
cd ~/mealplanner
git pull
./scripts/load-pi-images.sh    # If images transferred
./scripts/pi-run.sh             # Start application
./scripts/pi-health-check.sh    # Verify health
```

**Access:** http://your-pi-ip:8080

---

## Prerequisites

### Hardware Requirements

- **Minimum:** Raspberry Pi 4 Model B (2GB RAM)
- **Recommended:** Raspberry Pi 4 Model B (4GB+ RAM)
- **Storage:** 16GB+ SD card (Class 10 or better)
- **Network:** Ethernet connection recommended

### Software Requirements

**On Raspberry Pi:**
```bash
# Install Podman
sudo apt-get update
sudo apt-get install -y podman

# Install podman-compose
sudo apt-get install -y python3-pip
pip3 install podman-compose

# Verify installations
podman --version
podman-compose --version
```

**On Development Machine:**
- Podman or Docker with multi-arch support
- Git
- SSH access to Raspberry Pi

---

## Deployment Workflow

### Understanding the Architecture

**Why We Don't Build on Pi:**
- Raspberry Pi's Podman has strict seccomp restrictions
- Building triggers "container exited on bad system call" errors
- Solution: Build on capable machine, transfer pre-built images

### Step 1: Build Images (Development Machine)

```bash
cd ~/mealplanner
./scripts/build-for-pi.sh
```

**Output:**
- `pi-images/meals-backend.tar.gz` (~416MB compressed)
- `pi-images/meals-frontend.tar.gz` (~24MB compressed)

**Build time:** 10-15 minutes depending on machine

### Step 2: Transfer Images to Pi

**Option A: SCP (Simple)**
```bash
scp pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/
```

**Option B: Rsync (Resumable, faster)**
```bash
rsync -avz --progress pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/
```

**Transfer time:** 5-10 minutes on local network

### Step 3: Load Images on Pi

```bash
ssh pi@pihole.local
cd ~/mealplanner
./scripts/load-pi-images.sh
```

**What this does:**
- Decompresses images on-the-fly
- Loads into Podman
- Verifies successful load
- Cleans up tar files to save space

**Load time:** 3-5 minutes

### Step 4: Deploy Application

```bash
./scripts/pi-run.sh
```

**What this does:**
- Creates meals-network if needed
- Starts all containers with health checks
- Waits for services to be ready
- Displays access URLs

**Startup time:** 30-60 seconds

### Step 5: Verify Deployment

```bash
./scripts/pi-health-check.sh
```

**Access the application:**
- Web UI: http://your-pi-ip:8080
- Health endpoint: http://your-pi-ip:8080/health

---

## Performance Optimizations

### Memory Management

**Implemented in `podman-compose.pi.yml`:**

| Service | Limit | Reservation | Purpose |
|---------|-------|-------------|---------|
| PostgreSQL | 256MB | 128MB | Database |
| Backend | 384MB | 256MB | Node.js API |
| Frontend | 128MB | 64MB | Nginx static |
| Nginx Proxy | 64MB | 32MB | Reverse proxy |
| **Total** | **832MB** | **480MB** | **All services** |

**Memory headroom:** ~1GB available for OS and other services

### PostgreSQL Tuning

Optimized for 1.8GB RAM Pi (configured in `podman-compose.pi.yml`):

```yaml
POSTGRES_SHARED_BUFFERS: 128MB
POSTGRES_EFFECTIVE_CACHE_SIZE: 384MB
POSTGRES_WORK_MEM: 4MB
POSTGRES_MAX_CONNECTIONS: 20
```

### Node.js Optimization

```yaml
NODE_OPTIONS: --max-old-space-size=256
```

Limits Node.js heap to 256MB, preventing OOM issues.

### Container Image Sizes

- Backend: ~300MB (includes frontend assets)
- Frontend: ~50MB (nginx + static files)
- PostgreSQL: ~230MB (official alpine image)
- Nginx: ~40MB (official alpine image)

**Total:** ~620MB disk space for images

---

## Monitoring & Maintenance

### Health Checks

**Manual check:**
```bash
./scripts/pi-health-check.sh
```

**Automated monitoring (recommended):**
```bash
# Add to crontab for 5-minute checks
crontab -e
# Add this line:
*/5 * * * * /home/pi/mealplanner/scripts/pi-health-check.sh >> /var/log/pi-health.log 2>&1
```

**Health check monitors:**
- Temperature (Warning: >65°C, Critical: >70°C)
- Memory usage (Warning: >70%, Critical: >85%)
- Swap usage (Warning: >30%, Critical: >60%)
- Disk usage (Warning: >75%, Critical: >85%)
- CPU load (Warning: >2.0, Critical: >3.5)
- Container status (all 4 containers running)

### Auto-Start on Boot

The setup script can configure the application to start automatically when the Pi boots:

```bash
./scripts/pi-setup.sh
# Answer 'yes' when prompted for auto-start
```

**Systemd service commands:**
```bash
# Check status
sudo systemctl status mealplanner

# Start manually
sudo systemctl start mealplanner

# Stop
sudo systemctl stop mealplanner

# Restart
sudo systemctl restart mealplanner

# Disable auto-start
sudo systemctl disable mealplanner

# Re-enable auto-start
sudo systemctl enable mealplanner
```

### Management Commands

```bash
# View logs
podman-compose -f podman-compose.pi.yml logs -f

# View specific service logs
podman-compose -f podman-compose.pi.yml logs -f backend

# Restart application
./scripts/pi-bounce.sh

# Stop application
./scripts/pi-stop.sh

# Check container status
podman ps

# Check resource usage
podman stats
```

### Regular Maintenance

**Weekly:**
```bash
# Check health
./scripts/pi-health-check.sh

# Review logs for errors
podman-compose -f podman-compose.pi.yml logs --tail=100 backend

# Clean up stopped containers
podman system prune
```

**Monthly:**
```bash
# Database maintenance
podman exec meals-postgres psql -U mealplanner -d meal_planner -c "VACUUM ANALYZE;"

# More aggressive cleanup
podman system prune -a

# Check disk usage
df -h
du -sh /var/lib/containers/storage/
```

### Backup Strategy

**Database backup:**
```bash
# Manual backup
podman exec meals-postgres pg_dump -U mealplanner meal_planner > backup-$(date +%Y%m%d).sql

# Automated daily backup (add to crontab)
0 2 * * * podman exec meals-postgres pg_dump -U mealplanner meal_planner | gzip > /home/pi/backups/meal_planner-$(date +\%Y\%m\%d).sql.gz
```

**Full system backup:**
```bash
# Backup volumes
podman volume export postgres_data > postgres_data-$(date +%Y%m%d).tar

# Backup configuration
tar -czf config-backup-$(date +%Y%m%d).tar.gz \
    secrets/ \
    nginx/ \
    podman-compose.pi.yml
```

---

## Troubleshooting

### Common Issues

#### 1. "Container exited on bad system call"

**Cause:** Trying to build images on Pi  
**Solution:** Always build on development machine and transfer

```bash
# WRONG - Don't do this on Pi
./scripts/pi-build-manual.sh

# RIGHT - Do this workflow
# 1. Build on dev machine: ./scripts/build-for-pi.sh
# 2. Transfer: scp pi-images/*.tar.gz pi@pihole:~/mealplanner/pi-images/
# 3. Load on Pi: ./scripts/load-pi-images.sh
# 4. Run on Pi: ./scripts/pi-run.sh
```

#### 2. "Pre-built images not found"

**Cause:** Images not loaded before deployment  
**Solution:**

```bash
# Check if images exist
podman images | grep meals

# If not, load them
./scripts/load-pi-images.sh

# Then deploy
./scripts/pi-run.sh
```

#### 3. High Memory Usage

**Symptoms:** Swap usage >60%, system slow  
**Solution:**

```bash
# Check current usage
free -h
podman stats

# Restart services to clear memory
./scripts/pi-bounce.sh

# If persistent, increase swap
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

#### 4. Disk Space Full

**Symptoms:** Deployment fails, containers won't start  
**Solution:**

```bash
# Check usage
df -h
podman system df

# Clean up
sudo journalctl --vacuum-size=50M
podman system prune -a --volumes

# Remove old images
podman image prune -a
```

#### 5. Containers Won't Start

**Check logs:**
```bash
podman-compose -f podman-compose.pi.yml logs backend
podman-compose -f podman-compose.pi.yml logs postgres
```

**Common fixes:**
```bash
# Restart everything
./scripts/pi-stop.sh
./scripts/pi-run.sh

# Check network
podman network ls
podman network inspect meals-network

# Recreate network if needed
podman network rm meals-network
podman network create meals-network
```

### Performance Issues

#### Slow Response Times

**Check:**
```bash
# CPU load
uptime

# Memory pressure
free -h

# Container stats
podman stats
```

**Solutions:**
```bash
# Reduce concurrent connections in backend
# Edit backend environment in podman-compose.pi.yml
# Add: MAX_CONCURRENT_REQUESTS=5

# Restart to apply
./scripts/pi-bounce.sh
```

#### High CPU Usage

**Identify culprit:**
```bash
top
podman stats
```

**Solutions:**
```bash
# If Podman daemon high:
podman system prune

# If specific container high:
podman restart <container-name>

# Check for runaway processes
podman exec meals-backend ps aux
```

---

## Advanced Configuration

### Running Headless (Recommended)

Save ~150MB RAM and 10% CPU:

```bash
# Disable desktop environment
sudo systemctl set-default multi-user.target
sudo reboot
```

### Custom Memory Limits

Edit `podman-compose.pi.yml`:

```yaml
services:
  backend:
    mem_limit: 512m  # Increase if you have 4GB+ RAM
    mem_reservation: 384m
```

### Network Optimization

```bash
# Add to /etc/sysctl.conf
sudo tee -a /etc/sysctl.conf << 'EOF'
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 67108864
net.ipv4.tcp_wmem = 4096 65536 67108864
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq
EOF

sudo sysctl -p
```

### Log Rotation

```bash
# Create log rotation config
sudo tee /etc/logrotate.d/mealplanner << 'EOF'
/var/log/mealplanner/*.log {
    daily
    rotate 3
    compress
    delaycompress
    missingok
    notifempty
    maxsize 50M
}
EOF
```

### SSL/HTTPS Setup

```bash
# Generate self-signed certificate
mkdir -p certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout certs/key.pem \
    -out certs/cert.pem

# Update nginx configuration
# Edit nginx/default.conf to add SSL server block
```

---

## Performance Targets

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| CPU Load (1m) | <2.0 | >2.0 | >3.5 |
| Memory Usage | <70% | >70% | >85% |
| Swap Usage | <30% | >30% | >60% |
| Disk Usage | <75% | >75% | >85% |
| Temperature | <65°C | >65°C | >70°C |
| API Response | <200ms | >500ms | >1000ms |

---

## Quick Reference Commands

```bash
# First Time Setup
./scripts/pi-setup.sh              # Generate quick start guide + auto-start

# Status & Health
./scripts/pi-health-check.sh
podman ps
podman stats

# Start/Stop/Restart
./scripts/pi-run.sh
./scripts/pi-stop.sh
./scripts/pi-bounce.sh

# Logs
podman-compose -f podman-compose.pi.yml logs -f
podman-compose -f podman-compose.pi.yml logs -f backend

# Cleanup
podman system prune
podman system prune -a
sudo journalctl --vacuum-size=50M

# Backup
podman exec meals-postgres pg_dump -U mealplanner meal_planner > backup.sql

# Update
git pull
# Then rebuild on dev machine and transfer new images
```

---

## Support & Resources

- **Main Documentation:** [README.md](../README.md)
- **Optimization Details:** [PI_OPTIMIZATION_PROPOSAL.md](PI_OPTIMIZATION_PROPOSAL.md)
- **Workflow Details:** [RASPBERRY_PI_CORRECT_WORKFLOW.md](RASPBERRY_PI_CORRECT_WORKFLOW.md)
- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Changelog

**2026-04-25:**
- Added memory limits and PostgreSQL optimizations
- Created health check script
- Consolidated all Pi documentation
- Fixed build workflow (no building on Pi)

**2026-04-24:**
- Initial Pi deployment support
- Created build and transfer scripts

---

*Made with Bob*