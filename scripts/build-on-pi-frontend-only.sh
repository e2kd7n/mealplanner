#!/bin/bash

# Build only the frontend image on Raspberry Pi
# Use this to rebuild just the frontend after fixing the rolldown issue

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🏗️  Building frontend image only on Raspberry Pi...${NC}"

# Check if podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "${RED}❌ Podman is not installed${NC}"
    exit 1
fi

# Build frontend image (standalone for nginx)
echo -e "${YELLOW}🔨 Building frontend image...${NC}"
podman build \
    -t meals-frontend:latest \
    -f frontend/Dockerfile \
    --build-arg VITE_API_URL=/api \
    frontend/

echo -e "${GREEN}✅ Frontend image built successfully!${NC}"
echo ""
echo -e "${BLUE}📦 Built image:${NC}"
podman images | grep meals-frontend

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "   1. If backend is already built: ${GREEN}podman-compose -f podman-compose.pi.yml up -d${NC}"
echo -e "   2. Or build backend too: ${GREEN}./scripts/build-on-pi.sh${NC}"

# Made with Bob