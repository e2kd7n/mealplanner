#!/bin/bash

# Re-extract frontend static files from the already-built backend image
# Use this to refresh ./data/frontend-dist/ without a full rebuild.
# The frontend is embedded in meals-backend:latest at /app/public (built via
# multi-stage Dockerfile). For a full rebuild including frontend changes,
# use ./scripts/build-on-pi.sh instead.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

echo -e "${GREEN}📦 Re-extracting frontend static files from backend image...${NC}"

# Check if podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "${RED}❌ Podman is not installed${NC}"
    exit 1
fi

# Check backend image exists
if ! podman images | grep -q "meals-backend"; then
    echo -e "${RED}❌ meals-backend image not found${NC}"
    echo -e "${YELLOW}Build the backend first: ${GREEN}./scripts/build-on-pi.sh${NC}"
    exit 1
fi

echo -e "${BLUE}ℹ️  Extracting from meals-backend:latest /app/public ...${NC}"

extract_frontend_from_image
echo ""
echo -e "${BLUE}📁 Extracted files:${NC}"
ls ./data/frontend-dist
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "   If app is running: ${GREEN}./scripts/pi-bounce.sh${NC}"
echo -e "   To start fresh:    ${GREEN}./scripts/pi-run.sh${NC}"

