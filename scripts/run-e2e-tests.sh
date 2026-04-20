#!/bin/bash

# E2E Test Runner Script
# Sets up environment and runs Playwright E2E tests

set -e

echo "🧪 Starting E2E Test Runner..."

# Check if backend is running
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "❌ Backend is not running on port 3000"
    echo "Please start the backend with: ./scripts/run-local.sh"
    exit 1
fi

# Check if frontend is accessible
if ! curl -s http://localhost:5174 > /dev/null 2>&1; then
    echo "❌ Frontend is not running on port 5174"
    echo "Please start the frontend with: ./scripts/run-local.sh"
    exit 1
fi

echo "✅ Backend and frontend are running"

# Set E2E testing environment variable for backend
export E2E_TESTING=true

# Navigate to frontend directory and run tests
cd frontend

echo "🚀 Running Playwright E2E tests..."
npm run test:e2e

echo "✅ E2E tests completed!"

# Made with Bob
