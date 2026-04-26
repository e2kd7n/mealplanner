#!/bin/bash

# Cleanup script for Raspberry Pi
# Removes containers, images, volumes, and temporary files to free up storage

set -e

echo "🧹 Starting Raspberry Pi cleanup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show disk usage
show_disk_usage() {
    echo -e "${BLUE}💾 Current disk usage:${NC}"
    df -h / | grep -v Filesystem
    echo ""
}

# Function to check if cleanup is needed
check_cleanup_needed() {
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$DISK_USAGE" -lt 60 ]; then
        echo -e "${GREEN}✓ Disk usage is healthy (${DISK_USAGE}%)${NC}"
        echo -e "${BLUE}No cleanup needed at this time.${NC}"
        echo ""
        echo -e "${YELLOW}Current status:${NC}"
        show_disk_usage
        podman system df 2>/dev/null || true
        exit 0
    elif [ "$DISK_USAGE" -lt 70 ]; then
        echo -e "${YELLOW}⚠️  Disk usage is moderate (${DISK_USAGE}%)${NC}"
        echo -e "${BLUE}Cleanup recommended but not critical.${NC}"
    else
        echo -e "${RED}❌ Disk usage is high (${DISK_USAGE}%)${NC}"
        echo -e "${YELLOW}Cleanup strongly recommended!${NC}"
    fi
    echo ""
}

# Capture initial disk usage for calculation
DISK_BEFORE=$(df / | awk 'NR==2 {print $3}')
DISK_USAGE_PERCENT=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')

# Show initial disk usage
echo -e "${YELLOW}Before cleanup:${NC}"
show_disk_usage

# Check if cleanup is actually needed
check_cleanup_needed

# Stop mealplanner containers only
echo -e "${YELLOW}🛑 Stopping mealplanner containers...${NC}"
if command -v podman-compose &> /dev/null && [ -f "podman-compose.yml" ]; then
    podman-compose -f podman-compose.yml down 2>/dev/null || true
    echo -e "${GREEN}✓ Stopped containers via podman-compose${NC}"
else
    echo -e "${BLUE}ℹ️  No podman-compose.yml found, skipping compose down${NC}"
fi

# Remove only mealplanner-specific containers by name
if command -v podman &> /dev/null; then
    echo -e "${YELLOW}🗑️  Removing mealplanner containers...${NC}"
    podman rm -f meals-backend meals-frontend meals-db 2>/dev/null || true
    echo -e "${GREEN}✓ Removed mealplanner containers${NC}"
fi

# Remove only mealplanner images
echo -e "${YELLOW}🗑️  Removing mealplanner images...${NC}"
if command -v podman &> /dev/null; then
    podman rmi -f meals-backend:latest meals-frontend:latest 2>/dev/null || true
    podman rmi -f postgres:15-alpine 2>/dev/null || true
    echo -e "${GREEN}✓ Removed mealplanner images${NC}"
fi

# Remove only mealplanner volumes
echo -e "${YELLOW}🗑️  Removing mealplanner volumes...${NC}"
if command -v podman &> /dev/null; then
    podman volume rm -f mealplanner_postgres-data mealplanner_data-uploads mealplanner_data-backups mealplanner_data-images 2>/dev/null || true
    echo -e "${GREEN}✓ Removed mealplanner volumes${NC}"
fi

# Clean up only dangling resources (safe - doesn't remove other apps)
echo -e "${YELLOW}🧹 Cleaning dangling podman resources...${NC}"
if command -v podman &> /dev/null; then
    podman system prune -f 2>/dev/null || true
    echo -e "${GREEN}✓ Cleaned dangling resources${NC}"
fi

