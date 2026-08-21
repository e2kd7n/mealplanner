#!/bin/bash

# Stop Local Development Environment
# Gracefully shuts down all services
# ⚠️  FOR LOCAL DEVELOPMENT ONLY - Use pi-stop.sh on Raspberry Pi

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

OS=$(detect_os)

if [ "$OS" = "pi" ]; then
    echo -e "  ${RED}❌ ERROR: This is a LOCAL DEVELOPMENT script!${NC}"
    echo ""
    echo -e "  ${YELLOW}For Raspberry Pi, use: ./scripts/pi-stop.sh${NC}"
    echo ""
    exit 1
fi

section "Stopping Local Dev Environment" "🛑"

section "Database" "🗄️"
if podman inspect meals-postgres &>/dev/null; then
    start_spinner "Stopping database container"
    podman stop meals-postgres &>/dev/null || true
    podman rm meals-postgres &>/dev/null || true
    stop_spinner ok
else
    echo -e "  ${DIM}·  No database container running${NC}"
fi

section "Processes" "🛑"
kill_matching() {
    local label="$1" pattern="$2"
    if pkill -f "$pattern" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC}  ${label} stopped"
    else
        echo -e "  ${DIM}·  No ${label} processes found${NC}"
    fi
}
kill_matching "npm dev" "npm run dev"
kill_matching "vite" "vite"
kill_matching "nodemon" "nodemon"
kill_matching "ts-node/tsx" "ts-node\|tsx"

section "Cleanup" "🧹"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
for log in backend.log frontend.log; do
    if [ -f "$ROOT_DIR/$log" ]; then
        rm -f "$ROOT_DIR/$log"
        echo -e "  ${GREEN}✓${NC}  ${log} removed"
    else
        echo -e "  ${DIM}·  ${log} not present${NC}"
    fi
done

section "Summary" "🍽️"
echo -e "  ${GREEN}✓${NC}  All services stopped successfully!"
