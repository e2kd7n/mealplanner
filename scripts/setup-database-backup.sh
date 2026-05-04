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

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Database Backup Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Detect database configuration
echo -e "${YELLOW}Step 1: Detecting database configuration...${NC}"

# Check if using containerized database
if podman ps | grep -q meals-postgres; then
    echo -e "${GREEN}✓ Found Podman container: meals-postgres${NC}"
    DB_TYPE="podman"
    DB_HOST="localhost"
    DB_PORT="5432"
    DB_NAME="meal_planner"
    DB_USER="mealplanner"
    
    # Get password from secrets file
    if [ -f "secrets/postgres_password.txt" ]; then
        DB_PASSWORD=$(cat secrets/postgres_password.txt)
        echo -e "${GREEN}✓ Found database password in secrets${NC}"
    else
        echo -e "${RED}ERROR: secrets/postgres_password.txt not found${NC}"
        exit 1
    fi
elif docker ps | grep -q meals-postgres 2>/dev/null; then
    echo -e "${GREEN}✓ Found Docker container: meals-postgres${NC}"
    DB_TYPE="docker"
    DB_HOST="localhost"
    DB_PORT="5432"
    DB_NAME="meal_planner"
    DB_USER="mealplanner"
    
    # Get password from secrets file
    if [ -f "secrets/postgres_password.txt" ]; then
        DB_PASSWORD=$(cat secrets/postgres_password.txt)
        echo -e "${GREEN}✓ Found database password in secrets${NC}"
    else
        echo -e "${RED}ERROR: secrets/postgres_password.txt not found${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}No containerized database found, checking for local PostgreSQL...${NC}"
    if pg_isready -q; then
        echo -e "${GREEN}✓ Found local PostgreSQL${NC}"
        DB_TYPE="local"
        DB_HOST="localhost"
        DB_PORT="5432"
        
        # Prompt for database details
        read -p "Database name [mealplanner_prod]: " DB_NAME
        DB_NAME=${DB_NAME:-mealplanner_prod}
        
        read -p "Database user [postgres]: " DB_USER
        DB_USER=${DB_USER:-postgres}
        
        read -sp "Database password: " DB_PASSWORD
        echo ""
    else
        echo -e "${RED}ERROR: No database found!${NC}"
        echo "Please start your database first:"
        echo "  - For containers: podman-compose up -d postgres"
        echo "  - For local: brew services start postgresql"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}Database Configuration:${NC}"
echo -e "  Type: $DB_TYPE"
echo -e "  Host: $DB_HOST"
echo -e "  Port: $DB_PORT"
echo -e "  Database: $DB_NAME"
echo -e "  User: $DB_USER"
echo ""

# Step 2: Create/Update .env file
echo -e "${YELLOW}Step 2: Creating .env configuration...${NC}"

# Backup existing .env if it exists
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✓ Backed up existing .env${NC}"
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
    echo -e "${GREEN}✓ Updated DATABASE_URL in .env${NC}"
else
    # Add DATABASE_URL to .env
    if [ ! -f .env ]; then
        # Create new .env from example
        if [ -f .env.example ]; then
            cp .env.example .env
            echo -e "${GREEN}✓ Created .env from .env.example${NC}"
        else
            touch .env
            echo -e "${GREEN}✓ Created new .env file${NC}"
        fi
    fi
    
    # Add DATABASE_URL
    echo "" >> .env
    echo "# Database Configuration (added by setup-database-backup.sh)" >> .env
    echo "DATABASE_URL=\"${DATABASE_URL}\"" >> .env
    echo -e "${GREEN}✓ Added DATABASE_URL to .env${NC}"
fi

# Add POSTGRES_PASSWORD if not present
if ! grep -q "^POSTGRES_PASSWORD=" .env; then
    echo "POSTGRES_PASSWORD=\"${DB_PASSWORD}\"" >> .env
    echo -e "${GREEN}✓ Added POSTGRES_PASSWORD to .env${NC}"
fi

echo ""

# Step 3: Test database connection
echo -e "${YELLOW}Step 3: Testing database connection...${NC}"

if [ "$DB_TYPE" = "podman" ]; then
    if podman exec meals-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Database connection successful${NC}"
    else
        echo -e "${RED}ERROR: Cannot connect to database${NC}"
        exit 1
    fi
elif [ "$DB_TYPE" = "docker" ]; then
    if docker exec meals-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Database connection successful${NC}"
    else
        echo -e "${RED}ERROR: Cannot connect to database${NC}"
        exit 1
    fi
else
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Database connection successful${NC}"
    else
        echo -e "${RED}ERROR: Cannot connect to database${NC}"
        exit 1
    fi
fi

echo ""

# Step 4: Create first backup
echo -e "${YELLOW}Step 4: Creating your first backup...${NC}"

if ./scripts/pre-migration-backup.sh; then
    echo -e "${GREEN}✓ First backup created successfully!${NC}"
else
    echo -e "${RED}ERROR: Backup failed${NC}"
    echo "Please check the error messages above"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}What was configured:${NC}"
echo -e "  ✓ DATABASE_URL added to .env"
echo -e "  ✓ POSTGRES_PASSWORD added to .env"
echo -e "  ✓ Database connection tested"
echo -e "  ✓ First backup created"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Run weekly backups: ${GREEN}./scripts/pre-migration-backup.sh${NC}"
echo -e "  2. Before migrations: ${GREEN}./scripts/safe-migrate.sh${NC}"
echo -e "  3. Follow maintenance checklist: ${GREEN}docs/releases/maintenance/WEEKLY_MAINTENANCE_CHECKLIST.md${NC}"
echo ""
echo -e "${YELLOW}Your backups are stored in:${NC} ${GREEN}data/backups/${NC}"
echo ""

# Made with Bob
