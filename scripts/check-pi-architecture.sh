#!/bin/bash

# Check Raspberry Pi Architecture Configuration
# This script diagnoses 32-bit vs 64-bit kernel/userspace mismatches

set -e

echo "🔍 Raspberry Pi Architecture Diagnostic"
echo "========================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check kernel architecture
echo -e "${BLUE}1. Kernel Architecture:${NC}"
KERNEL_ARCH=$(uname -m)
echo "   uname -m: $KERNEL_ARCH"

if [ "$KERNEL_ARCH" = "aarch64" ]; then
    echo -e "   ${GREEN}✓ 64-bit kernel (ARM64)${NC}"
    KERNEL_64BIT=true
else
    echo -e "   ${YELLOW}⚠ 32-bit kernel ($KERNEL_ARCH)${NC}"
    KERNEL_64BIT=false
fi
echo ""

# Check userspace architecture
echo -e "${BLUE}2. Userspace Architecture:${NC}"
USERSPACE_ARCH=$(dpkg --print-architecture)
echo "   dpkg architecture: $USERSPACE_ARCH"

if [ "$USERSPACE_ARCH" = "arm64" ]; then
    echo -e "   ${GREEN}✓ 64-bit userspace${NC}"
    USERSPACE_64BIT=true
elif [ "$USERSPACE_ARCH" = "armhf" ]; then
    echo -e "   ${YELLOW}⚠ 32-bit userspace (armhf)${NC}"
    USERSPACE_64BIT=false
else
    echo -e "   ${RED}✗ Unknown userspace: $USERSPACE_ARCH${NC}"
    USERSPACE_64BIT=false
fi
echo ""

# Check LONG_BIT
echo -e "${BLUE}3. System Word Size:${NC}"
LONG_BIT=$(getconf LONG_BIT)
echo "   getconf LONG_BIT: $LONG_BIT"
if [ "$LONG_BIT" = "64" ]; then
    echo -e "   ${GREEN}✓ 64-bit word size${NC}"
else
    echo -e "   ${YELLOW}⚠ 32-bit word size${NC}"
fi
echo ""

# Check file command on a binary
echo -e "${BLUE}4. Binary Format Check:${NC}"
if command -v bash &> /dev/null; then
    BASH_FORMAT=$(file -L /bin/bash | grep -o "ELF [0-9]*-bit" || echo "unknown")
    echo "   /bin/bash: $BASH_FORMAT"
    if echo "$BASH_FORMAT" | grep -q "64-bit"; then
        echo -e "   ${GREEN}✓ 64-bit binaries${NC}"
    else
        echo -e "   ${YELLOW}⚠ 32-bit binaries${NC}"
    fi
fi
echo ""

# Check Podman architecture support
echo -e "${BLUE}5. Podman Architecture Support:${NC}"
if command -v podman &> /dev/null; then
    PODMAN_ARCH=$(podman version --format '{{.Client.OsArch}}' 2>/dev/null || echo "unknown")
    echo "   Podman OS/Arch: $PODMAN_ARCH"
    
    # Try to check what architectures podman can run
    if podman info &> /dev/null; then
        echo "   Podman is functional"
    fi
else
    echo -e "   ${RED}✗ Podman not found${NC}"
fi
echo ""

# Diagnosis and recommendation
echo "========================================"
echo -e "${BLUE}📊 DIAGNOSIS:${NC}"
echo ""

if [ "$KERNEL_64BIT" = true ] && [ "$USERSPACE_64BIT" = false ]; then
    echo -e "${YELLOW}⚠️  MIXED ARCHITECTURE DETECTED${NC}"
    echo ""
    echo "Your system has:"
    echo "  • 64-bit kernel (aarch64) ✓"
    echo "  • 32-bit userspace (armhf) ⚠️"
    echo ""
    echo "This is a common configuration where:"
    echo "  - The Pi hardware and kernel support 64-bit"
    echo "  - But the OS/packages are 32-bit for compatibility"
    echo ""
    echo -e "${BLUE}🐳 DOCKER/PODMAN IMPLICATIONS:${NC}"
    echo ""
    echo "Containers will run in the USERSPACE architecture (32-bit)."
    echo "This means:"
    echo "  • ARM64 images will NOT work ✗"
    echo "  • ARM v7 (32-bit) images WILL work ✓"
    echo ""
    echo -e "${BLUE}💡 RECOMMENDATIONS:${NC}"
    echo ""
    echo "Option 1: Build ARM v7 images (CURRENT APPROACH)"
    echo "  - Continue using local builds with build-on-pi.sh"
    echo "  - Takes 20-25 minutes but guaranteed to work"
    echo "  - Run: ./scripts/build-on-pi.sh"
    echo ""
    echo "Option 2: Upgrade to full 64-bit OS (RECOMMENDED)"
    echo "  - Backup your data first!"
    echo "  - Install Raspberry Pi OS 64-bit"
    echo "  - Then use GitHub Actions pre-built images"
    echo "  - Deployment time: 2-3 minutes instead of 25"
    echo ""
    echo "Option 3: Add ARM v7 to GitHub Actions"
    echo "  - Modify .github/workflows/build-and-push.yml"
    echo "  - Add linux/arm/v7 to platforms"
    echo "  - Note: May fail due to Rolldown compatibility"
    echo ""
    
elif [ "$KERNEL_64BIT" = true ] && [ "$USERSPACE_64BIT" = true ]; then
    echo -e "${GREEN}✅ FULL 64-BIT SYSTEM${NC}"
    echo ""
    echo "Your system is fully 64-bit!"
    echo "  • 64-bit kernel ✓"
    echo "  • 64-bit userspace ✓"
    echo ""
    echo "You can use the GitHub Actions pre-built ARM64 images."
    echo ""
    echo "To deploy:"
    echo "  cd ~/mealplanner"
    echo "  git pull"
    echo "  ./scripts/pi-deploy-from-registry.sh"
    echo ""
    
else
    echo -e "${YELLOW}⚠️  32-BIT SYSTEM${NC}"
    echo ""
    echo "Your system is fully 32-bit."
    echo "You must build locally or upgrade to 64-bit OS."
    echo ""
    echo "To build locally:"
    echo "  ./scripts/build-on-pi.sh"
fi

echo ""
echo "========================================"

# Made with Bob
