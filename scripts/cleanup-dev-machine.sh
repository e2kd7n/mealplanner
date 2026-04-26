#!/bin/bash

# Cleanup script for development machine
# Removes old container images, build cache, and temporary files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🧹 Cleaning up development machine..."
echo ""

# Check if podman or docker is available
if command -v podman &> /dev/null; then
    CONTAINER_CMD="podman"
elif command -v docker &> /dev/null; then
    CONTAINER_CMD="docker"
else
    echo -e "${RED}❌ Neither Podman nor Docker is installed${NC}"
    exit 1
fi

echo -e "${BLUE}Using: $CONTAINER_CMD${NC}"
echo ""

# Capture initial disk usage
DISK_BEFORE=$(df / | awk 'NR==2 {print $3}')
DISK_TOTAL=$(df -h / | awk 'NR==2 {print $2}')

# Show current disk usage
echo -e "${YELLOW}📊 Current disk usage:${NC}"
df -h / | grep -v Filesystem
echo ""

# Capture initial container storage
CONTAINER_BEFORE=$($CONTAINER_CMD system df --format "{{.Size}}" 2>/dev/null | head -1 || echo "0B")

# Show container storage usage
echo -e "${YELLOW}📦 Container storage usage:${NC}"
$CONTAINER_CMD system df
echo ""

# Ask for confirmation
echo -e "${YELLOW}⚠️  This will remove:${NC}"
echo "  - All stopped containers"
echo "  - All unused images (including old meal planner builds)"
echo "  - All build cache"
echo "  - All unused volumes"
echo "  - All unused networks"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Cleanup cancelled${NC}"
    exit 0
fi

# Clean up containers
echo -e "${YELLOW}🗑️  Removing stopped containers...${NC}"
$CONTAINER_CMD container prune -f
echo ""

# Clean up images
echo -e "${YELLOW}🗑️  Removing unused images...${NC}"
$CONTAINER_CMD image prune -a -f
echo ""

# Clean up volumes
echo -e "${YELLOW}🗑️  Removing unused volumes...${NC}"
$CONTAINER_CMD volume prune -f
echo ""

# Clean up networks
echo -e "${YELLOW}🗑️  Removing unused networks...${NC}"
$CONTAINER_CMD network prune -f
echo ""

# Clean up build cache
echo -e "${YELLOW}🗑️  Removing build cache...${NC}"
$CONTAINER_CMD builder prune -a -f 2>/dev/null || echo "  (Build cache cleanup not supported)"
echo ""

# Clean up old pi-images directory
if [ -d "./pi-images" ]; then
    echo -e "${YELLOW}🗑️  Cleaning pi-images directory...${NC}"
    OLD_SIZE=$(du -sh ./pi-images 2>/dev/null | cut -f1)
    rm -rf ./pi-images/*
    echo -e "${GREEN}  ✓ Removed $OLD_SIZE from pi-images/${NC}"
    echo ""
fi

# Clean up node_modules caches (optional)
echo -e "${YELLOW}🗑️  Cleaning npm/pnpm caches...${NC}"
npm cache clean --force 2>/dev/null || true
pnpm store prune 2>/dev/null || true
echo -e "${GREEN}  ✓ Caches cleaned${NC}"
echo ""

# Calculate space freed
DISK_AFTER=$(df / | awk 'NR==2 {print $3}')
DISK_FREED=$((DISK_BEFORE - DISK_AFTER))
DISK_FREED_MB=$((DISK_FREED / 1024))
DISK_FREED_GB=$(echo "scale=2; $DISK_FREED_MB / 1024" | bc)

# Show final disk usage
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo -e "${YELLOW}📊 Final disk usage:${NC}"
df -h / | grep -v Filesystem
echo ""

echo -e "${YELLOW}📦 Final container storage:${NC}"
$CONTAINER_CMD system df
echo ""

# Show summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ "$DISK_FREED_MB" -gt 1024 ]; then
    echo -e "${GREEN}🎉 Freed ${DISK_FREED_GB}GB of disk space!${NC}"
else
    echo -e "${GREEN}🎉 Freed ${DISK_FREED_MB}MB of disk space!${NC}"
fi
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}💡 Tip: Run './scripts/build-for-pi.sh' to rebuild fresh images${NC}"

# Made with Bob
