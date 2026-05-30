#!/bin/bash

# Cleanup script for Raspberry Pi
# Removes containers, images, volumes, and temporary files to free up storage

set -e

# Load common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utilities.sh"

echo "🧹 Starting Raspberry Pi cleanup..."

# Function to check if cleanup is needed
check_cleanup_needed() {
    DISK_USAGE=$(get_disk_usage_percent)
    
    if [ "$DISK_USAGE" -lt 60 ]; then
        echo -e "${GREEN}✓ Disk usage is healthy (${DISK_USAGE}%)${NC}"
        echo -e "${BLUE}No cleanup needed at this time.${NC}"
        echo ""
        echo -e "${YELLOW}Current status:${NC}"
        show_disk_usage
        CONTAINER_CMD=$(detect_container_runtime)
        [ -n "$CONTAINER_CMD" ] && $CONTAINER_CMD system df 2>/dev/null || true
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
DISK_BEFORE=$(get_disk_usage_kb)
DISK_USAGE_PERCENT=$(get_disk_usage_percent)

# Show initial disk usage
echo -e "${YELLOW}Before cleanup:${NC}"
show_disk_usage

# Check if cleanup is actually needed
check_cleanup_needed

# Stop mealplanner containers only
echo -e "${YELLOW}🛑 Stopping mealplanner containers...${NC}"
# Prefer Pi compose file; fall back to dev compose
if command -v podman-compose &> /dev/null; then
    if [ -f "podman-compose.pi.yml" ]; then
        podman-compose -f podman-compose.pi.yml down 2>/dev/null || true
    elif [ -f "podman-compose.yml" ]; then
        podman-compose -f podman-compose.yml down 2>/dev/null || true
    fi
    echo -e "${GREEN}✓ Stopped containers via podman-compose${NC}"
else
    echo -e "${BLUE}ℹ️  podman-compose not found, skipping compose down${NC}"
fi

# Detect container runtime
CONTAINER_CMD=$(detect_container_runtime)

# Remove only mealplanner-specific containers by name
# No meals-frontend on Pi — Nginx serves static files directly
if [ -n "$CONTAINER_CMD" ]; then
    echo -e "${YELLOW}🗑️  Removing mealplanner containers...${NC}"
    $CONTAINER_CMD rm -f meals-backend meals-db meals-nginx meals-redis 2>/dev/null || true
    echo -e "${GREEN}✓ Removed mealplanner containers${NC}"
fi

# Prune all unused images — this is what actually reclaims space
# (removing specific tags misses intermediate layers and old image versions)
echo -e "${YELLOW}🗑️  Pruning unused images...${NC}"
if [ -n "$CONTAINER_CMD" ]; then
    if pgrep -f "podman pull" > /dev/null 2>&1; then
        echo -e "${BLUE}ℹ️  Pull in progress — only removing images older than 2h${NC}"
        $CONTAINER_CMD image prune -af --filter "until=2h" 2>/dev/null || true
    else
        $CONTAINER_CMD image prune -af 2>/dev/null || true
    fi
    echo -e "${GREEN}✓ Pruned unused images${NC}"
fi

# NOTE: Volumes are intentionally NOT removed — they contain live database data
# and user uploads. To wipe volumes you must do so manually after confirming
# there is a current backup.

# Clean up only dangling resources (safe - doesn't remove other apps)
echo -e "${YELLOW}🧹 Cleaning dangling resources...${NC}"
if [ -n "$CONTAINER_CMD" ]; then
    $CONTAINER_CMD system prune -f 2>/dev/null || true
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
if [ -n "$CONTAINER_CMD" ]; then
    if pgrep -f "podman build" > /dev/null 2>&1; then
        echo -e "${BLUE}ℹ️  Build in progress — skipping builder cache cleanup${NC}"
    else
        $CONTAINER_CMD builder prune -af 2>/dev/null || true
        echo -e "${GREEN}✓ Build cache cleaned${NC}"
    fi
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
DISK_AFTER=$(get_disk_usage_kb)
DISK_FINAL_PERCENT=$(get_disk_usage_percent)
PERCENT_FREED=$((DISK_USAGE_PERCENT - DISK_FINAL_PERCENT))

# Show final disk usage
echo ""
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo -e "${YELLOW}After cleanup:${NC}"
show_disk_usage

# Show what was cleaned
echo -e "${BLUE}📊 Cleanup summary:${NC}"
echo -e "   ✓ Mealplanner containers stopped and removed"
echo -e "   ✓ Unused images pruned"
echo -e "   ✓ Podman build cache cleaned"
echo -e "   ✓ Image tar files removed from ./pi-images/"
echo -e "   ℹ️  Volumes preserved (contain live DB data and uploads)"
echo -e "   ℹ️  System-wide cleanup skipped (safe for multi-app Pi)"
echo ""

# Show space freed summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
show_space_freed "$DISK_BEFORE" "$DISK_AFTER"
echo -e "   (${PERCENT_FREED}% reduction)"
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

