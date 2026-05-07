#!/bin/bash

# Start the Meal Planner application on Raspberry Pi using Podman

set -e

echo "🚀 Starting Meal Planner on Raspberry Pi..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if podman-compose is installed
if ! command -v podman-compose &> /dev/null; then
    echo -e "${RED}❌ podman-compose is not installed${NC}"
    echo "Install with: pip3 install podman-compose"
    exit 1
fi

# Check if containers are already running
if podman ps | grep -q "meals-backend"; then
    echo -e "${YELLOW}⚠️  Application is already running${NC}"
    echo ""
    echo -e "${BLUE}Container status:${NC}"
    podman-compose -f podman-compose.pi.yml ps
    echo ""
    echo -e "${BLUE}To restart, use: ./scripts/pi-bounce.sh${NC}"
    exit 0
fi

# Check if images exist (either locally built or loaded from tar)
if ! podman images | grep -q "meals-backend"; then
    echo -e "${RED}❌ Container images not found${NC}"
    echo -e "${YELLOW}Please build or load images first:${NC}"
    echo -e "   Option 1 - Build directly on Pi: ${GREEN}./scripts/build-on-pi.sh${NC}"
    echo -e "   Option 2 - Load pre-built images:"
    echo -e "      a. Transfer: scp pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/"
    echo -e "      b. Load: ./scripts/load-pi-images.sh"
    exit 1
fi

if ! podman images | grep -q "meals-frontend"; then
    echo -e "${RED}❌ Frontend image not found${NC}"
    echo -e "${YELLOW}Please build or load images first:${NC}"
    echo -e "   Option 1 - Build directly on Pi: ${GREEN}./scripts/build-on-pi.sh${NC}"
    echo -e "   Option 2 - Load pre-built images:"
    echo -e "      a. Transfer: scp pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/"
    echo -e "      b. Load: ./scripts/load-pi-images.sh"
    exit 1
fi

# Start services
echo -e "${GREEN}🚀 Starting services...${NC}"
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
    echo -e "${GREEN}✅ Application started successfully!${NC}"
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
    echo -e "   🔄 Restart: ./scripts/pi-bounce.sh"
    echo -e "   📊 Diagnostics: ./scripts/pi-diagnostics.sh"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Failed to start backend container${NC}"
    echo -e "${YELLOW}Checking logs...${NC}"
    podman-compose -f podman-compose.pi.yml logs backend
    exit 1
fi

# Made with Bob