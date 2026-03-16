# Raspberry Pi Quick Start Guide

Get your Meal Planner app running on Raspberry Pi in under 10 minutes!

## 🚀 Quick Setup

### 1. Prepare Your Raspberry Pi

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install required packages
sudo apt-get install -y podman git

# Install podman-compose (use system package or pipx)
# Option 1: Try system package first (recommended)
sudo apt-get install -y podman-compose

# Option 2: If system package not available, use pipx
# sudo apt-get install -y pipx
# pipx install podman-compose
# pipx ensurepath
```

### 2. Clone and Deploy

```bash
# Clone the repository
git clone <your-repo-url> mealplanner
cd mealplanner

# Generate secrets
chmod +x scripts/generate-secrets.sh
./scripts/generate-secrets.sh

# Deploy!
chmod +x scripts/deploy-podman.sh
./scripts/deploy-podman.sh
```

### 3. Access Your App

Open your browser and go to:
- **On the Pi**: http://localhost:8080
- **From another device**: http://raspberrypi.local:8080
- **Or use IP**: http://192.168.x.x:8080

## 📱 Quick Commands

```bash
# View status
./scripts/podman-commands.sh status

# View logs
./scripts/podman-commands.sh logs

# Stop app
./scripts/podman-commands.sh stop

# Start app
./scripts/podman-commands.sh start

# Restart app
./scripts/podman-commands.sh restart

# Backup database
./scripts/podman-commands.sh backup-db

# Check health
./scripts/podman-commands.sh health
```

## 🔧 Common Issues

### Port 8080 Already in Use?

Edit `podman-compose.yml` and change the port:
```yaml
nginx:
  ports:
    - "8081:80"  # Change to any available port
```

### Out of Memory?

Increase swap space:
```bash
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Can't Access from Other Devices?

Check your firewall:
```bash
sudo ufw allow 8080/tcp
sudo ufw enable
```

## 🎯 Next Steps

1. **Create an account** at http://raspberrypi.local:8080/register
2. **Start planning meals** - Add recipes, create meal plans
3. **Generate grocery lists** - Automatically from your meal plans
4. **Track your pantry** - Know what you have on hand

## 📚 More Help

- Full deployment guide: See `DEPLOYMENT.md`
- Application setup: See `SETUP.md`
- Troubleshooting: See `DEPLOYMENT.md` troubleshooting section

## 🔄 Auto-Start on Boot

To make the app start automatically when your Pi boots:

```bash
# Create systemd service
sudo nano /etc/systemd/system/mealplanner.service
```

Paste this content:
```ini
[Unit]
Description=Meal Planner Application
After=network.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/pi/mealplanner
ExecStart=/home/pi/.local/bin/podman-compose -f podman-compose.yml up -d
ExecStop=/home/pi/.local/bin/podman-compose -f podman-compose.yml down
User=pi

[Install]
WantedBy=multi-user.target
```

Enable it:
```bash
sudo systemctl daemon-reload
sudo systemctl enable mealplanner
sudo systemctl start mealplanner
```

## 💡 Tips

- **Performance**: Raspberry Pi 4 with 4GB RAM works best
- **Storage**: Use a good quality SD card (Class 10 or better)
- **Network**: Wired connection is more stable than WiFi
- **Backups**: Run `./scripts/podman-commands.sh backup-db` regularly
- **Updates**: Run `./scripts/podman-commands.sh update` to get latest features

## 🆘 Need Help?

1. Check logs: `./scripts/podman-commands.sh logs`
2. Check status: `./scripts/podman-commands.sh status`
3. Check health: `./scripts/podman-commands.sh health`
4. Review full documentation in `DEPLOYMENT.md`

Happy meal planning! 🍽️