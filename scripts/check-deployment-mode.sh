#!/bin/bash

# Copyright (c) 2026 e2kd7n
# All rights reserved.

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect OS for compatibility
OS_TYPE=$(uname -s)

# Function to check if port is in use (cross-platform)
check_port() {
    local port=$1
    
    # Try lsof first (macOS, Linux)
    if command -v lsof &> /dev/null; then
        lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1
        return $?
    fi
    
    # Fallback to netstat (Linux, Pi)
    if command -v netstat &> /dev/null; then
        netstat -tuln 2>/dev/null | grep -q ":$port "
        return $?
    fi
    
    # Fallback to ss (modern Linux)
    if command -v ss &> /dev/null; then
        ss -tuln 2>/dev/null | grep -q ":$port "
        return $?
    fi
    
    # If no tools available, return false
    return 1
}

echo ""
echo -e "${BLUE}🔍 Checking Deployment Mode...${NC}"
echo ""

# Check for local dev mode (Vite on 5173)
if check_port 5173; then
    echo -e "${GREEN}✅ LOCAL DEVELOPMENT MODE is running${NC}"
    echo ""
    echo -e "${BLUE}📱 Access your application at:${NC}"
    echo -e "   ${GREEN}👉 http://localhost:5173${NC}"
    echo ""
    echo -e "${BLUE}🔧 Backend API:${NC} http://localhost:3000/api"
    echo -e "${BLUE}❤️  Health Check:${NC} http://localhost:3000/health"
    echo ""
    if [ -n "$CALLED_FROM_MENU" ]; then
        echo -e "${BLUE}🛑 To stop:${NC} Use menu option 3 (Stop all services)"
    else
        echo -e "${BLUE}🛑 To stop:${NC} ./scripts/local-stop.sh"
    fi
    echo ""
    exit 0
fi

# Check for container mode (nginx on 8080)
if check_port 8080; then
    echo -e "${GREEN}✅ CONTAINER MODE is running${NC}"
    echo ""
    echo -e "${BLUE}📱 Access your application at:${NC}"
    echo -e "   ${GREEN}👉 http://localhost:8080${NC}"
    echo ""
    echo -e "${BLUE}🔌 API Endpoint:${NC} http://localhost:8080/api"
    echo -e "${BLUE}❤️  Health Check:${NC} http://localhost:8080/health"
    echo ""
    
    # Check if it's local or remote
    if command -v podman &> /dev/null && podman ps --format "{{.Names}}" 2>/dev/null | grep -q "meals-"; then
        echo -e "${BLUE}📍 Location:${NC} Local machine (Podman containers)"
        if [ -n "$CALLED_FROM_MENU" ]; then
            echo -e "${BLUE}🛑 To stop:${NC} Use menu option 3 (Stop all services)"
        else
            echo -e "${BLUE}🛑 To stop:${NC} ./scripts/local-stop.sh"
        fi
    elif command -v docker &> /dev/null && docker ps --format "{{.Names}}" 2>/dev/null | grep -q "meals-"; then
        echo -e "${BLUE}📍 Location:${NC} Local machine (Docker containers)"
        echo -e "${BLUE}🛑 To stop:${NC} docker-compose down"
    else
        echo -e "${BLUE}📍 Location:${NC} Unknown (possibly remote)"
        echo -e "${BLUE}🛑 To stop:${NC} Check your deployment method"
    fi
    echo ""
    exit 0
fi

# Nothing running
echo -e "${RED}❌ No deployment detected${NC}"
echo ""
echo -e "${YELLOW}No services are currently running on standard ports.${NC}"
echo ""
echo -e "${BLUE}Start one of these modes:${NC}"
echo ""
echo -e "  ${GREEN}Local Development (Port 5173):${NC}"
echo -e "    ./scripts/local-run.sh"
echo ""
echo -e "  ${GREEN}Container Mode (Port 8080):${NC}"
echo -e "    ./scripts/deploy-podman.sh"
echo ""
echo -e "${BLUE}Or use the interactive menu:${NC}"
echo -e "    ./scripts/menu.sh"
echo ""

exit 1

# Made with Bob
