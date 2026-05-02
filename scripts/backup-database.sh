#!/bin/bash
# Database Backup Script - P1 Issue #164
# Automated PostgreSQL backup with retention policy

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./data/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-meals-postgres}"
POSTGRES_DB="${POSTGRES_DB:-meal_planner}"
POSTGRES_USER="${POSTGRES_USER:-mealplanner}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Database Backup Script ===${NC}"
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
echo -e "${YELLOW}Creating backup...${NC}"
if podman exec "${POSTGRES_CONTAINER}" pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"; then
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    echo -e "${GREEN}✓ Backup created successfully: ${BACKUP_FILE} (${BACKUP_SIZE})${NC}"
else
    echo -e "${RED}✗ Backup failed${NC}"
    exit 1
fi

# Verify backup
echo -e "${YELLOW}Verifying backup...${NC}"
if gunzip -t "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null; then
    echo -e "${GREEN}✓ Backup file is valid${NC}"
else
    echo -e "${RED}✗ Backup file is corrupted${NC}"
    exit 1
fi

# Clean up old backups (retention policy)
echo -e "${YELLOW}Applying retention policy (${RETENTION_DAYS} days)...${NC}"
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "${DELETED_COUNT}" -gt 0 ]; then
    echo -e "${GREEN}✓ Deleted ${DELETED_COUNT} old backup(s)${NC}"
else
    echo -e "${GREEN}✓ No old backups to delete${NC}"
fi

# List recent backups
echo ""
echo -e "${GREEN}Recent backups:${NC}"
ls -lh "${BACKUP_DIR}" | grep "backup_" | tail -5

# Summary
echo ""
echo -e "${GREEN}=== Backup Complete ===${NC}"
echo "Backup file: ${BACKUP_FILE}"
echo "Location: ${BACKUP_DIR}/${BACKUP_FILE}"
echo "Size: ${BACKUP_SIZE}"
echo "Retention: ${RETENTION_DAYS} days"

exit 0

# Made with Bob
