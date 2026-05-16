#!/bin/bash

# Pull pre-built container image from GitHub Container Registry and deploy on Pi.
#
# This is faster than building on Pi because GitHub runners are far more powerful
# than the Pi 4B (more RAM, faster CPU, datacenter-speed npm access) and produce
# ARM64 images via QEMU emulation. The Pi only needs to pull and restart.
#
# The backend image is a multi-stage build that includes the compiled React frontend
# at /app/public/ — so only one image needs to be pulled.
#
# Usage:
#   ./scripts/pi-deploy-registry.sh                # pull latest (= current main)
#   ./scripts/pi-deploy-registry.sh main-abc1234   # pull a specific SHA tag
#
# Prerequisites:
#   - GitHub Actions workflow has built and pushed the image
#   - For private repos: create ./secrets/ghcr_token.txt with a PAT (read:packages scope)
#   - For public repos: no token needed

set -e

TAG="${1:-latest}"

REGISTRY="ghcr.io"
IMAGE_OWNER="edidriksen"
REMOTE_IMAGE="${REGISTRY}/${IMAGE_OWNER}/mealplanner-backend:${TAG}"
LOCAL_IMAGE="meals-backend:latest"
GHCR_TOKEN_FILE="./secrets/ghcr_token.txt"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🚀 Deploying Meal Planner from GitHub Container Registry...${NC}"
echo -e "${BLUE}   Image: ${REMOTE_IMAGE}${NC}"
echo ""

# ── Prerequisites ───────────────────────────────────────────────────────────────

if ! command -v podman &> /dev/null; then
    echo -e "${RED}❌ Podman is not installed${NC}"
    echo "Install with: sudo apt-get install -y podman"
    exit 1
fi

if ! podman-compose --version &> /dev/null; then
    echo -e "${RED}❌ podman-compose is not installed${NC}"
    echo "Install with: pip3 install podman-compose"
    exit 1
fi

# ── Disk space check ────────────────────────────────────────────────────────────

DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 70 ]; then
    echo -e "${YELLOW}⚠️  Disk usage is ${DISK_USAGE}% — pulling a new image may fail${NC}"
    echo -e "${YELLOW}   Consider running first: ./scripts/cleanup-pi.sh${NC}"
    echo -e "${YELLOW}   Or prune old images:    podman image prune -a${NC}"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# ── GHCR authentication ─────────────────────────────────────────────────────────

if [ -f "$GHCR_TOKEN_FILE" ]; then
    echo -e "${BLUE}🔐 Logging into GitHub Container Registry...${NC}"
    GHCR_TOKEN=$(cat "$GHCR_TOKEN_FILE")
    if echo "$GHCR_TOKEN" | podman login "$REGISTRY" -u "$IMAGE_OWNER" --password-stdin; then
        echo -e "${GREEN}✓ Authenticated with GHCR${NC}"
    else
        echo -e "${RED}❌ Login failed — check the token in ${GHCR_TOKEN_FILE}${NC}"
        echo -e "${YELLOW}   Token needs 'read:packages' scope (classic PAT)${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  No token file at ${GHCR_TOKEN_FILE}${NC}"
    echo -e "${YELLOW}   Proceeding without login — only works for public packages${NC}"
    echo -e "${YELLOW}   To create the token file:${NC}"
    echo -e "      echo 'ghp_yourtoken' > ./secrets/ghcr_token.txt${NC}"
    echo ""
fi

# ── Pull image ──────────────────────────────────────────────────────────────────

echo ""
echo -e "${YELLOW}📥 Pulling backend image (includes compiled frontend)...${NC}"
echo -e "${BLUE}   This typically takes 3–8 minutes on a home connection.${NC}"
PULL_START=$(date +%s)

if ! podman pull "$REMOTE_IMAGE"; then
    echo ""
    echo -e "${RED}❌ Pull failed${NC}"
    echo -e "${YELLOW}Common causes:${NC}"
    echo -e "   - GitHub Actions hasn't finished building (check the Actions tab)"
    echo -e "   - Package is private and no token was provided"
    echo -e "   - Tag '${TAG}' doesn't exist (available: latest, main, develop, main-<sha>)"
    echo -e "   - Network issue — retry in a moment"
    exit 1
fi

PULL_END=$(date +%s)
PULL_DURATION=$((PULL_END - PULL_START))
echo -e "${GREEN}✓ Pulled in $((PULL_DURATION / 60))m $((PULL_DURATION % 60))s${NC}"

# ── Retag for local compose ─────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}🏷️  Tagging as ${LOCAL_IMAGE} (required by podman-compose.pi.yml)...${NC}"
podman tag "$REMOTE_IMAGE" "$LOCAL_IMAGE"
echo -e "${GREEN}✓ Tagged${NC}"

# ── Extract frontend static files ───────────────────────────────────────────────
#
# The backend image is a multi-stage build. The compiled React app lives at
# /app/public/ inside the image. Nginx on Pi serves these files directly from
# ./data/frontend-dist/ — there is no frontend container on the Pi.

echo ""
echo -e "${BLUE}📦 Extracting frontend static files from image...${NC}"
mkdir -p ./data/frontend-dist
rm -rf ./data/frontend-dist/*
podman run --rm \
    -v "$(pwd)/data/frontend-dist:/output:z" \
    "$LOCAL_IMAGE" \
    sh -c "cp -rp /app/public/. /output/"
FILE_COUNT=$(ls ./data/frontend-dist | wc -l)
echo -e "${GREEN}✓ Extracted ${FILE_COUNT} files to ./data/frontend-dist/${NC}"

# ── Remove remote-tagged copy (keep only the local tag) ─────────────────────────
#
# podman pull leaves two references to the same image layers: the remote tag
# and the local tag we just created. Removing the remote tag frees the name
# without touching the underlying layers.

echo ""
echo -e "${BLUE}🧹 Removing remote tag (layers are kept under ${LOCAL_IMAGE})...${NC}"
podman rmi "$REMOTE_IMAGE" 2>/dev/null || true
echo -e "${GREEN}✓ Done${NC}"

# ── Show what we've got ─────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}📋 Local image:${NC}"
podman images | grep "meals-backend"
echo ""
echo -e "${BLUE}📁 Frontend dist (first 10 files):${NC}"
ls ./data/frontend-dist | head -10

# ── Hand off to pi-run.sh ───────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}✅ Image ready — starting services...${NC}"
echo ""
bash ./scripts/pi-run.sh

# Made with Bob
