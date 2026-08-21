#!/bin/bash

# Clean up systemd journal corruption on Raspberry Pi
# This script fixes corrupted journal files and optimizes journal storage

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

section "Journal Cleanup" "🧹"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ This script must be run as root or with sudo${NC}"
    echo -e "${YELLOW}Usage: sudo ./scripts/pi-journal-cleanup.sh${NC}"
    exit 1
fi

echo -e "${BLUE}ℹ️  Current journal status:${NC}"
journalctl --disk-usage

steps_init 6

step "Rotating journals"
journalctl --rotate

step "Removing corrupted/archived journals older than 1 day"
journalctl --vacuum-time=1d

step "Limiting journal size to 100MB"
journalctl --vacuum-size=100M

step "Verifying journal integrity"
if ! journalctl --verify; then
    echo -e "  ${YELLOW}⚠️  Some journal files have issues, removing them...${NC}"
    # If verification fails, remove all archived journals
    rm -f /var/log/journal/*/system@*.journal
    echo -e "  ${GREEN}✓ Removed problematic journal files${NC}"
fi

step "Configuring journal limits"
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
echo -e "  ${GREEN}✓ Journal configuration updated${NC}"

step "Restarting systemd-journald"
systemctl restart systemd-journald

section "Summary" "🍽️"
echo -e "  ${GREEN}✓ Journal cleanup complete!${NC}"
echo ""
echo -e "${BLUE}ℹ️  New journal status:${NC}"
journalctl --disk-usage

echo ""
echo -e "${BLUE}💡 Tips to prevent future corruption:${NC}"
echo -e "   1. Always use 'sudo shutdown -h now' instead of pulling power"
echo -e "   2. Consider adding a UPS or battery backup"
echo -e "   3. Use 'sudo systemctl reboot' for reboots"
echo ""
echo -e "${GREEN}🎯 Journal is now clean and optimized for SD card longevity${NC}"
