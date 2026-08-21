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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

# Configuration
BACKUP_DIR="data/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/pre_migration_${TIMESTAMP}.sql.gz"
ENV_FILE=".env"

section "Pre-Migration Backup" "🗄️"

# ── Environment ──────────────────────────────────────────────────────────────
section "Environment" "🔍"

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "  ${RED}❌ .env file not found${NC}"
    echo "  Please create .env file with database credentials."
    exit 1
fi

# Load environment variables
set -a  # automatically export all variables
source "$ENV_FILE"
set +a

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "  ${RED}❌ DATABASE_URL not set in .env${NC}"
    echo "  Please add DATABASE_URL to your .env file"
    echo "  Example: DATABASE_URL=postgresql://postgres:password@localhost:5432/mealplanner"
    exit 1
fi

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo -e "  ${BLUE}ℹ️${NC}  Database: ${BOLD}${DB_NAME}${NC}"
echo -e "  ${BLUE}ℹ️${NC}  Host: ${DB_HOST}:${DB_PORT}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Detect if using containerized database
CONTAINER_NAME=""
if podman ps --format "{{.Names}}" 2>/dev/null | grep -q "meals-postgres"; then
    CONTAINER_NAME="meals-postgres"
    CONTAINER_CMD="podman"
    echo -e "  ${GREEN}✓${NC}  Using Podman container: ${CONTAINER_NAME}"
elif docker ps --format "{{.Names}}" 2>/dev/null | grep -q "meals-postgres"; then
    CONTAINER_NAME="meals-postgres"
    CONTAINER_CMD="docker"
    echo -e "  ${GREEN}✓${NC}  Using Docker container: ${CONTAINER_NAME}"
fi

# Check if database is accessible
start_spinner "Checking database connection"
if [ -n "$CONTAINER_NAME" ]; then
    # Use container exec for connection test
    if ! $CONTAINER_CMD exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
        stop_spinner fail
        echo -e "  ${RED}❌ Cannot connect to database${NC}"
        echo "  Please check your database credentials and ensure the database is running."
        exit 1
    fi
else
    # Use direct connection for local database
    if ! PGPASSWORD=$POSTGRES_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
        stop_spinner fail
        echo -e "  ${RED}❌ Cannot connect to database${NC}"
        echo "  Please check your database credentials and ensure the database is running."
        exit 1
    fi
fi
stop_spinner ok

# Count records before backup
start_spinner "Counting records"
if [ -n "$CONTAINER_NAME" ]; then
    USER_COUNT=$($CONTAINER_CMD exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
    RECIPE_COUNT=$($CONTAINER_CMD exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM recipes;" 2>/dev/null | xargs)
else
    USER_COUNT=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
    RECIPE_COUNT=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM recipes;" 2>/dev/null | xargs)
fi
stop_spinner ok
echo -e "  ${DIM}Users: ${USER_COUNT}, Recipes: ${RECIPE_COUNT}${NC}"

# ── Backup ───────────────────────────────────────────────────────────────────
section "Creating Backup" "🗄️"
echo -e "  ${BLUE}ℹ️${NC}  Target file: ${BACKUP_FILE}"

start_spinner "Dumping database"
DUMP_STATUS=0
if [ -n "$CONTAINER_NAME" ]; then
    # Use container exec for backup
    $CONTAINER_CMD exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists | gzip > "$BACKUP_FILE" || DUMP_STATUS=$?
else
    # Use direct connection for local database
    PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --clean --if-exists | gzip > "$BACKUP_FILE" || DUMP_STATUS=$?
fi

if [ "$DUMP_STATUS" -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    stop_spinner ok
    echo -e "  ${DIM}${BACKUP_SIZE}${NC}"
else
    stop_spinner fail
    echo -e "  ${RED}❌ Backup failed${NC}"
    exit 1
fi

# Verify backup
start_spinner "Verifying backup integrity"
if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    stop_spinner ok
else
    stop_spinner fail
    echo -e "  ${RED}❌ Backup file is corrupted${NC}"
    exit 1
fi

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

# Summary
section "Summary" "🍽️"
echo -e "  ${BLUE}Backup file:${NC} ${GREEN}$BACKUP_FILE${NC} ${DIM}(${BACKUP_SIZE})${NC}"
echo -e "  ${BLUE}Restore instructions:${NC} ${GREEN}$RESTORE_INSTRUCTIONS${NC}"
echo ""
echo -e "  ${YELLOW}⚠️  IMPORTANT:${NC} Keep this backup safe before proceeding with migration!"
echo ""
