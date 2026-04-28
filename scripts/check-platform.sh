#!/bin/bash

# Check platform compatibility for Raspberry Pi deployment

echo "🔍 Checking platform compatibility..."
echo ""

# Check system architecture
echo "📊 System Information:"
echo "  Architecture: $(uname -m)"
echo "  OS: $(uname -s)"
echo "  Kernel: $(uname -r)"
echo ""

# Check if running on 32-bit or 64-bit
if [ "$(uname -m)" = "armv7l" ]; then
    echo "⚠️  Running on 32-bit ARM (armv7l)"
    echo "   Images should be built for linux/arm/v7"
elif [ "$(uname -m)" = "aarch64" ]; then
    echo "✓ Running on 64-bit ARM (aarch64)"
    echo "   Images should be built for linux/arm64/v8"
else
    echo "❓ Unknown architecture: $(uname -m)"
fi
echo ""

# Check podman images and their platforms
echo "📦 Checking image platforms:"
if command -v podman &> /dev/null; then
    for image in meals-backend meals-frontend; do
        if podman images --format "{{.Repository}}" | grep -q "^localhost/$image$\|^$image$"; then
            echo ""
            echo "Image: $image"
            podman inspect localhost/$image 2>/dev/null || podman inspect $image 2>/dev/null | \
                jq -r '.[] | "  Platform: \(.Os)/\(.Architecture)\(.Variant // "")"' 2>/dev/null || \
                echo "  Unable to determine platform"
        fi
    done
else
    echo "❌ Podman not installed"
fi
echo ""

# Recommendations
echo "💡 Recommendations:"
if [ "$(uname -m)" = "armv7l" ]; then
    echo "  1. Build images with: --platform linux/arm/v7"
    echo "  2. Or upgrade to 64-bit Raspberry Pi OS for better compatibility"
elif [ "$(uname -m)" = "aarch64" ]; then
    echo "  1. Build images with: --platform linux/arm64/v8"
    echo "  2. Current setup should work correctly"
fi
echo ""

# Check if images exist
echo "📋 Available images:"
if command -v podman &> /dev/null; then
    podman images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.Created}}" | grep -E "REPOSITORY|meals-"
else
    echo "❌ Podman not installed"
fi

# Made with Bob