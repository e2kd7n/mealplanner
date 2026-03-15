#!/bin/bash
# Secrets Generation Script for Meal Planner Application - Enhanced Security Edition
# This script generates secure random passwords and stores them in Docker secrets files
# with metadata and integrity checksums
# Usage: ./scripts/generate-secrets.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Secrets directory
SECRETS_DIR="./secrets"

# Function to generate a secure random password
generate_password() {
    local length=${1:-32}
    openssl rand -base64 48 | tr -d "=+/" | cut -c1-${length}
}

# Function to generate a secure JWT secret (longer)
generate_jwt_secret() {
    openssl rand -base64 64 | tr -d "=+/" | cut -c1-64
}

# Function to generate secret with metadata and checksum
generate_secret_with_metadata() {
    local name=$1
    local length=$2
    local description=$3
    
    echo -e "${BLUE}Generating ${name}...${NC}"
    
    # Generate the secret
    local secret=$(openssl rand -base64 $((length * 2)) | tr -d "=+/" | cut -c1-${length})
    
    # Write secret to file
    echo -n "$secret" > "$SECRETS_DIR/${name}.txt"
    chmod 600 "$SECRETS_DIR/${name}.txt"
    
    # Generate and write checksum
    echo -n "$secret" | shasum -a 256 | cut -d' ' -f1 > "$SECRETS_DIR/${name}.txt.sha256"
    chmod 600 "$SECRETS_DIR/${name}.txt.sha256"
    
    # Generate and write metadata
    cat > "$SECRETS_DIR/${name}.txt.metadata" << EOF
{
  "name": "${name}",
  "description": "${description}",
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "expiresAt": "$(date -u -v+90d +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d '+90 days' +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || echo 'null')",
  "rotationDue": "$(date -u -v+75d +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d '+75 days' +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || echo 'null')",
  "algorithm": "openssl-rand-base64",
  "length": ${length},
  "version": 1
}
EOF
    chmod 600 "$SECRETS_DIR/${name}.txt.metadata"
    
    echo -e "${GREEN}✓ Generated ${name} (${length} chars) with metadata and checksum${NC}"
}

# Function to backup existing secret as previous version
backup_as_previous() {
    local name=$1
    
    if [ -f "$SECRETS_DIR/${name}.txt" ]; then
        echo -e "${YELLOW}Backing up current ${name} as previous version...${NC}"
        cp "$SECRETS_DIR/${name}.txt" "$SECRETS_DIR/${name}.txt.previous"
        chmod 600 "$SECRETS_DIR/${name}.txt.previous"
        echo -e "${GREEN}✓ Previous version saved for rotation support${NC}"
    fi
}

echo -e "${GREEN}=== Meal Planner Secrets Generator - Enhanced Security Edition ===${NC}"
echo ""

# Check if secrets directory exists
if [ -d "$SECRETS_DIR" ]; then
    echo -e "${YELLOW}Warning: Secrets directory already exists.${NC}"
    read -p "Do you want to regenerate all secrets? This will overwrite existing secrets. (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Aborted. No secrets were changed.${NC}"
        exit 1
    fi
    
    # Create timestamped backup
    echo -e "${YELLOW}Creating timestamped backup of existing secrets...${NC}"
    backup_dir="${SECRETS_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
    cp -r "$SECRETS_DIR" "$backup_dir"
    echo -e "${GREEN}✓ Backup created: ${backup_dir}${NC}"
    echo ""
    
    # Backup current secrets as previous versions for rotation support
    echo -e "${BLUE}Preparing for secret rotation...${NC}"
    backup_as_previous "postgres_password"
    backup_as_previous "redis_password"
    backup_as_previous "jwt_secret"
    backup_as_previous "jwt_refresh_secret"
    backup_as_previous "session_secret"
    echo ""
fi

# Create secrets directory
mkdir -p "$SECRETS_DIR"
chmod 700 "$SECRETS_DIR"

echo -e "${GREEN}Generating secure secrets with metadata and integrity checksums...${NC}"
echo ""

# Generate PostgreSQL password
generate_secret_with_metadata "postgres_password" 32 "PostgreSQL database password"

# Generate Redis password
generate_secret_with_metadata "redis_password" 32 "Redis cache password"

# Generate JWT secret
generate_secret_with_metadata "jwt_secret" 64 "JWT access token signing secret"

# Generate JWT refresh secret
generate_secret_with_metadata "jwt_refresh_secret" 64 "JWT refresh token signing secret"

