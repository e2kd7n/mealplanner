#!/bin/bash
# Database Backup Script - P1 Issue #164
# Automated PostgreSQL backup with retention policy

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

_notify_exit() {
    local code=$?
    if [ "$code" -eq 0 ]; then
        bash "$SCRIPT_DIR/send-notification.sh" default "DB Backup Complete" \
            "Backup: ${BACKUP_FILE} (${BACKUP_SIZE})" "white_check_mark,floppy_disk" || true
    else
        bash "$SCRIPT_DIR/send-notification.sh" urgent "DB Backup Failed" \
            "Database backup failed — exit ${code} on $(hostname -s 2>/dev/null || echo Pi)" \
            "rotating_light,floppy_disk" || true
    fi
}
trap _notify_exit EXIT

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./data/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-meals-postgres}"
POSTGRES_DB="${POSTGRES_DB:-meal_planner}"
POSTGRES_USER="${POSTGRES_USER:-mealplanner}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

section "Database Backup Script" "💾"
echo "Timestamp: $(date)"
echo "Database: ${POSTGRES_DB}"
echo "Backup Directory: ${BACKUP_DIR}"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Check if container is running
if ! podman ps | grep -q "${POSTGRES_CONTAINER}"; then
    echo -e "${RED}Error: PostgreSQL container '${POSTGRES_CONTAINER}' is not running${NC}"
    exit 1
fi

# Perform backup
start_spinner "Creating backup..."
if podman exec "${POSTGRES_CONTAINER}" pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"; then
    stop_spinner ok
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    echo -e "  ${GREEN}✓ Backup created: ${BACKUP_FILE} (${BACKUP_SIZE})${NC}"
else
    stop_spinner fail
    echo -e "${RED}✗ Backup failed${NC}"
    exit 1
fi

# Verify backup
start_spinner "Verifying backup integrity..."
if gunzip -t "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null; then
    stop_spinner ok
else
    stop_spinner fail
    echo -e "${RED}✗ Backup file is corrupted${NC}"
    exit 1
fi

# Clean up old backups (retention policy)
start_spinner "Applying retention policy (${RETENTION_DAYS} days)..."
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l)
stop_spinner ok
if [ "${DELETED_COUNT}" -gt 0 ]; then
    echo -e "  ${GREEN}✓ Deleted ${DELETED_COUNT} old backup(s)${NC}"
else
    echo -e "  ${GREEN}✓ No old backups to delete${NC}"
fi

# List recent backups
echo ""
echo -e "${GREEN}Recent backups:${NC}"
ls -lh "${BACKUP_DIR}" | grep "backup_" | tail -5

# Summary
section "Backup Complete" "✅"
echo "Backup file: ${BACKUP_FILE}"
echo "Location: ${BACKUP_DIR}/${BACKUP_FILE}"
echo "Size: ${BACKUP_SIZE}"
echo "Retention: ${RETENTION_DAYS} days"

exit 0

