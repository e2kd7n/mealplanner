#!/bin/bash
# Pre-build cleanup script for Raspberry Pi
# Frees up disk space before building or loading container images
# Run this on the Pi before deployment to ensure sufficient space

set -e

# Load common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utilities.sh"

section "Pi Pre-Build Cleanup" "🧹"

# Show initial disk usage
echo -e "${BLUE}ℹ️  Initial disk usage:${NC}"
show_disk_usage

timer_start

# 1. Clear systemd journal logs (can save 500MB-1GB)
clean_journal_logs "50M" "7d"

# 2. Clear package manager caches
clean_package_caches

# 3. Clear APT cache
clean_apt_cache

# 4. Clear container build cache and unused images
CONTAINER_CMD=$(detect_container_runtime)
if [ -n "$CONTAINER_CMD" ]; then
    echo -e "${BLUE}ℹ️  Current $CONTAINER_CMD storage usage:${NC}"
    $CONTAINER_CMD system df 2>/dev/null || true
    clean_container_system "$CONTAINER_CMD"
else
    echo -e "${YELLOW}⚠️  No container runtime found, skipping${NC}"
fi

# 6. Clear temporary files
start_spinner "Clearing temporary files"
$SUDO rm -rf /tmp/* 2>/dev/null || true
rm -rf ~/.cache/* 2>/dev/null || true
rm -rf ~/.npm 2>/dev/null || true
rm -rf ~/.local/share/pnpm/store 2>/dev/null || true
stop_spinner ok

# 7. Clear old log files in common locations
start_spinner "Clearing old application logs"
find /var/log -type f -name "*.log.*" -mtime +7 -delete 2>/dev/null || true
find /var/log -type f -name "*.gz" -mtime +7 -delete 2>/dev/null || true
stop_spinner ok

timer_end

# 8. Show final disk usage + summary
section "Summary" "🍽️"
echo -e "${BLUE}ℹ️  Final disk usage:${NC}"
show_disk_usage

echo -e "${BLUE}💡 Tips:${NC}"
echo -e "  - Ensure you have at least 5GB free before building images"
echo -e "  - Consider building images on a more powerful machine"
echo -e "  - Use 'podman system df' to monitor storage usage"
echo ""
