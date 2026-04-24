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

# Show initial disk usage
echo -e "${YELLOW}Before cleanup:${NC}"
show_disk_usage

# Stop all running containers
echo -e "${YELLOW}🛑 Stopping all containers...${NC}"
if command -v podman-compose &> /dev/null && [ -f "podman-compose.yml" ]; then
    podman-compose -f podman-compose.yml down 2>/dev/null || true
fi

# Stop any remaining podman containers
if command -v podman &> /dev/null; then
    echo -e "${YELLOW}🛑 Stopping remaining podman containers...${NC}"
    podman stop $(podman ps -aq) 2>/dev/null || true
fi

# Remove all containers
echo -e "${YELLOW}🗑️  Removing all containers...${NC}"
if command -v podman &> /dev/null; then
    podman rm -f $(podman ps -aq) 2>/dev/null || true
fi

# Remove all images
echo -e "${YELLOW}🗑️  Removing all images...${NC}"
if command -v podman &> /dev/null; then
    podman rmi -f $(podman images -aq) 2>/dev/null || true
fi

# Remove all volumes
echo -e "${YELLOW}🗑️  Removing all volumes...${NC}"
if command -v podman &> /dev/null; then
    podman volume rm -f $(podman volume ls -q) 2>/dev/null || true
fi

# Clean up podman system
echo -e "${YELLOW}🧹 Cleaning podman system...${NC}"
if command -v podman &> /dev/null; then
    podman system prune -af --volumes 2>/dev/null || true
fi

# Remove image tar files
echo -e "${YELLOW}🗑️  Removing image tar files...${NC}"
if [ -d "./pi-images" ]; then
    rm -rf ./pi-images/*.tar 2>/dev/null || true
    echo -e "${GREEN}✓ Removed tar files from ./pi-images/${NC}"
fi

# Clean up build cache
echo -e "${YELLOW}🧹 Cleaning build cache...${NC}"
if command -v podman &> /dev/null; then
    podman builder prune -af 2>/dev/null || true
fi

# Remove temporary files
echo -e "${YELLOW}🗑️  Removing temporary files...${NC}"
rm -rf /tmp/podman-* 2>/dev/null || true
rm -rf /tmp/buildah-* 2>/dev/null || true

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

# Clean package manager cache
echo -e "${YELLOW}🧹 Cleaning package manager cache...${NC}"
sudo apt-get clean 2>/dev/null || true
sudo apt-get autoremove -y 2>/dev/null || true

# Clean journal logs (keep last 3 days)
echo -e "${YELLOW}🧹 Cleaning old journal logs...${NC}"
sudo journalctl --vacuum-time=3d 2>/dev/null || true

# Show final disk usage
echo ""
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo -e "${YELLOW}After cleanup:${NC}"
show_disk_usage

# Show what was cleaned
echo -e "${BLUE}📊 Cleanup summary:${NC}"
echo -e "   ✓ All containers stopped and removed"
echo -e "   ✓ All images removed"
echo -e "   ✓ All volumes removed"
echo -e "   ✓ Podman system cache cleaned"
echo -e "   ✓ Image tar files removed"
echo -e "   ✓ Temporary files cleaned"
echo -e "   ✓ Package cache cleaned"
echo -e "   ✓ Old journal logs removed"
echo ""
echo -e "${GREEN}💡 To redeploy:${NC}"
echo -e "   1. Transfer new images: ${BLUE}scp pi-images/*.tar pi@pihole.local:~/mealplanner/pi-images/${NC}"
echo -e "   2. Load images: ${BLUE}./scripts/load-pi-images.sh${NC}"
echo -e "   3. Deploy: ${BLUE}./scripts/deploy-podman.sh${NC}"

# Made with Bob