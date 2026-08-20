#!/bin/bash

# Check platform compatibility for Raspberry Pi deployment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

section "Platform Check" "🔍"

echo -e "  ${BLUE}Architecture:${NC} $(uname -m)"
echo -e "  ${BLUE}OS:${NC}           $(uname -s)"
echo -e "  ${BLUE}Kernel:${NC}       $(uname -r)"
echo ""

ARCH="$(uname -m)"
if [ "$ARCH" = "armv7l" ]; then
    echo -e "  ${YELLOW}⚠️  Running on 32-bit ARM (armv7l)${NC}"
    echo -e "     Images should be built for linux/arm/v7"
    echo ""
    echo -e "  ${BLUE}ℹ️  Recommendations:${NC}"
    echo -e "     1. Build images with: --platform linux/arm/v7"
    echo -e "     2. Or upgrade to 64-bit Raspberry Pi OS for better compatibility"
elif [ "$ARCH" = "aarch64" ]; then
    echo -e "  ${GREEN}✓${NC}  Running on 64-bit ARM (aarch64)"
    echo -e "     Images should be built for linux/arm64/v8"
    echo ""
    echo -e "  ${BLUE}ℹ️  Recommendations:${NC}"
    echo -e "     1. Build images with: --platform linux/arm64/v8"
    echo -e "     2. Current setup should work correctly"
else
    echo -e "  ${YELLOW}⚠️  Unknown architecture: ${ARCH}${NC}"
fi

section "Image Platforms" "📦"

if command -v podman &> /dev/null; then
    for image in meals-backend meals-frontend; do
        if podman images --format "{{.Repository}}" | grep -q "^localhost/$image$\|^$image$"; then
            echo ""
            echo -e "  ${BOLD}Image:${NC} $image"
            podman inspect localhost/$image 2>/dev/null || podman inspect $image 2>/dev/null | \
                jq -r '.[] | "    Platform: \(.Os)/\(.Architecture)\(.Variant // "")"' 2>/dev/null || \
                echo -e "    ${YELLOW}⚠️  Unable to determine platform${NC}"
        fi
    done
    echo ""
    echo -e "  ${BLUE}ℹ️  Available images:${NC}"
    podman images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.Created}}" | grep -E "REPOSITORY|meals-" | sed 's/^/    /'
else
    echo -e "  ${RED}✗ Podman not installed${NC}"
fi
