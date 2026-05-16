#!/bin/bash

# Load container images from tar files on Raspberry Pi
# This script loads pre-built images that were transferred from the build machine

set -e

echo "📦 Loading container images on Raspberry Pi..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "${RED}❌ Podman is not installed. Please install it first:${NC}"
    echo "   sudo apt-get update && sudo apt-get install -y podman"
    exit 1
fi

# Check if image directory exists
IMAGE_DIR="./pi-images"
if [ ! -d "$IMAGE_DIR" ]; then
    echo -e "${RED}❌ Image directory not found: $IMAGE_DIR${NC}"
    echo -e "${YELLOW}Please transfer images first using:${NC}"
    echo -e "   scp pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/"
    exit 1
fi

# Check which backend image file exists (compressed or uncompressed)
BACKEND_COMPRESSED="$IMAGE_DIR/meals-backend.tar.gz"
BACKEND_UNCOMPRESSED="$IMAGE_DIR/meals-backend.tar"
FRONTEND_DIST_TAR="$IMAGE_DIR/frontend-dist.tar.gz"

if [ -f "$BACKEND_COMPRESSED" ]; then
    echo -e "${GREEN}✓ Found compressed backend image${NC}"
    USE_COMPRESSED=true
elif [ -f "$BACKEND_UNCOMPRESSED" ]; then
    echo -e "${GREEN}✓ Found uncompressed backend image${NC}"
    USE_COMPRESSED=false
else
    echo -e "${RED}❌ Backend image not found in $IMAGE_DIR${NC}"
    echo -e "${YELLOW}Expected one of:${NC}"
    echo -e "   - meals-backend.tar.gz  (compressed)"
    echo -e "   - meals-backend.tar     (uncompressed)"
    exit 1
fi

if [ ! -f "$FRONTEND_DIST_TAR" ]; then
    echo -e "${RED}❌ Frontend static files archive not found: $FRONTEND_DIST_TAR${NC}"
    echo -e "${YELLOW}Transfer it from your dev machine:${NC}"
    echo -e "   scp pi-images/frontend-dist.tar.gz pi@raspberrypi.local:~/mealplanner/pi-images/"
    exit 1
fi

# Check disk space before loading
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 70 ]; then
    echo -e "${YELLOW}⚠️  Disk usage is ${DISK_USAGE}% - cleanup recommended before loading${NC}"
    echo -e "${YELLOW}Run: ./scripts/cleanup-pi.sh${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Load backend image
echo -e "${YELLOW}📥 Loading backend image (1/2)...${NC}"
echo -e "${BLUE}   This may take 2-3 minutes...${NC}"
if [ "$USE_COMPRESSED" = true ]; then
    LOAD_OUTPUT=$(gunzip -c "$BACKEND_COMPRESSED" | podman load 2>&1)
    echo "$LOAD_OUTPUT"
    if echo "$LOAD_OUTPUT" | grep -q "Loaded image"; then
        echo -e "${GREEN}✓ Backend image loaded successfully${NC}"
    else
        echo -e "${RED}❌ Failed to load backend image${NC}"
        echo "$LOAD_OUTPUT"
        exit 1
    fi
else
    LOAD_OUTPUT=$(podman load -i "$BACKEND_UNCOMPRESSED" 2>&1)
    echo "$LOAD_OUTPUT"
    if echo "$LOAD_OUTPUT" | grep -q "Loaded image"; then
        echo -e "${GREEN}✓ Backend image loaded successfully${NC}"
    else
        echo -e "${RED}❌ Failed to load backend image${NC}"
        exit 1
    fi
fi
echo ""

# Extract frontend static files (Nginx serves these directly — no frontend container on Pi)
echo -e "${YELLOW}📦 Extracting frontend static files (2/2)...${NC}"
mkdir -p ./data/frontend-dist
rm -rf ./data/frontend-dist/*
tar -xzf "$FRONTEND_DIST_TAR" -C ./data/frontend-dist
echo -e "${GREEN}✓ Frontend static files extracted to ./data/frontend-dist/ ($(ls ./data/frontend-dist | wc -l) files)${NC}"
echo ""

# Verify
echo -e "${GREEN}✅ All assets loaded successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Backend image:${NC}"
podman images | grep meals-backend
echo ""
echo -e "${BLUE}📁 Frontend dist:${NC}"
ls ./data/frontend-dist | head -10

# Cleanup transferred files
echo ""
echo -e "${YELLOW}🧹 Cleaning up transferred files to save space...${NC}"
if [ "$USE_COMPRESSED" = true ]; then
    rm -f "$BACKEND_COMPRESSED"
else
    rm -f "$BACKEND_UNCOMPRESSED"
fi
rm -f "$FRONTEND_DIST_TAR"
echo -e "${GREEN}✓ Removed transferred files${NC}"

# Show disk space after cleanup
DISK_AFTER=$(df / | awk 'NR==2 {print $5}')
echo -e "${BLUE}💾 Disk usage after cleanup: ${DISK_AFTER}${NC}"

echo ""
echo -e "${GREEN}🚀 Next step: Deploy the application${NC}"
echo -e "   ${GREEN}./scripts/pi-run.sh${NC}"

# Made with Bob