# Generate session secret
generate_secret_with_metadata "session_secret" 48 "Express session secret"

echo ""
echo -e "${GREEN}✓ All secrets generated successfully!${NC}"
echo -e "${YELLOW}⚠ Secrets are stored in: $SECRETS_DIR${NC}"
echo -e "${YELLOW}⚠ These files contain sensitive data and should NEVER be committed to version control${NC}"
echo ""

# Display secret information
echo -e "${BLUE}=== Secret Information ===${NC}"
for secret_file in "$SECRETS_DIR"/*.txt; do
    if [ -f "$secret_file" ]; then
        secret_name=$(basename "$secret_file" .txt)
        if [ "$secret_name" != "*.txt" ]; then
            secret_length=$(wc -c < "$secret_file" | tr -d ' ')
            checksum_file="${secret_file}.sha256"
            metadata_file="${secret_file}.metadata"
            
            echo -e "${GREEN}${secret_name}:${NC}"
            echo -e "  Length: ${secret_length} characters"
            
            if [ -f "$checksum_file" ]; then
                checksum=$(cat "$checksum_file")
                echo -e "  Checksum: ${checksum:0:16}..."
            fi
            
            if [ -f "$metadata_file" ]; then
                rotation_due=$(grep -o '"rotationDue": "[^"]*"' "$metadata_file" | cut -d'"' -f4)
                if [ "$rotation_due" != "null" ]; then
                    echo -e "  Rotation Due: ${rotation_due}"
                fi
            fi
            echo ""
        fi
    fi
done

# Create .env file with references to secrets (for local development)
ENV_FILE="./backend/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${GREEN}Creating backend/.env file with secret references...${NC}"
    cat > "$ENV_FILE" << 'EOF'
# Backend Environment Variables
# Generated by generate-secrets.sh - Enhanced Security Edition

# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Security Configuration
ALLOW_SECRET_ENV_FALLBACK=true
ENABLE_SECRET_AUDIT_LOG=false

# Database (secrets loaded from files in Docker)
DATABASE_URL=postgresql://mealplanner:$(cat /run/secrets/postgres_password)@localhost:5432/meal_planner
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=meal_planner
POSTGRES_USER=mealplanner

# Redis (secrets loaded from files in Docker)
REDIS_URL=redis://:$(cat /run/secrets/redis_password)@localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration (secrets loaded from files in Docker)
# Shorter token lifetimes for improved security
JWT_EXPIRES_IN=10m
JWT_REFRESH_EXPIRES_IN=1d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# External APIs (Optional for MVP)
SPOONACULAR_API_KEY=
EDAMAM_APP_ID=
EDAMAM_APP_KEY=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
LOG_FORMAT=dev

# Password Policy Configuration
PASSWORD_MIN_LENGTH=8
PASSWORD_MAX_LENGTH=128
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_SPECIAL=true
PASSWORD_MIN_UPPERCASE=1
PASSWORD_MIN_LOWERCASE=1
PASSWORD_MIN_NUMBERS=1
PASSWORD_MIN_SPECIAL=1
EOF
    echo -e "${GREEN}✓ Created backend/.env file${NC}"
else
    echo -e "${YELLOW}⚠ backend/.env already exists. Skipping creation.${NC}"
    echo -e "${YELLOW}  You may need to manually update it to reference the new secrets.${NC}"
fi

echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo -e "Next steps:"
echo -e "1. Review the generated secrets in: ${YELLOW}$SECRETS_DIR${NC}"
echo -e "2. Start your services with: ${YELLOW}docker-compose up -d${NC}"
echo -e "3. For local development without Docker, manually set environment variables from secrets files"
echo ""
echo -e "${BLUE}Security Features:${NC}"
echo -e "  ✓ Cryptographically secure random generation"
echo -e "  ✓ SHA-256 integrity checksums"
echo -e "  ✓ Metadata with expiration tracking"
echo -e "  ✓ Previous version backup for rotation support"
echo -e "  ✓ Timestamped backups of old secrets"
echo ""
echo -e "${YELLOW}Security Reminders:${NC}"
echo -e "  • Rotate secrets every 90 days (tracked in metadata)"
echo -e "  • Never commit secrets to version control"
echo -e "  • Use different secrets for each environment"
echo -e "  • Keep backups encrypted and secure"
echo ""
echo -e "${RED}IMPORTANT: Add '$SECRETS_DIR/' to your .gitignore if not already present!${NC}"

# Made with Bob
