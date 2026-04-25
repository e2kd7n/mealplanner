#!/bin/bash

# Stop the Meal Planner application on Raspberry Pi

set -e

echo "🛑 Stopping Meal Planner on Raspberry Pi..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if podman-compose is installed
if ! command -v podman-compose &> /dev/null; then
    echo -e "${RED}❌ podman-compose is not installed${NC}"
    exit 1
fi

# Check if containers are running
if ! podman ps | grep -q "meals-"; then
    echo -e "${YELLOW}⚠️  No containers are currently running${NC}"
    echo ""
    echo -e "${BLUE}Container status:${NC}"
    podman-compose -f podman-compose.pi.yml ps
    exit 0
fi

# Show what's running before stopping
echo -e "${BLUE}Currently running containers:${NC}"
podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep meals

echo ""
echo -e "${YELLOW}🛑 Stopping all services...${NC}"

# Stop services
podman-compose -f podman-compose.pi.yml down

# Verify containers are stopped
echo ""
if podman ps | grep -q "meals-"; then
    echo -e "${RED}❌ Some containers are still running${NC}"
    podman ps | grep meals
    exit 1
else
    echo -e "${GREEN}✅ All services stopped successfully${NC}"
    echo ""
    echo -e "${BLUE}Container status:${NC}"
    podman-compose -f podman-compose.pi.yml ps
    echo ""
    echo -e "${BLUE}To start again: ./scripts/pi-run.sh${NC}"
fi

# Made with Bob