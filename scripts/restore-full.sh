#!/bin/bash
# Restore Meal Planner on a fresh Raspberry Pi OS install from a full backup bundle.
# Run on the Pi 4B after cloning the repo. The app directory is assumed to already exist.
#
# Usage: ./scripts/restore-full.sh /path/to/mealplanner-full-TIMESTAMP.tar.gz

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

BUNDLE="${1:-}"
APP_DIR="$(dirname "$SCRIPT_DIR")"

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-meals-postgres}"
POSTGRES_DB="${POSTGRES_DB:-meal_planner}"
POSTGRES_USER="${POSTGRES_USER:-mealplanner}"

log()    { echo -e "  ${GREEN}✓${NC}  $1"; }
warn()   { echo -e "  ${YELLOW}⚠️${NC}  $1"; }
err()    { echo -e "  ${RED}❌ $1${NC}"; exit 1; }
manual() { echo -e "  ${BLUE}[MANUAL]${NC} $1"; }

[ -n "$BUNDLE" ] || err "Usage: $0 /path/to/mealplanner-full-TIMESTAMP.tar.gz"
[ -f "$BUNDLE" ] || err "Bundle not found: $BUNDLE"

BUNDLE_SIZE=$(du -h "$BUNDLE" | cut -f1)

section "Full System Restore" "🗄️"
echo -e "${BLUE}  Bundle:${NC} ${BUNDLE} ${DIM}(${BUNDLE_SIZE})${NC}"
echo -e "${BLUE}  Target:${NC} ${APP_DIR}"

# Confirmation — destructive: overwrites secrets, data, nginx config, /etc/hosts.
# Default is abort on bare Enter.
echo ""
echo -e "  ${RED}⚠️  This will OVERWRITE on this machine:${NC}"
echo -e "  ${RED}     - secrets/ (JWT, Postgres, Redis secrets)${NC}"
echo -e "  ${RED}     - data/images, data/uploads${NC}"
echo -e "  ${RED}     - nginx/default.conf${NC}"
echo -e "  ${RED}     - the '${POSTGRES_DB}' database (dropped and recreated)${NC}"
echo -e "  ${RED}     - /etc/hosts Zero W entries and /boot/firmware/config.txt (if present in bundle)${NC}"
echo ""
read -p "  $(echo -e "${RED}Continue? (y/N):${NC}") " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "  ${YELLOW}Aborted — nothing changed.${NC}"
    exit 0
fi

# Extract bundle
STAGING=$(mktemp -d)
trap 'rm -rf "$STAGING"' EXIT
start_spinner "Extracting bundle"
tar -xzf "$BUNDLE" -C "$STAGING"
BUNDLE_DIR=$(find "$STAGING" -maxdepth 1 -type d -name 'mealplanner-full-*' | head -1)
if [ -d "$BUNDLE_DIR" ]; then
    stop_spinner ok
else
    stop_spinner fail
    err "Unexpected bundle structure — expected mealplanner-full-* directory inside archive"
fi

steps_init 11

# 1. System packages
section "System Packages" "📦"
step "Installing git, curl, podman, python3-pip"
sudo apt-get update -qq
sudo apt-get install -y -qq git curl podman python3-pip
log "System packages installed"

if ! node --version 2>/dev/null | grep -q 'v20'; then
    step "Installing Node.js 20"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - -q
    sudo apt-get install -y -qq nodejs
fi
log "Node.js $(node --version)"

if ! command -v pnpm &>/dev/null; then
    step "Installing pnpm"
    sudo npm install -g pnpm -q
fi
log "pnpm $(pnpm --version)"

if ! command -v podman-compose &>/dev/null; then
    step "Installing podman-compose"
    sudo pip3 install podman-compose --break-system-packages -q 2>/dev/null \
        || sudo pip3 install podman-compose -q
fi
log "podman-compose $(podman-compose --version)"

# 2-6. Restore config, secrets, and data from the bundle
section "Restoring System Config" "📦"

step "Restoring /boot/firmware/config.txt"
if [ -f "${BUNDLE_DIR}/pi4b/config.txt" ]; then
    sudo cp "/boot/firmware/config.txt" "/boot/firmware/config.txt.pre-restore"
    sudo cp "${BUNDLE_DIR}/pi4b/config.txt" "/boot/firmware/config.txt"
    log "config.txt restored ${DIM}(previous saved as config.txt.pre-restore)${NC}"
    warn "Reboot required for config.txt changes to take effect"
