#!/bin/bash

###############################################################################
# Pre-Migration Database Backup Script
# 
# This script MUST be run before any database migration to prevent data loss.
# It creates a timestamped backup and verifies it was successful.
#
# Usage: ./scripts/pre-migration-backup.sh
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="data/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/pre_migration_${TIMESTAMP}.sql.gz"
ENV_FILE=".env"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Pre-Migration Database Backup${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    echo "Please create .env file with database credentials."
    exit 1
fi

# Load environment variables
set -a  # automatically export all variables
source "$ENV_FILE"
set +a

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL not set in .env${NC}"
    echo "Please add DATABASE_URL to your .env file"
    echo "Example: DATABASE_URL=postgresql://postgres:password@localhost:5432/mealplanner"
    exit 1
fi

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo -e "${YELLOW}Database:${NC} $DB_NAME"
echo -e "${YELLOW}Host:${NC} $DB_HOST:$DB_PORT"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Detect if using containerized database
CONTAINER_NAME=""
if podman ps --format "{{.Names}}" 2>/dev/null | grep -q "meals-postgres"; then
    CONTAINER_NAME="meals-postgres"
    CONTAINER_CMD="podman"
    echo -e "${GREEN}✓ Using Podman container: $CONTAINER_NAME${NC}"
elif docker ps --format "{{.Names}}" 2>/dev/null | grep -q "meals-postgres"; then
    CONTAINER_NAME="meals-postgres"
    CONTAINER_CMD="docker"
    echo -e "${GREEN}✓ Using Docker container: $CONTAINER_NAME${NC}"
fi

# Check if database is accessible
echo -e "${YELLOW}Checking database connection...${NC}"
if [ -n "$CONTAINER_NAME" ]; then
    # Use container exec for connection test
    if ! $CONTAINER_CMD exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
        echo -e "${RED}ERROR: Cannot connect to database!${NC}"
        echo "Please check your database credentials and ensure the database is running."
        exit 1
    fi
else
    # Use direct connection for local database
    if ! PGPASSWORD=$POSTGRES_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
        echo -e "${RED}ERROR: Cannot connect to database!${NC}"
        echo "Please check your database credentials and ensure the database is running."
        exit 1
    fi
fi
echo -e "${GREEN}✓ Database connection successful${NC}"
echo ""

# Count records before backup
echo -e "${YELLOW}Counting records...${NC}"
if [ -n "$CONTAINER_NAME" ]; then
    USER_COUNT=$($CONTAINER_CMD exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
    RECIPE_COUNT=$($CONTAINER_CMD exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM recipes;" 2>/dev/null | xargs)
else
    USER_COUNT=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
    RECIPE_COUNT=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM recipes;" 2>/dev/null | xargs)
fi

echo -e "${GREEN}✓ Users: $USER_COUNT${NC}"
echo -e "${GREEN}✓ Recipes: $RECIPE_COUNT${NC}"
echo ""

# Create backup
echo -e "${YELLOW}Creating backup: $BACKUP_FILE${NC}"
if [ -n "$CONTAINER_NAME" ]; then
    # Use container exec for backup
    $CONTAINER_CMD exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists | gzip > "$BACKUP_FILE"
else
    # Use direct connection for local database
    PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --clean --if-exists | gzip > "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ Backup created successfully ($BACKUP_SIZE)${NC}"
else
    echo -e "${RED}ERROR: Backup failed!${NC}"
    exit 1
fi
echo ""

# Verify backup
echo -e "${YELLOW}Verifying backup integrity...${NC}"
if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓ Backup file is valid${NC}"
else
    echo -e "${RED}ERROR: Backup file is corrupted!${NC}"
    exit 1
fi
echo ""

# Create a restore instructions file
RESTORE_INSTRUCTIONS="${BACKUP_DIR}/RESTORE_${TIMESTAMP}.txt"
cat > "$RESTORE_INSTRUCTIONS" << EOF
Database Backup Information
===========================
Created: $(date)
Database: $DB_NAME
Users: $USER_COUNT
Recipes: $RECIPE_COUNT
Backup File: $BACKUP_FILE

To restore this backup:
-----------------------
1. Stop the application
2. Run: ./scripts/restore-database.sh $BACKUP_FILE
3. Restart the application

Or manually:
gunzip -c $BACKUP_FILE | PGPASSWORD=\$POSTGRES_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
EOF

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Backup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Backup file: ${GREEN}$BACKUP_FILE${NC}"
echo -e "Restore instructions: ${GREEN}$RESTORE_INSTRUCTIONS${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT:${NC} Keep this backup safe before proceeding with migration!"
echo ""

# Made with Bob
