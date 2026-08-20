#!/bin/bash
# Start Glances monitoring on Pi 4B and optionally Zero W cluster nodes
# Usage: ./scripts/start-glances.sh [--clusterhat]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

CLUSTERHAT=false
ZEROS=(p1 p2 p3 p4)

for arg in "$@"; do
    case $arg in
        --clusterhat) CLUSTERHAT=true ;;
    esac
done

section "Start Glances" "🩺"

if ! command -v glances &>/dev/null; then
    echo -e "  ${YELLOW}⚠️  Glances not installed — run ./scripts/install-glances.sh first${NC}"
    exit 0
fi

start_spinner "Starting Glances on Pi 4B"
if systemctl is-active --quiet glances 2>/dev/null; then
    sudo systemctl restart glances
else
    sudo systemctl start glances
fi
stop_spinner ok

if [ "$CLUSTERHAT" = true ]; then
    section "Starting on Zero W Nodes" "🌐"
    for zero in "${ZEROS[@]}"; do
        if ! ssh -o ConnectTimeout=5 -o BatchMode=yes pi@"$zero" true 2>/dev/null; then
            echo -e "  ${YELLOW}⚠️  ${zero}: unreachable — skipping${NC}"
            continue
        fi
        if ssh -o BatchMode=yes pi@"$zero" \
                'sudo systemctl restart glances 2>/dev/null || sudo systemctl start glances' 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC}  ${zero}"
        else
            echo -e "  ${YELLOW}⚠️  ${zero}: glances not installed — run ./scripts/install-glances.sh --clusterhat${NC}"
        fi
    done
fi
