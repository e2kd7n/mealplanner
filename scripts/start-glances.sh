#!/bin/bash
# Start Glances monitoring on Pi 4B and optionally Zero W cluster nodes
# Usage: ./scripts/start-glances.sh [--clusterhat]

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CLUSTERHAT=false
ZEROS=(p1 p2 p3 p4)

for arg in "$@"; do
    case $arg in
        --clusterhat) CLUSTERHAT=true ;;
    esac
done

log()  { echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] $1${NC}"; }

if ! command -v glances &>/dev/null; then
    warn "Glances not installed — run ./scripts/install-glances.sh first"
    exit 0
fi

log "Starting Glances on Pi 4B..."
if systemctl is-active --quiet glances 2>/dev/null; then
    sudo systemctl restart glances
else
    sudo systemctl start glances
fi
log "✓ Pi 4B monitoring active"

if [ "$CLUSTERHAT" = true ]; then
    echo ""
    log "Starting Glances on Zero W nodes..."
    for zero in "${ZEROS[@]}"; do
        if ! ssh -o ConnectTimeout=5 -o BatchMode=yes pi@"$zero" true 2>/dev/null; then
            warn "  ${zero}: unreachable — skipping"
            continue
        fi
        if ssh -o BatchMode=yes pi@"$zero" \
                'sudo systemctl restart glances 2>/dev/null || sudo systemctl start glances' 2>/dev/null; then
            log "  ✓ ${zero}"
        else
            warn "  ${zero}: glances not installed — run ./scripts/install-glances.sh --clusterhat"
        fi
    done
fi

# Made with Bob
