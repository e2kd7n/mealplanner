#!/bin/bash

# Script to remove or wrap console.log statements in production
# This addresses P0 issue #109 - Remove Production Console Logging

echo "🔍 Removing production console logging..."

# Find all TypeScript/TSX files with console statements
files=$(grep -rl "console\.\(log\|debug\|info\)" frontend/src --include="*.ts" --include="*.tsx" | grep -v "logger.ts" | grep -v "node_modules")

count=0
for file in $files; do
  # Check if file has console.log or console.debug or console.info (not error/warn)
  if grep -q "console\.\(log\|debug\|info\)" "$file"; then
    echo "  Processing: $file"
    
    # Remove debug console.log statements (those with emojis or debug markers)
    sed -i '' '/console\.log.*[📅🔍✅❌🍽️]/d' "$file"
    
    # Remove standalone console.log/debug/info lines
    sed -i '' '/^[[:space:]]*console\.\(log\|debug\|info\)/d' "$file"
    
    ((count++))
  fi
done

echo "✅ Processed $count files"
echo "⚠️  Note: console.error and console.warn statements preserved for production error tracking"

# Made with Bob
