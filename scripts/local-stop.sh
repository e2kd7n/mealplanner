#!/bin/bash

# Stop Local Development Environment
# Gracefully shuts down all services
# ⚠️  FOR LOCAL DEVELOPMENT ONLY - Use pi-stop.sh on Raspberry Pi

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Darwin*)  echo "mac" ;;
        Linux*)
            if grep -qi microsoft /proc/version 2>/dev/null; then
                echo "wsl"
            elif [ -f /proc/device-tree/model ] && grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
                echo "pi"
            else
                echo "linux"
            fi
            ;;
        MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
        *) echo "unknown" ;;
    esac
}

OS=$(detect_os)

if [ "$OS" = "pi" ]; then
    echo "❌ ERROR: This is a LOCAL DEVELOPMENT script!"
    echo ""
    echo "For Raspberry Pi, use: ./scripts/pi-stop.sh"
    echo ""
    exit 1
fi

echo -e "${YELLOW}🛑 Stopping Meal Planner local development environment...${NC}"

# Stop and remove the standalone postgres container started by local-run.sh
echo -e "${BLUE}📦 Stopping database container...${NC}"
if podman stop meals-postgres 2>/dev/null; then
    podman rm meals-postgres 2>/dev/null || true
    echo -e "${GREEN}   ✓ Database container stopped${NC}"
else
    echo "   No database container running"
fi

# Kill any running Node/Vite processes
echo -e "${BLUE}🔪 Stopping Node processes...${NC}"
pkill -f "npm run dev" 2>/dev/null && echo -e "${GREEN}   ✓ npm dev stopped${NC}" || echo "   No npm dev processes found"
pkill -f "vite" 2>/dev/null && echo -e "${GREEN}   ✓ vite stopped${NC}" || echo "   No vite processes found"
pkill -f "nodemon" 2>/dev/null && echo -e "${GREEN}   ✓ nodemon stopped${NC}" || echo "   No nodemon processes found"
pkill -f "ts-node\|tsx" 2>/dev/null && echo -e "${GREEN}   ✓ ts-node/tsx stopped${NC}" || true

# Clean up log files written by local-run.sh (project root)
echo -e "${BLUE}🧹 Cleaning up log files...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
rm -f "$ROOT_DIR/backend.log" && echo -e "${GREEN}   ✓ backend.log removed${NC}" || true
rm -f "$ROOT_DIR/frontend.log" && echo -e "${GREEN}   ✓ frontend.log removed${NC}" || true

echo ""
echo -e "${GREEN}✅ All services stopped successfully!${NC}"

# Made with Bob
