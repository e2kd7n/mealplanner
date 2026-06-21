#!/bin/bash

# Stop the Meal Planner application on Raspberry Pi

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

echo "🛑 Stopping Meal Planner on Raspberry Pi..."

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

# Stop Zero W backend services first (while they can still reach Postgres/Redis)
clusterhat_stop_zeros

echo -e "${YELLOW}🛑 Stopping all services...${NC}"

# Stop services (include ClusterHAT overlay if present so ports are cleaned up)
COMPOSE_FILES=$(clusterhat_compose_files)
# shellcheck disable=SC2086
podman-compose $COMPOSE_FILES down

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

