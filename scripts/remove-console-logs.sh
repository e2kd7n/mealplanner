#!/bin/bash

# Script to remove or wrap console.log statements in production
# This addresses P0 issue #109 - Remove Production Console Logging

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

section "Removing Production Console Logging" "🧹"

# Find all TypeScript/TSX files with console statements
files=$(grep -rl "console\.\(log\|debug\|info\)" frontend/src --include="*.ts" --include="*.tsx" | grep -v "logger.ts" | grep -v "node_modules")

count=0
for file in $files; do
  # Check if file has console.log or console.debug or console.info (not error/warn)
  if grep -q "console\.\(log\|debug\|info\)" "$file"; then
    echo -e "  ${GREEN}✓${NC}  ${file}"

    # Remove debug console.log statements (those with emojis or debug markers)
    sed -i '' '/console\.log.*[📅🔍✅❌🍽️]/d' "$file"

    # Remove standalone console.log/debug/info lines
    sed -i '' '/^[[:space:]]*console\.\(log\|debug\|info\)/d' "$file"

    (( count++ ))
  fi
done

section "Summary" "🍽️"
echo -e "  ${GREEN}✓${NC}  ${count} file(s) processed"
echo -e "  ${YELLOW}⚠️${NC}  console.error and console.warn statements preserved for production error tracking"
