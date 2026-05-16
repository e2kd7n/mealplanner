#!/bin/bash

# Run the Meal Planner application locally for development
# Starts only the database in a container; backend and frontend run natively with hot reload.
# ⚠️  FOR LOCAL DEVELOPMENT ONLY - Use pi-run.sh on Raspberry Pi

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect OS / architecture
detect_os() {
    case "$(uname -s)" in
        Darwin*)
            echo "mac" ;;
        Linux*)
            if grep -qi microsoft /proc/version 2>/dev/null; then
                echo "wsl"
            elif [ -f /proc/device-tree/model ] && grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
                echo "pi"
            else
                echo "linux"
            fi
            ;;
        MINGW*|MSYS*|CYGWIN*)
            echo "windows" ;;
        *)
            echo "unknown" ;;
    esac
}

OS=$(detect_os)
ARCH=$(uname -m)

# ── Argument parsing ──────────────────────────────────────────────────────────
# --browser <name|path>  override which browser to open (also reads $BROWSER env var)
# --no-browser           skip opening a browser entirely
OPEN_BROWSER=true
BROWSER_OVERRIDE="${BROWSER:-}"   # seed from env var; CLI flag takes precedence

while [[ $# -gt 0 ]]; do
    case "$1" in
        --browser)
            BROWSER_OVERRIDE="$2"
            shift 2 ;;
        --no-browser)
            OPEN_BROWSER=false
            shift ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 [--browser <name|path>] [--no-browser]"
            echo "  Supported names: chrome, chromium, firefox, brave, edge, safari (mac)"
            exit 1 ;;
    esac
done

if [ "$OS" = "pi" ]; then
    echo -e "${RED}❌ ERROR: This is a LOCAL DEVELOPMENT script!${NC}"
    echo ""
    echo -e "${YELLOW}For Raspberry Pi deployment, use:${NC}"
    echo -e "  ${GREEN}./scripts/pi-run.sh${NC}"
    echo ""
    exit 1
fi

echo -e "${BLUE}🖥️  Platform: $OS ($ARCH)${NC}"

echo "🚀 Starting Meal Planner in local development mode..."

# Cleanup function to kill background processes on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    echo -e "${GREEN}✅ Services stopped${NC}"
}

trap cleanup EXIT INT TERM

# Check if podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "${RED}❌ Podman is not installed.${NC}"
    echo -e "${YELLOW}Install with: brew install podman${NC}"
    exit 1
fi

# Podman VM is only needed on macOS and Windows (not on Linux/WSL where Podman runs natively)
if [[ "$OS" == "mac" || "$OS" == "windows" ]]; then
    if ! podman machine list 2>/dev/null | grep -q "Currently running"; then
        echo -e "${YELLOW}⚠️  Podman machine not running. Starting...${NC}"
        podman machine start
    fi
fi

# Generate secrets if they don't exist
if [ ! -f "./secrets/postgres_password.txt" ]; then
    echo -e "${YELLOW}⚠️  Secrets not found. Generating...${NC}"
    ./scripts/generate-secrets.sh
fi

