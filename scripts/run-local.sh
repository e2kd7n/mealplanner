#!/bin/bash

# Run the Meal Planner application locally using Podman
# This script builds and runs the application on your local machine for testing

set -e

echo "🚀 Starting Meal Planner locally..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "${RED}❌ Podman is not installed.${NC}"
    echo -e "${YELLOW}Install with: brew install podman${NC}"
    exit 1
fi

# Check if podman-compose is installed
if ! command -v podman-compose &> /dev/null; then
    echo -e "${YELLOW}⚠️  podman-compose not found. Installing...${NC}"
    pip3 install podman-compose
fi

# Check if podman machine is running (macOS/Windows)
if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "msys" ]]; then
    if ! podman machine list | grep -q "Currently running"; then
        echo -e "${YELLOW}⚠️  Podman machine not running. Starting...${NC}"
        podman machine start
        sleep 5
    fi
fi

# Generate secrets if they don't exist
if [ ! -f "./secrets/postgres_password.txt" ]; then
    echo -e "${YELLOW}⚠️  Secrets not found. Generating...${NC}"
    ./scripts/generate-secrets.sh
fi

# Stop and remove existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
podman stop meals-backend meals-postgres 2>/dev/null || true
podman rm meals-backend meals-postgres 2>/dev/null || true

# Remove old network if it exists
echo -e "${YELLOW}🔧 Cleaning up old network...${NC}"
podman network rm mealplanner_meals-network 2>/dev/null || true

# Start services using podman-compose
echo -e "${GREEN}🚀 Starting services with podman-compose...${NC}"
podman-compose -f podman-compose.yml up -d --build

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 15

# Check service status
echo -e "${GREEN}📊 Service status:${NC}"
podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Verify backend container exists and is running
if ! podman ps --format "{{.Names}}" | grep -q "meals-backend"; then
    echo -e "${RED}❌ Backend container not running. Checking logs...${NC}"
    podman logs meals-backend
    exit 1
fi

# Run database migrations
echo -e "${GREEN}🔄 Running database migrations...${NC}"
podman exec meals-backend sh -c "cd /app && npx prisma migrate deploy"

echo ""
echo -e "${GREEN}✅ Application is running locally!${NC}"
echo ""
echo -e "${BLUE}📱 Access the application:${NC}"
echo -e "   🌐 Frontend: ${GREEN}http://localhost:8080${NC}"
echo -e "   🔧 Backend API: ${GREEN}http://localhost:8080/api${NC}"
echo -e "   ❤️  Health Check: ${GREEN}http://localhost:8080/health${NC}"
echo ""
echo -e "${BLUE}📝 Test Credentials:${NC}"
echo -e "   Email: ${GREEN}test@example.com${NC}"
echo -e "   Password: ${GREEN}TestPass123!${NC}"
echo ""
echo -e "${BLUE}📝 Useful commands:${NC}"
echo -e "   View logs:        ${GREEN}podman-compose -f podman-compose.yml logs -f${NC}"
echo -e "   Stop services:    ${GREEN}podman-compose -f podman-compose.yml down${NC}"
echo -e "   Restart services: ${GREEN}podman-compose -f podman-compose.yml restart${NC}"
echo -e "   View status:      ${GREEN}podman ps${NC}"
echo ""
echo -e "${YELLOW}💡 Tip: The frontend now uses relative API paths (/api) through nginx proxy!${NC}"

# Made with Bob