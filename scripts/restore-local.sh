#!/bin/bash

# Restore unhealthy services in the Meal Planner application
# This script checks for stopped, crashed, or unhealthy containers and restarts only those

set -e

echo "🔍 Checking Meal Planner service health..."

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
    echo -e "${RED}❌ podman-compose is not installed.${NC}"
    echo -e "${YELLOW}Install with: pip3 install podman-compose${NC}"
    exit 1
fi

# Define expected services
SERVICES=("meals-postgres" "meals-backend" "meals-frontend" "meals-nginx")
UNHEALTHY_SERVICES=()
MISSING_SERVICES=()

# Function to check if a container is healthy
check_container_health() {
    local container_name=$1
    
    # Check if container exists
    if ! podman ps -a --format "{{.Names}}" | grep -q "^${container_name}$"; then
        echo -e "${RED}❌ ${container_name}: Not found${NC}"
        MISSING_SERVICES+=("$container_name")
        return 1
    fi
    
    # Get container status
    local status=$(podman ps -a --filter "name=^${container_name}$" --format "{{.Status}}")
    
    # Check if container is running
    if ! echo "$status" | grep -q "Up"; then
        echo -e "${RED}❌ ${container_name}: Stopped or crashed${NC}"
        echo -e "   Status: $status"
        UNHEALTHY_SERVICES+=("$container_name")
        return 1
    fi
    
    # Check if container is healthy (if it has a health check)
    local health=$(podman inspect "$container_name" --format "{{.State.Health.Status}}" 2>/dev/null || echo "none")
    if [ "$health" != "none" ] && [ "$health" != "healthy" ]; then
        echo -e "${YELLOW}⚠️  ${container_name}: Unhealthy${NC}"
        echo -e "   Health: $health"
        UNHEALTHY_SERVICES+=("$container_name")
        return 1
    fi
    
    echo -e "${GREEN}✓ ${container_name}: Healthy${NC}"
    return 0
}

# Check all services
echo ""
echo -e "${BLUE}Checking service health...${NC}"
for service in "${SERVICES[@]}"; do
    check_container_health "$service"
done

# If there are missing services, suggest full restart
if [ ${#MISSING_SERVICES[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}⚠️  Missing services detected: ${MISSING_SERVICES[*]}${NC}"
    echo -e "${YELLOW}This suggests the application hasn't been started yet.${NC}"
    echo -e "${YELLOW}Run: ./scripts/run-local.sh${NC}"
    exit 1
fi

# If all services are healthy, exit
if [ ${#UNHEALTHY_SERVICES[@]} -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All services are healthy!${NC}"
    echo ""
    echo -e "${BLUE}📱 Application is available at:${NC}"
    echo -e "   🌐 Frontend: ${GREEN}http://localhost:8080${NC}"
    echo -e "   🔧 Backend API: ${GREEN}http://localhost:8080/api${NC}"
    echo -e "   ❤️  Health Check: ${GREEN}http://localhost:8080/health${NC}"
    exit 0
fi

# Restart unhealthy services
echo ""
echo -e "${YELLOW}🔄 Restarting unhealthy services: ${UNHEALTHY_SERVICES[*]}${NC}"
echo ""

for service in "${UNHEALTHY_SERVICES[@]}"; do
    echo -e "${BLUE}Restarting ${service}...${NC}"
    
    # Map container name to service name in podman-compose.yml
    compose_service=""
    case "$service" in
        "meals-postgres")
            compose_service="postgres"
            ;;
        "meals-backend")
            compose_service="backend"
            ;;
        "meals-frontend")
            compose_service="frontend"
            ;;
        "meals-nginx")
            compose_service="nginx"
            ;;
        *)
            echo -e "${RED}❌ Unknown service: ${service}${NC}"
            continue
            ;;
    esac
    
    # Stop the container
    echo -e "${YELLOW}  Stopping ${service}...${NC}"
    podman stop "$service" 2>/dev/null || true
    
    # Remove the container
    echo -e "${YELLOW}  Removing ${service}...${NC}"
    podman rm "$service" 2>/dev/null || true
    
    # Restart using podman-compose (this will recreate the container)
    echo -e "${YELLOW}  Starting ${compose_service} service...${NC}"
    case "$service" in
        "meals-postgres")
            echo -e "${YELLOW}⚠️  Database restart detected. This may take a moment...${NC}"
            podman-compose -f podman-compose.yml up -d "$compose_service"
            sleep 10
            ;;
        "meals-backend")
            podman-compose -f podman-compose.yml up -d "$compose_service"
            sleep 5
            # Run migrations if backend was restarted
            echo -e "${GREEN}🔄 Running database migrations...${NC}"
            podman exec meals-backend sh -c "cd /app && npx prisma migrate deploy" 2>/dev/null || echo -e "${YELLOW}⚠️  Migrations may have already been applied${NC}"
            ;;
        "meals-frontend")
            podman-compose -f podman-compose.yml up -d "$compose_service"
            sleep 3
            ;;
        "meals-nginx")
            podman-compose -f podman-compose.yml up -d "$compose_service"
            sleep 3
            ;;
    esac
    
    echo -e "${GREEN}✓ ${service} restarted${NC}"
done

# Wait for services to stabilize
echo ""
echo -e "${YELLOW}⏳ Waiting for services to stabilize...${NC}"
sleep 5

# Check health again
echo ""
echo -e "${BLUE}Verifying service health...${NC}"
ALL_HEALTHY=true
for service in "${UNHEALTHY_SERVICES[@]}"; do
    if check_container_health "$service"; then
        echo -e "${GREEN}✓ ${service} is now healthy${NC}"
    else
        echo -e "${RED}❌ ${service} is still unhealthy${NC}"
        ALL_HEALTHY=false
    fi
done

echo ""
if [ "$ALL_HEALTHY" = true ]; then
    echo -e "${GREEN}✅ All services restored successfully!${NC}"
    echo ""
    echo -e "${BLUE}📱 Application is available at:${NC}"
    echo -e "   🌐 Frontend: ${GREEN}http://localhost:8080${NC}"
    echo -e "   🔧 Backend API: ${GREEN}http://localhost:8080/api${NC}"
    echo -e "   ❤️  Health Check: ${GREEN}http://localhost:8080/health${NC}"
    echo ""
    echo -e "${BLUE}📝 Useful commands:${NC}"
    echo -e "   View logs:        ${GREEN}podman-compose -f podman-compose.yml logs -f${NC}"
    echo -e "   Check status:     ${GREEN}podman ps${NC}"
    echo -e "   Full restart:     ${GREEN}./scripts/run-local.sh${NC}"
else
    echo -e "${RED}❌ Some services could not be restored.${NC}"
    echo -e "${YELLOW}Try a full restart: ./scripts/run-local.sh${NC}"
    echo -e "${YELLOW}Or check logs: podman-compose -f podman-compose.yml logs -f${NC}"
    exit 1
fi

# Made with Bob