#!/bin/bash

# Run the Meal Planner application locally for development
# This script starts the database container and local dev services, then opens the UI in Chrome
# ⚠️  FOR LOCAL DEVELOPMENT ONLY - Use pi-run.sh on Raspberry Pi

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect if running on Raspberry Pi
if [ -f /proc/device-tree/model ]; then
    PI_MODEL=$(cat /proc/device-tree/model 2>/dev/null | tr -d '\0')
    if [[ "$PI_MODEL" == *"Raspberry Pi"* ]]; then
        echo -e "${RED}❌ ERROR: This is a LOCAL DEVELOPMENT script!${NC}"
        echo ""
        echo -e "${YELLOW}For Raspberry Pi deployment, use:${NC}"
        echo -e "  ${GREEN}./scripts/pi-run.sh${NC}"
        echo ""
        echo -e "${BLUE}This script runs services directly (not in containers)${NC}"
        echo -e "${BLUE}and is intended for development machines only.${NC}"
        echo ""
        exit 1
    fi
fi

echo "🚀 Starting Meal Planner in local development mode..."

# Cleanup function to kill background processes on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    echo -e "${GREEN}✅ Services stopped${NC}"
}

trap cleanup EXIT INT TERM

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
echo -e "${YELLOW}🛑 Resetting existing database container...${NC}"
podman stop meals-postgres >/dev/null 2>&1 || true
podman rm meals-postgres >/dev/null 2>&1 || true

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
    docker.io/library/postgres:16-alpine >/dev/null

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

# Start backend in background
echo -e "${BLUE}🔧 Starting backend server...${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend failed to start${NC}"
        echo -e "${YELLOW}Backend logs:${NC}"
        tail -20 backend.log
        exit 1
    fi
    sleep 1
done

# Start frontend in background
echo -e "${BLUE}🌐 Starting frontend server...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
echo -e "${YELLOW}⏳ Waiting for frontend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is healthy${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Frontend failed to start${NC}"
        echo -e "${YELLOW}Frontend logs:${NC}"
        tail -20 frontend.log
        exit 1
    fi
    sleep 1
done

echo ""
echo -e "${GREEN}✅ All services are running!${NC}"
echo ""

# Open Chrome with the application
echo -e "${BLUE}🌐 Opening application in Chrome...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open -a "Google Chrome" http://localhost:5173 2>/dev/null
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v google-chrome &> /dev/null; then
        google-chrome http://localhost:5173 &>/dev/null &
    elif command -v chromium-browser &> /dev/null; then
        chromium-browser http://localhost:5173 &>/dev/null &
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Call check-deployment-mode.sh as the source of truth
if [ -f "./scripts/check-deployment-mode.sh" ]; then
    bash ./scripts/check-deployment-mode.sh
else
    # Fallback if script doesn't exist
    echo -e "${BLUE}📱 Access your application at:${NC}"
    echo -e "   ${GREEN}👉 http://localhost:5173${NC}"
    echo ""
    echo -e "${BLUE}🔧 Backend API:${NC} http://localhost:3000/api"
    echo -e "${BLUE}❤️  Health Check:${NC} http://localhost:3000/health"
    echo ""
    if [ -n "$CALLED_FROM_MENU" ]; then
        echo -e "${BLUE}🛑 To stop:${NC} Use menu option 3 (Stop all services)"
    else
        echo -e "${BLUE}🛑 To stop:${NC} Press Ctrl+C or run ./scripts/local-stop.sh"
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}📝 Test Credentials:${NC}"
echo -e "   Email: ${GREEN}test@example.com${NC}"
echo -e "   Password: ${GREEN}TestPass123!${NC}"
echo ""
echo -e "${BLUE}📝 Useful commands:${NC}"
echo -e "   View backend logs:  ${GREEN}tail -f backend.log${NC}"
echo -e "   View frontend logs: ${GREEN}tail -f frontend.log${NC}"
echo -e "   View DB logs:       ${GREEN}podman logs -f meals-postgres${NC}"
echo ""
if [ -n "$CALLED_FROM_MENU" ]; then
    echo -e "${YELLOW}Use menu option 3 to stop all services${NC}"
    echo ""
    trap - EXIT INT TERM
    echo -e "${GREEN}✅ Services started and detached successfully${NC}"
    echo -e "${BLUE}Returning to menu...${NC}"
    sleep 2
else
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    echo ""
    # Keep script running and show logs when called directly
    tail -f backend.log frontend.log
fi

# Made with Bob