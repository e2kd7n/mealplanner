#!/bin/bash

# Load pre-built container images on Raspberry Pi
# This script loads images that were built on another machine

set -e

echo "📥 Loading pre-built container images..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "${RED}❌ Podman is not installed. Please install it first:${NC}"
    echo "   sudo apt-get update && sudo apt-get install -y podman"
    exit 1
fi

# Image directory
IMAGE_DIR="./pi-images"

# Check if image directory exists
if [ ! -d "$IMAGE_DIR" ]; then
    echo -e "${RED}❌ Image directory not found: $IMAGE_DIR${NC}"
    echo -e "${YELLOW}Please transfer the images first:${NC}"
    echo "   scp pi-images/*.tar pi@raspberrypi.local:~/mealplanner/pi-images/"
    exit 1
fi

# Check if image files exist
if [ ! -f "$IMAGE_DIR/meals-backend.tar" ]; then
    echo -e "${RED}❌ Image files not found in $IMAGE_DIR${NC}"
    echo -e "${YELLOW}Expected files:${NC}"
    echo "   - meals-backend.tar"
    exit 1
fi

# Load backend image
echo -e "${YELLOW}📦 Loading backend image...${NC}"
podman load -i "$IMAGE_DIR/meals-backend.tar"

# Verify images are loaded
echo -e "${GREEN}✅ Images loaded successfully!${NC}"
echo ""
echo -e "${YELLOW}📊 Loaded images:${NC}"
podman images | grep meals

echo ""
echo -e "${GREEN}🚀 Ready to deploy!${NC}"
echo -e "   Run: ${GREEN}./scripts/deploy-podman.sh${NC}"

# Made with Bob