#!/bin/bash

# Restore unhealthy services in the Meal Planner local development environment
# This script checks the database container and local dev services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

section "Local Dev Health Check" "🩺"

# Check if podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "  ${RED}❌ Podman is not installed.${NC}"
    echo -e "  ${YELLOW}Install with: brew install podman${NC}"
    exit 1
fi

# Function to check database container health
check_database_health() {
    echo -e "  ${BLUE}ℹ️  Checking database container...${NC}"

    # Check if container exists
    if ! podman ps -a --format "{{.Names}}" | grep -q "^meals-postgres$"; then
        echo -e "  ${RED}❌ Database container not found${NC}"
        echo -e "  ${YELLOW}   Run: ./scripts/run-local.sh${NC}"
        return 1
    fi

    # Get container status
    local status=$(podman ps -a --filter "name=^meals-postgres$" --format "{{.Status}}")

    # Check if container is running
    if ! echo "$status" | grep -q "Up"; then
        echo -e "  ${RED}❌ Database container is stopped${NC}"
        echo -e "     Status: $status"
        return 1
    fi

    # Check if container is healthy
    local health=$(podman inspect meals-postgres --format "{{.State.Health.Status}}" 2>/dev/null || echo "none")
    if [ "$health" != "none" ] && [ "$health" != "healthy" ]; then
        echo -e "  ${YELLOW}⚠️  Database container is unhealthy${NC}"
        echo -e "     Health: $health"
        return 1
    fi

    echo -e "  ${GREEN}✓${NC}  Database container: Healthy"
    return 0
}

