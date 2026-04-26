#!/bin/bash

# Restore unhealthy services in the Meal Planner local development environment
# This script checks the database container and local dev services

set -e

echo "🔍 Checking Meal Planner local development health..."

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

# Function to check database container health
check_database_health() {
    echo -e "${BLUE}Checking database container...${NC}"
    
    # Check if container exists
    if ! podman ps -a --format "{{.Names}}" | grep -q "^meals-postgres$"; then
        echo -e "${RED}❌ Database container not found${NC}"
        echo -e "${YELLOW}Run: ./scripts/run-local.sh${NC}"
        return 1
    fi
    
    # Get container status
    local status=$(podman ps -a --filter "name=^meals-postgres$" --format "{{.Status}}")
    
    # Check if container is running
    if ! echo "$status" | grep -q "Up"; then
        echo -e "${RED}❌ Database container is stopped${NC}"
        echo -e "   Status: $status"
        return 1
    fi
    
    # Check if container is healthy
    local health=$(podman inspect meals-postgres --format "{{.State.Health.Status}}" 2>/dev/null || echo "none")
    if [ "$health" != "none" ] && [ "$health" != "healthy" ]; then
        echo -e "${YELLOW}⚠️  Database container is unhealthy${NC}"
        echo -e "   Health: $health"
        return 1
    fi
    
    echo -e "${GREEN}✓ Database container: Healthy${NC}"
    return 0
}

# Function to check if backend is running
check_backend_health() {
    echo -e "${BLUE}Checking backend service...${NC}"
    
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        local health_status=$(curl -s http://localhost:3000/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [ "$health_status" = "healthy" ]; then
            echo -e "${GREEN}✓ Backend service: Healthy (http://localhost:3000)${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  Backend service: Unhealthy${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Backend service: Not responding (http://localhost:3000)${NC}"
        echo -e "${YELLOW}   Start with: cd backend && npm run dev${NC}"
        return 1
    fi
}

# Function to check if frontend is running
check_frontend_health() {
    echo -e "${BLUE}Checking frontend service...${NC}"
    
    if curl -s http://localhost:5173 -I > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend service: Healthy (http://localhost:5173)${NC}"
        return 0
    else
        echo -e "${RED}❌ Frontend service: Not responding (http://localhost:5173)${NC}"
        echo -e "${YELLOW}   Start with: cd frontend && npm run dev${NC}"
        return 1
    fi
}

# Check all services
echo ""
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

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# If database is unhealthy, restart it
if [ "$DATABASE_HEALTHY" = false ]; then
    echo ""
    echo -e "${YELLOW}🔄 Restarting database container...${NC}"
    
    # Check if container exists but is stopped
    if podman ps -a --format "{{.Names}}" | grep -q "^meals-postgres$"; then
        echo -e "${YELLOW}  Stopping existing container...${NC}"
        podman stop meals-postgres 2>/dev/null || true
        podman rm meals-postgres 2>/dev/null || true
    fi
    
    # Start database container
    echo -e "${YELLOW}  Starting database container...${NC}"
    POSTGRES_PASSWORD=$(cat secrets/postgres_password.txt)
    podman run -d \
        --name meals-postgres \
        --restart unless-stopped \
        -p 5432:5432 \
        -e POSTGRES_DB=meal_planner \
        -e POSTGRES_USER=mealplanner \
        -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
        -v postgres_data:/var/lib/postgresql/data \
        -v ./database/init:/docker-entrypoint-initdb.d:ro \
        --health-cmd "pg_isready -U mealplanner -d meal_planner" \
        --health-interval 10s \
        --health-timeout 5s \
        --health-retries 5 \
        docker.io/library/postgres:16-alpine
    
    # Wait for database to be healthy
    echo -e "${YELLOW}  Waiting for database to be healthy...${NC}"
    for i in {1..30}; do
        if podman exec meals-postgres pg_isready -U mealplanner -d meal_planner &>/dev/null; then
            echo -e "${GREEN}✓ Database is now healthy${NC}"
            DATABASE_HEALTHY=true
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ Database failed to become healthy${NC}"
            podman logs meals-postgres
            exit 1
        fi
        sleep 1
    done
fi

# Summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Service Status Summary:${NC}"
echo ""

if [ "$DATABASE_HEALTHY" = true ]; then
    echo -e "   ${GREEN}✓ Database Container${NC}"
else
    echo -e "   ${RED}✗ Database Container${NC}"
fi

if [ "$BACKEND_HEALTHY" = true ]; then
    echo -e "   ${GREEN}✓ Backend Service (http://localhost:3000)${NC}"
else
    echo -e "   ${RED}✗ Backend Service${NC}"
fi

if [ "$FRONTEND_HEALTHY" = true ]; then
    echo -e "   ${GREEN}✓ Frontend Service (http://localhost:5173)${NC}"
else
    echo -e "   ${RED}✗ Frontend Service${NC}"
fi

echo ""

# If all services are healthy
if [ "$DATABASE_HEALTHY" = true ] && [ "$BACKEND_HEALTHY" = true ] && [ "$FRONTEND_HEALTHY" = true ]; then
    echo -e "${GREEN}✅ All services are healthy!${NC}"
    echo ""
    echo -e "${BLUE}📱 Application is available at:${NC}"
    echo -e "   🌐 Frontend: ${GREEN}http://localhost:5173${NC}"
    echo -e "   🔧 Backend API: ${GREEN}http://localhost:3000/api${NC}"
    echo -e "   ❤️  Health Check: ${GREEN}http://localhost:3000/health${NC}"
    exit 0
fi

# Provide instructions for unhealthy services
echo -e "${YELLOW}⚠️  Some services need attention:${NC}"
echo ""

if [ "$DATABASE_HEALTHY" = false ]; then
    echo -e "${RED}Database:${NC} Run ${GREEN}./scripts/run-local.sh${NC}"
fi

if [ "$BACKEND_HEALTHY" = false ]; then
    echo -e "${RED}Backend:${NC} Run ${GREEN}cd backend && npm run dev${NC}"
fi

if [ "$FRONTEND_HEALTHY" = false ]; then
    echo -e "${RED}Frontend:${NC} Run ${GREEN}cd frontend && npm run dev${NC}"
fi

echo ""
echo -e "${BLUE}📝 Useful commands:${NC}"
echo -e "   View DB logs:     ${GREEN}podman logs -f meals-postgres${NC}"
echo -e "   Restart database: ${GREEN}podman restart meals-postgres${NC}"
echo -e "   Full setup:       ${GREEN}./scripts/run-local.sh${NC}"

exit 1

# Made with Bob