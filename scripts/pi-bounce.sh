#!/bin/bash

# Restart (bounce) the Meal Planner application on Raspberry Pi

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

COMPOSE_FILES=$(clusterhat_compose_files)

section "Restart Meal Planner" "🚀"

# Check if podman-compose is installed
if ! command -v podman-compose &> /dev/null; then
    echo -e "${RED}❌ podman-compose is not installed${NC}"
    exit 1
fi

# Check if containers exist (running or stopped)
if ! podman ps -a | grep -q "meals-"; then
    echo -e "${YELLOW}⚠️  No containers found${NC}"
    echo -e "${BLUE}Use ./scripts/pi-run.sh to start the application${NC}"
    exit 1
fi

# Show current status
echo -e "${BLUE}ℹ️  Current status:${NC}"
# shellcheck disable=SC2086
podman-compose $COMPOSE_FILES ps

section "Stopping Services" "🛑"

# Stop Zero W services first (while Postgres/Redis are still up)
clusterhat_stop_zeros

echo -e "${YELLOW}🛑 Stopping services...${NC}"
# shellcheck disable=SC2086
podman-compose $COMPOSE_FILES down
echo -e "  ${GREEN}✓${NC}  Services stopped"

section "Starting Services" "🚀"

echo -e "${YELLOW}🚀 Starting services...${NC}"
# shellcheck disable=SC2086
podman-compose $COMPOSE_FILES up -d
echo -e "  ${GREEN}✓${NC}  Services started"

# Wait for services to be healthy
start_spinner "Waiting for services to stabilize"
sleep 10
stop_spinner ok

# Check service status
echo ""
echo -e "${BLUE}ℹ️  Service status:${NC}"
# shellcheck disable=SC2086
podman-compose $COMPOSE_FILES ps

section "Verifying" "🩺"

# Verify backend is running
if podman ps | grep -q "meals-backend"; then
    echo -e "  ${GREEN}✓${NC}  Backend container running"

    # Nginx caches backend DNS at startup — after down/up the backend container
    # has a new IP, causing 502s until nginx is restarted (Podman 4.3.1 lacks
    # working resolver directive support). See #206.
    if podman ps | grep -q "meals-nginx"; then
        start_spinner "Restarting nginx to refresh backend DNS"
        podman restart meals-nginx &>/dev/null
        stop_spinner ok
    fi

    # Restart Zero W services now that Postgres/Redis are back
    clusterhat_restart_zeros

    section "Summary" "🍽️"

    echo -e "  ${GREEN}✓ Application restarted successfully${NC}"
    echo ""

    # Call check-deployment-mode.sh as the source of truth
    if [ -f "./scripts/check-deployment-mode.sh" ]; then
        bash ./scripts/check-deployment-mode.sh || true
    else
        # Fallback if script doesn't exist
        echo -e "${BLUE}Access the application:${NC}"
        echo -e "   🌐 Web: http://$(hostname -I | awk '{print $1}')"
        echo -e "   🌐 Local: http://localhost"
        echo ""
    fi

    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo -e "   📝 View logs: podman-compose -f podman-compose.pi.yml logs -f"
    echo -e "   🛑 Stop: ./scripts/pi-stop.sh"
    echo -e "   📊 Diagnostics: ./scripts/pi-diagnostics.sh"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Failed to restart backend container${NC}"
    echo -e "${YELLOW}Checking logs...${NC}"
    # shellcheck disable=SC2086
    podman-compose $COMPOSE_FILES logs backend
    exit 1
fi
