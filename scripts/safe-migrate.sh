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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

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
            echo -e "${RED}❌ Unknown option: $1${NC}"
            echo "Usage: $0 [--production]"
            exit 1
            ;;
    esac
done

section "Safe Database Migration" "🗄️"

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "  ${RED}❌ .env file not found${NC}"
    exit 1
fi

# Load environment variables
source "$ENV_FILE"

# Detect environment
DETECTED_ENV=${NODE_ENV:-development}
echo -e "  ${BLUE}ℹ️${NC}  Detected environment: ${BOLD}${DETECTED_ENV}${NC}"

# Safety check for production
if [ "$DETECTED_ENV" = "production" ] && [ "$PRODUCTION_MODE" = false ]; then
    echo ""
    echo -e "  ${RED}⚠️  PRODUCTION ENVIRONMENT DETECTED!${NC}"
    echo ""
    echo -e "  ${YELLOW}You are about to run a migration on a PRODUCTION database.${NC}"
    echo -e "  ${YELLOW}This could result in data loss if not done carefully.${NC}"
    echo ""
    echo -e "  To proceed, you must:"
    echo -e "    1. Review the migration files carefully"
    echo -e "    2. Run with --production flag: ${GREEN}./scripts/safe-migrate.sh --production${NC}"
    echo ""
    exit 1
fi

# Additional confirmation for production
if [ "$PRODUCTION_MODE" = true ]; then
    echo ""
    echo -e "  ${RED}⚠️  PRODUCTION MIGRATION WARNING${NC}"
    echo ""
    echo -e "  ${YELLOW}You are about to migrate a PRODUCTION database.${NC}"
    echo ""
    read -p "  Have you reviewed the migration files? (yes/no): " REVIEWED
    if [ "$REVIEWED" != "yes" ]; then
        echo -e "  ${RED}Migration cancelled.${NC}"
        exit 1
    fi

    read -p "  Type 'MIGRATE PRODUCTION' to confirm: " CONFIRM
    if [ "$CONFIRM" != "MIGRATE PRODUCTION" ]; then
        echo -e "  ${RED}Migration cancelled.${NC}"
        exit 1
    fi
fi

# Each phase below is announced with its own [n/3] step so that if the script
# dies partway through — e.g. under `set -e` on an unexpected psql error — the
# operator can tell exactly which phase failed from the last step line printed,
# rather than guessing from a bare stack of undifferentiated output.
steps_init 3

# Step 1: Create backup
section "Phase 1: Pre-Migration Backup" "🗄️"
step "Creating pre-migration backup"
if ! ./scripts/pre-migration-backup.sh; then
    echo -e "  ${RED}❌ Backup failed — migration cancelled, nothing was touched${NC}"
    exit 1
fi

# Step 2: Run migration
section "Phase 2: Running Migration" "🗄️"
cd backend

if [ "$DETECTED_ENV" = "production" ]; then
    # Production: deploy migrations without prompts
    step "Running: prisma migrate deploy"
    npx prisma migrate deploy
else
    # Development: interactive migration
    step "Running: prisma migrate dev"
    npx prisma migrate dev
fi

MIGRATION_STATUS=$?
cd ..

if [ $MIGRATION_STATUS -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC}  Migration completed successfully"
else
    echo -e "  ${RED}❌ Migration failed (exit ${MIGRATION_STATUS})${NC}"
    echo ""
    echo -e "  ${DIM}If the error mentions a column or table that already exists, the${NC}"
    echo -e "  ${DIM}migration may have been partially applied already — do not re-run it${NC}"
    echo -e "  ${DIM}manually. Investigate before retrying.${NC}"
    echo ""
    echo -e "  ${YELLOW}To restore from the pre-migration backup:${NC}"
    echo -e "    1. Find the latest backup in data/backups/"
    echo -e "    2. Run: ./scripts/restore-database.sh <backup-file>"
    exit 1
fi

# Step 3: Verify database
section "Phase 3: Verifying Database" "🩺"
step "Checking database is accessible"
cd backend
if npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM users;" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC}  Database is accessible"
else
    echo -e "  ${YELLOW}⚠️  Database verification failed${NC}"
fi
cd ..

section "Summary" "🍽️"
echo -e "  ${YELLOW}Next steps:${NC}"
echo -e "    1. Test the application thoroughly"
echo -e "    2. Check for any data inconsistencies"
echo -e "    3. Keep the backup file safe for at least 7 days"
echo ""
