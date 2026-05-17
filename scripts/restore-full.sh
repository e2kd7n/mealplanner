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

log()    { echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"; }
warn()   { echo -e "${YELLOW}[$(date '+%H:%M:%S')] $1${NC}"; }
err()    { echo -e "${RED}[$(date '+%H:%M:%S')] ERROR: $1${NC}"; exit 1; }
manual() { echo -e "${BLUE}  [MANUAL] $1${NC}"; }

[ -n "$BUNDLE" ] || err "Usage: $0 /path/to/mealplanner-full-TIMESTAMP.tar.gz"
[ -f "$BUNDLE" ] || err "Bundle not found: $BUNDLE"

echo -e "${BLUE}=== Meal Planner Restore ===${NC}"
echo "Bundle: ${BUNDLE}"
echo "Target: ${APP_DIR}"
echo ""
warn "This will overwrite existing secrets, data, nginx config, and /etc/hosts entries."
read -p "Continue? (y/N): " -n 1 -r
echo ""
[[ $REPLY =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }

# Extract bundle
STAGING=$(mktemp -d)
trap 'rm -rf "$STAGING"' EXIT
tar -xzf "$BUNDLE" -C "$STAGING"
BUNDLE_DIR=$(find "$STAGING" -maxdepth 1 -type d -name 'mealplanner-full-*' | head -1)
[ -d "$BUNDLE_DIR" ] || err "Unexpected bundle structure — expected mealplanner-full-* directory inside archive"

# 1. System packages
log "Installing system packages..."
sudo apt-get update -qq
sudo apt-get install -y -qq git curl podman python3-pip
log "✓ System packages installed"

if ! node --version 2>/dev/null | grep -q 'v20'; then
    log "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - -q
    sudo apt-get install -y -qq nodejs
fi
log "✓ Node.js $(node --version)"

if ! command -v pnpm &>/dev/null; then
    sudo npm install -g pnpm -q
fi
log "✓ pnpm $(pnpm --version)"

if ! command -v podman-compose &>/dev/null; then
    sudo pip3 install podman-compose --break-system-packages -q 2>/dev/null \
        || sudo pip3 install podman-compose -q
fi
log "✓ podman-compose $(podman-compose --version)"

# 2. /boot/firmware/config.txt
if [ -f "${BUNDLE_DIR}/pi4b/config.txt" ]; then
    log "Restoring /boot/firmware/config.txt..."
    sudo cp "/boot/firmware/config.txt" "/boot/firmware/config.txt.pre-restore"
    sudo cp "${BUNDLE_DIR}/pi4b/config.txt" "/boot/firmware/config.txt"
    warn "  Reboot required for config.txt changes to take effect"
fi

# 3. /etc/hosts Zero W entries
if [ -f "${BUNDLE_DIR}/pi4b/hosts-zeros" ] && [ -s "${BUNDLE_DIR}/pi4b/hosts-zeros" ]; then
    log "Restoring Zero W hostname entries in /etc/hosts..."
    sudo sed -i '/\bp[1-4]\b/d' /etc/hosts
    sudo tee -a /etc/hosts < "${BUNDLE_DIR}/pi4b/hosts-zeros" > /dev/null
    log "✓ /etc/hosts updated"
fi

# 4. Nginx config
if [ -f "${BUNDLE_DIR}/nginx/default.conf" ]; then
    log "Restoring nginx/default.conf..."
    mkdir -p "${APP_DIR}/nginx"
    cp "${BUNDLE_DIR}/nginx/default.conf" "${APP_DIR}/nginx/default.conf"
    log "✓ Nginx config restored"
fi

# 5. Secrets
if [ -d "${BUNDLE_DIR}/secrets" ]; then
    log "Restoring secrets/..."
    cp -r "${BUNDLE_DIR}/secrets" "${APP_DIR}/secrets"
    chmod 600 "${APP_DIR}/secrets/"*.txt 2>/dev/null || true
    log "✓ Secrets restored"
else
    warn "No secrets in bundle — run ./scripts/generate-secrets.sh before starting services"
fi

# 6. Data directories
log "Restoring data directories..."
mkdir -p "${APP_DIR}/data/backups"
[ -d "${BUNDLE_DIR}/data/images" ]  && cp -r "${BUNDLE_DIR}/data/images"  "${APP_DIR}/data/images"
[ -d "${BUNDLE_DIR}/data/uploads" ] && cp -r "${BUNDLE_DIR}/data/uploads" "${APP_DIR}/data/uploads"
log "✓ Data directories restored"

# 7. Backend npm install
log "Installing backend dependencies..."
cd "${APP_DIR}/backend"
npm install -q
cd "$APP_DIR"
log "✓ Backend dependencies installed"

# 8. Start Postgres + Redis
log "Starting PostgreSQL and Redis..."
podman-compose -f podman-compose.pi.yml up -d postgres redis

log "Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
    podman exec "${POSTGRES_CONTAINER}" pg_isready -U "${POSTGRES_USER}" &>/dev/null && break
    sleep 2
done
podman exec "${POSTGRES_CONTAINER}" pg_isready -U "${POSTGRES_USER}" \
    || err "PostgreSQL did not become ready after 60s"
log "✓ PostgreSQL ready"

# 9. Restore database
log "Restoring database..."
# Drop and recreate to ensure a clean slate
podman exec "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" postgres \
    -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};" \
    -c "CREATE DATABASE ${POSTGRES_DB};"
zcat "${BUNDLE_DIR}/database.sql.gz" \
    | podman exec -i "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" "${POSTGRES_DB}" -q
log "✓ Database restored"

# 10. Run migrations (brings schema up to date if app version changed)
log "Applying Prisma migrations..."
cd "${APP_DIR}/backend"
npx prisma migrate deploy
cd "$APP_DIR"
log "✓ Migrations applied"

# 11. Start remaining services
log "Starting all services..."
podman-compose -f podman-compose.pi.yml up -d
log "✓ All services started"

PI_IP=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}=== Restore Complete ===${NC}"
echo -e "App should be available at: ${GREEN}http://${PI_IP}:8080${NC}"
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