# Check if backend .env exists
if [ ! -f "./backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Backend .env not found. Creating from example...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${RED}⚠️  IMPORTANT: Update backend/.env with secrets from secrets/ directory${NC}"
fi

# Check if frontend .env exists
if [ ! -f "./frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  Frontend .env not found. Creating from example...${NC}"
    cp frontend/.env.example frontend/.env
    # Rewrite API URL for local dev — sed -i syntax differs between macOS and GNU
    if [[ "$OS" == "mac" ]]; then
        sed -i '' 's|VITE_API_URL=/api|VITE_API_URL=http://localhost:3000/api|g' frontend/.env
    else
        sed -i 's|VITE_API_URL=/api|VITE_API_URL=http://localhost:3000/api|g' frontend/.env
    fi
fi

# Stop and remove existing database container if it exists
echo -e "${YELLOW}🛑 Resetting existing database container...${NC}"
podman stop meals-postgres >/dev/null 2>&1 || true
podman rm meals-postgres >/dev/null 2>&1 || true

# Start PostgreSQL database container using podman-compose
echo -e "${GREEN}🗄️  Starting PostgreSQL database container...${NC}"
podman-compose -f podman-compose.yml up postgres -d >/dev/null 2>&1

# Wait for database to be healthy
echo -e "${YELLOW}⏳ Waiting for database to be healthy...${NC}"
for i in {1..30}; do
    if podman exec meals-postgres pg_isready -U mealplanner -d meal_planner &>/dev/null; then
        echo -e "${GREEN}✓ Database is healthy${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Database failed to become healthy${NC}"
        podman logs meals-postgres
        exit 1
    fi
    sleep 1
done

# Check if backend dependencies are installed
if [ ! -d "./backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "./frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
fi

# Run database migrations
echo -e "${GREEN}🔄 Running database migrations...${NC}"
cd backend && npx prisma migrate deploy && cd ..

echo ""
echo -e "${GREEN}✅ Database container is running!${NC}"
echo ""

# Start backend in background
echo -e "${BLUE}🔧 Starting backend server...${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend failed to start${NC}"
        echo -e "${YELLOW}Backend logs:${NC}"
        tail -20 backend.log
        exit 1
    fi
    sleep 1
done

# Start frontend in background
echo -e "${BLUE}🌐 Starting frontend server...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
echo -e "${YELLOW}⏳ Waiting for frontend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is healthy${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Frontend failed to start${NC}"
        echo -e "${YELLOW}Frontend logs:${NC}"
        tail -20 frontend.log
        exit 1
    fi
    sleep 1
done

echo ""
echo -e "${GREEN}✅ All services are running!${NC}"
echo ""

# open_browser <url>
# Resolves $BROWSER_OVERRIDE (shorthand or full path) against the current OS,
# then falls back to the OS default opener.
open_browser() {
    local url="$1"

    # Map shorthand names to per-OS app names / binaries
    resolve_browser_mac() {
        case "${BROWSER_OVERRIDE,,}" in
            chrome|"google chrome")  echo "Google Chrome" ;;
            chromium)                echo "Chromium" ;;
            firefox)                 echo "Firefox" ;;
            brave|"brave browser")   echo "Brave Browser" ;;
            edge|"microsoft edge")   echo "Microsoft Edge" ;;
            safari)                  echo "Safari" ;;
            "")                      echo "" ;;    # no override → use default open
            *)                       echo "$BROWSER_OVERRIDE" ;;  # treat as app name
        esac
    }

    resolve_browser_linux() {
        case "${BROWSER_OVERRIDE,,}" in
            chrome)    echo "google-chrome google-chrome-stable chromium chromium-browser" ;;
            chromium)  echo "chromium chromium-browser" ;;
            firefox)   echo "firefox" ;;
            brave)     echo "brave-browser brave" ;;
            edge)      echo "microsoft-edge microsoft-edge-stable" ;;
            "")        echo "" ;;
            *)         echo "$BROWSER_OVERRIDE" ;;
        esac
    }

    resolve_browser_win() {
        case "${BROWSER_OVERRIDE,,}" in
            chrome)    echo "chrome.exe" ;;
            chromium)  echo "chromium.exe" ;;
            firefox)   echo "firefox.exe" ;;
            brave)     echo "brave.exe" ;;
            edge)      echo "msedge.exe" ;;
            "")        echo "" ;;
            *)         echo "$BROWSER_OVERRIDE" ;;
        esac
    }

    case "$OS" in
        mac)
            local app
            app=$(resolve_browser_mac)
            if [ -n "$app" ]; then
                open -a "$app" "$url" 2>/dev/null && return
                echo -e "${YELLOW}⚠️  Browser '$app' not found, falling back to system default${NC}"
            fi
            open "$url" 2>/dev/null || true
            ;;
        linux)
            local candidates
            candidates=$(resolve_browser_linux)
            if [ -n "$candidates" ]; then
                for bin in $candidates; do
                    if command -v "$bin" &>/dev/null; then
                        "$bin" "$url" &>/dev/null & return
                    fi
                done
                echo -e "${YELLOW}⚠️  Browser '${BROWSER_OVERRIDE}' not found, falling back to xdg-open${NC}"
            fi
            command -v xdg-open &>/dev/null && xdg-open "$url" &>/dev/null & || true
            ;;
        wsl)
            local win_bin
            win_bin=$(resolve_browser_win)
            if [ -n "$win_bin" ]; then
                cmd.exe /c start "$win_bin" "$url" &>/dev/null 2>&1 && return
                echo -e "${YELLOW}⚠️  Browser '${BROWSER_OVERRIDE}' not found, falling back to wslview${NC}"
            fi
            if command -v wslview &>/dev/null; then
                wslview "$url" &>/dev/null &
            else
                explorer.exe "$url" &>/dev/null & || true
            fi
            ;;
        windows)
            local win_bin
            win_bin=$(resolve_browser_win)
            if [ -n "$win_bin" ]; then
                start "$win_bin" "$url" 2>/dev/null && return
                echo -e "${YELLOW}⚠️  Browser '${BROWSER_OVERRIDE}' not found, falling back to start${NC}"
            fi
            start "$url" 2>/dev/null || true
            ;;
    esac
}

if [ "$OPEN_BROWSER" = true ]; then
    local_label=""
    [ -n "$BROWSER_OVERRIDE" ] && local_label=" ($BROWSER_OVERRIDE)"
    echo -e "${BLUE}🌐 Opening application in browser${local_label}...${NC}"
    open_browser "http://localhost:5173"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Call check-deployment-mode.sh as the source of truth
if [ -f "./scripts/check-deployment-mode.sh" ]; then
    bash ./scripts/check-deployment-mode.sh
else
    # Fallback if script doesn't exist
    echo -e "${BLUE}📱 Access your application at:${NC}"
    echo -e "   ${GREEN}👉 http://localhost:5173${NC}"
    echo ""
    echo -e "${BLUE}🔧 Backend API:${NC} http://localhost:3000/api"
    echo -e "${BLUE}❤️  Health Check:${NC} http://localhost:3000/health"
    echo ""
    if [ -n "$CALLED_FROM_MENU" ]; then
        echo -e "${BLUE}🛑 To stop:${NC} Use menu option 3 (Stop all services)"
    else
        echo -e "${BLUE}🛑 To stop:${NC} Press Ctrl+C or run ./scripts/local-stop.sh"
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}📝 Test Credentials:${NC}"
echo -e "   Email: ${GREEN}test@example.com${NC}"
echo -e "   Password: ${GREEN}TestPass123!${NC}"
echo ""
echo -e "${BLUE}📝 Useful commands:${NC}"
echo -e "   View backend logs:  ${GREEN}tail -f backend.log${NC}"
echo -e "   View frontend logs: ${GREEN}tail -f frontend.log${NC}"
echo -e "   View DB logs:       ${GREEN}podman logs -f meals-postgres${NC}"
echo ""
if [ -n "$CALLED_FROM_MENU" ]; then
    echo -e "${YELLOW}Use menu option 3 to stop all services${NC}"
    echo ""
    trap - EXIT INT TERM
    echo -e "${GREEN}✅ Services started and detached successfully${NC}"
    echo -e "${BLUE}Returning to menu...${NC}"
    sleep 2
else
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    echo ""
    # Keep script running and show logs when called directly
    tail -f backend.log frontend.log
fi

# Made with Bob