# Remove image tar files (both compressed and uncompressed)
echo -e "${YELLOW}🗑️  Removing image tar files...${NC}"
if [ -d "./pi-images" ]; then
    TAR_COUNT=$(ls -1 ./pi-images/*.tar ./pi-images/*.tar.gz 2>/dev/null | wc -l)
    if [ "$TAR_COUNT" -gt 0 ]; then
        rm -f ./pi-images/*.tar ./pi-images/*.tar.gz 2>/dev/null || true
        echo -e "${GREEN}✓ Removed ${TAR_COUNT} tar files from ./pi-images/${NC}"
    else
        echo -e "${BLUE}ℹ️  No tar files found in ./pi-images/${NC}"
    fi
else
    echo -e "${BLUE}ℹ️  No pi-images directory found${NC}"
fi

# Clean up build cache
echo -e "${YELLOW}🧹 Cleaning build cache...${NC}"
if command -v podman &> /dev/null; then
    podman builder prune -af 2>/dev/null || true
fi

# Remove temporary files (only mealplanner-related)
echo -e "${YELLOW}🗑️  Removing temporary files...${NC}"
# Note: Skipping /tmp cleanup to avoid affecting other applications
echo -e "${BLUE}ℹ️  Skipping /tmp cleanup (system-wide)${NC}"

# Clean up data directories (optional - prompts user)
echo ""
echo -e "${YELLOW}⚠️  Do you want to remove application data? (uploads, backups, images)${NC}"
echo -e "${RED}WARNING: This will delete all user data!${NC}"
read -p "Remove data directories? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗑️  Removing data directories...${NC}"
    rm -rf ./data/uploads/* 2>/dev/null || true
    rm -rf ./data/backups/* 2>/dev/null || true
    rm -rf ./data/images/* 2>/dev/null || true
    echo -e "${GREEN}✓ Data directories cleaned${NC}"
else
    echo -e "${BLUE}ℹ️  Keeping data directories${NC}"
fi

# Clean up secrets (optional - prompts user)
echo ""
echo -e "${YELLOW}⚠️  Do you want to remove secrets?${NC}"
echo -e "${RED}WARNING: You'll need to regenerate secrets for next deployment!${NC}"
read -p "Remove secrets? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗑️  Removing secrets...${NC}"
    rm -rf ./secrets/* 2>/dev/null || true
    echo -e "${GREEN}✓ Secrets removed${NC}"
else
    echo -e "${BLUE}ℹ️  Keeping secrets${NC}"
fi

# Skip system-wide cleanup operations
echo -e "${BLUE}ℹ️  Skipping system-wide cleanup (apt cache, journal logs)${NC}"
echo -e "${BLUE}ℹ️  These operations could affect other applications on the Pi${NC}"
echo -e "${YELLOW}💡 If you need system-wide cleanup, run manually:${NC}"
echo -e "   sudo apt-get clean && sudo apt-get autoremove -y"
echo -e "   sudo journalctl --vacuum-time=3d"

# Calculate space freed
DISK_AFTER=$(df / | awk 'NR==2 {print $3}')
DISK_FINAL_PERCENT=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
DISK_FREED=$((DISK_BEFORE - DISK_AFTER))
DISK_FREED_MB=$((DISK_FREED / 1024))
DISK_FREED_GB=$(echo "scale=2; $DISK_FREED_MB / 1024" | bc 2>/dev/null || echo "0")
PERCENT_FREED=$((DISK_USAGE_PERCENT - DISK_FINAL_PERCENT))

# Show final disk usage
echo ""
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo -e "${YELLOW}After cleanup:${NC}"
show_disk_usage

# Show what was cleaned
echo -e "${BLUE}📊 Cleanup summary:${NC}"
echo -e "   ✓ All mealplanner containers stopped and removed"
echo -e "   ✓ All mealplanner images removed"
echo -e "   ✓ All mealplanner volumes removed"
echo -e "   ✓ Podman system cache cleaned"
echo -e "   ✓ Image tar files removed from ./pi-images/"
echo -e "   ℹ️  System-wide cleanup skipped (safe for multi-app Pi)"
echo ""

# Show space freed summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ "$DISK_FREED_MB" -gt 1024 ]; then
    echo -e "${GREEN}🎉 Freed ${DISK_FREED_GB}GB of disk space! (${PERCENT_FREED}% reduction)${NC}"
else
    echo -e "${GREEN}🎉 Freed ${DISK_FREED_MB}MB of disk space! (${PERCENT_FREED}% reduction)${NC}"
fi
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$DISK_FINAL_PERCENT" -lt 60 ]; then
    echo -e "${GREEN}✓ Disk usage is now healthy (${DISK_FINAL_PERCENT}%)${NC}"
elif [ "$DISK_FINAL_PERCENT" -lt 70 ]; then
    echo -e "${YELLOW}⚠️  Disk usage is moderate (${DISK_FINAL_PERCENT}%)${NC}"
    echo -e "${BLUE}Consider expanding storage if this persists${NC}"
else
    echo -e "${RED}⚠️  Disk usage is still high (${DISK_FINAL_PERCENT}%)${NC}"
    echo -e "${YELLOW}Additional cleanup may be needed:${NC}"
    echo -e "   - Check /var/log for large log files"
    echo -e "   - Check /home for large files: du -sh /home/*"
    echo -e "   - Consider expanding SD card storage"
fi

echo ""
echo -e "${GREEN}💡 To redeploy:${NC}"
echo -e "   1. Transfer new images: ${BLUE}scp pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/${NC}"
echo -e "   2. Load images: ${BLUE}./scripts/load-pi-images.sh${NC}"
echo -e "   3. Deploy: ${BLUE}./scripts/deploy-podman.sh${NC}"

# Made with Bob