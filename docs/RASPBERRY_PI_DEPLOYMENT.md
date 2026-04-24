# Raspberry Pi Deployment Guide

Complete guide for building and deploying the Meal Planner application on Raspberry Pi using Podman containers.

## Architecture Overview

The application uses a multi-container architecture:

1. **Backend Container** (`meals-backend`)
   - Node.js 20 Alpine
   - Includes built frontend assets (served as fallback)
   - Prisma ORM with PostgreSQL
   - Runs on port 3000

2. **Frontend Container** (`meals-frontend`)
   - Nginx Alpine
   - Serves React SPA
   - Runs on port 80 (internal)

3. **Database Container** (`meals-postgres`)
   - PostgreSQL 16 Alpine
   - Persistent volume storage
   - Runs on port 5432 (internal)

4. **Reverse Proxy** (`meals-nginx`)
   - Nginx Alpine
   - Routes traffic to frontend/backend
   - Exposed on port 8080 (HTTP)

## Prerequisites

### On Development Machine
- Podman or Docker installed
- Access to project repository
- Sufficient disk space (~2GB for images)

### On Raspberry Pi
- Raspberry Pi 4 or newer (ARM64)
- Raspberry Pi OS (64-bit) or Ubuntu Server
- Podman installed: `sudo apt-get install -y podman`
- Python 3 with pip: `sudo apt-get install -y python3-pip`
- podman-compose: `pip3 install podman-compose`
- At least 4GB RAM recommended
- 16GB+ SD card/storage

## Deployment Process

### Step 1: Build Container Images (Development Machine)

Build ARM64 container images for Raspberry Pi:

```bash
./scripts/build-for-pi.sh
```

This script:
- ✅ Detects Podman or Docker
- ✅ Builds backend image with integrated frontend (multi-stage)
- ✅ Builds standalone frontend image for nginx
- ✅ Targets ARM64 architecture
- ✅ Saves images as tar files in `./pi-images/`

**Output:**
- `pi-images/meals-backend.tar` (~300-400MB)
- `pi-images/meals-frontend.tar` (~50-100MB)

### Step 2: Transfer Images to Raspberry Pi

Transfer the built images to your Raspberry Pi:

```bash
# Using SCP (recommended - transfer compressed files)
scp pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/

# Or transfer uncompressed (larger, slower)
scp pi-images/*.tar pi@pihole.local:~/mealplanner/pi-images/

# Or using rsync (faster, resumable)
rsync -avz --progress pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/
```

**Note:**
- Ensure the `~/mealplanner` directory exists on the Pi and contains all project files
- Use compressed `.tar.gz` files for faster transfer (60% smaller)
- The load script handles both compressed and uncompressed files automatically

### Step 3: Load Images on Raspberry Pi

SSH into your Raspberry Pi and load the images:

```bash
ssh pi@pihole.local
cd ~/mealplanner
./scripts/load-pi-images.sh
```

**What this script does:**
- Automatically detects compressed (.tar.gz) or uncompressed (.tar) files
- Decompresses on-the-fly (no manual unzip needed)
- Loads images into podman
- Automatically removes tar files after successful load to save space
- Shows disk usage before and after

This script:
- ✅ Verifies Podman is installed
- ✅ Checks for required image files
- ✅ Loads both backend and frontend images
- ✅ Verifies images are available

### Step 4: Deploy Application

Deploy the application using Podman Compose:

```bash
./scripts/deploy-podman.sh
```

This script:
- ✅ Generates secrets if not present
- ✅ Stops existing containers
- ✅ Uses pre-loaded images (skips build)
- ✅ Starts all services with health checks
- ✅ Runs database migrations automatically
- ✅ Verifies deployment success

**Deployment takes ~2-3 minutes** including database initialization.

## Verification

### Check Service Status

```bash
podman-compose -f podman-compose.yml ps
```

All services should show "Up" status with healthy state.

### Access the Application

- **Web Interface:** http://pihole.local:8080
- **API Health:** http://pihole.local:8080/api/health
- **Direct Backend:** http://pihole.local:8080/api

### View Logs

```bash
# All services
podman-compose -f podman-compose.yml logs -f

# Specific service
podman-compose -f podman-compose.yml logs -f backend
podman-compose -f podman-compose.yml logs -f frontend
podman-compose -f podman-compose.yml logs -f postgres
```

## Management Commands

Use the [`scripts/podman-commands.sh`](../scripts/podman-commands.sh) script for common operations:

