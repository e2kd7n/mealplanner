#!/bin/bash

###############################################################################
# Database Backup Setup Script
#
# This script automatically configures your environment for database backups
# by detecting your current setup and creating the necessary configuration.
#
# Usage: ./scripts/setup-database-backup.sh
###############################################################################

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

section "Database Backup Setup" "🗄️"

# Step 1: Detect database configuration
section "Detecting Configuration" "🔍"

# Check if using containerized database
if podman ps | grep -q meals-postgres; then
    echo -e "  ${GREEN}✓${NC}  Found Podman container: meals-postgres"
    DB_TYPE="podman"
    DB_HOST="localhost"
    DB_PORT="5432"
    DB_NAME="meal_planner"
    DB_USER="mealplanner"

    # Get password from secrets file
    if [ -f "secrets/postgres_password.txt" ]; then
        DB_PASSWORD=$(cat secrets/postgres_password.txt)
        echo -e "  ${GREEN}✓${NC}  Found database password in secrets"
    else
        echo -e "  ${RED}❌ secrets/postgres_password.txt not found${NC}"
        exit 1
    fi
elif docker ps | grep -q meals-postgres 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC}  Found Docker container: meals-postgres"
    DB_TYPE="docker"
    DB_HOST="localhost"
    DB_PORT="5432"
    DB_NAME="meal_planner"
    DB_USER="mealplanner"

    # Get password from secrets file
    if [ -f "secrets/postgres_password.txt" ]; then
        DB_PASSWORD=$(cat secrets/postgres_password.txt)
        echo -e "  ${GREEN}✓${NC}  Found database password in secrets"
    else
        echo -e "  ${RED}❌ secrets/postgres_password.txt not found${NC}"
        exit 1
    fi
else
    echo -e "  ${YELLOW}ℹ️  No containerized database found, checking for local PostgreSQL...${NC}"
    if pg_isready -q; then
        echo -e "  ${GREEN}✓${NC}  Found local PostgreSQL"
        DB_TYPE="local"
        DB_HOST="localhost"
        DB_PORT="5432"

        # Prompt for database details
        read -p "  Database name [mealplanner_prod]: " DB_NAME
        DB_NAME=${DB_NAME:-mealplanner_prod}

        read -p "  Database user [postgres]: " DB_USER
        DB_USER=${DB_USER:-postgres}

        read -sp "  Database password: " DB_PASSWORD
        echo ""
    else
        echo -e "  ${RED}❌ No database found!${NC}"
        echo "  Please start your database first:"
        echo "    - For containers: podman-compose up -d postgres"
        echo "    - For local: brew services start postgresql"
        exit 1
    fi
fi

echo ""
echo -e "  ${BLUE}Database Configuration:${NC}"
echo -e "    Type: $DB_TYPE"
echo -e "    Host: $DB_HOST"
echo -e "    Port: $DB_PORT"
echo -e "    Database: $DB_NAME"
echo -e "    User: $DB_USER"

# Step 2: Create/Update .env file
section "Configuring .env" "🔐"

# Backup existing .env if it exists
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "  ${GREEN}✓${NC}  Backed up existing .env"
fi

# Create DATABASE_URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Check if .env exists and has DATABASE_URL
if [ -f .env ] && grep -q "^DATABASE_URL=" .env; then
    # Update existing DATABASE_URL
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" .env
    else
        # Linux
        sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" .env
    fi
    echo -e "  ${GREEN}✓${NC}  Updated DATABASE_URL in .env"
else
    # Add DATABASE_URL to .env
    if [ ! -f .env ]; then
        # Create new .env from example
        if [ -f .env.example ]; then
            cp .env.example .env
            echo -e "  ${GREEN}✓${NC}  Created .env from .env.example"
        else
            touch .env
            echo -e "  ${GREEN}✓${NC}  Created new .env file"
        fi
    fi

    # Add DATABASE_URL
    echo "" >> .env
    echo "# Database Configuration (added by setup-database-backup.sh)" >> .env
    echo "DATABASE_URL=\"${DATABASE_URL}\"" >> .env
    echo -e "  ${GREEN}✓${NC}  Added DATABASE_URL to .env"
fi

# Add POSTGRES_PASSWORD if not present
if ! grep -q "^POSTGRES_PASSWORD=" .env; then
    echo "POSTGRES_PASSWORD=\"${DB_PASSWORD}\"" >> .env
    echo -e "  ${GREEN}✓${NC}  Added POSTGRES_PASSWORD to .env"
fi

# Step 3: Test database connection
section "Testing Connection" "🔍"

start_spinner "Testing database connection"
if [ "$DB_TYPE" = "podman" ]; then
    if podman exec meals-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        stop_spinner ok
    else
        stop_spinner fail
        echo -e "  ${RED}❌ Cannot connect to database${NC}"
        exit 1
    fi
elif [ "$DB_TYPE" = "docker" ]; then
    if docker exec meals-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        stop_spinner ok
    else
        stop_spinner fail
        echo -e "  ${RED}❌ Cannot connect to database${NC}"
        exit 1
    fi
else
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        stop_spinner ok
    else
        stop_spinner fail
        echo -e "  ${RED}❌ Cannot connect to database${NC}"
        exit 1
    fi
fi

# Step 4: Create first backup
section "First Backup" "🗄️"

if ./scripts/pre-migration-backup.sh; then
    echo -e "  ${GREEN}✓${NC}  First backup created successfully!"
else
    echo -e "  ${RED}❌ Backup failed${NC}"
    echo "  Please check the error messages above"
    exit 1
fi

section "Summary" "🍽️"
echo -e "  ${YELLOW}What was configured:${NC}"
echo -e "    ✓ DATABASE_URL added to .env"
echo -e "    ✓ POSTGRES_PASSWORD added to .env"
echo -e "    ✓ Database connection tested"
echo -e "    ✓ First backup created"
echo ""
echo -e "  ${YELLOW}Next steps:${NC}"
echo -e "    1. Run weekly backups: ${GREEN}./scripts/pre-migration-backup.sh${NC}"
echo -e "    2. Before migrations: ${GREEN}./scripts/safe-migrate.sh${NC}"
echo -e "    3. Follow maintenance checklist: ${GREEN}docs/releases/maintenance/WEEKLY_MAINTENANCE_CHECKLIST.md${NC}"
echo ""
echo -e "  ${YELLOW}Your backups are stored in:${NC} ${GREEN}data/backups/${NC}"
echo ""
