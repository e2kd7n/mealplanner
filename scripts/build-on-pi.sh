#!/bin/bash

# Build container images directly on Raspberry Pi
# This avoids cross-compilation issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🏗️  Building container images on Raspberry Pi...${NC}"

# Check if podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "${RED}❌ Podman is not installed${NC}"
    exit 1
fi

# Build backend image (includes frontend in multi-stage build)
echo -e "${YELLOW}🔨 Building backend image (includes frontend)...${NC}"
podman build \
    --no-cache \
    -t meals-backend:latest \
    -f backend/Dockerfile \
    --build-arg VITE_API_URL=/api \
    .

# Build frontend image (standalone for nginx)
echo -e "${YELLOW}🔨 Building frontend image...${NC}"
podman build \
    --no-cache \
    -t meals-frontend:latest \
    -f frontend/Dockerfile \
    --build-arg VITE_API_URL=/api \
    frontend/

echo -e "${GREEN}✅ Images built successfully!${NC}"
echo ""
echo -e "${BLUE}📦 Built images:${NC}"
podman images | grep meals

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "   Deploy: ${GREEN}./scripts/pi-run.sh${NC}"

# Made with Bob