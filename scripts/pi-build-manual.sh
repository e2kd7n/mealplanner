#!/bin/bash
# Manual build script for Raspberry Pi - bypasses podman-compose network bug
# This script builds images directly with podman instead of podman-compose

set -e

echo "🔨 Building Meal Planner images manually..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "${RED}❌ Podman is not installed${NC}"
    exit 1
fi

# Generate secrets if they don't exist
if [ ! -f "./secrets/postgres_password.txt" ]; then
    echo -e "${YELLOW}⚠️  Secrets not found. Generating...${NC}"
    ./scripts/generate-secrets.sh
fi

# Create network if it doesn't exist
if ! podman network ls | grep -q "meals-network"; then
    echo -e "${BLUE}📡 Creating meals-network...${NC}"
    podman network create meals-network
else
    echo -e "${GREEN}✓ Network meals-network already exists${NC}"
fi

# Build backend image
echo -e "${BLUE}🔨 Building backend image...${NC}"
podman build \
    --platform linux/arm64 \
    --security-opt seccomp=unconfined \
    -t meals-backend:latest \
    -f backend/Dockerfile \
    --build-arg VITE_API_URL=/api \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend image built successfully${NC}"
else
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi

# Build frontend image
echo -e "${BLUE}🔨 Building frontend image...${NC}"
podman build \
    --platform linux/arm64 \
    --security-opt seccomp=unconfined \
    -t meals-frontend:latest \
    -f frontend/Dockerfile \
    --build-arg VITE_API_URL=/api \
    ./frontend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend image built successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Pull nginx and postgres images
echo -e "${BLUE}📥 Pulling nginx and postgres images...${NC}"
podman pull docker.io/library/nginx:alpine
podman pull docker.io/library/postgres:16-alpine

echo -e "${GREEN}✅ All images built successfully!${NC}"
echo -e "${BLUE}📊 Image list:${NC}"
podman images | grep -E "meals-|nginx|postgres"

echo ""
echo -e "${GREEN}Next steps:${NC}"
echo -e "  1. Start services: ${YELLOW}podman-compose up -d${NC}"
echo -e "  2. Check status: ${YELLOW}podman-compose ps${NC}"
echo -e "  3. View logs: ${YELLOW}podman-compose logs -f${NC}"

# Made with Bob