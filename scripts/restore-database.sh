#!/bin/bash
# Database Restore Script - P1 Issue #164
# Restore PostgreSQL database from backup

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./data/backups}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-meals-postgres}"
POSTGRES_DB="${POSTGRES_DB:-meal_planner}"
POSTGRES_USER="${POSTGRES_USER:-mealplanner}"

section "Database Restore" "🗄️"
echo -e "${BLUE}  Timestamp: $(date)${NC}"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <backup_file>${NC}"
    echo ""
    echo -e "${BLUE}Available backups:${NC}"
    ls -lh "${BACKUP_DIR}" | grep "backup_" | tail -10
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "${BACKUP_DIR}/${BACKUP_FILE}" ] && [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}❌ Backup file not found${NC}"
    echo "Tried: ${BACKUP_DIR}/${BACKUP_FILE}"
    echo "Tried: ${BACKUP_FILE}"
    exit 1
fi

# Use full path if relative path provided
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
fi

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)

section "Pre-flight Check" "🔍"
echo -e "${BLUE}  Backup file:${NC} ${BACKUP_FILE} ${DIM}(${BACKUP_SIZE})${NC}"
echo -e "${BLUE}  Target database:${NC} ${POSTGRES_DB} ${DIM}(container: ${POSTGRES_CONTAINER})${NC}"

# Verify backup file
start_spinner "Verifying backup file integrity"
if gunzip -t "${BACKUP_FILE}" 2>/dev/null; then
    stop_spinner ok
else
    stop_spinner fail
    echo -e "${RED}❌ Backup file is corrupted${NC}"
    exit 1
fi

# Check if container is running
if ! podman ps | grep -q "${POSTGRES_CONTAINER}"; then
    echo -e "${RED}❌ PostgreSQL container '${POSTGRES_CONTAINER}' is not running${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC}  Container '${POSTGRES_CONTAINER}' is running"

CURRENT_TABLE_COUNT=$(podman exec "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t \
    -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "?")
echo -e "  ${BLUE}ℹ️${NC}  Current database has ${BOLD}${CURRENT_TABLE_COUNT}${NC} table(s) — this data will be replaced"

# Confirmation — destructive: replaces the live database. Default is abort.
echo ""
echo -e "  ${RED}⚠️  This will DROP and REPLACE the '${POSTGRES_DB}' database.${NC}"
echo -e "  ${RED}   Current data (${CURRENT_TABLE_COUNT} tables) will be overwritten with:${NC}"
echo -e "  ${RED}   ${BACKUP_FILE} (${BACKUP_SIZE})${NC}"
echo -e "  ${DIM}   A safety backup of the current database is taken first, so a restore${NC}"
echo -e "  ${DIM}   failure can roll back — but a successful restore cannot be undone.${NC}"
echo ""
read -p "  $(echo -e "${RED}Overwrite '${POSTGRES_DB}' now? (y/N):${NC}") " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "  ${YELLOW}Aborted — nothing changed.${NC}"
    exit 1
fi

# Create a safety backup before restore
section "Safety Backup" "🗄️"
SAFETY_BACKUP="safety_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
start_spinner "Backing up current database before restore"
if podman exec "${POSTGRES_CONTAINER}" pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "${BACKUP_DIR}/${SAFETY_BACKUP}"; then
    stop_spinner ok
    echo -e "  ${DIM}${BACKUP_DIR}/${SAFETY_BACKUP}${NC}"
else
    stop_spinner fail
    echo -e "${RED}❌ Safety backup failed — aborting restore. Nothing was changed.${NC}"
    exit 1
fi

# Drop and recreate database, then restore from backup
section "Restoring" "🗄️"

start_spinner "Dropping and recreating '${POSTGRES_DB}'"
podman exec "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};" postgres
podman exec "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -c "CREATE DATABASE ${POSTGRES_DB};" postgres
stop_spinner ok

start_spinner "Restoring from ${BACKUP_FILE}"
if gunzip -c "${BACKUP_FILE}" | podman exec -i "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" "${POSTGRES_DB}" > /dev/null 2>&1; then
    stop_spinner ok
else
    stop_spinner fail
    echo -e "${RED}❌ Restore failed — rolling back to the safety backup${NC}"
    start_spinner "Restoring from safety backup"
    gunzip -c "${BACKUP_DIR}/${SAFETY_BACKUP}" | podman exec -i "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" "${POSTGRES_DB}" > /dev/null 2>&1
    stop_spinner ok
    echo -e "${RED}   Rolled back to the safety backup — the restore did NOT complete.${NC}"
    echo -e "${YELLOW}   Investigate the failure above before trying again.${NC}"
    exit 1
fi

# Verify restore
section "Verification" "🩺"
start_spinner "Counting tables in restored database"
TABLE_COUNT=$(podman exec "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
stop_spinner ok
echo -e "  ${GREEN}✓${NC}  Found ${BOLD}${TABLE_COUNT}${NC} tables in restored database"

# Summary
section "Summary" "🍽️"
echo -e "${BLUE}  Restored from:${NC} ${BACKUP_FILE}"
echo -e "${BLUE}  Database:${NC}      ${POSTGRES_DB}"
echo -e "${BLUE}  Tables:${NC}        ${TABLE_COUNT}"
echo -e "${BLUE}  Safety backup:${NC} ${BACKUP_DIR}/${SAFETY_BACKUP}"

exit 0
