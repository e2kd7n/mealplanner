#!/bin/bash

# Bounce Local Development Environment
# Stops and restarts all services
# ⚠️  FOR LOCAL DEVELOPMENT ONLY - Use pi-bounce.sh on Raspberry Pi

set -e

# Detect if running on Raspberry Pi
if [ -f /proc/device-tree/model ]; then
    PI_MODEL=$(cat /proc/device-tree/model 2>/dev/null | tr -d '\0')
    if [[ "$PI_MODEL" == *"Raspberry Pi"* ]]; then
        echo "❌ ERROR: This is a LOCAL DEVELOPMENT script!"
        echo ""
        echo "For Raspberry Pi, use: ./scripts/pi-bounce.sh"
        echo ""
        exit 1
    fi
fi

echo "🔄 Bouncing Meal Planner local development environment..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run stop script
echo "Step 1/2: Stopping services..."
"$SCRIPT_DIR/local-stop.sh"

echo ""
echo "⏳ Waiting 2 seconds before restart..."
sleep 2
echo ""

# Run start script
echo "Step 2/2: Starting services..."
"$SCRIPT_DIR/local-run.sh"

# Made with Bob