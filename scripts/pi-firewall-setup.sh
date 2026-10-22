#!/bin/bash
#
# Install the Pi 4B host firewall (scripts/pi-firewall.nft) and a systemd
# unit that reloads it on boot. Run once on the Pi:
#
#   ./scripts/pi-firewall-setup.sh
#
# Lockout guard: the ruleset is applied with an automatic rollback 3 minutes
# later unless you confirm from a NEW SSH session that you can still log in:
#
#   sudo systemctl stop pi-firewall-rollback.timer

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

RULES_SRC="$SCRIPT_DIR/pi-firewall.nft"
RULES_DST="/etc/nftables.d/pi-hardening.nft"
SERVICE="pi-firewall"

section "Host Firewall" "🛡️"

start_spinner "Validating ruleset"
sudo nft -c -f "$RULES_SRC"
stop_spinner ok

start_spinner "Installing ${RULES_DST}"
sudo install -D -m 0644 "$RULES_SRC" "$RULES_DST"
stop_spinner ok

start_spinner "Installing ${SERVICE}.service"
sudo tee /etc/systemd/system/${SERVICE}.service > /dev/null << EOF
[Unit]
Description=Pi 4B host firewall (table inet pi_hardening)
After=nftables.service
Before=network-pre.target
Wants=network-pre.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/sbin/nft -f ${RULES_DST}
ExecStop=/usr/sbin/nft delete table inet pi_hardening

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
stop_spinner ok

start_spinner "Arming 3-minute rollback"
sudo systemd-run --quiet --unit=pi-firewall-rollback --on-active=180 \
    /usr/sbin/nft delete table inet pi_hardening
stop_spinner ok

start_spinner "Applying ruleset"
sudo systemctl enable --now -q ${SERVICE}.service
stop_spinner ok

echo ""
echo -e "  ${YELLOW}Rollback in 3 minutes unless cancelled.${NC} From a NEW SSH session, run:"
echo -e "    sudo systemctl stop pi-firewall-rollback.timer"
