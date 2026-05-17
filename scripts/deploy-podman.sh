#!/bin/bash

# Container-mode deployment for local development machines
# Starts all services via podman-compose using the dev compose file (port 8080)
# ⚠️  FOR LOCAL DEV MACHINES ONLY - Use pi-run.sh on Raspberry Pi

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
ARCH=$(uname -m)   # x86_64, aarch64, arm64, etc.

if [ "$OS" = "pi" ]; then
    echo -e "${RED}❌ This is a LOCAL DEV script. On Raspberry Pi use: ./scripts/pi-run.sh${NC}"
    exit 1
fi

echo -e "${BLUE}🖥️  Platform: $OS ($ARCH)${NC}"
echo "🚀 Starting Meal Planner in container mode (port 8080)..."

# ── Prerequisites ────────────────────────────────────────────────────────────

if ! command -v podman &> /dev/null; then
    echo -e "${RED}❌ Podman is not installed.${NC}"
    case "$OS" in
        mac)     echo "  Install with: brew install podman" ;;
        linux|wsl) echo "  Install with: sudo apt-get install -y podman" ;;
        windows) echo "  Install from: https://podman.io/getting-started/installation" ;;
    esac
    exit 1
fi

if ! command -v podman-compose &> /dev/null; then
    echo -e "${YELLOW}⚠️  podman-compose not found. Installing...${NC}"
    pip3 install podman-compose
fi

# On macOS/Windows the Podman VM must be running
if [[ "$OS" == "mac" || "$OS" == "windows" ]]; then
    if ! podman machine list 2>/dev/null | grep -q "Currently running"; then
        echo -e "${YELLOW}⚠️  Podman machine not running. Starting...${NC}"
        podman machine start
    fi
fi

# ── Secrets ──────────────────────────────────────────────────────────────────

if [ ! -f "./secrets/postgres_password.txt" ]; then
    echo -e "${YELLOW}⚠️  Secrets not found. Generating...${NC}"
    ./scripts/generate-secrets.sh
fi

# ── Disk space check ─────────────────────────────────────────────────────────

DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
echo -e "${BLUE}💾 Disk usage: ${DISK_USAGE}%${NC}"

if [ "$DISK_USAGE" -gt 90 ]; then
    echo -e "${RED}❌ Disk usage critically high (${DISK_USAGE}%). Run cleanup first:${NC}"
    echo -e "   ${GREEN}./scripts/cleanup-dev-machine.sh${NC}"
    exit 1
elif [ "$DISK_USAGE" -gt 80 ]; then
    echo -e "${YELLOW}⚠️  Disk usage high (${DISK_USAGE}%)${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]] || exit 1
fi

# ── Tear down existing containers ─────────────────────────────────────────────

echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
podman-compose -f podman-compose.yml down 2>/dev/null || true
podman rm -f meals-postgres meals-backend meals-frontend meals-nginx 2>/dev/null || true
podman container prune -f 2>/dev/null || true

# ── Start all services via dev compose ───────────────────────────────────────

echo -e "${GREEN}🚀 Starting services (podman-compose.yml)...${NC}"
podman-compose -f podman-compose.yml up -d

section "Waiting for Services" "⏲️"

if ! wait_for "PostgreSQL starting up" 60 2 \
        podman exec meals-postgres pg_isready -U mealplanner -d meal_planner; then
    echo -e "${RED}❌ PostgreSQL failed to start within 60s${NC}"
    podman logs meals-postgres
    exit 1
fi

if ! wait_for "Backend starting up" 90 3 \
        curl -sf http://localhost:3000/health; then
    echo -e "${RED}❌ Backend failed to start within 90s${NC}"
    podman logs meals-backend --tail=50
    exit 1
fi

# ── Run migrations ────────────────────────────────────────────────────────────

echo -e "${GREEN}🔄 Running database migrations...${NC}"
if ! podman exec meals-backend sh -c "cd /app && npx prisma migrate deploy"; then
    echo -e "${RED}❌ Migration failed${NC}"
    podman logs meals-backend --tail=100
    exit 1
fi

# ── Status ────────────────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}📊 Container status:${NC}"
podman ps --filter "name=meals-"

FAILED=$(podman ps -a --filter "name=meals-" --format "{{.Names}} {{.Status}}" | grep -v "Up" || true)
if [ -n "$FAILED" ]; then
    echo -e "${RED}❌ Some containers failed:${NC}"
    echo "$FAILED"
    for c in meals-postgres meals-backend meals-frontend meals-nginx; do
        podman ps -a --format "{{.Names}}" | grep -q "^${c}$" || continue
        echo -e "${YELLOW}=== $c ===${NC}"
        podman logs "$c" 2>&1 | tail -20
    done
    exit 1
fi

# ── Open browser ──────────────────────────────────────────────────────────────

case "$OS" in
    mac)     open "http://localhost:8080" 2>/dev/null || true ;;
    linux)
        if command -v xdg-open &>/dev/null; then
            xdg-open "http://localhost:8080" &>/dev/null &
        fi
        ;;
    wsl)
        if command -v wslview &>/dev/null; then
            wslview "http://localhost:8080" &>/dev/null &
        elif command -v explorer.exe &>/dev/null; then
            explorer.exe "http://localhost:8080" &>/dev/null &
        fi
        ;;
    windows)
        start "http://localhost:8080" 2>/dev/null || true ;;
esac

# ── Summary ───────────────────────────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ -f "./scripts/check-deployment-mode.sh" ]; then
    bash ./scripts/check-deployment-mode.sh
else
    echo -e "${GREEN}🌐 Application: http://localhost:8080${NC}"
    echo -e "${BLUE}🔌 API:         http://localhost:8080/api${NC}"
    echo -e "${BLUE}❤️  Health:      http://localhost:8080/health${NC}"
fi

echo ""
echo -e "${BLUE}📝 Useful commands:${NC}"
echo -e "   Logs:    ${GREEN}podman-compose -f podman-compose.yml logs -f${NC}"
echo -e "   Stop:    ${GREEN}./scripts/local-stop.sh${NC}"
echo -e "   Cleanup: ${GREEN}./scripts/cleanup-dev-machine.sh${NC}"
echo ""

UNUSED=$(podman images -f "dangling=true" -q | wc -l)
[ "$UNUSED" -gt 0 ] && echo -e "${YELLOW}⚠️  ${UNUSED} dangling images found — run cleanup-dev-machine.sh${NC}"

# Made with Bob
