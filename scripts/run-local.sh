#!/bin/bash

# Run the Meal Planner application locally for development
# This script starts only the database container and local dev services

set -e

echo "🚀 Starting Meal Planner in local development mode..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "${RED}❌ Podman is not installed.${NC}"
    echo -e "${YELLOW}Install with: brew install podman${NC}"
    exit 1
fi

# Check if podman machine is running (macOS/Windows)
if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "msys" ]]; then
    if ! podman machine list | grep -q "Currently running"; then
        echo -e "${YELLOW}⚠️  Podman machine not running. Starting...${NC}"
        podman machine start
        sleep 5
    fi
fi

# Generate secrets if they don't exist
if [ ! -f "./secrets/postgres_password.txt" ]; then
    echo -e "${YELLOW}⚠️  Secrets not found. Generating...${NC}"
    ./scripts/generate-secrets.sh
fi

# Check if backend .env exists
if [ ! -f "./backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Backend .env not found. Creating from example...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${RED}⚠️  IMPORTANT: Update backend/.env with secrets from secrets/ directory${NC}"
fi

# Check if frontend .env exists
if [ ! -f "./frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  Frontend .env not found. Creating from example...${NC}"
    cp frontend/.env.example frontend/.env
    # Update for local development
    sed -i '' 's|VITE_API_URL=/api|VITE_API_URL=http://localhost:3000/api|g' frontend/.env
fi

# Stop and remove existing database container if it exists
echo -e "${YELLOW}🛑 Stopping existing database container...${NC}"
podman stop meals-postgres 2>/dev/null || true
podman rm meals-postgres 2>/dev/null || true

# Start PostgreSQL database container
echo -e "${GREEN}🗄️  Starting PostgreSQL database container...${NC}"
POSTGRES_PASSWORD=$(cat secrets/postgres_password.txt)
podman run -d \
    --name meals-postgres \
    --restart unless-stopped \
    -p 5432:5432 \
    -e POSTGRES_DB=meal_planner \
    -e POSTGRES_USER=mealplanner \
    -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    -v postgres_data:/var/lib/postgresql/data \
    -v ./database/init:/docker-entrypoint-initdb.d:ro \
    --health-cmd "pg_isready -U mealplanner -d meal_planner" \
    --health-interval 10s \
    --health-timeout 5s \
    --health-retries 5 \
    docker.io/library/postgres:16-alpine

# Wait for database to be healthy
echo -e "${YELLOW}⏳ Waiting for database to be healthy...${NC}"
for i in {1..30}; do
    if podman exec meals-postgres pg_isready -U mealplanner -d meal_planner &>/dev/null; then
        echo -e "${GREEN}✓ Database is healthy${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Database failed to become healthy${NC}"
        podman logs meals-postgres
        exit 1
    fi
    sleep 1
done

# Check if backend dependencies are installed
if [ ! -d "./backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "./frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
fi

# Run database migrations
echo -e "${GREEN}🔄 Running database migrations...${NC}"
cd backend && npx prisma migrate deploy && cd ..

echo ""
echo -e "${GREEN}✅ Database container is running!${NC}"
echo ""
echo -e "${BLUE}📊 Container status:${NC}"
podman ps --filter name=meals-postgres --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo -e "${YELLOW}🚀 Now start the local development services:${NC}"
echo ""
echo -e "${BLUE}Terminal 1 - Backend:${NC}"
echo -e "   ${GREEN}cd backend && npm run dev${NC}"
echo ""
echo -e "${BLUE}Terminal 2 - Frontend:${NC}"
echo -e "   ${GREEN}cd frontend && npm run dev${NC}"
echo ""
echo -e "${BLUE}📱 Once started, access the application:${NC}"
echo -e "   🌐 Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "   🔧 Backend API: ${GREEN}http://localhost:3000/api${NC}"
echo -e "   ❤️  Health Check: ${GREEN}http://localhost:3000/health${NC}"
echo -e "   🗄️  Database: ${GREEN}localhost:5432${NC}"
echo ""
echo -e "${BLUE}📝 Test Credentials:${NC}"
echo -e "   Email: ${GREEN}test@example.com${NC}"
echo -e "   Password: ${GREEN}TestPass123!${NC}"
echo ""
echo -e "${BLUE}📝 Useful commands:${NC}"
echo -e "   View DB logs:     ${GREEN}podman logs -f meals-postgres${NC}"
echo -e "   Stop database:    ${GREEN}podman stop meals-postgres${NC}"
echo -e "   Restart database: ${GREEN}podman restart meals-postgres${NC}"
echo -e "   DB shell:         ${GREEN}podman exec -it meals-postgres psql -U mealplanner -d meal_planner${NC}"
echo ""
echo -e "${YELLOW}💡 For full production testing, use: podman-compose up -d${NC}"

# Made with Bob