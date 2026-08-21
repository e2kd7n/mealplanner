#!/bin/bash

# Fix line endings on scripts (convert CRLF to LF)
# Run this on the Pi if you encounter "r#!/bin/bash" errors

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

section "Fixing Line Endings" "🧹"

fixed=0

for script in scripts/*.sh; do
    if [ -f "$script" ]; then
        echo -e "  ${GREEN}✓${NC}  ${script}"
        sed -i 's/\r$//' "$script"
        chmod +x "$script"
        (( fixed++ ))
    fi
done

section "Summary" "🍽️"
echo -e "  ${GREEN}✓${NC}  ${fixed} script(s) converted to LF and marked executable"
echo -e "  ${DIM}You can now run your scripts normally.${NC}"
