#!/bin/bash
# Database Restore Script for Meal Planner
# Restores the PostgreSQL database from a backup file

set -e

# Configuration
BACKUP_DIR="./data/backups"
CONTAINER_NAME="meals-postgres"
DB_NAME="meals"
DB_USER="mealplanner"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Meal Planner Database Restore ===${NC}"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Available backups:${NC}"
    ls -lh "${BACKUP_DIR}"/mealplanner_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    echo ""
    echo -e "${RED}Usage: $0 <backup_file>${NC}"
    echo "Example: $0 ${BACKUP_DIR}/mealplanner_backup_20260322_163000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}Error: Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

# Check if container is running
if ! podman ps | grep -q "${CONTAINER_NAME}"; then
    echo -e "${RED}Error: Container ${CONTAINER_NAME} is not running${NC}"
    exit 1
fi

# Confirm restore
echo -e "${YELLOW}WARNING: This will replace the current database with the backup!${NC}"
echo "Backup file: ${BACKUP_FILE}"
echo -n "Are you sure you want to continue? (yes/no): "
read -r CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Decompress if needed
TEMP_FILE="/tmp/mealplanner_restore_$$.sql"
if [[ "${BACKUP_FILE}" == *.gz ]]; then
    echo -e "${YELLOW}Decompressing backup...${NC}"
    gunzip -c "${BACKUP_FILE}" > "${TEMP_FILE}"
else
    cp "${BACKUP_FILE}" "${TEMP_FILE}"
fi

# Restore database
echo -e "${YELLOW}Restoring database...${NC}"
if cat "${TEMP_FILE}" | podman exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" "${DB_NAME}"; then
    echo -e "${GREEN}✓ Database restored successfully${NC}"
else
    echo -e "${RED}✗ Restore failed${NC}"
    rm -f "${TEMP_FILE}"
    exit 1
fi

# Clean up
rm -f "${TEMP_FILE}"

echo -e "${GREEN}=== Restore Complete ===${NC}"

# Made with Bob
