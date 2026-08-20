#!/bin/bash
# Copyright (c) 2026 e2kd7n. All rights reserved.
#
# Script to create GitHub issues from UAT findings
# Requires: gh CLI tool (GitHub CLI)
# Install: brew install gh (macOS) or see https://cli.github.com/

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

section "Pre-flight Check" "🔍"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "  ${RED}✗${NC}  GitHub CLI (gh) is not installed"
    echo -e "  ${YELLOW}Install it with: brew install gh${NC}"
    echo -e "  ${YELLOW}Or visit: https://cli.github.com/${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC}  gh CLI installed"

# Check if authenticated
start_spinner "Checking GitHub authentication"
if gh auth status &> /dev/null; then
    stop_spinner ok
else
    stop_spinner fail
    echo -e "  ${YELLOW}Run: gh auth login${NC}"
    exit 1
fi

section "Creating Issues" "📋"

start_spinner "Creating Issue 1: [P0] Recipe Creation - Ingredient Button Not Working"
if ISSUE_URL=$(gh issue create \
    --title "[P0] Recipe Creation - Ingredient Button Not Working" \
    --body-file github-issue-ingredient-button.md \
    --label "P0-critical,bug,blocking-launch,user-testing" 2>&1); then
    stop_spinner ok
    echo -e "  ${DIM}${ISSUE_URL}${NC}"
else
    stop_spinner fail
    echo -e "  ${RED}${ISSUE_URL}${NC}"
    exit 1
fi

start_spinner "Creating Issue 2: [P2] Recipe Creation - Numeric Fields Append Instead of Replace"
if ISSUE_URL=$(gh issue create \
    --title "[P2] Recipe Creation - Numeric Fields Append Instead of Replace on Input" \
    --body-file github-issue-numeric-field-input.md \
    --label "P2-medium,bug,ux,user-testing" 2>&1); then
    stop_spinner ok
    echo -e "  ${DIM}${ISSUE_URL}${NC}"
else
    stop_spinner fail
    echo -e "  ${RED}${ISSUE_URL}${NC}"
    exit 1
fi

start_spinner "Creating Issue 3: [P2] Meal Deletion - Missing Confirmation Dialog"
if ISSUE_URL=$(gh issue create \
    --title "[P2] Meal Deletion - Missing Confirmation Dialog" \
    --body-file github-issue-meal-deletion-confirmation.md \
    --label "P2-medium,enhancement,ux,data-loss-prevention,user-testing" 2>&1); then
    stop_spinner ok
    echo -e "  ${DIM}${ISSUE_URL}${NC}"
else
    stop_spinner fail
    echo -e "  ${RED}${ISSUE_URL}${NC}"
    exit 1
fi

start_spinner "Creating Issue 4: [P3] Search Inconsistency Between Recipe Tabs"
if ISSUE_URL=$(gh issue create \
    --title "[P3] Search Inconsistency Between Recipe Tabs" \
    --body "## Description

MY RECIPES tab lacks search functionality while BROWSE RECIPES has full search with autocomplete.

## Current Behavior
- **BROWSE RECIPES:** Has search field with autocomplete, suggestions, and keyboard shortcuts
- **MY RECIPES:** No search field - only filter dropdowns (Difficulty, Meal Type, Cleanup)

## Expected Behavior
Both tabs should have consistent search functionality.

## Impact
- **Severity:** Low (P3)
- **User Impact:** As recipe library grows, lack of search becomes problematic
- **Workaround:** Use filters, but not as effective as search

## Recommendation
Add search field to MY RECIPES tab matching BROWSE RECIPES functionality:
- Text search on recipe title and description
- Same autocomplete/suggestion pattern
- Consistent keyboard shortcuts
- Debounced search (300ms)

## Related
- Part of UAT findings: docs/usertesting/COMPREHENSIVE_UAT_SUMMARY_REPORT.md
- Related to meal planner search fix (frontend/src/pages/MealPlanner.tsx)

## Acceptance Criteria
- [ ] Search field added to MY RECIPES tab
- [ ] Search functionality matches BROWSE RECIPES
- [ ] Keyboard shortcuts work (Ctrl+K)
- [ ] Debounced search implemented
- [ ] Works with large recipe libraries (100+ recipes)

## Estimated Effort
2-3 hours" \
    --label "P3-low,enhancement,ux,user-testing" 2>&1); then
    stop_spinner ok
    echo -e "  ${DIM}${ISSUE_URL}${NC}"
else
    stop_spinner fail
    echo -e "  ${RED}${ISSUE_URL}${NC}"
    exit 1
fi

section "Summary" "🍽️"
echo -e "  ${GREEN}✓${NC} All GitHub issues created successfully!"
echo ""
echo -e "  ${BLUE}Next steps:${NC}"
echo "  1. Review issues on GitHub"
echo "  2. Link related issues (Issue #1 ↔ Issue #2)"
echo "  3. Add to project board"
echo "  4. Set milestones"
echo "  5. Begin P0 fix immediately"

// Made with Bob
