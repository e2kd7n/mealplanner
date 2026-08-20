#!/bin/bash

# Script to add copyright notices to source files
# Copyright (c) 2026 e2kd7n
# All rights reserved.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

COPYRIGHT_NOTICE="/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

"

section "Adding Copyright Notices" "✏️"

added=0
skipped=0

# Process substitution keeps the loop in the current shell so the counters
# below survive past the loop (a piped `find | while` would run in a subshell).
while IFS= read -r file; do
    if ! head -5 "$file" | grep -q "Copyright"; then
        echo -e "  ${GREEN}✓${NC}  ${file}"
        echo "$COPYRIGHT_NOTICE" > "$file.tmp"
        cat "$file" >> "$file.tmp"
        mv "$file.tmp" "$file"
        (( added++ ))
    else
        echo -e "  ${DIM}·  ${file} (already has copyright)${NC}"
        (( skipped++ ))
    fi
done < <(find backend/src frontend/src -type f \( -name "*.ts" -o -name "*.tsx" \))

section "Summary" "🍽️"
echo -e "  ${GREEN}✓${NC}  ${added} file(s) updated, ${DIM}${skipped} already had a notice${NC}"
