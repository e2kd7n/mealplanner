#!/bin/bash

# Script to close duplicate issues, keeping the lowest numbered one

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

section "Closing Duplicate Issues" "🧹"

# Get all open issues
start_spinner "Fetching open issues"
gh issue list --state open --json number,title --limit 100 > /tmp/issues.json
stop_spinner ok

# Find duplicates and close higher numbered ones
cat /tmp/issues.json | jq -r '.[] | "\(.title)|\(.number)"' | sort | \
awk -F'|' '{
  if (titles[$1]) {
    # This is a duplicate, store for closing
    duplicates[++dup_count] = $2 "|" $1 "|" titles[$1]
  } else {
    # First occurrence, remember it
    titles[$1] = $2
  }
}
END {
  for (i=1; i<=dup_count; i++) {
    split(duplicates[i], parts, "|")
    print parts[1] "|" parts[2] "|" parts[3]
  }
}' | while IFS='|' read -r dup_number title keep_number; do
  echo -e "  ${YELLOW}⚠️${NC}  Closing #$dup_number (duplicate of #$keep_number): $title"
  if gh issue close "$dup_number" --reason "not planned" --comment "Duplicate of #$keep_number" > /dev/null; then
    echo -e "  ${GREEN}✓${NC}  Closed #$dup_number"
  else
    echo -e "  ${RED}✗${NC}  Failed to close #$dup_number"
  fi
done

section "Summary" "🍽️"
echo -e "  ${GREEN}✓${NC}  Done!"