```bash
# Start services
./scripts/podman-commands.sh start

# Stop services
./scripts/podman-commands.sh stop

# Restart services
./scripts/podman-commands.sh restart

# View logs
./scripts/podman-commands.sh logs

# Check status
./scripts/podman-commands.sh status

# Backup database
./scripts/podman-commands.sh backup

# Restore database
./scripts/podman-commands.sh restore

# Update application
./scripts/podman-commands.sh update

# View resource usage
./scripts/podman-commands.sh stats

# Clean up (stop + remove containers)
./scripts/podman-commands.sh clean

# Full cleanup (includes volumes)
./scripts/podman-commands.sh clean-all
```

## Architecture Details

### Container Build Process

#### Backend Dockerfile (`backend/Dockerfile`)
Multi-stage build:
1. **Stage 1:** Build frontend (Node 20 Alpine)
   - Install pnpm and dependencies
   - Build React app with Vite
   - Output to `/frontend/dist`

2. **Stage 2:** Build backend (Node 20 Alpine)
   - Install build dependencies (python3, make, g++)
   - Install pnpm and dependencies
   - Generate Prisma client
   - Compile TypeScript

3. **Stage 3:** Production (Node 20 Alpine)
   - Copy built backend from stage 2
   - Copy built frontend from stage 1
   - Install production dependencies
   - Generate Prisma client for runtime
   - Configure entrypoint script

#### Frontend Dockerfile (`frontend/Dockerfile`)
Two-stage build:
1. **Builder:** Build React app
   - Install pnpm and dependencies
   - Build with Vite
   
2. **Production:** Nginx Alpine
   - Copy built assets
   - Configure nginx
   - Serve static files

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

### Data Persistence

Volumes mounted on host:
- `./data/uploads` - User uploaded files
- `./data/backups` - Database backups
- `./data/images` - Recipe images
- `postgres_data` - Database files (Docker volume)

## Troubleshooting

### Images Not Loading
```bash
# Verify images exist
podman images | grep meals

# If missing, re-run load script
./scripts/load-pi-images.sh
```

### Backend Container Fails
```bash
# Check logs
podman logs meals-backend

# Common issues:
# - Database not ready: Wait 30s and check again
# - Secrets missing: Run ./scripts/generate-secrets.sh
# - Migration failed: Check database connectivity
```

### Database Connection Issues
```bash
# Check postgres is running
podman ps | grep postgres

# Check postgres logs
podman logs meals-postgres

# Verify secrets
ls -la ./secrets/
```

### Port Already in Use
```bash
# Check what's using port 8080
sudo lsof -i :8080

# Stop conflicting service or change port in podman-compose.yml
```

### Out of Memory
```bash
# Check memory usage
free -h

# Increase swap if needed
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile  # Set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

## Performance Optimization

### Raspberry Pi 4 Recommendations
- Use 4GB or 8GB RAM model
- Use SSD instead of SD card for better I/O
- Enable swap (2GB minimum)
- Overclock if needed (with proper cooling)

### Container Resource Limits
Edit `podman-compose.yml` to add resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '2'
```

## Updates and Maintenance

### Update Application

1. On development machine, rebuild images:
```bash
./scripts/build-for-pi.sh
```

2. Transfer new images to Pi

3. On Raspberry Pi:
```bash
./scripts/load-pi-images.sh
./scripts/deploy-podman.sh
```

### Database Backups

Automatic backups can be scheduled with cron:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd ~/mealplanner && ./scripts/podman-commands.sh backup
```

### Monitor Logs

Set up log rotation to prevent disk space issues:

```bash
# Configure podman log rotation
sudo nano /etc/containers/containers.conf

# Add under [containers] section:
log_size_max = 10485760  # 10MB
```

## Security Considerations

1. **Change Default Secrets:** Always regenerate secrets in production
2. **Firewall:** Configure UFW to restrict access
3. **HTTPS:** Set up SSL certificates for production use
4. **Updates:** Keep Raspberry Pi OS and Podman updated
5. **Backups:** Regular database backups to external storage

## Network Configuration

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

## Related Documentation

- [Local Development](LOCAL_DEVELOPMENT.md) - Running locally without containers
- [Database Backup](DATABASE_BACKUP.md) - Backup and restore procedures
- [Secrets Management](SECRETS_MANAGEMENT.md) - Security best practices
- [Monitoring](MONITORING.md) - Application monitoring setup

## Support

For issues or questions:
1. Check logs: `podman-compose logs -f`
2. Verify all services are healthy: `podman-compose ps`
3. Review this documentation
4. Check GitHub issues

---

*Last Updated: 2026-04-24*
*Tested on: Raspberry Pi 4 (4GB), Raspberry Pi OS 64-bit*