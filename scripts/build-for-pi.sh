#!/bin/bash

# Build container images locally for Raspberry Pi (ARM64)
# This script builds multi-arch images and saves them as tar files for transfer
# ⚠️  RUN THIS ON YOUR DEVELOPMENT MACHINE, NOT ON THE RASPBERRY PI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect if running on Raspberry Pi
if [ -f /proc/device-tree/model ]; then
    PI_MODEL=$(cat /proc/device-tree/model 2>/dev/null | tr -d '\0')
    if [[ "$PI_MODEL" == *"Raspberry Pi"* ]]; then
        echo -e "${RED}❌ ERROR: This script should NOT be run on a Raspberry Pi!${NC}"
        echo ""
        echo -e "${YELLOW}This script builds images FOR the Pi, not ON the Pi.${NC}"
        echo -e "${YELLOW}It must be run on a development machine with more resources.${NC}"
        echo ""
        echo -e "${BLUE}Correct workflow:${NC}"
        echo -e "  1. Run this script on your ${GREEN}development machine${NC}"
        echo -e "  2. Transfer images: ${GREEN}scp pi-images/*.tar.gz pi@pihole:~/mealplanner/pi-images/${NC}"
        echo -e "  3. On Pi, load images: ${GREEN}./scripts/load-pi-images.sh${NC}"
        echo -e "  4. On Pi, deploy: ${GREEN}./scripts/deploy-podman.sh${NC}"
        echo ""
        exit 1
    fi
fi

echo "🏗️  Building container images for Raspberry Pi..."

# Detect macOS and block with clear instructions
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo ""
    echo -e "${RED}❌ ERROR: Cannot build ARM images reliably on macOS${NC}"
    echo ""
    echo -e "${YELLOW}macOS Docker/Podman has known limitations with ARM64 cross-compilation.${NC}"
    echo -e "${YELLOW}Images built on macOS may have compatibility issues on Raspberry Pi.${NC}"
    echo ""
    echo -e "${BLUE}✅ RECOMMENDED: Build directly on your Raspberry Pi${NC}"
    echo ""
    echo -e "${GREEN}Step 1: Transfer code to Pi${NC}"
    echo -e "   rsync -av --exclude node_modules --exclude .git . pi@pihole.local:~/mealplanner/"
    echo ""
    echo -e "${GREEN}Step 2: SSH to Pi and build${NC}"
    echo -e "   ssh pi@pihole.local"
    echo -e "   cd ~/mealplanner"
    echo -e "   ./scripts/build-on-pi.sh  # First build: ~2 hours, subsequent: 5-10 min"
    echo ""
    echo -e "${GREEN}Step 3: Deploy${NC}"
    echo -e "   ./scripts/pi-run.sh"
    echo ""
    echo -e "${BLUE}💡 With build cache enabled, incremental builds are fast (5-10 minutes)${NC}"
    echo ""
    echo -e "${YELLOW}To override this check (not recommended):${NC}"
    echo -e "   FORCE_MACOS_BUILD=true ./scripts/build-for-pi.sh"
    echo ""
    
    # Allow override for testing/advanced users
    if [ "${FORCE_MACOS_BUILD:-false}" != "true" ]; then
        exit 1
    fi
    
    echo -e "${YELLOW}⚠️  Proceeding with macOS build (FORCE_MACOS_BUILD=true)${NC}"
    echo -e "${YELLOW}⚠️  Images may have compatibility issues on Raspberry Pi${NC}"
    echo ""
fi

# Check if podman or docker is available
if command -v podman &> /dev/null; then
    CONTAINER_CMD="podman"
    echo -e "${GREEN}✓ Using Podman${NC}"
    
    # Check if podman machine is running (macOS/Windows)
    if podman machine list &> /dev/null; then
        if ! podman machine list | grep -q "Currently running"; then
            echo -e "${YELLOW}⚠️  Podman machine not running, starting it...${NC}"
            podman machine start
            echo -e "${GREEN}✓ Podman machine started${NC}"
        fi
    fi
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

# Parse command line arguments
COMPRESS=false

# Default to 32-bit ARM for maximum Raspberry Pi compatibility
# Works with Pi 2, 3, 3B+, 4, Zero 2 W (all models)
TARGET_ARCH="linux/arm/v7"

for arg in "$@"; do
    case $arg in
        --arm64)
            TARGET_ARCH="linux/arm64/v8"
            ;;
        --compress)
            COMPRESS=true
            echo -e "${BLUE}ℹ️  Compression enabled (--compress flag)${NC}"
            ;;
        *)
            echo -e "${RED}Unknown option: $arg${NC}"
            echo "Usage: $0 [--arm64] [--compress]"
            exit 1
            ;;
    esac
done

# Check for problematic configuration: ARM64 Mac + 32-bit target + Podman
if [ "$TARGET_ARCH" = "linux/arm/v7" ] && [ "$HOST_ARCH" = "arm64" ] && [ "$CONTAINER_CMD" = "podman" ]; then
    echo ""
    echo -e "${RED}❌ ERROR: Cannot build 32-bit ARM images on ARM64 Mac with Podman${NC}"
    echo ""
    echo -e "${YELLOW}Podman on ARM64 Mac cannot properly emulate 32-bit ARM containers.${NC}"
    echo ""
    echo -e "${BLUE}You have 3 options:${NC}"
    echo ""
    echo -e "${GREEN}Option 1 (RECOMMENDED): Build directly on your Raspberry Pi${NC}"
    echo -e "   1. Transfer code to Pi: ${GREEN}rsync -av --exclude node_modules --exclude .git . pi@pihole.local:~/mealplanner/${NC}"
    echo -e "   2. SSH to Pi: ${GREEN}ssh pi@pihole.local${NC}"
    echo -e "   3. Build on Pi: ${GREEN}cd ~/mealplanner && ./scripts/build-on-pi.sh${NC}"
    echo -e "   4. Deploy: ${GREEN}./scripts/pi-run.sh${NC}"
    echo ""
    echo -e "${GREEN}Option 2: Build 64-bit images (if your Pi runs 64-bit OS)${NC}"
    echo -e "   Run: ${GREEN}./scripts/build-for-pi.sh --arm64${NC}"
    echo -e "   Note: Only works if your Pi is running 64-bit Raspberry Pi OS"
    echo ""
    echo -e "${GREEN}Option 3: Use Docker Desktop instead of Podman${NC}"
    echo -e "   Docker Desktop has better ARM emulation support"
    echo ""
    exit 1
