#!/bin/bash

# Bounce Local Development Environment
# Stops and restarts all services

set -e

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