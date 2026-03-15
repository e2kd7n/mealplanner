#!/bin/bash

# Podman deployment script for Raspberry Pi
# This script deploys the Meal Planner application using Podman

set -e

echo "🚀 Starting Podman deployment for Meal Planner..."

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

# Check if podman-compose is installed
if ! command -v podman-compose &> /dev/null; then
    echo -e "${YELLOW}⚠️  podman-compose not found. Installing...${NC}"
    pip3 install podman-compose
fi

# Generate secrets if they don't exist
if [ ! -f "./secrets/postgres_password.txt" ]; then
    echo -e "${YELLOW}⚠️  Secrets not found. Generating...${NC}"
    ./scripts/generate-secrets.sh
fi

# Stop and remove existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
podman-compose -f podman-compose.yml down 2>/dev/null || true

# Remove old images (optional - comment out to keep cached images)
# echo -e "${YELLOW}🗑️  Removing old images...${NC}"
# podman rmi meals-backend meals-frontend 2>/dev/null || true

# Build images
echo -e "${GREEN}🔨 Building images...${NC}"
podman-compose -f podman-compose.yml build --no-cache

# Start services
echo -e "${GREEN}🚀 Starting services...${NC}"
podman-compose -f podman-compose.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Check service status
echo -e "${GREEN}📊 Service status:${NC}"
podman-compose -f podman-compose.yml ps

# Run database migrations
echo -e "${GREEN}🔄 Running database migrations...${NC}"
podman exec meals-backend sh -c "cd /app && npx prisma migrate deploy"

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Application is available at: http://localhost:8080${NC}"
echo -e "${GREEN}📝 View logs with: podman-compose -f podman-compose.yml logs -f${NC}"

# Made with Bob