fi

if [ "$TARGET_ARCH" = "linux/arm/v7" ]; then
    echo -e "${BLUE}ℹ️  Target architecture: ${TARGET_ARCH} (32-bit ARM - compatible with all Pi models)${NC}"
    if [ "$HOST_ARCH" = "arm64" ] || [ "$HOST_ARCH" = "aarch64" ]; then
        echo -e "${GREEN}✓ Building 32-bit ARM on ARM64 host${NC}"
    fi
elif [ "$TARGET_ARCH" = "linux/arm64/v8" ]; then
    echo -e "${BLUE}ℹ️  Target architecture: ${TARGET_ARCH} (64-bit ARM - requires 64-bit Pi OS)${NC}"
    if [ "$HOST_ARCH" = "arm64" ] || [ "$HOST_ARCH" = "aarch64" ]; then
        echo -e "${GREEN}✓ Native build - no emulation needed${NC}"
    else
        echo -e "${YELLOW}💡 Cross-compiling from ${HOST_ARCH} to ARM64${NC}"
    fi
fi

# Create output directory for image tars
OUTPUT_DIR="./pi-images"
mkdir -p "$OUTPUT_DIR"

# Build backend image (includes frontend in multi-stage build)
echo -e "${YELLOW}🔨 Building backend image for ${TARGET_ARCH} (includes frontend)...${NC}"
echo -e "${BLUE}ℹ️  Building without cache to ensure correct architecture${NC}"
$CONTAINER_CMD build \
    --platform "$TARGET_ARCH" \
    --no-cache \
    -t meals-backend:latest \
    -f backend/Dockerfile \
    --build-arg VITE_API_URL=/api \
    .

# Build frontend image (standalone for nginx)
echo -e "${YELLOW}🔨 Building frontend image for ${TARGET_ARCH}...${NC}"
echo -e "${BLUE}ℹ️  Building without cache to ensure correct architecture${NC}"
$CONTAINER_CMD build \
    --platform "$TARGET_ARCH" \
    --no-cache \
    -t meals-frontend:latest \
    -f frontend/Dockerfile \
    --build-arg VITE_API_URL=/api \
    frontend/

# Save images as tar files
echo -e "${YELLOW}💾 Saving images to tar files...${NC}"

if [ "$COMPRESS" = true ]; then
    echo -e "${BLUE}ℹ️  Compressing tar files (smaller transfer size)${NC}"
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
    echo -e "${BLUE}📦 Image files (compressed - recommended for slow networks):${NC}"
    echo -e "   Backend:   $OUTPUT_DIR/meals-backend.tar.gz   (${BACKEND_GZ_SIZE})"
    echo -e "   Frontend:  $OUTPUT_DIR/meals-frontend.tar.gz  (${FRONTEND_GZ_SIZE})"
    echo ""
    echo -e "${YELLOW}📤 Next steps:${NC}"
    echo -e "   1. Transfer images to your Raspberry Pi:"
    echo -e "      ${GREEN}# For fast networks (3+ MB/s): Use uncompressed${NC}"
    echo -e "      ${GREEN}scp pi-images/*.tar pi@pihole.local:~/mealplanner/pi-images/${NC}"
    echo -e "      ${BLUE}# For slow networks (<1 MB/s): Use compressed${NC}"
    echo -e "      scp pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/"
else
    echo -e "${BLUE}ℹ️  Saving uncompressed tar files (faster loading on Pi - default)${NC}"
    $CONTAINER_CMD save -o "$OUTPUT_DIR/meals-backend.tar" meals-backend:latest
    $CONTAINER_CMD save -o "$OUTPUT_DIR/meals-frontend.tar" meals-frontend:latest
    
    # Get file sizes
    BACKEND_SIZE=$(du -h "$OUTPUT_DIR/meals-backend.tar" | cut -f1)
    FRONTEND_SIZE=$(du -h "$OUTPUT_DIR/meals-frontend.tar" | cut -f1)
    
    echo -e "${GREEN}✅ Images built and saved successfully!${NC}"
    echo ""
    echo -e "${BLUE}📦 Image files (uncompressed):${NC}"
    echo -e "   Backend:   $OUTPUT_DIR/meals-backend.tar   (${BACKEND_SIZE})"
    echo -e "   Frontend:  $OUTPUT_DIR/meals-frontend.tar  (${FRONTEND_SIZE})"
    echo ""
    echo -e "${YELLOW}📤 Next steps:${NC}"
    echo -e "   1. Transfer images to your Raspberry Pi:"
    echo -e "      ${GREEN}scp pi-images/*.tar pi@pihole.local:~/mealplanner/pi-images/${NC}"
    echo -e "      ${BLUE}💡 Tip: Use --compress flag for slower networks${NC}"
fi
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