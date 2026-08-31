#!/bin/bash
# Install Glances monitoring on Pi 4B and optionally Zero W cluster nodes
# Usage: ./scripts/install-glances.sh [--clusterhat]
#
# Without --clusterhat: installs only on Pi 4B, accessible at /monitoring
# With --clusterhat:    also installs on each reachable Zero W node

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

CLUSTERHAT=false
ZERO_USER="pi"
ZEROS=(p1 p2 p3 p4)
GLANCES_PORT=61208
PI4B_IP="192.168.4.110"
ZERO_IPS=(172.19.181.1 172.19.181.2 172.19.181.3 172.19.181.4)

for arg in "$@"; do
    case $arg in
        --clusterhat) CLUSTERHAT=true ;;
        --zero-user=*) ZERO_USER="${arg#*=}" ;;
    esac
done

section "Install Glances" "🩺"

# ---------------------------------------------------------------------------
# Pi 4B
# ---------------------------------------------------------------------------

steps_init 4

step "Installing Glances package"
if command -v glances &>/dev/null; then
    echo -e "  ${BLUE}ℹ️  already installed: $(glances --version 2>&1 | head -1)${NC}"
else
    start_spinner "Installing glances via apt"
    sudo apt install glances -y &>/dev/null
    stop_spinner ok
fi

GLANCES_BIN=$(command -v glances)
CURRENT_USER=$(whoami)

step "Writing systemd unit"
sudo tee /etc/systemd/system/glances.service > /dev/null << EOF
[Unit]
Description=Glances monitoring
After=network.target

[Service]
ExecStart=${GLANCES_BIN} -w --bind 127.0.0.1 --port ${GLANCES_PORT} --url-prefix /monitoring --disable-plugin docker
Restart=on-failure
User=${CURRENT_USER}

[Install]
WantedBy=multi-user.target
EOF
echo -e "  ${GREEN}✓${NC}  /etc/systemd/system/glances.service written"

step "Enabling service"
sudo systemctl daemon-reload
sudo systemctl enable glances -q
echo -e "  ${GREEN}✓${NC}  glances enabled at boot"

step "Starting service"
sudo systemctl restart glances
echo -e "  ${GREEN}✓${NC}  Pi 4B — http://${PI4B_IP}/monitoring"

if [ "$CLUSTERHAT" = false ]; then
    section "Summary" "🍽️"
    echo -e "${BLUE}Monitoring dashboard:${NC}"
    echo -e "  ${GREEN}http://${PI4B_IP}/monitoring${NC}"
    echo ""
    exit 0
fi

# ---------------------------------------------------------------------------
# Zero W nodes
# ---------------------------------------------------------------------------

section "Installing on Zero W Nodes" "🌐"

for i in "${!ZEROS[@]}"; do
    zero="${ZEROS[$i]}"
    ip="${ZERO_IPS[$i]}"
    echo ""
    echo -e "${YELLOW}→ ${zero} (${ip})...${NC}"

    if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "${ZERO_USER}@${zero}" true 2>/dev/null; then
        echo -e "  ${RED}✗ ${zero}: unreachable — skipping${NC}"
        continue
    fi

    start_spinner "Installing glances on ${zero}"
    if ssh "${ZERO_USER}@${zero}" bash << 'ENDSSH'
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
        stop_spinner ok
        echo -e "  ${GREEN}✓${NC}  ${zero} — browse via Pi 4B Connections menu"
    else
        stop_spinner fail
        echo -e "  ${RED}✗ ${zero}: install failed${NC}"
    fi
done

section "Summary" "🍽️"
echo -e "${BLUE}Monitoring dashboard:${NC}"
echo -e "  ${GREEN}http://${PI4B_IP}/monitoring${NC}"
echo -e "  ${YELLOW}Browse Zero W nodes via the Connections menu in the dashboard${NC}"
echo ""
