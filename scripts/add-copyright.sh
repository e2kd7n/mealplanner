#!/bin/bash

# Script to add copyright notices to source files
# Copyright (c) 2026 e2kd7n
# All rights reserved.

COPYRIGHT_NOTICE="/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

"

# Find all TypeScript and TSX files that don't have copyright notices
find backend/src frontend/src -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
    # Check if file already has copyright notice
    if ! head -5 "$file" | grep -q "Copyright"; then
        echo "Adding copyright to: $file"
        # Create temporary file with copyright notice
        echo "$COPYRIGHT_NOTICE" > "$file.tmp"
        # Append original file content
        cat "$file" >> "$file.tmp"
        # Replace original file
        mv "$file.tmp" "$file"
    else
        echo "Skipping (already has copyright): $file"
    fi
done

echo "Copyright notices added successfully!"

# Made with Bob
