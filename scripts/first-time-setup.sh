#!/bin/bash

###############################################################################
# First-Time Setup Script for Meal Planner Application
# 
# This script sets up the entire application from scratch, including:
# - Environment configuration
# - Secrets generation
# - Database setup
# - Dependencies installation
# - Initial backup configuration
# - Container network setup
#
# Usage: ./scripts/first-time-setup.sh
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Progress tracking
TOTAL_STEPS=12
CURRENT_STEP=0

# Function to show progress
show_progress() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    local percent=$((CURRENT_STEP * 100 / TOTAL_STEPS))
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${BLUE}Step ${CURRENT_STEP}/${TOTAL_STEPS} (${percent}%): $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Function to show success
show_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to show error
show_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to show info
show_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Welcome banner
clear
echo -e "${BOLD}${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║           Family Meal Planner - First Time Setup             ║
║                                                               ║
║   This script will configure your development environment    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""

# ============================================================================
# PHASE 1: COLLECT USER DECISIONS
# ============================================================================

echo -e "${BOLD}${YELLOW}PHASE 1: Configuration Questions${NC}"
echo -e "${YELLOW}Please answer the following questions. Defaults are shown in [brackets].${NC}"
echo ""

# Question 1: Environment type
echo -e "${BOLD}1. What environment are you setting up?${NC}"
echo "   1) Development (local machine)"
echo "   2) Production (server/Raspberry Pi)"
read -p "   Choice [1]: " ENV_CHOICE
ENV_CHOICE=${ENV_CHOICE:-1}

if [ "$ENV_CHOICE" = "2" ]; then
    NODE_ENV="production"
    DB_NAME="mealplanner_prod"
    show_info "Setting up PRODUCTION environment"
else
    NODE_ENV="development"
    DB_NAME="mealplanner_dev"
    show_info "Setting up DEVELOPMENT environment"
fi
echo ""

# Question 2: Container engine
echo -e "${BOLD}2. Which container engine are you using?${NC}"
echo "   1) Podman (recommended for macOS/Linux)"
echo "   2) Docker"
echo "   3) None (local PostgreSQL)"
read -p "   Choice [1]: " CONTAINER_CHOICE
CONTAINER_CHOICE=${CONTAINER_CHOICE:-1}

case $CONTAINER_CHOICE in
    2)
        CONTAINER_CMD="docker"
        COMPOSE_CMD="docker-compose"
        ;;
    3)
        CONTAINER_CMD="none"
        COMPOSE_CMD="none"
        ;;
    *)
        CONTAINER_CMD="podman"
        COMPOSE_CMD="podman-compose"
        ;;
esac
show_info "Using: $CONTAINER_CMD"
echo ""

# Question 3: Database name (if not using containers)
if [ "$CONTAINER_CMD" = "none" ]; then
    read -p "3. Database name [$DB_NAME]: " USER_DB_NAME
    DB_NAME=${USER_DB_NAME:-$DB_NAME}
    
    read -p "4. Database user [postgres]: " DB_USER
    DB_USER=${DB_USER:-postgres}
    
    read -sp "5. Database password: " DB_PASSWORD
    echo ""
else
    DB_USER="mealplanner"
    DB_PASSWORD=""  # Will be generated
fi
echo ""

# Question 4: Install dependencies
echo -e "${BOLD}3. Install Node.js dependencies?${NC}"
read -p "   (yes/no) [yes]: " INSTALL_DEPS
INSTALL_DEPS=${INSTALL_DEPS:-yes}
echo ""

# Question 5: Run database migrations
echo -e "${BOLD}4. Run database migrations after setup?${NC}"
read -p "   (yes/no) [yes]: " RUN_MIGRATIONS
RUN_MIGRATIONS=${RUN_MIGRATIONS:-yes}
echo ""

# Question 6: Create initial backup
echo -e "${BOLD}5. Create initial database backup?${NC}"
read -p "   (yes/no) [yes]: " CREATE_BACKUP
CREATE_BACKUP=${CREATE_BACKUP:-yes}
echo ""

# Summary
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Configuration Summary:${NC}"
echo -e "  Environment: ${GREEN}$NODE_ENV${NC}"
echo -e "  Container: ${GREEN}$CONTAINER_CMD${NC}"
echo -e "  Database: ${GREEN}$DB_NAME${NC}"
echo -e "  Install dependencies: ${GREEN}$INSTALL_DEPS${NC}"
echo -e "  Run migrations: ${GREEN}$RUN_MIGRATIONS${NC}"
echo -e "  Create backup: ${GREEN}$CREATE_BACKUP${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

read -p "Proceed with setup? (yes/no) [yes]: " PROCEED
PROCEED=${PROCEED:-yes}

if [ "$PROCEED" != "yes" ]; then
    echo -e "${YELLOW}Setup cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${BOLD}${GREEN}Starting setup...${NC}"
sleep 2

# ============================================================================
# PHASE 2: SETUP EXECUTION
# ============================================================================

# Step 1: Check prerequisites
show_progress "Checking prerequisites"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    show_success "Node.js installed: $NODE_VERSION"
else
    show_error "Node.js not found! Please install Node.js first."
    echo "  Visit: https://nodejs.org/ or run: brew install node"
    exit 1
