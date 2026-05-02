#!/bin/bash

# Build container images directly on Raspberry Pi
# This avoids cross-compilation issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🏗️  Building container images on Raspberry Pi...${NC}"

# Check if podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "${RED}❌ Podman is not installed${NC}"
    exit 1
fi

# Build backend image (includes frontend in multi-stage build)
echo -e "${YELLOW}🔨 Building backend image (includes frontend)...${NC}"
echo -e "${BLUE}ℹ️  This is a multi-stage build with 3 stages:${NC}"
echo -e "   ${BLUE}[1/3]${NC} Frontend Builder - Building React app"
echo -e "   ${BLUE}[2/3]${NC} Backend Builder  - Building Node.js backend"
echo -e "   ${BLUE}[3/3]${NC} Production       - Creating final optimized image"
echo ""
echo -e "${BLUE}💡 Progress indicators:${NC}"
echo -e "   ${GREEN}resolved X${NC}   = Total packages identified"
echo -e "   ${GREEN}downloaded X${NC} = Packages fetched from npm (progress %)"
echo -e "   ${GREEN}added X${NC}      = Packages installed to node_modules"
echo ""
podman build \
    --no-cache \
    -t meals-backend:latest \
    -f backend/Dockerfile \
    --build-arg VITE_API_URL=/api \
    . 2>&1 | while IFS= read -r line; do
        echo "$line"
        
        # Detect build stage transitions
        if echo "$line" | grep -q "STEP 1/9.*frontend-builder"; then
            echo -e "${YELLOW}▶️  [1/3] Starting Frontend Builder stage...${NC}"
        elif echo "$line" | grep -q "STEP 1/9.*backend-builder"; then
            echo -e "${YELLOW}▶️  [2/3] Starting Backend Builder stage...${NC}"
        elif echo "$line" | grep -q "STEP 1/"; then
            if echo "$line" | grep -q "FROM.*node:20-alpine$"; then
                echo -e "${YELLOW}▶️  [3/3] Starting Production stage...${NC}"
            fi
        fi
        
        # Detect key operations
        if echo "$line" | grep -q "RUN npm install -g pnpm"; then
            echo -e "${BLUE}   📦 Installing pnpm package manager...${NC}"
        elif echo "$line" | grep -q "RUN pnpm install.*frontend"; then
            echo -e "${BLUE}   📥 Installing frontend dependencies...${NC}"
        elif echo "$line" | grep -q "RUN pnpm build" && echo "$line" | grep -q "frontend"; then
            echo -e "${BLUE}   🔨 Building React application...${NC}"
        elif echo "$line" | grep -q "RUN pnpm install.*backend"; then
            echo -e "${BLUE}   📥 Installing backend dependencies...${NC}"
        elif echo "$line" | grep -q "RUN pnpm prisma generate"; then
            echo -e "${BLUE}   🗄️  Generating Prisma database client...${NC}"
        elif echo "$line" | grep -q "RUN pnpm build" && ! echo "$line" | grep -q "frontend"; then
            echo -e "${BLUE}   🔨 Compiling TypeScript backend...${NC}"
        elif echo "$line" | grep -q "COPY --from=frontend-builder"; then
            echo -e "${BLUE}   📋 Copying built frontend files...${NC}"
        elif echo "$line" | grep -q "COPY --from=backend-builder"; then
            echo -e "${BLUE}   📋 Copying built backend files...${NC}"
        fi
        
        # Extract and display progress percentage for pnpm installs (only show every 10%)
        if echo "$line" | grep -q "Progress: resolved"; then
            resolved=$(echo "$line" | grep -oP 'resolved \K[0-9]+' || echo "0")
            downloaded=$(echo "$line" | grep -oP 'downloaded \K[0-9]+' || echo "0")
            added=$(echo "$line" | grep -oP 'added \K[0-9]+' || echo "0")
            if [ "$resolved" -gt 0 ]; then
                dl_pct=$((downloaded * 100 / resolved))
                add_pct=$((added * 100 / resolved))
                remaining=$((resolved - added))
                
                # Only show progress at 10% intervals or when complete
                if [ $((add_pct % 10)) -eq 0 ] || [ "$remaining" -eq 0 ]; then
                    # Use carriage return to update same line, or newline at milestones
                    if [ $((add_pct % 25)) -eq 0 ] || [ "$remaining" -eq 0 ]; then
                        echo -e "${GREEN}   📊 Download: ${dl_pct}% | Install: ${add_pct}% | Remaining: ${remaining} packages${NC}"
                    else
                        echo -ne "\r${GREEN}   📊 Download: ${dl_pct}% | Install: ${add_pct}% | Remaining: ${remaining} packages${NC}"
                    fi
                fi
            fi
        fi
        
        # Detect stage completion
        if echo "$line" | grep -q "COMMIT meals-backend:latest"; then
            echo -e "${GREEN}   ✅ Build completed successfully!${NC}"
        fi
    done

# Build frontend image using the dedicated frontend build script
echo ""
echo -e "${BLUE}📦 Calling frontend build script...${NC}"
./scripts/build-on-pi-frontend-only.sh

echo -e "${GREEN}✅ Images built successfully!${NC}"
echo ""
echo -e "${BLUE}📦 Built images:${NC}"
podman images | grep meals

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "   Deploy: ${GREEN}./scripts/pi-run.sh${NC}"

# Made with Bob