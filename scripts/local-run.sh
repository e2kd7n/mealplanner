#!/bin/bash

# Run the Meal Planner application locally for development
# Starts only the database in a container; backend and frontend run natively with hot reload.
# ⚠️  FOR LOCAL DEVELOPMENT ONLY - Use pi-run.sh on Raspberry Pi

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

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

# Kill any stale backend/frontend processes from a previous run.
# On WSL with a Windows-side project, node runs as a native Windows process,
# so use netstat.exe + taskkill.exe to find and stop it.
kill_port() {
    local port=$1
    # Linux/WSL processes
    local pids
    pids=$(ss -tlnp 2>/dev/null | awk -v p=":$port" '$4 ~ p {match($NF, /pid=([0-9]+)/, a); if (a[1]) print a[1]}')
    [ -n "$pids" ] && kill $pids 2>/dev/null || true
    # Windows native processes (node.exe when project lives on NTFS)
    local win_pid
    win_pid=$(netstat.exe -ano 2>/dev/null | tr -d '\r' | awk -v p=":${port}" '$2 ~ p && $4 == "LISTENING" {print $NF; exit}')
    if [ -n "$win_pid" ] && [[ "$win_pid" =~ ^[0-9]+$ ]]; then
        taskkill.exe /F /PID "$win_pid" >/dev/null 2>&1 || true
    fi
}
kill_port 3000
kill_port 5173

# Stop and remove existing database container if it exists
echo -e "${YELLOW}🛑 Resetting existing database container...${NC}"
podman stop meals-postgres >/dev/null 2>&1 || true
podman rm meals-postgres >/dev/null 2>&1 || true
# Kill any orphaned rootlessport process still holding port 5432
if ss -tlnp 2>/dev/null | grep -q ':5432'; then
    pkill -f 'rootlessport' 2>/dev/null || true
    sleep 1
fi

section "Database" "🗄️"

echo -e "${GREEN}  Starting PostgreSQL database container...${NC}"
POSTGRES_PASSWORD=$(head -1 ./secrets/postgres_password.txt | tr -d '\r\n')
if ! podman run -d \
    --name meals-postgres \
    -e POSTGRES_DB=meal_planner \
    -e POSTGRES_USER=mealplanner \
    -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    -e PGDATA=/var/lib/postgresql/data/pgdata \
    -p 5432:5432 \
    -v meals-postgres-data:/var/lib/postgresql/data \
    -v "$(pwd)/database/init:/docker-entrypoint-initdb.d:ro" \
    docker.io/library/postgres:16-alpine >/dev/null 2>&1; then
    echo -e "${RED}❌ Failed to start PostgreSQL container${NC}"
    podman logs meals-postgres 2>/dev/null || true
    exit 1
fi

if ! wait_for "Waiting for database" 60 2 \
        podman exec meals-postgres pg_isready -U mealplanner -d meal_planner; then
    echo -e "${RED}❌ Database failed to become healthy${NC}"
    podman logs meals-postgres
    exit 1
fi

section "Dependencies & Migrations" "📦"

if [ ! -d "./backend/node_modules" ]; then
    start_spinner "Installing backend dependencies (first run)"
    if (cd backend && npm install) > /tmp/npm-backend-install.log 2>&1; then
        stop_spinner ok
    else
        stop_spinner fail
        cat /tmp/npm-backend-install.log
        exit 1
    fi
fi

if [ ! -d "./frontend/node_modules" ]; then
    start_spinner "Installing frontend dependencies (first run)"
    if (cd frontend && npm install) > /tmp/npm-frontend-install.log 2>&1; then
        stop_spinner ok
    else
        stop_spinner fail
        cat /tmp/npm-frontend-install.log
        exit 1
    fi
fi

start_spinner "Running database migrations"
if (cd backend && npx prisma migrate deploy) > /tmp/prisma-migrate.log 2>&1; then
    stop_spinner ok
else
    stop_spinner fail
    cat /tmp/prisma-migrate.log
    exit 1
fi

section "Services" "🚀"

echo -e "  ${CYAN}▸${NC} Starting backend server..."
(cd backend && npm run dev > ../backend.log 2>&1) &
BACKEND_PID=$!

# check_port <port> — returns 0 when something is LISTENING on the port.
# In WSL, node/npm run as Windows processes and aren't visible to WSL's network
# stack, so we use netstat.exe (always available on Windows) for the check.
check_port() {
    local port=$1
    if [[ "$OS" == "wsl" ]]; then
        netstat.exe -ano 2>/dev/null | tr -d '\r' | grep -qE ":${port}[[:space:]].*LISTENING"
    else
        curl -s --max-time 1 "http://localhost:${port}" > /dev/null 2>&1
    fi
}

start_spinner "Waiting for backend"
waited=0
while [[ $waited -lt 30 ]]; do
    if check_port 3000; then
        stop_spinner ok
        break
    fi
    if [[ $waited -ge 28 ]]; then
        stop_spinner fail
        echo -e "${YELLOW}Backend logs:${NC}"
        tail -20 backend.log
        exit 1
    fi
    sleep 1
    waited=$(( waited + 1 ))
done

echo -e "  ${CYAN}▸${NC} Starting frontend server..."
(cd frontend && npm run dev > ../frontend.log 2>&1) &
FRONTEND_PID=$!

start_spinner "Waiting for frontend"
waited=0
while [[ $waited -lt 30 ]]; do
    if check_port 5173; then
        stop_spinner ok
        break
    fi
    if [[ $waited -ge 28 ]]; then
        stop_spinner fail
        echo -e "${YELLOW}Frontend logs:${NC}"
        tail -20 frontend.log
        exit 1
    fi
    sleep 1
    waited=$(( waited + 1 ))
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
            if command -v xdg-open &>/dev/null; then xdg-open "$url" &>/dev/null & fi || true
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
                explorer.exe "$url" &>/dev/null || true
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
    bash ./scripts/check-deployment-mode.sh || true
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
