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

# Force remove any stuck containers
echo -e "${YELLOW}🧹 Cleaning up any stuck containers...${NC}"
podman rm -f meals-postgres meals-backend meals-frontend meals-nginx 2>/dev/null || true

# Remove any orphaned containers from previous failed attempts
podman container prune -f 2>/dev/null || true

# Check if pre-built images exist
echo -e "${BLUE}🔍 Checking for pre-built images...${NC}"
# Check for images with or without localhost/ prefix
BACKEND_EXISTS=$(podman images --format "{{.Repository}}:{{.Tag}}" | grep -c "meals-backend:latest$" || true)
FRONTEND_EXISTS=$(podman images --format "{{.Repository}}:{{.Tag}}" | grep -c "meals-frontend:latest$" || true)

if [ "$BACKEND_EXISTS" -gt 0 ] && [ "$FRONTEND_EXISTS" -gt 0 ]; then
    echo -e "${GREEN}✓ Found pre-built images:${NC}"
    podman images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep -E "REPOSITORY|meals-"
    SKIP_BUILD=true
else
    echo -e "${YELLOW}⚠️  Pre-built images not found${NC}"
    echo -e "${BLUE}Current images:${NC}"
    podman images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | head -10
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

# Start services manually to avoid podman-compose blocking issues
echo -e "${GREEN}🚀 Starting services...${NC}"

# Create network if it doesn't exist
if ! podman network exists mealplanner_meals-network 2>/dev/null; then
    echo -e "${BLUE}Creating network...${NC}"
    podman network create mealplanner_meals-network
fi

# Start postgres first
echo -e "${BLUE}Starting PostgreSQL...${NC}"
podman-compose -f podman-compose.pi.yml up -d postgres

# Wait a moment for postgres to create
sleep 3

# Start postgres container
echo -e "${BLUE}Starting PostgreSQL container...${NC}"
if ! podman start meals-postgres 2>/dev/null; then
    echo -e "${YELLOW}Container doesn't exist yet, waiting for podman-compose...${NC}"
    sleep 5
fi

# Wait for postgres to be ready (critical dependency)
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if podman exec meals-postgres pg_isready -U mealplanner -d meal_planner &>/dev/null; then
        echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
    echo -n "."
done
echo ""

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${RED}❌ PostgreSQL failed to start within ${MAX_WAIT}s${NC}"
    echo -e "${YELLOW}PostgreSQL logs:${NC}"
    podman logs meals-postgres
    exit 1
fi

# Start backend
echo -e "${BLUE}Starting backend...${NC}"
podman-compose -f podman-compose.pi.yml up -d backend
sleep 5

# Start backend container if needed
if ! podman start meals-backend 2>/dev/null; then
    echo -e "${YELLOW}Waiting for backend container...${NC}"
    sleep 5
fi

# Wait for backend to be ready
echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
MAX_WAIT=90
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if podman exec meals-backend wget --no-verbose --tries=1 --spider http://localhost:3000/health &>/dev/null; then
        echo -e "${GREEN}✓ Backend is ready${NC}"
        break
    fi
    sleep 3
    WAITED=$((WAITED + 3))
    echo -n "."
done
echo ""

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${RED}❌ Backend failed to start within ${MAX_WAIT}s${NC}"
    echo -e "${YELLOW}Backend logs:${NC}"
    podman logs meals-backend
    exit 1
fi

# Start frontend and nginx
echo -e "${BLUE}Starting frontend and nginx...${NC}"
podman-compose -f podman-compose.pi.yml up -d frontend nginx
sleep 5

# Verify all containers are running
echo -e "${GREEN}📊 Service status:${NC}"
podman ps --filter "name=meals-"

# Check for any failed containers
FAILED_CONTAINERS=$(podman ps -a --filter "name=meals-" --format "{{.Names}} {{.Status}}" | grep -v "Up" || true)
if [ -n "$FAILED_CONTAINERS" ]; then
    echo -e "${RED}❌ Some containers failed to start:${NC}"
    echo "$FAILED_CONTAINERS"
    echo -e "${YELLOW}Checking logs...${NC}"
    for container in meals-postgres meals-backend meals-frontend meals-nginx; do
        if podman ps -a --format "{{.Names}}" | grep -q "^${container}$"; then
            echo -e "${YELLOW}=== ${container} logs ===${NC}"
            podman logs $container 2>&1 | tail -30
        fi
    done
    exit 1
fi

# Run database migrations
echo -e "${GREEN}🔄 Running database migrations...${NC}"
if ! podman exec meals-backend sh -c "cd /app && npx prisma migrate deploy"; then
    echo -e "${RED}❌ Database migration failed${NC}"
    echo -e "${YELLOW}Backend logs:${NC}"
    podman logs meals-backend --tail=100
    exit 1
fi

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
