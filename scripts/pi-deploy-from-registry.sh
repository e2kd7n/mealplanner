#!/bin/bash

# Deploy pre-built container images from GitHub Container Registry to Raspberry Pi
# This script pulls images built by GitHub Actions instead of building locally

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

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

# Extract frontend static files from the pulled backend image
# (Pi serves the frontend as static files via Nginx — no frontend container)
echo -e "${YELLOW}📦 Extracting frontend static files from backend image...${NC}"
extract_frontend_from_image
echo ""

# Verify
echo -e "${BLUE}📦 Verifying assets...${NC}"
echo -e "${BLUE}Backend image:${NC}"
podman inspect meals-backend:latest --format '  Architecture: {{.Architecture}}, OS: {{.Os}}, Size: {{.Size}}' 2>/dev/null || echo "  Image info not available"
echo -e "${BLUE}Frontend dist:${NC}"
ls ./data/frontend-dist | head -5
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
wait_for "Waiting for backend to be healthy" 65 2 curl -f http://localhost:3000/health || {
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo -e "${YELLOW}Check logs: podman logs meals-backend${NC}"
    exit 1
}

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
echo -e "   App:     http://$(hostname -I | awk '{print $1}'):8080"
echo -e "   Health:  http://localhost:8080/health"

# Made with Bob
