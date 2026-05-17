#!/bin/bash
# Full system backup for Pi cluster
# Run on Pi 4B. Captures: database, secrets, data, nginx config, Pi 4B system
# config, and Zero W systemd units. Output: a single .tar.gz bundle.
#
# Usage: ./scripts/backup-full.sh [output-dir]
# Default output dir: ./data/backups/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

APP_DIR="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BUNDLE_NAME="mealplanner-full-${TIMESTAMP}"
STAGING="/tmp/${BUNDLE_NAME}"
OUTPUT_DIR="${1:-${APP_DIR}/data/backups}"
BUNDLE="${OUTPUT_DIR}/${BUNDLE_NAME}.tar.gz"

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-meals-postgres}"
POSTGRES_DB="${POSTGRES_DB:-meal_planner}"
POSTGRES_USER="${POSTGRES_USER:-mealplanner}"
ZEROS=(p1 p2 p3 p4)

log()  { echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] $1${NC}"; }
err()  { echo -e "${RED}[$(date '+%H:%M:%S')] ERROR: $1${NC}"; exit 1; }

section "Meal Planner Full Backup" "💾"
echo "Timestamp: $(date)"
echo "Bundle:    ${BUNDLE}"
echo ""

mkdir -p "${STAGING}" "${OUTPUT_DIR}"
trap 'rm -rf "${STAGING}"' EXIT

# 1. Database
start_spinner "Backing up PostgreSQL..."
podman ps | grep -q "${POSTGRES_CONTAINER}" \
    || { stop_spinner fail; err "PostgreSQL container '${POSTGRES_CONTAINER}' is not running"; }
podman exec "${POSTGRES_CONTAINER}" pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" \
    | gzip > "${STAGING}/database.sql.gz"
stop_spinner ok

# 2. Secrets
log "Backing up secrets/..."
if [ -d "${APP_DIR}/secrets" ]; then
    cp -r "${APP_DIR}/secrets" "${STAGING}/secrets"
    warn "  Secrets included — keep this archive secure and off public storage"
else
    warn "  secrets/ not found — skipping"
fi

# 3. User data
start_spinner "Backing up data/images and data/uploads..."
mkdir -p "${STAGING}/data"
[ -d "${APP_DIR}/data/images" ]  && cp -r "${APP_DIR}/data/images"  "${STAGING}/data/images"
[ -d "${APP_DIR}/data/uploads" ] && cp -r "${APP_DIR}/data/uploads" "${STAGING}/data/uploads"
stop_spinner ok

# 4. Nginx config
log "Backing up nginx config..."
mkdir -p "${STAGING}/nginx"
[ -f "${APP_DIR}/nginx/default.conf" ] \
    && cp "${APP_DIR}/nginx/default.conf" "${STAGING}/nginx/default.conf"
log "✓ Nginx config backed up"

# 5. Pi 4B system config
log "Backing up Pi 4B system config..."
mkdir -p "${STAGING}/pi4b"
[ -f "/boot/firmware/config.txt" ] \
    && sudo cp "/boot/firmware/config.txt" "${STAGING}/pi4b/config.txt"
grep -E '\bp[1-4]\b' /etc/hosts > "${STAGING}/pi4b/hosts-zeros" 2>/dev/null || true
log "✓ Pi 4B system config backed up"

# 6. Zero W systemd units
log "Backing up Zero W systemd units..."
mkdir -p "${STAGING}/zeros"
for zero in "${ZEROS[@]}"; do
    if ssh -o ConnectTimeout=5 pi@"$zero" true 2>/dev/null; then
        unit=$(ssh pi@"$zero" "cat /etc/systemd/system/mealplanner-backend.service 2>/dev/null || true")
        if [ -n "$unit" ]; then
            echo "$unit" > "${STAGING}/zeros/${zero}-mealplanner-backend.service"
            log "  ✓ ${zero} service unit saved"
        else
            warn "  ${zero}: no mealplanner-backend.service found"
        fi
    else
        warn "  ${zero}: unreachable — skipping"
    fi
done

# 7. Bundle
start_spinner "Creating archive..."
tar -czf "${BUNDLE}" -C /tmp "${BUNDLE_NAME}"
BUNDLE_SIZE=$(du -h "${BUNDLE}" | cut -f1)
stop_spinner ok

# Also extract a standalone SQL dump for easy access
SQL_COPY="${OUTPUT_DIR}/database_${TIMESTAMP}.sql.gz"
tar -xOzf "${BUNDLE}" "${BUNDLE_NAME}/database.sql.gz" > "${SQL_COPY}"

section "Backup Complete" "✅"
echo "Bundle:   ${BUNDLE} (${BUNDLE_SIZE})"
echo "SQL dump: ${SQL_COPY}"
echo ""
echo -e "${YELLOW}Keep this archive secure — it contains secrets.${NC}"
