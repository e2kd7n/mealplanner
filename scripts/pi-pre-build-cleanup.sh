#!/bin/bash
# Pre-build cleanup script for Raspberry Pi
# Frees up disk space before building or loading container images
# Run this on the Pi before deployment to ensure sufficient space

set -e

# Load common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

echo "=========================================="
echo "Pi Pre-Build Cleanup Script"
echo "=========================================="
echo ""

# Show initial disk usage
echo "📊 Initial Disk Usage:"
show_disk_usage

# 1. Clear systemd journal logs (can save 500MB-1GB)
clean_journal_logs "50M" "7d"
echo ""

# 2. Clear package manager caches
clean_package_caches
echo ""

# 3. Clear APT cache
clean_apt_cache
echo ""

# 4. Clear container build cache and unused images
CONTAINER_CMD=$(detect_container_runtime)
if [ -n "$CONTAINER_CMD" ]; then
    echo "🧹 Clearing $CONTAINER_CMD build cache..."
    echo "  Current storage usage:"
    $CONTAINER_CMD system df 2>/dev/null || true
    echo ""
    
    clean_container_system "$CONTAINER_CMD"
else
    echo -e "${YELLOW}⚠️  No container runtime found, skipping${NC}"
fi
echo ""

# 6. Clear temporary files
echo "🧹 Clearing temporary files..."
$SUDO rm -rf /tmp/* 2>/dev/null || true
rm -rf ~/.cache/* 2>/dev/null || true
rm -rf ~/.npm 2>/dev/null || true
rm -rf ~/.local/share/pnpm/store 2>/dev/null || true
echo "✅ Temporary files cleared"
echo ""

# 7. Clear old log files in common locations
echo "🧹 Clearing old application logs..."
find /var/log -type f -name "*.log.*" -mtime +7 -delete 2>/dev/null || true
find /var/log -type f -name "*.gz" -mtime +7 -delete 2>/dev/null || true
echo "✅ Old logs cleared"
echo ""

# 8. Show final disk usage
echo "📊 Final Disk Usage:"
show_disk_usage

# 9. Show space freed
echo "=========================================="
echo "✅ Cleanup Complete!"
echo "=========================================="
echo ""
echo "💡 Tips:"
echo "  - Ensure you have at least 5GB free before building images"
echo "  - Consider building images on a more powerful machine"
echo "  - Use 'podman system df' to monitor storage usage"
echo ""

# Made with Bob
