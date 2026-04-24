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

# Check if compressed or uncompressed tar files exist
BACKEND_COMPRESSED="$IMAGE_DIR/meals-backend.tar.gz"
FRONTEND_COMPRESSED="$IMAGE_DIR/meals-frontend.tar.gz"
BACKEND_UNCOMPRESSED="$IMAGE_DIR/meals-backend.tar"
FRONTEND_UNCOMPRESSED="$IMAGE_DIR/meals-frontend.tar"

# Determine which files to use
if [ -f "$BACKEND_COMPRESSED" ] && [ -f "$FRONTEND_COMPRESSED" ]; then
    echo -e "${GREEN}✓ Found compressed image files${NC}"
    USE_COMPRESSED=true
elif [ -f "$BACKEND_UNCOMPRESSED" ] && [ -f "$FRONTEND_UNCOMPRESSED" ]; then
    echo -e "${GREEN}✓ Found uncompressed image files${NC}"
    USE_COMPRESSED=false
else
    echo -e "${RED}❌ Image files not found in $IMAGE_DIR${NC}"
    echo -e "${YELLOW}Expected files (compressed):${NC}"
    echo -e "   - meals-backend.tar.gz"
    echo -e "   - meals-frontend.tar.gz"
    echo -e "${YELLOW}Or (uncompressed):${NC}"
    echo -e "   - meals-backend.tar"
    echo -e "   - meals-frontend.tar"
    exit 1
fi

# Load backend image
echo -e "${YELLOW}📥 Loading backend image...${NC}"
if [ "$USE_COMPRESSED" = true ]; then
    gunzip -c "$BACKEND_COMPRESSED" | podman load
else
    podman load -i "$BACKEND_UNCOMPRESSED"
fi

# Load frontend image
echo -e "${YELLOW}📥 Loading frontend image...${NC}"
if [ "$USE_COMPRESSED" = true ]; then
    gunzip -c "$FRONTEND_COMPRESSED" | podman load
else
    podman load -i "$FRONTEND_UNCOMPRESSED"
fi

# Verify images are loaded
echo -e "${GREEN}✅ Images loaded successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Loaded images:${NC}"
podman images | grep meals

echo ""
echo -e "${GREEN}🚀 Next step: Deploy the application${NC}"
echo -e "   ${GREEN}./scripts/deploy-podman.sh${NC}"

# Made with Bob