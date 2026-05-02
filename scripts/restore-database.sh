#!/bin/bash
# Database Restore Script - P1 Issue #164
# Restore PostgreSQL database from backup

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./data/backups}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-meals-postgres}"
POSTGRES_DB="${POSTGRES_DB:-meal_planner}"
POSTGRES_USER="${POSTGRES_USER:-mealplanner}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Database Restore Script ===${NC}"
echo "Timestamp: $(date)"
echo ""

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <backup_file>${NC}"
    echo ""
    echo "Available backups:"
    ls -lh "${BACKUP_DIR}" | grep "backup_" | tail -10
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "${BACKUP_DIR}/${BACKUP_FILE}" ] && [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}Error: Backup file not found${NC}"
    echo "Tried: ${BACKUP_DIR}/${BACKUP_FILE}"
    echo "Tried: ${BACKUP_FILE}"
    exit 1
fi

# Use full path if relative path provided
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
fi

echo "Backup file: ${BACKUP_FILE}"
echo "Database: ${POSTGRES_DB}"
echo ""

# Verify backup file
echo -e "${YELLOW}Verifying backup file...${NC}"
if gunzip -t "${BACKUP_FILE}" 2>/dev/null; then
    echo -e "${GREEN}✓ Backup file is valid${NC}"
else
    echo -e "${RED}✗ Backup file is corrupted${NC}"
    exit 1
fi

# Check if container is running
if ! podman ps | grep -q "${POSTGRES_CONTAINER}"; then
    echo -e "${RED}Error: PostgreSQL container '${POSTGRES_CONTAINER}' is not running${NC}"
    exit 1
fi

# Warning
echo ""
echo -e "${RED}WARNING: This will REPLACE the current database!${NC}"
echo -e "${YELLOW}Press Ctrl+C to cancel, or Enter to continue...${NC}"
read -r

# Create a safety backup before restore
SAFETY_BACKUP="safety_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
echo -e "${YELLOW}Creating safety backup first...${NC}"
if podman exec "${POSTGRES_CONTAINER}" pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "${BACKUP_DIR}/${SAFETY_BACKUP}"; then
    echo -e "${GREEN}✓ Safety backup created: ${SAFETY_BACKUP}${NC}"
else
    echo -e "${RED}✗ Safety backup failed - aborting restore${NC}"
    exit 1
fi

# Drop and recreate database
echo -e "${YELLOW}Dropping and recreating database...${NC}"
podman exec "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};" postgres
podman exec "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -c "CREATE DATABASE ${POSTGRES_DB};" postgres
echo -e "${GREEN}✓ Database recreated${NC}"

# Restore from backup
echo -e "${YELLOW}Restoring from backup...${NC}"
if gunzip -c "${BACKUP_FILE}" | podman exec -i "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" "${POSTGRES_DB}" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database restored successfully${NC}"
else
    echo -e "${RED}✗ Restore failed${NC}"
    echo -e "${YELLOW}Attempting to restore from safety backup...${NC}"
    gunzip -c "${BACKUP_DIR}/${SAFETY_BACKUP}" | podman exec -i "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" "${POSTGRES_DB}" > /dev/null 2>&1
    echo -e "${RED}Restored from safety backup - please investigate the issue${NC}"
    exit 1
fi

# Verify restore
echo -e "${YELLOW}Verifying restore...${NC}"
TABLE_COUNT=$(podman exec "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
echo -e "${GREEN}✓ Found ${TABLE_COUNT} tables in restored database${NC}"

# Summary
echo ""
echo -e "${GREEN}=== Restore Complete ===${NC}"
echo "Restored from: ${BACKUP_FILE}"
echo "Database: ${POSTGRES_DB}"
echo "Tables: ${TABLE_COUNT}"
echo "Safety backup: ${BACKUP_DIR}/${SAFETY_BACKUP}"

exit 0

# Made with Bob
