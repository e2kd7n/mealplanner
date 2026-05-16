# Deployment Guide - Raspberry Pi with Podman

**Last Updated:** 2026-05-06

This guide covers deploying the Meal Planner application on Raspberry Pi using Podman.

## Quick Start (Recommended: Build on Pi)

**Build directly on Pi** - This is the recommended approach. Cross-compilation from macOS has known limitations, and Linux cross-compilation requires proper multi-arch toolchain setup:

```bash
# On Pi
cd ~/mealplanner
git pull
./scripts/build-on-pi.sh  # First build: ~2 hours, subsequent: 5-10 min
./scripts/pi-run.sh
```

## Alternative (Linux Dev Machines)

If you have a Linux development machine with proper multi-arch support:

```bash
# On Linux dev machine
./scripts/build-for-pi.sh
scp pi-images/meals-backend.tar pi-images/frontend-dist.tar.gz \
    pi@192.168.4.110:~/mealplanner/pi-images/

# On Pi
./scripts/load-pi-images.sh
./scripts/pi-run.sh
```

**Important**: Cross-compilation from macOS to ARM64 has known compatibility issues with Vite's toolchain. When in doubt, build directly on the Pi.

**See [docs/PI_BUILD_OPTIMIZATION.md](docs/PI_BUILD_OPTIMIZATION.md) for detailed build optimization guide.**

---

## Prerequisites

### Hardware Requirements
- Raspberry Pi 4 (2GB RAM minimum, 4GB+ recommended)
- 16GB+ SD card
- Stable internet connection

### Software Requirements
- Raspberry Pi OS (64-bit recommended)
- Podman
- podman-compose
- Git

## Installation Steps

### 1. Update Your Raspberry Pi

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 2. Install Podman

```bash
# Install Podman
sudo apt-get install -y podman

# Verify installation
podman --version
```

### 3. Install podman-compose

```bash
# Install Python pip if not already installed
sudo apt-get install -y python3-pip

# Install podman-compose
pip3 install podman-compose

# Add to PATH if needed
echo 'export PATH=$PATH:~/.local/bin' >> ~/.bashrc
source ~/.bashrc

# Verify installation
podman-compose --version
```

### 4. Clone the Repository

```bash
# Clone the repository
git clone <your-repo-url> meal-planner
cd meal-planner
```

### 5. Generate Secrets

```bash
# Make the script executable
chmod +x scripts/generate-secrets.sh

# Generate secrets
./scripts/generate-secrets.sh
```

This will create secure random passwords and keys in the `secrets/` directory.

### 6. Configure Environment (Optional)

If you need to customize settings, edit the `podman-compose.yml` file:

```bash
nano podman-compose.yml
```

Key settings to consider:
- `CORS_ORIGIN`: Add your Pi's IP address or hostname
- Port mappings (default is 8080)

### 7. Deploy the Application

```bash
# Make the deployment script executable
chmod +x scripts/deploy-podman.sh

# Run the deployment
./scripts/deploy-podman.sh
```

The script will:
1. Check for required dependencies
2. Generate secrets if needed
3. Stop any existing containers
4. Build the Docker images
5. Start all services
6. Run database migrations

### 8. Access the Application

Once deployed, access the application at:
- **Local**: http://localhost:8080
- **Network**: http://raspberrypi.local:8080 (or your Pi's IP address)

## Managing the Application

### View Logs

```bash
# View all logs
podman-compose -f podman-compose.pi.yml logs -f

# View specific service logs
podman-compose -f podman-compose.pi.yml logs -f backend
podman-compose -f podman-compose.pi.yml logs -f postgres
podman-compose -f podman-compose.pi.yml logs -f nginx
# Note: no frontend container — Nginx serves the PWA static files directly
```

### Stop the Application

```bash
./scripts/pi-stop.sh
```

### Start the Application

```bash
./scripts/pi-run.sh
```

### Restart the Application

```bash
./scripts/pi-bounce.sh
```

### Stop and Remove Containers

```bash
podman-compose -f podman-compose.pi.yml down
```

### Update the Application

```bash
# Pull latest changes
git pull

# Rebuild on Pi (recommended):
./scripts/build-on-pi.sh
./scripts/pi-bounce.sh
```

## Troubleshooting

### Check Service Status

```bash
podman-compose -f podman-compose.pi.yml ps
```

### Check Container Health

```bash
podman ps --format "table {{.Names}}\t{{.Status}}"
```

### Access Container Shell

```bash
# Backend
podman exec -it meals-backend sh

# Database
podman exec -it meals-postgres psql -U mealplanner -d meal_planner

# Note: no frontend container — frontend is static files in ./data/frontend-dist/
```

### Database Issues

If you need to reset the database:

```bash
# Stop containers
podman-compose -f podman-compose.pi.yml down

# Remove database volume
podman volume rm meals_postgres_data

# Restart
./scripts/pi-run.sh
```

### Port Already in Use

If port 8080 is already in use, edit `podman-compose.yml`:

```yaml
nginx:
  ports:
    - "8081:80"  # Change 8080 to another port
```

### Memory Issues

If your Pi runs out of memory:

1. Increase swap space:
```bash
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

2. Build directly on Pi (avoids cross-compile memory pressure):
```bash
./scripts/build-on-pi.sh
./scripts/pi-run.sh
```

## Performance Optimization

### Enable Podman Auto-Update

```bash
# Enable auto-update for containers
podman auto-update
```

### Set Up Systemd Service

Create a systemd service to start the application on boot:

```bash
# Create service file
sudo nano /etc/systemd/system/meal-planner.service
```

Add the following content:

```ini
[Unit]
Description=Meal Planner Application
After=network.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/pi/mealplanner
ExecStart=/usr/bin/podman-compose -f podman-compose.pi.yml up -d
ExecStop=/usr/bin/podman-compose -f podman-compose.pi.yml down
User=pi

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable meal-planner
sudo systemctl start meal-planner
```

## Backup and Restore

### Backup Database

```bash
# Create backup directory
mkdir -p backups

# Backup database
podman exec meals-postgres pg_dump -U mealplanner meal_planner > backups/backup-$(date +%Y%m%d-%H%M%S).sql
```

### Restore Database

```bash
# Restore from backup
cat backups/backup-YYYYMMDD-HHMMSS.sql | podman exec -i meals-postgres psql -U mealplanner -d meal_planner
```

### Backup Volumes

```bash
# Backup all data
podman volume export meals_postgres_data > backups/postgres-data-$(date +%Y%m%d).tar
podman volume export meals_redis_data > backups/redis-data-$(date +%Y%m%d).tar
```

## Security Considerations

1. **Change Default Secrets**: Always generate new secrets for production
2. **Firewall**: Configure UFW to restrict access
   ```bash
   sudo ufw allow 8080/tcp
   sudo ufw enable
   ```
3. **HTTPS**: Consider setting up a reverse proxy with SSL (Caddy or Traefik)
4. **Updates**: Regularly update the system and containers
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   podman pull --all-tags
   ```

## Monitoring

### Resource Usage

```bash
# Monitor container resources
podman stats

# Check disk usage
podman system df
```

### Health Checks

```bash
# Check application health
curl http://localhost:8080/health

# Check backend health
curl http://localhost:8080/api/health
```

## Support

For issues or questions:
1. Check the logs: `podman-compose -f podman-compose.pi.yml logs -f`
2. Review this documentation
3. Check the main README.md for application-specific help

## Additional Resources

- [Podman Documentation](https://docs.podman.io/)
- [podman-compose Documentation](https://github.com/containers/podman-compose)
- [Raspberry Pi Documentation](https://www.raspberrypi.org/documentation/)