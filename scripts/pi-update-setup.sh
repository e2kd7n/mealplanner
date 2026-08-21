#!/bin/bash
#
# Install the systemd service + timer for nightly auto-updates from GHCR.
# Run once on the Pi:
#
#   ./scripts/pi-update-setup.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_USER="$(whoami)"
SERVICE="mealplanner-update"

section "Auto-Update Timer" "🚀"
echo -e "  ${BLUE}App dir:${NC} ${APP_DIR}"
echo -e "  ${BLUE}Run as:${NC}  ${APP_USER}"
echo ""

start_spinner "Installing ${SERVICE}.service"
sudo tee /etc/systemd/system/${SERVICE}.service > /dev/null << EOF
[Unit]
Description=Meal Planner — Pull latest image from GHCR and redeploy
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
WorkingDirectory=${APP_DIR}
ExecStart=${APP_DIR}/scripts/pi-auto-update.sh
User=${APP_USER}
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mealplanner-update
EOF
stop_spinner ok

start_spinner "Installing ${SERVICE}.timer"
sudo tee /etc/systemd/system/${SERVICE}.timer > /dev/null << 'EOF'
[Unit]
Description=Meal Planner — Daily auto-update at 01:30

[Timer]
OnCalendar=*-*-* 01:30:00
Persistent=true

[Install]
WantedBy=timers.target
EOF
stop_spinner ok

start_spinner "Enabling ${SERVICE}.timer"
sudo systemctl daemon-reload
sudo systemctl enable --now ${SERVICE}.timer
stop_spinner ok

section "Summary" "🍽️"
echo -e "  ${GREEN}✓${NC}  Timer installed and enabled. Schedule:"
systemctl list-timers ${SERVICE}.timer --no-pager
echo ""
echo -e "  ${BLUE}Manual trigger (two options):${NC}"
echo -e "    sudo systemctl start ${SERVICE}.service"
echo -e "    ./scripts/pi-auto-update.sh --force"
