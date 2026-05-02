#!/bin/bash
# Pre-build cleanup script for Raspberry Pi
# Frees up disk space before building or loading container images
# Run this on the Pi before deployment to ensure sufficient space

set -e

echo "=========================================="
echo "Pi Pre-Build Cleanup Script"
echo "=========================================="
echo ""

# Check if running as root for some operations
if [ "$EUID" -eq 0 ]; then 
    SUDO=""
else
    SUDO="sudo"
fi

# Show initial disk usage
echo "📊 Initial Disk Usage:"
df -h / | grep -v Filesystem
echo ""

# 1. Clear systemd journal logs (can save 500MB-1GB)
echo "🧹 Clearing systemd journal logs..."
$SUDO journalctl --vacuum-size=50M
$SUDO journalctl --vacuum-time=7d
echo "✅ Journal logs cleared"
echo ""

# 2. Clear package manager caches
echo "🧹 Clearing package manager caches..."
if command -v npm &> /dev/null; then
    npm cache clean --force 2>/dev/null || true
    echo "  ✅ npm cache cleared"
fi

if command -v pnpm &> /dev/null; then
    pnpm store prune 2>/dev/null || true
    echo "  ✅ pnpm store pruned"
fi

if command -v yarn &> /dev/null; then
    yarn cache clean 2>/dev/null || true
    echo "  ✅ yarn cache cleared"
fi
echo ""

# 3. Clear APT cache
echo "🧹 Clearing APT cache..."
$SUDO apt-get clean 2>/dev/null || true
$SUDO apt-get autoremove -y 2>/dev/null || true
echo "✅ APT cache cleared"
echo ""

# 4. Clear Podman build cache and unused images
echo "🧹 Clearing Podman build cache..."
if command -v podman &> /dev/null; then
    # Show what will be removed
    echo "  Current Podman storage usage:"
    podman system df 2>/dev/null || true
    echo ""
    
    # Prune system (removes stopped containers, unused networks, dangling images)
    echo "  Pruning Podman system..."
    podman system prune -f 2>/dev/null || true
    
    # More aggressive: remove all unused images (not just dangling)
    echo "  Removing unused images..."
    podman image prune -a -f 2>/dev/null || true
    
    echo "✅ Podman cache cleared"
else
    echo "⚠️  Podman not found, skipping"
fi
echo ""

# 5. Clear Docker cache if present (but not used)
if command -v docker &> /dev/null; then
    echo "🧹 Clearing Docker cache..."
    docker system prune -a -f 2>/dev/null || true
    echo "✅ Docker cache cleared"
    echo ""
fi

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
df -h / | grep -v Filesystem
echo ""

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