fi

# Check npm/pnpm
if command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
    show_success "pnpm installed"
elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
    show_success "npm installed"
else
    show_error "No package manager found!"
    exit 1
fi

# Check container engine
if [ "$CONTAINER_CMD" != "none" ]; then
    if command -v $CONTAINER_CMD &> /dev/null; then
        show_success "$CONTAINER_CMD installed"
    else
        show_error "$CONTAINER_CMD not found!"
        echo "  Install with: brew install $CONTAINER_CMD"
        exit 1
    fi
fi

# Step 2: Create directory structure
show_progress "Creating directory structure"

mkdir -p secrets
mkdir -p data/backups
mkdir -p data/uploads
mkdir -p data/images
mkdir -p data/feedback-exports

show_success "Directories created"

# Step 3: Generate secrets
show_progress "Generating secure secrets"

if [ -f "./scripts/generate-secrets.sh" ]; then
    chmod +x ./scripts/generate-secrets.sh
    ./scripts/generate-secrets.sh > /dev/null 2>&1
    show_success "Secrets generated"
else
    # Fallback: generate secrets manually
    show_info "Generating secrets manually..."
    
    # Generate postgres password
    if [ -z "$DB_PASSWORD" ]; then
        DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    fi
    echo -n "$DB_PASSWORD" > secrets/postgres_password.txt
    chmod 600 secrets/postgres_password.txt
    
    # Generate JWT secrets
    openssl rand -base64 64 | tr -d "=+/" | cut -c1-64 > secrets/jwt_secret.txt
    chmod 600 secrets/jwt_secret.txt
    
    openssl rand -base64 64 | tr -d "=+/" | cut -c1-64 > secrets/jwt_refresh_secret.txt
    chmod 600 secrets/jwt_refresh_secret.txt
    
    openssl rand -base64 64 | tr -d "=+/" | cut -c1-64 > secrets/session_secret.txt
    chmod 600 secrets/session_secret.txt
    
    show_success "Secrets generated"
fi

# Step 4: Create .env file
show_progress "Creating environment configuration"

# Backup existing .env
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    show_info "Backed up existing .env"
fi

# Read generated password
if [ -f secrets/postgres_password.txt ]; then
    DB_PASSWORD=$(cat secrets/postgres_password.txt)
fi

# Create DATABASE_URL
if [ "$CONTAINER_CMD" = "none" ]; then
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"
else
    DATABASE_URL="postgresql://mealplanner:${DB_PASSWORD}@localhost:5432/meal_planner"
fi

# Create .env file
cat > .env << EOF
# Environment Configuration
# Generated by first-time-setup.sh on $(date)

# Environment
NODE_ENV=$NODE_ENV

# Database Configuration
DATABASE_URL="$DATABASE_URL"
POSTGRES_PASSWORD="$DB_PASSWORD"

# JWT Secrets (loaded from secrets files in production)
JWT_SECRET=$(cat secrets/jwt_secret.txt 2>/dev/null || echo "CHANGE_ME_IN_PRODUCTION")
JWT_REFRESH_SECRET=$(cat secrets/jwt_refresh_secret.txt 2>/dev/null || echo "CHANGE_ME_IN_PRODUCTION")

# External APIs (optional - add your keys here)
# SPOONACULAR_API_KEY=your_key_here
# EDAMAM_APP_ID=your_app_id_here
# EDAMAM_APP_KEY=your_app_key_here

# Server Configuration
PORT=3000
HOST=0.0.0.0

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:8080

EOF

show_success ".env file created"

# Step 5: Set up container network (if using containers)
if [ "$CONTAINER_CMD" != "none" ]; then
    show_progress "Setting up container network"
    
    if $CONTAINER_CMD network exists meals-network 2>/dev/null; then
        show_info "Network meals-network already exists"
    else
        $CONTAINER_CMD network create meals-network
        show_success "Network meals-network created"
    fi
fi

# Step 6: Start database container (if using containers)
if [ "$CONTAINER_CMD" != "none" ]; then
    show_progress "Starting database container"
    
    if [ -f "podman-compose.yml" ]; then
        $COMPOSE_CMD up -d postgres
        show_success "Database container started"
        
        # Wait for database to be ready
        show_info "Waiting for database to be ready..."
        sleep 5
        
        for i in {1..30}; do
            if $CONTAINER_CMD exec meals-postgres pg_isready -U mealplanner > /dev/null 2>&1; then
                show_success "Database is ready"
                break
            fi
            if [ $i -eq 30 ]; then
                show_error "Database failed to start"
                exit 1
            fi
            sleep 1
        done
    else
        show_error "podman-compose.yml not found"
        exit 1
    fi
fi

# Step 7: Install dependencies
if [ "$INSTALL_DEPS" = "yes" ]; then
    show_progress "Installing backend dependencies"
    
    cd backend
    $PACKAGE_MANAGER install
    show_success "Backend dependencies installed"
    cd ..
    
    show_progress "Installing frontend dependencies"
    
    cd frontend
    $PACKAGE_MANAGER install
    show_success "Frontend dependencies installed"
    cd ..
