#!/bin/bash

# Script to remove priority prefixes from issue titles
# Priority should be indicated by labels, not title prefixes

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

section "Cleaning Issue Titles" "🧹"

start_spinner "Fetching open issues"
ISSUES_JSON=$(gh issue list --state open --json number,title --limit 100)
stop_spinner ok

echo "$ISSUES_JSON" | \
jq -r '.[] | "\(.number)|\(.title)"' | \
while IFS='|' read -r number title; do
  # Remove various priority prefix patterns:
  # [P#] prefix (e.g., "[P2] Title")
  # P#: prefix (e.g., "P2: Title")
  new_title=$(echo "$title" | sed -E 's/^(\[P[0-4]\] |P[0-4]: )//')

  if [ "$title" != "$new_title" ]; then
    echo -e "  ${GREEN}✓${NC}  Issue #$number: '$title' -> '$new_title'"
    gh issue edit "$number" --title "$new_title" > /dev/null
  fi
done

section "Summary" "🍽️"
echo -e "  ${GREEN}✓${NC}  Done!"