else
    echo -e "  ${DIM}(not present in bundle — skipping)${NC}"
fi

step "Restoring Zero W hostname entries in /etc/hosts"
if [ -f "${BUNDLE_DIR}/pi4b/hosts-zeros" ] && [ -s "${BUNDLE_DIR}/pi4b/hosts-zeros" ]; then
    sudo sed -i '/\bp[1-4]\b/d' /etc/hosts
    sudo tee -a /etc/hosts < "${BUNDLE_DIR}/pi4b/hosts-zeros" > /dev/null
    log "/etc/hosts updated"
else
    echo -e "  ${DIM}(not present in bundle — skipping)${NC}"
fi

step "Restoring nginx/default.conf"
if [ -f "${BUNDLE_DIR}/nginx/default.conf" ]; then
    mkdir -p "${APP_DIR}/nginx"
    cp "${BUNDLE_DIR}/nginx/default.conf" "${APP_DIR}/nginx/default.conf"
    log "Nginx config restored"
else
    echo -e "  ${DIM}(not present in bundle — skipping)${NC}"
fi

section "Restoring Secrets" "🔐"
step "Restoring secrets/"
if [ -d "${BUNDLE_DIR}/secrets" ]; then
    cp -r "${BUNDLE_DIR}/secrets" "${APP_DIR}/secrets"
    chmod 600 "${APP_DIR}/secrets/"*.txt 2>/dev/null || true
    log "Secrets restored"
else
    warn "No secrets in bundle — run ./scripts/generate-secrets.sh before starting services"
fi

step "Restoring data/images and data/uploads"
mkdir -p "${APP_DIR}/data/backups"
[ -d "${BUNDLE_DIR}/data/images" ]  && cp -r "${BUNDLE_DIR}/data/images"  "${APP_DIR}/data/images"
[ -d "${BUNDLE_DIR}/data/uploads" ] && cp -r "${BUNDLE_DIR}/data/uploads" "${APP_DIR}/data/uploads"
log "Data directories restored"

# 7. Backend npm install
section "Backend Dependencies" "📦"
step "Installing backend dependencies"
cd "${APP_DIR}/backend"
npm install -q
cd "$APP_DIR"
log "Backend dependencies installed"

# 8. Start Postgres + Redis
section "Starting Data Services" "🚀"
step "Starting PostgreSQL and Redis"
podman-compose -f podman-compose.pi.yml up -d postgres redis

wait_for "Waiting for PostgreSQL to be ready" 60 2 \
    podman exec "${POSTGRES_CONTAINER}" pg_isready -U "${POSTGRES_USER}" \
    || err "PostgreSQL did not become ready after 60s"
log "PostgreSQL ready"

# 9. Restore database
section "Database Restore" "🗄️"
step "Restoring database from bundle"
echo -e "  ${DIM}Dropping and recreating '${POSTGRES_DB}' for a clean slate...${NC}"
podman exec "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" postgres \
    -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};" \
    -c "CREATE DATABASE ${POSTGRES_DB};"
zcat "${BUNDLE_DIR}/database.sql.gz" \
    | podman exec -i "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" "${POSTGRES_DB}" -q
log "Database restored"

# 10. Run migrations (brings schema up to date if app version changed)
step "Applying Prisma migrations"
cd "${APP_DIR}/backend"
npx prisma migrate deploy
cd "$APP_DIR"
log "Migrations applied"

# 11. Start remaining services
section "Starting All Services" "🚀"
step "Starting all services"
podman-compose -f podman-compose.pi.yml up -d
log "All services started"

PI_IP=$(hostname -I | awk '{print $1}')

section "Summary" "🍽️"
echo -e "${BLUE}  App should be available at:${NC} ${GREEN}http://${PI_IP}/${NC}"
echo ""
echo -e "${YELLOW}Remaining manual steps:${NC}"
manual "1. Generate SSH key and copy to Zero Ws:"
manual "     ssh-keygen -t ed25519 && for n in p1 p2 p3 p4; do ssh-copy-id pi@\$n; done"
manual "2. Deploy backend to Zero Ws:"
manual "     ./scripts/pi-run.sh --clusterhat"
manual "3. Install Glances across the cluster:"
manual "     ./scripts/install-glances.sh"
if [ -f "${BUNDLE_DIR}/pi4b/config.txt" ]; then
    manual "4. Reboot to apply /boot/firmware/config.txt changes"
fi
echo ""
