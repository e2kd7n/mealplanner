#!/bin/bash

# Restart (bounce) the Meal Planner application on Raspberry Pi

set -e

echo "🔄 Restarting Meal Planner on Raspberry Pi..."

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

# Check if containers exist (running or stopped)
if ! podman ps -a | grep -q "meals-"; then
    echo -e "${YELLOW}⚠️  No containers found${NC}"
    echo -e "${BLUE}Use ./scripts/pi-run.sh to start the application${NC}"
    exit 1
fi

# Show current status
echo -e "${BLUE}Current status:${NC}"
podman-compose -f podman-compose.pi.yml ps

echo ""
echo -e "${YELLOW}🛑 Stopping services...${NC}"

# Stop services
podman-compose -f podman-compose.pi.yml down

echo -e "${GREEN}✓ Services stopped${NC}"
echo ""
echo -e "${YELLOW}🚀 Starting services...${NC}"

# Start services
podman-compose -f podman-compose.pi.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 10

# Check service status
echo ""
echo -e "${GREEN}📊 Service status:${NC}"
podman-compose -f podman-compose.pi.yml ps

# Verify backend is running
if podman ps | grep -q "meals-backend"; then
    echo ""
    echo -e "${GREEN}✅ Application restarted successfully!${NC}"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    
    # Call check-deployment-mode.sh as the source of truth
    if [ -f "./scripts/check-deployment-mode.sh" ]; then
        bash ./scripts/check-deployment-mode.sh
    else
        # Fallback if script doesn't exist
        echo -e "${BLUE}Access the application:${NC}"
        echo -e "   🌐 Web: http://$(hostname -I | awk '{print $1}'):8080"
        echo -e "   🌐 Local: http://localhost:8080"
        echo ""
    fi
    
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
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
    podman-compose -f podman-compose.pi.yml logs backend
    exit 1
fi

# Made with Bob