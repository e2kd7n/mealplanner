#!/bin/bash

# Podman deployment script for Raspberry Pi
# This script deploys the Meal Planner application using Podman

set -e

echo "🚀 Starting Podman deployment for Meal Planner..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check disk space before deployment
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
echo -e "${BLUE}💾 Current disk usage: ${DISK_USAGE}%${NC}"

if [ "$DISK_USAGE" -gt 80 ]; then
    echo -e "${RED}❌ Disk usage is critically high (${DISK_USAGE}%)${NC}"
    echo -e "${YELLOW}Please run cleanup before deploying:${NC}"
    echo -e "   ${GREEN}./scripts/cleanup-pi.sh${NC}"
    exit 1
elif [ "$DISK_USAGE" -gt 70 ]; then
    echo -e "${YELLOW}⚠️  Disk usage is high (${DISK_USAGE}%) - cleanup recommended${NC}"
    echo -e "${YELLOW}Run: ./scripts/cleanup-pi.sh${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

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
podman-compose -f podman-compose.pi.yml down 2>/dev/null || true

# Check if pre-built images exist
if podman images | grep -q "meals-backend"; then
    echo -e "${GREEN}✓ Using pre-built images${NC}"
    SKIP_BUILD=true
else
    echo -e "${YELLOW}⚠️  Pre-built images not found, building locally...${NC}"
    SKIP_BUILD=false
fi

# Build images only if needed
if [ "$SKIP_BUILD" = false ]; then
    echo -e "${RED}❌ Pre-built images not found!${NC}"
    echo -e "${YELLOW}On Raspberry Pi, you must use pre-built images.${NC}"
    echo -e "${YELLOW}Please follow these steps:${NC}"
    echo -e "   1. On dev machine: ${GREEN}./scripts/build-for-pi.sh${NC}"
    echo -e "   2. Transfer images: ${GREEN}scp pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/${NC}"
    echo -e "   3. On Pi: ${GREEN}./scripts/load-pi-images.sh${NC}"
    echo -e "   4. Then run: ${GREEN}./scripts/deploy-podman.sh${NC}"
    exit 1
else
    echo -e "${BLUE}ℹ️  Using pre-loaded images${NC}"
fi

# Start services
echo -e "${GREEN}🚀 Starting services...${NC}"
podman-compose -f podman-compose.pi.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Check service status
echo -e "${GREEN}📊 Service status:${NC}"
podman-compose -f podman-compose.pi.yml ps

# Wait a bit more for backend to fully start
echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
sleep 15

# Verify backend container exists and is running
if ! podman ps --format "{{.Names}}" | grep -q "meals-backend"; then
    echo -e "${RED}❌ Backend container not running. Checking logs...${NC}"
    podman-compose -f podman-compose.pi.yml logs backend
    exit 1
fi

# Run database migrations
echo -e "${GREEN}🔄 Running database migrations...${NC}"
podman exec meals-backend sh -c "cd /app && npx prisma migrate deploy"

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Application is available at: http://localhost:8080${NC}"
echo -e "${GREEN}📝 View logs with: podman-compose -f podman-compose.pi.yml logs -f${NC}"

# Post-deployment cleanup check
echo ""
echo -e "${YELLOW}🧹 Checking for cleanup opportunities...${NC}"
DISK_AFTER=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
echo -e "${BLUE}💾 Disk usage after deployment: ${DISK_AFTER}${NC}"

# Check for old/unused images
UNUSED_IMAGES=$(podman images -f "dangling=true" -q | wc -l)
if [ "$UNUSED_IMAGES" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found ${UNUSED_IMAGES} unused/dangling images${NC}"
    echo -e "${YELLOW}Run cleanup to remove them: ./scripts/cleanup-pi.sh${NC}"
fi

# Check for stopped containers
STOPPED_CONTAINERS=$(podman ps -a -f "status=exited" -q | wc -l)
if [ "$STOPPED_CONTAINERS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found ${STOPPED_CONTAINERS} stopped containers${NC}"
    echo -e "${YELLOW}Run cleanup to remove them: ./scripts/cleanup-pi.sh${NC}"
fi

if [ "$DISK_AFTER" -gt 70 ]; then
    echo -e "${YELLOW}⚠️  Disk usage is still high (${DISK_AFTER}%)${NC}"
    echo -e "${YELLOW}Consider running: ./scripts/cleanup-pi.sh${NC}"
fi

echo ""
echo -e "${BLUE}💡 Tip: Run diagnostics to monitor system health:${NC}"
echo -e "   ${GREEN}./scripts/pi-diagnostics.sh${NC}"

# Made with Bob
