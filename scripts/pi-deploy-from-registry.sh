#!/bin/bash

# Deploy pre-built container images from GitHub Container Registry to Raspberry Pi
# This script pulls images built by GitHub Actions instead of building locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="ghcr.io"
REPO_OWNER="${GITHUB_REPO_OWNER:-$(git config --get remote.origin.url | sed -n 's/.*github.com[:/]\([^/]*\).*/\1/p')}"
IMAGE_TAG="${1:-latest}"

echo -e "${GREEN}🚀 Deploying from GitHub Container Registry...${NC}"
echo -e "${BLUE}Registry: ${REGISTRY}${NC}"
echo -e "${BLUE}Repository: ${REPO_OWNER}/mealplanner${NC}"
echo -e "${BLUE}Tag: ${IMAGE_TAG}${NC}"
echo ""

# Check if we need authentication
if [ -n "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}🔐 Logging in to registry...${NC}"
    echo "$GITHUB_TOKEN" | podman login $REGISTRY -u $REPO_OWNER --password-stdin
    echo -e "${GREEN}✅ Logged in successfully${NC}"
    echo ""
elif [ -f ~/.docker/config.json ] || [ -f ~/.config/containers/auth.json ]; then
    echo -e "${BLUE}ℹ️  Using existing authentication${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  No authentication found. If images are private, set GITHUB_TOKEN${NC}"
    echo -e "${BLUE}   export GITHUB_TOKEN='your_token_here'${NC}"
    echo ""
fi

# Pull backend image
echo -e "${YELLOW}📥 Pulling backend image...${NC}"
BACKEND_IMAGE="$REGISTRY/$REPO_OWNER/mealplanner-backend:$IMAGE_TAG"
if podman pull $BACKEND_IMAGE; then
    echo -e "${GREEN}✅ Backend image pulled successfully${NC}"
    # Tag as latest for local use
    podman tag $BACKEND_IMAGE meals-backend:latest
else
    echo -e "${RED}❌ Failed to pull backend image${NC}"
    echo -e "${YELLOW}💡 Make sure:${NC}"
    echo -e "   1. GitHub Actions workflow has run successfully"
    echo -e "   2. Images are public or GITHUB_TOKEN is set"
    echo -e "   3. Repository owner is correct: ${REPO_OWNER}"
    exit 1
fi
echo ""

# Pull frontend image
echo -e "${YELLOW}📥 Pulling frontend image...${NC}"
FRONTEND_IMAGE="$REGISTRY/$REPO_OWNER/mealplanner-frontend:$IMAGE_TAG"
if podman pull $FRONTEND_IMAGE; then
    echo -e "${GREEN}✅ Frontend image pulled successfully${NC}"
    # Tag as latest for local use
    podman tag $FRONTEND_IMAGE meals-frontend:latest
else
    echo -e "${RED}❌ Failed to pull frontend image${NC}"
    exit 1
fi
echo ""

# Verify images
echo -e "${BLUE}📦 Verifying images...${NC}"
echo -e "${BLUE}Backend:${NC}"
podman inspect meals-backend:latest --format '  Architecture: {{.Architecture}}, OS: {{.Os}}, Size: {{.Size}}' 2>/dev/null || echo "  Image info not available"
echo -e "${BLUE}Frontend:${NC}"
podman inspect meals-frontend:latest --format '  Architecture: {{.Architecture}}, OS: {{.Os}}, Size: {{.Size}}' 2>/dev/null || echo "  Image info not available"
echo ""

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
podman-compose -f podman-compose.pi.yml down 2>/dev/null || true
echo -e "${GREEN}✅ Containers stopped${NC}"
echo ""

# Start new containers
echo -e "${YELLOW}🚀 Starting containers...${NC}"
podman-compose -f podman-compose.pi.yml up -d

# Wait for health checks
echo ""
echo -e "${BLUE}⏳ Waiting for services to be healthy...${NC}"
sleep 5

# Check backend health
for i in {1..30}; do
    if curl -f http://localhost:3000/health 2>/dev/null; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend health check failed${NC}"
        echo -e "${YELLOW}Check logs: podman logs meals-backend${NC}"
        exit 1
    fi
    sleep 2
done

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}📊 Running containers:${NC}"
podman ps --filter "name=meals" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo -e "${YELLOW}💡 Useful commands:${NC}"
echo -e "   View logs:    ${GREEN}podman logs -f meals-backend${NC}"
echo -e "   Stop all:     ${GREEN}podman-compose -f podman-compose.pi.yml down${NC}"
echo -e "   Restart:      ${GREEN}podman-compose -f podman-compose.pi.yml restart${NC}"
echo ""
echo -e "${GREEN}🎉 Your application is now running!${NC}"
echo -e "   Backend:  http://localhost:3000"
echo -e "   Frontend: http://localhost:80"

# Made with Bob
