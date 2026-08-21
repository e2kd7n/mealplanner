#!/bin/bash

# Bounce Local Development Environment
# Stops and restarts all services
# ⚠️  FOR LOCAL DEVELOPMENT ONLY - Use pi-bounce.sh on Raspberry Pi

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

# Detect if running on Raspberry Pi
if [ -f /proc/device-tree/model ]; then
    PI_MODEL=$(cat /proc/device-tree/model 2>/dev/null | tr -d '\0')
    if [[ "$PI_MODEL" == *"Raspberry Pi"* ]]; then
        echo -e "  ${RED}❌ ERROR: This is a LOCAL DEVELOPMENT script!${NC}"
        echo ""
        echo -e "  ${YELLOW}For Raspberry Pi, use: ./scripts/pi-bounce.sh${NC}"
        echo ""
        exit 1
    fi
fi

section "Bouncing Local Dev Environment" "🛑"

steps_init 2

step "Stopping services"
"$SCRIPT_DIR/local-stop.sh"

echo ""
start_spinner "Waiting before restart"
sleep 2
stop_spinner ok

step "Starting services"
"$SCRIPT_DIR/local-run.sh"
