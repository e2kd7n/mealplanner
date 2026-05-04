#!/bin/bash

###############################################################################
# Safe Database Migration Script
# 
# This script wraps Prisma migrations with automatic backup and safety checks.
# It prevents accidental data loss by:
# 1. Creating a backup before migration
# 2. Checking for production environment
# 3. Requiring explicit confirmation for production
#
# Usage: 
#   Development: ./scripts/safe-migrate.sh
#   Production:  ./scripts/safe-migrate.sh --production
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENV_FILE=".env"
PRODUCTION_MODE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --production)
            PRODUCTION_MODE=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 [--production]"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Safe Database Migration${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    exit 1
fi

# Load environment variables
source "$ENV_FILE"

# Detect environment
DETECTED_ENV=${NODE_ENV:-development}
echo -e "${YELLOW}Detected environment:${NC} $DETECTED_ENV"

# Safety check for production
if [ "$DETECTED_ENV" = "production" ] && [ "$PRODUCTION_MODE" = false ]; then
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}PRODUCTION ENVIRONMENT DETECTED!${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${YELLOW}You are about to run a migration on a PRODUCTION database.${NC}"
    echo -e "${YELLOW}This could result in data loss if not done carefully.${NC}"
    echo ""
    echo -e "To proceed, you must:"
    echo -e "  1. Review the migration files carefully"
    echo -e "  2. Run with --production flag: ${GREEN}./scripts/safe-migrate.sh --production${NC}"
    echo ""
    exit 1
fi

# Additional confirmation for production
if [ "$PRODUCTION_MODE" = true ]; then
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}PRODUCTION MIGRATION WARNING${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${YELLOW}You are about to migrate a PRODUCTION database.${NC}"
    echo ""
    read -p "Have you reviewed the migration files? (yes/no): " REVIEWED
    if [ "$REVIEWED" != "yes" ]; then
        echo -e "${RED}Migration cancelled.${NC}"
        exit 1
    fi
    
    read -p "Type 'MIGRATE PRODUCTION' to confirm: " CONFIRM
    if [ "$CONFIRM" != "MIGRATE PRODUCTION" ]; then
        echo -e "${RED}Migration cancelled.${NC}"
        exit 1
    fi
    echo ""
fi

# Step 1: Create backup
echo -e "${YELLOW}Step 1: Creating pre-migration backup...${NC}"
if ! ./scripts/pre-migration-backup.sh; then
    echo -e "${RED}ERROR: Backup failed! Migration cancelled.${NC}"
    exit 1
fi
echo ""

# Step 2: Run migration
echo -e "${YELLOW}Step 2: Running Prisma migration...${NC}"
cd backend

if [ "$DETECTED_ENV" = "production" ]; then
    # Production: deploy migrations without prompts
    echo -e "${YELLOW}Running: prisma migrate deploy${NC}"
    npx prisma migrate deploy
else
    # Development: interactive migration
    echo -e "${YELLOW}Running: prisma migrate dev${NC}"
    npx prisma migrate dev
fi

MIGRATION_STATUS=$?
cd ..

if [ $MIGRATION_STATUS -eq 0 ]; then
    echo -e "${GREEN}✓ Migration completed successfully${NC}"
else
    echo -e "${RED}ERROR: Migration failed!${NC}"
    echo ""
    echo -e "${YELLOW}To restore from backup:${NC}"
    echo -e "  1. Find the latest backup in data/backups/"
    echo -e "  2. Run: ./scripts/restore-database.sh <backup-file>"
    exit 1
fi
echo ""

# Step 3: Verify database
echo -e "${YELLOW}Step 3: Verifying database...${NC}"
cd backend
if npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM users;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database is accessible${NC}"
else
    echo -e "${RED}WARNING: Database verification failed${NC}"
fi
cd ..
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Migration Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Test the application thoroughly"
echo -e "  2. Check for any data inconsistencies"
echo -e "  3. Keep the backup file safe for at least 7 days"
echo ""

# Made with Bob
