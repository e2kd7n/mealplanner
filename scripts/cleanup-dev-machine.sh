#!/bin/bash

# Cleanup script for development machine
# Removes old container images, build cache, and temporary files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

section "Dev Machine Cleanup" "🧹"

ensure_podman_runtime
CONTAINER_CMD=$(detect_container_runtime)
if [ -z "$CONTAINER_CMD" ]; then
    echo -e "  ${RED}❌ Neither Podman nor Docker is installed${NC}"
    exit 1
fi
echo -e "  ${BLUE}ℹ️  Using: ${CONTAINER_CMD}${NC}"

section "Current Usage" "🔍"

DISK_BEFORE=$(get_disk_usage_kb)
show_disk_usage

CONTAINER_BEFORE=$($CONTAINER_CMD system df --format "{{.Size}}" 2>/dev/null | head -1 || echo "0B")
echo -e "${BLUE}📦 Container storage usage:${NC}"
$CONTAINER_CMD system df
echo ""

echo -e "  ${RED}⚠️  This will remove:${NC}"
echo -e "     - All stopped containers"
echo -e "     - All unused images (including old meal planner builds)"
echo -e "     - All build cache"
echo -e "     - All unused volumes"
echo -e "     - All unused networks"
echo ""
read -p "  $(echo -e "${RED}Continue? (y/N):${NC}") " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "  ${BLUE}ℹ️  Cleanup cancelled${NC}"
    exit 0
fi

section "Removing" "🧹"

start_spinner "Removing stopped containers"
$CONTAINER_CMD container prune -f &>/dev/null
stop_spinner ok

start_spinner "Removing unused images"
$CONTAINER_CMD image prune -a -f &>/dev/null
stop_spinner ok

start_spinner "Removing unused volumes"
$CONTAINER_CMD volume prune -f &>/dev/null
stop_spinner ok

start_spinner "Removing unused networks"
$CONTAINER_CMD network prune -f &>/dev/null
stop_spinner ok

start_spinner "Removing build cache"
if $CONTAINER_CMD builder prune -a -f &>/dev/null; then
    stop_spinner ok
else
    stop_spinner fail
    echo -e "  ${DIM}(build cache cleanup not supported)${NC}"
fi

if [ -d "./pi-images" ]; then
    OLD_SIZE=$(du -sh ./pi-images 2>/dev/null | cut -f1)
    rm -rf ./pi-images/*
    echo -e "  ${GREEN}✓${NC}  Removed ${OLD_SIZE} from pi-images/"
fi

clean_package_caches

section "Summary" "🍽️"

DISK_AFTER=$(get_disk_usage_kb)
show_disk_usage

echo -e "${BLUE}📦 Final container storage:${NC}"
$CONTAINER_CMD system df
echo ""

show_space_freed "$DISK_BEFORE" "$DISK_AFTER"
echo ""
echo -e "  ${BLUE}💡 Tip: Run './scripts/build-for-pi.sh' to rebuild fresh images${NC}"
