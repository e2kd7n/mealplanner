#!/bin/bash

# Clean up systemd journal corruption on Raspberry Pi
# This script fixes corrupted journal files and optimizes journal storage

set -e

echo "🔧 Cleaning up systemd journal on Raspberry Pi..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ This script must be run as root or with sudo${NC}"
    echo -e "${YELLOW}Usage: sudo ./scripts/pi-journal-cleanup.sh${NC}"
    exit 1
fi

echo -e "${BLUE}📊 Current journal status:${NC}"
journalctl --disk-usage

echo ""
echo -e "${YELLOW}🧹 Step 1: Rotating journals...${NC}"
journalctl --rotate

echo ""
echo -e "${YELLOW}🗑️  Step 2: Removing corrupted/archived journals...${NC}"
# Remove archived journals older than 1 day
journalctl --vacuum-time=1d

echo ""
echo -e "${YELLOW}💾 Step 3: Limiting journal size...${NC}"
# Keep only 100MB of journals
journalctl --vacuum-size=100M

echo ""
echo -e "${YELLOW}🔍 Step 4: Verifying journal integrity...${NC}"
journalctl --verify || {
    echo -e "${YELLOW}⚠️  Some journal files have issues, removing them...${NC}"
    # If verification fails, remove all archived journals
    rm -f /var/log/journal/*/system@*.journal
    echo -e "${GREEN}✓ Removed problematic journal files${NC}"
}

echo ""
echo -e "${YELLOW}⚙️  Step 5: Configuring journal limits...${NC}"
# Create or update journald configuration
cat > /etc/systemd/journald.conf.d/00-journal-size.conf << 'EOF'
[Journal]
# Limit journal size to 100MB
SystemMaxUse=100M
# Keep journals for 7 days
MaxRetentionSec=7day
# Compress journals
Compress=yes
# Sync to disk every 5 minutes (reduces SD card wear)
SyncIntervalSec=5m
EOF

echo -e "${GREEN}✓ Journal configuration updated${NC}"

echo ""
echo -e "${YELLOW}🔄 Step 6: Restarting systemd-journald...${NC}"
systemctl restart systemd-journald

echo ""
echo -e "${GREEN}✅ Journal cleanup complete!${NC}"
echo ""
echo -e "${BLUE}📊 New journal status:${NC}"
journalctl --disk-usage

echo ""
echo -e "${BLUE}💡 Tips to prevent future corruption:${NC}"
echo -e "   1. Always use 'sudo shutdown -h now' instead of pulling power"
echo -e "   2. Consider adding a UPS or battery backup"
echo -e "   3. Use 'sudo systemctl reboot' for reboots"
echo ""
echo -e "${GREEN}🎯 Journal is now clean and optimized for SD card longevity${NC}"

# Made with Bob