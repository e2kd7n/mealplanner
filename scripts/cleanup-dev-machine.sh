#!/bin/bash

# Cleanup script for development machine
# Removes old container images, build cache, and temporary files

set -e

# Load common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utilities.sh"

echo "🧹 Cleaning up development machine..."
echo ""

# Check if podman or docker is available
CONTAINER_CMD=$(detect_container_runtime)
if [ -z "$CONTAINER_CMD" ]; then
    echo -e "${RED}❌ Neither Podman nor Docker is installed${NC}"
    exit 1
fi

echo -e "${BLUE}Using: $CONTAINER_CMD${NC}"
echo ""

# Capture initial disk usage
DISK_BEFORE=$(get_disk_usage_kb)

# Show current disk usage
echo -e "${YELLOW}📊 Current disk usage:${NC}"
show_disk_usage

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
clean_package_caches
echo ""

# Calculate space freed
DISK_AFTER=$(get_disk_usage_kb)

# Show final disk usage
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo -e "${YELLOW}📊 Final disk usage:${NC}"
show_disk_usage

echo -e "${YELLOW}📦 Final container storage:${NC}"
$CONTAINER_CMD system df
echo ""

# Show summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
show_space_freed "$DISK_BEFORE" "$DISK_AFTER"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}💡 Tip: Run './scripts/build-for-pi.sh' to rebuild fresh images${NC}"

# Made with Bob