# Function to check if backend is running
check_backend_health() {
    echo -e "  ${BLUE}ℹ️  Checking backend service...${NC}"

    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        local health_status=$(curl -s http://localhost:3000/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [ "$health_status" = "healthy" ]; then
            echo -e "  ${GREEN}✓${NC}  Backend service: Healthy (http://localhost:3000)"
            return 0
        else
            echo -e "  ${YELLOW}⚠️  Backend service: Unhealthy${NC}"
            return 1
        fi
    else
        echo -e "  ${RED}❌ Backend service: Not responding (http://localhost:3000)${NC}"
        echo -e "  ${YELLOW}   Start with: cd backend && npm run dev${NC}"
        return 1
    fi
}

# Function to check if frontend is running
check_frontend_health() {
    echo -e "  ${BLUE}ℹ️  Checking frontend service...${NC}"

    if curl -s http://localhost:5173 -I > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC}  Frontend service: Healthy (http://localhost:5173)"
        return 0
    else
        echo -e "  ${RED}❌ Frontend service: Not responding (http://localhost:5173)${NC}"
        echo -e "  ${YELLOW}   Start with: cd frontend && npm run dev${NC}"
        return 1
    fi
}

# Check all services
section "Service Checks" "🔍"
DATABASE_HEALTHY=false
BACKEND_HEALTHY=false
FRONTEND_HEALTHY=false

if check_database_health; then
    DATABASE_HEALTHY=true
fi

echo ""
if check_backend_health; then
    BACKEND_HEALTHY=true
fi

echo ""
if check_frontend_health; then
    FRONTEND_HEALTHY=true
fi

# If database is unhealthy, restart it
if [ "$DATABASE_HEALTHY" = false ]; then
    section "Restarting Database" "🗄️"

    CONTAINER_EXISTS=false
    if podman ps -a --format "{{.Names}}" | grep -q "^meals-postgres$"; then
        CONTAINER_EXISTS=true
    fi

    # Confirmation — stopping/removing the container is disruptive, even though
    # data itself persists in the named 'postgres_data' volume (podman rm without
    # -v never touches volumes). Still worth an explicit gate since it interrupts
    # whatever's using the DB right now. Default is abort on bare Enter.
    echo ""
    if [ "$CONTAINER_EXISTS" = true ]; then
        echo -e "  ${RED}⚠️  About to stop and remove the 'meals-postgres' container and recreate it.${NC}"
        echo -e "  ${DIM}   Data persists in the 'postgres_data' named volume — this does not delete${NC}"
        echo -e "  ${DIM}   your data — but it will interrupt any in-flight connections.${NC}"
    else
        echo -e "  ${YELLOW}⚠️  About to create a new 'meals-postgres' container (none exists yet).${NC}"
    fi
    echo ""
    read -p "  $(echo -e "${RED}Continue? (y/N):${NC}") " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "  ${YELLOW}Aborted — database left as-is.${NC}"
        exit 1
    fi

    if [ "$CONTAINER_EXISTS" = true ]; then
        start_spinner "Stopping and removing existing container"
        podman stop meals-postgres 2>/dev/null || true
        podman rm meals-postgres 2>/dev/null || true
        stop_spinner ok
    fi

    # Start database container
    start_spinner "Starting database container"
    POSTGRES_PASSWORD=$(cat secrets/postgres_password.txt)
    podman run -d \
        --name meals-postgres \
        --restart unless-stopped \
        -p 5432:5432 \
        -e POSTGRES_DB=meal_planner \
        -e POSTGRES_USER=mealplanner \
        -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
        -v postgres_data:/var/lib/postgresql/data \
        -v ./database/init/01-init.sql:/docker-entrypoint-initdb.d/01-init.sql:ro \
        -v ./database/seed-dev/02-test-data.sql:/docker-entrypoint-initdb.d/02-test-data.sql:ro \
        -v ./database/seed-dev/03-additional-recipes.sql:/docker-entrypoint-initdb.d/03-additional-recipes.sql:ro \
        -v ./database/seed-dev/04-complete-recipe-data.sql:/docker-entrypoint-initdb.d/04-complete-recipe-data.sql:ro \
        -v ./database/seed-dev/05-enrich-existing-recipes.sql:/docker-entrypoint-initdb.d/05-enrich-existing-recipes.sql:ro \
        --health-cmd "pg_isready -U mealplanner -d meal_planner" \
        --health-interval 10s \
        --health-timeout 5s \
        --health-retries 5 \
        docker.io/library/postgres:16-alpine >/dev/null
    stop_spinner ok

    # Wait for database to be healthy
    if wait_for "Waiting for database to be healthy" 30 1 \
        podman exec meals-postgres pg_isready -U mealplanner -d meal_planner; then
        DATABASE_HEALTHY=true
    else
        echo -e "  ${RED}❌ Database failed to become healthy${NC}"
        podman logs meals-postgres
        exit 1
    fi
fi

# Summary
section "Summary" "🍽️"

if [ "$DATABASE_HEALTHY" = true ]; then
    echo -e "  ${GREEN}✓${NC}  Database Container"
else
    echo -e "  ${RED}✗${NC}  Database Container"
fi

if [ "$BACKEND_HEALTHY" = true ]; then
    echo -e "  ${GREEN}✓${NC}  Backend Service (http://localhost:3000)"
else
    echo -e "  ${RED}✗${NC}  Backend Service"
fi

if [ "$FRONTEND_HEALTHY" = true ]; then
    echo -e "  ${GREEN}✓${NC}  Frontend Service (http://localhost:5173)"
else
    echo -e "  ${RED}✗${NC}  Frontend Service"
fi

echo ""

# If all services are healthy
if [ "$DATABASE_HEALTHY" = true ] && [ "$BACKEND_HEALTHY" = true ] && [ "$FRONTEND_HEALTHY" = true ]; then
    echo -e "  ${GREEN}✓ All services are healthy!${NC}"
    echo ""
    echo -e "  ${BLUE}Application is available at:${NC}"
    echo -e "    🌐 Frontend: ${GREEN}http://localhost:5173${NC}"
    echo -e "    🔧 Backend API: ${GREEN}http://localhost:3000/api${NC}"
    echo -e "    🩺 Health Check: ${GREEN}http://localhost:3000/health${NC}"
    exit 0
fi

# Provide instructions for unhealthy services
echo -e "  ${YELLOW}⚠️  Some services need attention:${NC}"
echo ""

if [ "$DATABASE_HEALTHY" = false ]; then
    echo -e "  ${RED}Database:${NC} Run ${GREEN}./scripts/run-local.sh${NC}"
fi

if [ "$BACKEND_HEALTHY" = false ]; then
    echo -e "  ${RED}Backend:${NC} Run ${GREEN}cd backend && npm run dev${NC}"
fi

if [ "$FRONTEND_HEALTHY" = false ]; then
    echo -e "  ${RED}Frontend:${NC} Run ${GREEN}cd frontend && npm run dev${NC}"
fi

echo ""
echo -e "  ${BLUE}Useful commands:${NC}"
echo -e "    View DB logs:     ${GREEN}podman logs -f meals-postgres${NC}"
echo -e "    Restart database: ${GREEN}podman restart meals-postgres${NC}"
echo -e "    Full setup:       ${GREEN}./scripts/run-local.sh${NC}"

exit 1
