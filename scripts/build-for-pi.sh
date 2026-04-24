#!/bin/bash

# Build container images locally for Raspberry Pi (ARM64)
# This script builds multi-arch images and saves them as tar files for transfer

set -e

echo "🏗️  Building container images for Raspberry Pi..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if podman or docker is available
if command -v podman &> /dev/null; then
    CONTAINER_CMD="podman"
    echo -e "${GREEN}✓ Using Podman${NC}"
elif command -v docker &> /dev/null; then
    CONTAINER_CMD="docker"
    echo -e "${GREEN}✓ Using Docker${NC}"
else
    echo -e "${RED}❌ Neither Podman nor Docker is installed${NC}"
    exit 1
fi

# Detect host architecture
HOST_ARCH=$(uname -m)
echo -e "${BLUE}ℹ️  Host architecture: ${HOST_ARCH}${NC}"

# Target architecture for Raspberry Pi
TARGET_ARCH="linux/arm64"
echo -e "${BLUE}ℹ️  Target architecture: ${TARGET_ARCH}${NC}"

# Create output directory for image tars
OUTPUT_DIR="./pi-images"
mkdir -p "$OUTPUT_DIR"

# Build backend image (includes frontend in multi-stage build)
echo -e "${YELLOW}🔨 Building backend image for ARM64 (includes frontend)...${NC}"
$CONTAINER_CMD build \
    --platform "$TARGET_ARCH" \
    -t meals-backend:latest \
    -f backend/Dockerfile \
    --build-arg VITE_API_URL=/api \
    --compress \
    --squash 2>/dev/null || \
$CONTAINER_CMD build \
    --platform "$TARGET_ARCH" \
    -t meals-backend:latest \
    -f backend/Dockerfile \
    --build-arg VITE_API_URL=/api \
    .

# Build frontend image (standalone for nginx)
echo -e "${YELLOW}🔨 Building frontend image for ARM64...${NC}"
$CONTAINER_CMD build \
    --platform "$TARGET_ARCH" \
    -t meals-frontend:latest \
    -f frontend/Dockerfile \
    --build-arg VITE_API_URL=/api \
    --compress \
    --squash 2>/dev/null || \
$CONTAINER_CMD build \
    --platform "$TARGET_ARCH" \
    -t meals-frontend:latest \
    -f frontend/Dockerfile \
    --build-arg VITE_API_URL=/api \
    frontend/

# Save images as tar files (compressed)
echo -e "${YELLOW}💾 Saving images to tar files...${NC}"
$CONTAINER_CMD save meals-backend:latest | gzip > "$OUTPUT_DIR/meals-backend.tar.gz"
$CONTAINER_CMD save meals-frontend:latest | gzip > "$OUTPUT_DIR/meals-frontend.tar.gz"

# Also save uncompressed for compatibility
$CONTAINER_CMD save -o "$OUTPUT_DIR/meals-backend.tar" meals-backend:latest
$CONTAINER_CMD save -o "$OUTPUT_DIR/meals-frontend.tar" meals-frontend:latest

# Get file sizes
BACKEND_SIZE=$(du -h "$OUTPUT_DIR/meals-backend.tar" | cut -f1)
FRONTEND_SIZE=$(du -h "$OUTPUT_DIR/meals-frontend.tar" | cut -f1)
BACKEND_GZ_SIZE=$(du -h "$OUTPUT_DIR/meals-backend.tar.gz" | cut -f1)
FRONTEND_GZ_SIZE=$(du -h "$OUTPUT_DIR/meals-frontend.tar.gz" | cut -f1)

echo -e "${GREEN}✅ Images built and saved successfully!${NC}"
echo ""
echo -e "${BLUE}📦 Image files (uncompressed):${NC}"
echo -e "   Backend:   $OUTPUT_DIR/meals-backend.tar   (${BACKEND_SIZE})"
echo -e "   Frontend:  $OUTPUT_DIR/meals-frontend.tar  (${FRONTEND_SIZE})"
echo ""
echo -e "${BLUE}📦 Image files (compressed - recommended for transfer):${NC}"
echo -e "   Backend:   $OUTPUT_DIR/meals-backend.tar.gz   (${BACKEND_GZ_SIZE})"
echo -e "   Frontend:  $OUTPUT_DIR/meals-frontend.tar.gz  (${FRONTEND_GZ_SIZE})"
echo ""
echo -e "${YELLOW}📤 Next steps:${NC}"
echo -e "   1. Transfer images to your Raspberry Pi (use compressed files for faster transfer):"
echo -e "      ${GREEN}scp pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/${NC}"
echo -e "      ${BLUE}Or uncompressed:${NC} scp pi-images/*.tar pi@pihole.local:~/mealplanner/pi-images/"
echo ""
echo -e "   2. On the Raspberry Pi, load the images:"
echo -e "      ${GREEN}cd ~/mealplanner${NC}"
echo -e "      ${GREEN}./scripts/load-pi-images.sh${NC}"
echo ""
echo -e "   3. Deploy the application:"
echo -e "      ${GREEN}./scripts/deploy-podman.sh${NC}"
echo ""
echo -e "${BLUE}💡 Tip: Use rsync for faster, resumable transfers:${NC}"
echo -e "   ${GREEN}rsync -avz --progress pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/${NC}"

# Made with Bob