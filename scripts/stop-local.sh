#!/bin/bash

# Stop Local Development Environment
# Gracefully shuts down all services

set -e

echo "🛑 Stopping Meal Planner local development environment..."

# Stop podman-compose services
if command -v podman-compose &> /dev/null; then
    echo "📦 Stopping podman-compose services..."
    podman-compose down
else
    echo "⚠️  podman-compose not found, skipping container shutdown"
fi

# Kill any running npm processes
echo "🔪 Stopping npm processes..."
pkill -f "npm run dev" 2>/dev/null || echo "   No npm dev processes found"
pkill -f "vite" 2>/dev/null || echo "   No vite processes found"
pkill -f "nodemon" 2>/dev/null || echo "   No nodemon processes found"

# Clean up temporary files
echo "🧹 Cleaning up temporary files..."
rm -f /tmp/backend.log
rm -f /tmp/cookies.txt

echo "✅ All services stopped successfully!"

# Made with Bob
