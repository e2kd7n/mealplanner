#!/bin/bash
# Database Backup Script for Meal Planner
# Automatically backs up the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="./data/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="mealplanner_backup_${TIMESTAMP}.sql"
CONTAINER_NAME="meals-postgres"
DB_NAME="meal_planner"
DB_USER="mealplanner"

# Keep last N backups (default: 7 days of backups if run daily)
KEEP_BACKUPS=7

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Meal Planner Database Backup ===${NC}"
echo "Timestamp: $(date)"
echo "Backup file: ${BACKUP_FILE}"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Check if container is running
if ! podman ps | grep -q "${CONTAINER_NAME}"; then
    echo -e "${RED}Error: Container ${CONTAINER_NAME} is not running${NC}"
    exit 1
fi

# Perform backup
echo -e "${YELLOW}Creating backup...${NC}"
if podman exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" "${DB_NAME}" > "${BACKUP_DIR}/${BACKUP_FILE}"; then
    echo -e "${GREEN}✓ Backup created successfully${NC}"
    
    # Compress backup
    echo -e "${YELLOW}Compressing backup...${NC}"
    gzip "${BACKUP_DIR}/${BACKUP_FILE}"
    echo -e "${GREEN}✓ Backup compressed: ${BACKUP_FILE}.gz${NC}"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}.gz" | cut -f1)
    echo -e "${GREEN}Backup size: ${BACKUP_SIZE}${NC}"
else
    echo -e "${RED}✗ Backup failed${NC}"
    exit 1
fi

# Clean up old backups
echo -e "${YELLOW}Cleaning up old backups (keeping last ${KEEP_BACKUPS})...${NC}"
cd "${BACKUP_DIR}"
ls -t mealplanner_backup_*.sql.gz 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm -f
REMAINING=$(ls -1 mealplanner_backup_*.sql.gz 2>/dev/null | wc -l)
echo -e "${GREEN}✓ ${REMAINING} backup(s) retained${NC}"

echo -e "${GREEN}=== Backup Complete ===${NC}"

# Made with Bob
