#!/bin/bash
# Install Glances monitoring on Pi 4B and optionally Zero W cluster nodes
# Usage: ./scripts/install-glances.sh [--clusterhat]
#
# Without --clusterhat: installs only on Pi 4B, accessible at /monitoring
# With --clusterhat:    also installs on each reachable Zero W node

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CLUSTERHAT=false
ZEROS=(p1 p2 p3 p4)
GLANCES_PORT=61208
PI4B_IP="192.168.4.110"
ZERO_IPS=(172.19.181.1 172.19.181.2 172.19.181.3 172.19.181.4)

for arg in "$@"; do
    case $arg in
        --clusterhat) CLUSTERHAT=true ;;
    esac
done

log()  { echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] $1${NC}"; }
err()  { echo -e "${RED}[$(date '+%H:%M:%S')] $1${NC}"; }

echo -e "${BLUE}=== Install Glances on Pi Cluster ===${NC}"
echo ""

# ---------------------------------------------------------------------------
# Pi 4B
# ---------------------------------------------------------------------------

log "Installing on Pi 4B..."
if command -v glances &>/dev/null; then
    echo "  already installed: $(glances --version 2>&1 | head -1)"
else
    sudo apt install glances -y
fi

GLANCES_BIN=$(command -v glances)
CURRENT_USER=$(whoami)

sudo tee /etc/systemd/system/glances.service > /dev/null << EOF
[Unit]
Description=Glances monitoring
After=network.target

[Service]
ExecStart=${GLANCES_BIN} -w --port ${GLANCES_PORT} --url-prefix /monitoring --disable-plugin docker
Restart=on-failure
User=${CURRENT_USER}

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable glances -q
sudo systemctl restart glances
log "✓ Pi 4B — http://${PI4B_IP}:8080/monitoring"

if [ "$CLUSTERHAT" = false ]; then
    echo ""
    echo -e "${GREEN}=== Glances Install Complete ===${NC}"
    echo ""
    echo -e "${BLUE}Monitoring dashboard:${NC}"
    echo -e "  ${GREEN}http://${PI4B_IP}:8080/monitoring${NC}"
    echo ""
    exit 0
fi

# ---------------------------------------------------------------------------
# Zero W nodes
# ---------------------------------------------------------------------------

echo ""
log "Installing on Zero W nodes..."

for i in "${!ZEROS[@]}"; do
    zero="${ZEROS[$i]}"
    ip="${ZERO_IPS[$i]}"
    echo ""
    warn "→ ${zero} (${ip})..."

    if ! ssh -o ConnectTimeout=5 -o BatchMode=yes pi@"$zero" true 2>/dev/null; then
        err "  ✗ ${zero}: unreachable — skipping"
        continue
    fi

    if ssh pi@"$zero" bash << 'ENDSSH'
set -e
if ! command -v glances &>/dev/null; then
    sudo apt install glances -y
fi
GLANCES_BIN=$(command -v glances)
sudo tee /etc/systemd/system/glances.service > /dev/null << EOF
[Unit]
Description=Glances monitoring
After=network.target

[Service]
ExecStart=${GLANCES_BIN} -w --port 61208 --disable-plugin docker
Restart=on-failure
User=pi

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable glances -q
sudo systemctl restart glances
ENDSSH
    then
        log "  ✓ ${zero} — browse via Pi 4B Connections menu"
    else
        err "  ✗ ${zero}: install failed"
    fi
done

echo ""
echo -e "${GREEN}=== Glances Install Complete ===${NC}"
echo ""
echo -e "${BLUE}Monitoring dashboard:${NC}"
echo -e "  ${GREEN}http://${PI4B_IP}:8080/monitoring${NC}"
echo -e "  ${YELLOW}Browse Zero W nodes via the Connections menu in the dashboard${NC}"
echo ""

# Made with Bob
