#!/bin/bash

# E2E Test Runner Script
# Sets up environment and runs Playwright E2E tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

section "Pre-flight Check" "🔍"

# Check if backend is running
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "  ${RED}✗${NC}  Backend is not running on port 3000"
    echo "     Please start the backend with: ./scripts/run-local.sh"
    exit 1
fi

# Check if frontend is accessible
if ! curl -s http://localhost:5174 > /dev/null 2>&1; then
    echo -e "  ${RED}✗${NC}  Frontend is not running on port 5174"
    echo "     Please start the frontend with: ./scripts/run-local.sh"
    exit 1
fi

echo -e "  ${GREEN}✓${NC}  Backend and frontend are running"

# Set E2E testing environment variable for backend
export E2E_TESTING=true

# Navigate to frontend directory and run tests
cd frontend

# Playwright's own reporter drives the detailed progress output from here —
# we just bookend it with the recipe-card sections.
section "Running E2E Tests" "🔍"
npm run test:e2e

section "Summary" "🍽️"
echo -e "  ${GREEN}✓${NC}  E2E tests completed!"