fi

# Step 8: Generate Prisma client
show_progress "Generating Prisma client"

cd backend
$PACKAGE_MANAGER run prisma:generate
show_success "Prisma client generated"
cd ..

# Step 9: Run database migrations
if [ "$RUN_MIGRATIONS" = "yes" ]; then
    show_progress "Running database migrations"
    
    cd backend
    if [ "$NODE_ENV" = "production" ]; then
        $PACKAGE_MANAGER run prisma migrate deploy
    else
        $PACKAGE_MANAGER run prisma migrate dev
    fi
    show_success "Database migrations completed"
    cd ..
fi

# Step 10: Seed database (development only)
if [ "$NODE_ENV" = "development" ] && [ "$RUN_MIGRATIONS" = "yes" ]; then
    show_progress "Seeding database with test data"
    
    cd backend
    $PACKAGE_MANAGER run prisma:seed
    show_success "Database seeded"
    cd ..
fi

# Step 11: Create initial backup
if [ "$CREATE_BACKUP" = "yes" ]; then
    show_progress "Creating initial database backup"
    
    if [ -f "./scripts/pre-migration-backup.sh" ]; then
        chmod +x ./scripts/pre-migration-backup.sh
        ./scripts/pre-migration-backup.sh > /dev/null 2>&1
        show_success "Initial backup created"
    else
        show_info "Backup script not found, skipping"
    fi
fi

# Step 12: Final verification
show_progress "Verifying setup"

# Check database connection
if [ "$CONTAINER_CMD" != "none" ]; then
    if $CONTAINER_CMD exec meals-postgres psql -U mealplanner -d meal_planner -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1; then
        show_success "Database connection verified"
    else
        show_error "Database connection failed"
    fi
else
    if PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        show_success "Database connection verified"
    else
        show_error "Database connection failed"
    fi
fi

# Check .env file
if [ -f .env ] && grep -q "DATABASE_URL" .env; then
    show_success ".env file configured"
else
    show_error ".env file missing or incomplete"
fi

# Check secrets
if [ -f secrets/postgres_password.txt ] && [ -f secrets/jwt_secret.txt ]; then
    show_success "Secrets generated"
else
    show_error "Secrets missing"
fi

# ============================================================================
# COMPLETION
# ============================================================================

echo ""
echo -e "${BOLD}${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                    Setup Complete! 🎉                        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""

echo -e "${BOLD}${CYAN}Next Steps:${NC}"
echo ""

if [ "$NODE_ENV" = "development" ]; then
    echo -e "${YELLOW}1. Start the development servers:${NC}"
    echo -e "   ${GREEN}# Backend:${NC}"
    echo -e "   cd backend && $PACKAGE_MANAGER run dev"
    echo ""
    echo -e "   ${GREEN}# Frontend (in another terminal):${NC}"
    echo -e "   cd frontend && $PACKAGE_MANAGER run dev"
    echo ""
    echo -e "${YELLOW}2. Access the application:${NC}"
    echo -e "   Frontend: ${GREEN}http://localhost:5173${NC}"
    echo -e "   Backend API: ${GREEN}http://localhost:3000${NC}"
    echo ""
    echo -e "${YELLOW}3. Test login credentials:${NC}"
    echo -e "   Email: ${GREEN}test@example.com${NC}"
    echo -e "   Password: ${GREEN}TestPass123!${NC}"
else
    echo -e "${YELLOW}1. Start the application:${NC}"
    echo -e "   ${GREEN}$COMPOSE_CMD up -d${NC}"
    echo ""
    echo -e "${YELLOW}2. Access the application:${NC}"
    echo -e "   ${GREEN}http://localhost:8080${NC}"
    echo ""
    echo -e "${YELLOW}3. Register your account:${NC}"
    echo -e "   Visit the registration page and create your account"
fi

echo ""
echo -e "${BOLD}${CYAN}Important Files:${NC}"
echo -e "  Configuration: ${GREEN}.env${NC}"
echo -e "  Secrets: ${GREEN}secrets/${NC}"
echo -e "  Backups: ${GREEN}data/backups/${NC}"
echo -e "  Documentation: ${GREEN}docs/${NC}"
echo ""

echo -e "${BOLD}${CYAN}Useful Commands:${NC}"
echo -e "  Create backup: ${GREEN}./scripts/pre-migration-backup.sh${NC}"
echo -e "  Safe migration: ${GREEN}./scripts/safe-migrate.sh${NC}"
echo -e "  View logs: ${GREEN}$COMPOSE_CMD logs -f${NC}"
echo -e "  Stop services: ${GREEN}$COMPOSE_CMD down${NC}"
echo ""

echo -e "${BOLD}${YELLOW}⚠️  Security Reminders:${NC}"
echo -e "  • Never commit .env or secrets/ to version control"
echo -e "  • Run weekly backups: ${GREEN}./scripts/pre-migration-backup.sh${NC}"
echo -e "  • Keep your secrets secure and backed up"
echo ""

echo -e "${GREEN}Setup completed successfully!${NC}"
echo ""

# Made with Bob
