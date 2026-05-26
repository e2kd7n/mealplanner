#!/bin/bash

# WSL/Cygwin fix: LANG is unset in those environments, causing bash to mangle multi-byte
# UTF-8 sequences (emoji appear as garbage). macOS sets en_US.UTF-8 automatically.
# Fall back to C.UTF-8 when en_US.UTF-8 locale is not generated (common in minimal WSL installs).
if locale -a 2>/dev/null | grep -qi "en_US.utf8\|en_US.UTF-8"; then
    export LANG="${LANG:-en_US.UTF-8}"
    export LC_ALL="${LC_ALL:-en_US.UTF-8}"
else
    export LANG="${LANG:-C.UTF-8}"
    export LC_ALL="${LC_ALL:-C.UTF-8}"
fi

# Check required dependencies before doing anything
MISSING_DEPS=()
command -v gh >/dev/null 2>&1 || MISSING_DEPS+=("gh (GitHub CLI)")
command -v jq >/dev/null 2>&1 || MISSING_DEPS+=("jq")

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
  echo "Error: required tools not found: ${MISSING_DEPS[*]}" >&2
  echo "" >&2
  echo "This script must be run from a machine with the GitHub CLI and jq installed." >&2
  echo "It is not intended to run on the Pi deployment host." >&2
  echo "" >&2
  echo "Install on Debian/Ubuntu:  sudo apt install gh jq" >&2
  echo "Install on macOS:          brew install gh jq" >&2
  echo "Authenticate:              gh auth login" >&2
  exit 1
fi

# Check stderr (fd 2) for tty — log functions write there, not stdout.
if [ -t 2 ]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; NC=''
fi

# Use printf instead of echo -e: more portable across bash versions and WSL/Cygwin.
log_action()  { printf "${BLUE}[%s]${NC} %s\n"    "$(date +%H:%M:%S)" "$1" >&2; }
log_success() { printf "${GREEN}[%s]${NC} ✅ %s\n" "$(date +%H:%M:%S)" "$1" >&2; }
log_warning() { printf "${YELLOW}[%s]${NC} ⚠️  %s\n" "$(date +%H:%M:%S)" "$1" >&2; }
log_error()   { printf "${RED}[%s]${NC} ❌ %s\n"   "$(date +%H:%M:%S)" "$1" >&2; }

# ---------------------------------------------------------------------------
# Issue management helpers
# ---------------------------------------------------------------------------

detect_duplicate_issues() {
  log_action "Checking for duplicate issues..."

  local temp_file
  temp_file=$(mktemp)
  gh issue list --state open --json number,title,body --limit 200 > "$temp_file"

  local duplicates
  duplicates=$(jq -r '
    group_by(.title | ascii_downcase | gsub("[^a-z0-9 ]"; "")) |
    map(select(length > 1)) |
    .[] |
    "Potential duplicates: " + (map("#\(.number) - \(.title)") | join(" | "))
  ' "$temp_file")

  if [ -n "$duplicates" ]; then
    log_warning "Found potential duplicate issues:"
    echo "$duplicates" >&2
    echo "" >&2
  else
    log_success "No duplicate issues detected"
  fi

  rm -f "$temp_file"
}

auto_close_completed_issues() {
  log_action "Checking for completed issues that should be closed..."

  local closed_count=0

  if [ -f "P1_ISSUES_COMPLETED.md" ]; then
    local completed_issues
    completed_issues=$(grep -oE '#[0-9]+' P1_ISSUES_COMPLETED.md | sort -u | sed 's/#//')
    for issue_num in $completed_issues; do
      local is_open
      is_open=$(gh issue view "$issue_num" --json state --jq '.state' 2>/dev/null)
      if [ "$is_open" = "OPEN" ]; then
        log_action "Closing completed issue #$issue_num..."
        gh issue close "$issue_num" --comment "Auto-closed: Marked as completed in P1_ISSUES_COMPLETED.md" >/dev/null 2>&1
        [ $? -eq 0 ] && ((closed_count++)) && log_success "Closed issue #$issue_num"
      fi
    done
  fi

  for doc in *_COMPLETE*.md *_SUMMARY.md *_IMPLEMENTATION_SUMMARY.md P0_*.md; do
    if [ -f "$doc" ]; then
      local doc_issues
      doc_issues=$(grep -oE '#[0-9]+' "$doc" | sort -u | sed 's/#//')
      for issue_num in $doc_issues; do
        local is_open
        is_open=$(gh issue view "$issue_num" --json state --jq '.state' 2>/dev/null)
        if [ "$is_open" = "OPEN" ]; then
          if grep -qi "complete\|implemented\|fixed\|resolved" "$doc"; then
            log_action "Issue #$issue_num mentioned in completion doc: $doc"
            echo "  Consider closing if work is complete" >&2
          fi
        fi
      done
    fi
  done

  if [ $closed_count -gt 0 ]; then
    log_success "Auto-closed $closed_count completed issues"
  else
    log_success "No issues needed auto-closing"
  fi
  echo "" >&2
}

check_commits_for_completed_work() {
  log_action "Checking recent commits for completed work..."

  local closed_count=0
  local SHOULD_CLOSE_COUNT=0
  local temp_file commit_details
  temp_file=$(mktemp)
  commit_details=$(mktemp)

  git log --format="%H|%s|%b" -50 --no-merges 2>/dev/null > "$commit_details"

  if [ ! -s "$commit_details" ]; then
    log_warning "No recent git history found"
    rm -f "$temp_file" "$commit_details"
    return
  fi

  grep -oE '#[0-9]+' "$commit_details" | sort -u | sed 's/#//' > "$temp_file"

  if [ ! -s "$temp_file" ]; then
    log_success "No issue references found in recent commits"
    rm -f "$temp_file" "$commit_details"
    return
  fi

  while read -r issue_num; do
    local is_open
    is_open=$(gh issue view "$issue_num" --json state --jq '.state' 2>/dev/null)

    if [ "$is_open" = "OPEN" ]; then
      local issue_commits
      issue_commits=$(grep "#$issue_num" "$commit_details")

      local completion_patterns=(
        "fix.*#$issue_num"     "close.*#$issue_num"    "resolve.*#$issue_num"
        "complete.*#$issue_num" "implement.*#$issue_num"
        "#$issue_num.*fix"     "#$issue_num.*close"    "#$issue_num.*resolve"
        "#$issue_num.*complete" "#$issue_num.*implement"
        "Resolves #$issue_num" "Fixes #$issue_num"     "Closes #$issue_num"
      )

      local should_close=false
      local matching_pattern=""

      for pattern in "${completion_patterns[@]}"; do
        if echo "$issue_commits" | grep -qiE "$pattern"; then
          should_close=true
          matching_pattern="$pattern"
          break
        fi
      done

      if echo "$issue_commits" | grep -qE "^[a-f0-9]+\|(feat|fix):.*#$issue_num"; then
        should_close=true
        matching_pattern="conventional commit with issue reference"
      fi

      if [ "$should_close" = true ]; then
        ((SHOULD_CLOSE_COUNT++))
        local commit_summary
        commit_summary=$(echo "$issue_commits" | head -1 | cut -d'|' -f2 | cut -c1-80)
        log_action "Issue #$issue_num appears resolved (pattern: $matching_pattern)"

        if [ "$AUTO_CLOSE" = true ] && [ "$DRY_RUN" = false ]; then
          log_action "Auto-closing issue #$issue_num based on commit analysis"
          gh issue close "$issue_num" --comment "Auto-closed: Issue appears resolved in recent commits. Last relevant commit: $commit_summary" >/dev/null 2>&1
          [ $? -eq 0 ] && ((closed_count++)) && log_success "Closed issue #$issue_num"
        else
          echo "  Would close #$issue_num (use --auto-close to enable)" >&2
          echo "  Commit: $commit_summary" >&2
        fi
      else
        local commit_summary
        commit_summary=$(echo "$issue_commits" | head -1 | cut -d'|' -f2 | cut -c1-60)
        log_action "Issue #$issue_num mentioned in commits but not marked as resolved"
        echo "  Last mention: $commit_summary" >&2
      fi
    fi
  done < "$temp_file"

  rm -f "$temp_file" "$commit_details"

  [ $closed_count -gt 0 ] && log_success "Auto-closed $closed_count issues based on commits"

  if [ "$AUTO_CLOSE" = false ] && [ $SHOULD_CLOSE_COUNT -gt 0 ]; then
    echo "" >&2
    log_warning "Found $SHOULD_CLOSE_COUNT issues that appear complete but are still open"
    echo "Run with --auto-close to close them automatically" >&2
    echo "" >&2
  fi

  echo "" >&2
}

suggest_priority_updates() {
  log_action "Analyzing recent development activity for priority updates..."

  local recent_files
  recent_files=$(git diff --name-only HEAD~10 HEAD 2>/dev/null | head -20)

  if [ -z "$recent_files" ]; then
    log_warning "No recent git history found"
    return
  fi

  echo "$recent_files" | grep -qE "(auth|security|database|migration)" && \
    log_warning "Critical files modified recently - review P0/P1 issues for updates"

  local tests_modified
  tests_modified=$(echo "$recent_files" | grep -c "test\|spec")
  [ "$tests_modified" -gt 5 ] && log_success "Significant test activity detected ($tests_modified test files)"

  echo "" >&2
}

create_issues_from_todos() {
  log_action "Checking for TODO comments that should become issues..."

  local temp_file
  temp_file=$(mktemp)

  grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build \
    --exclude-dir=coverage --exclude-dir=.next --exclude-dir=test-results \
    -E "TODO.*#issue|FIXME.*#issue|TODO.*\[create-issue\]|FIXME.*\[create-issue\]" . 2>/dev/null > "$temp_file"

  if [ -s "$temp_file" ]; then
    log_warning "Found TODO comments marked for issue creation:"
    cat "$temp_file" >&2
    echo "" >&2
    echo "Run with --create-todos flag to automatically create these issues" >&2
  else
    log_success "No TODO comments marked for issue creation"
  fi

  rm -f "$temp_file"
  echo "" >&2
}

update_issue_labels() {
  log_action "Checking for issues that need label updates..."

  local updated_count=0
  local issues
  issues=$(gh issue list --state open --json number,title,body,labels --limit 100)

  echo "$issues" | jq -r '.[] | select(.title | test("security|vulnerability|auth|csrf|xss|sql"; "i")) | select(.labels | map(.name) | index("security") | not) | .number' | while read -r issue_num; do
    log_action "Adding 'security' label to issue #$issue_num"
    gh issue edit "$issue_num" --add-label "security" >/dev/null 2>&1
    ((updated_count++))
  done

  echo "$issues" | jq -r '.[] | select(.title | test("bug|error|fail|broken"; "i")) | select(.labels | map(.name) | index("bug") | not) | .number' | while read -r issue_num; do
    log_action "Adding 'bug' label to issue #$issue_num"
    gh issue edit "$issue_num" --add-label "bug" >/dev/null 2>&1
    ((updated_count++))
  done

  if [ $updated_count -gt 0 ]; then
    log_success "Updated labels on $updated_count issues"
  else
    log_success "All issue labels are up to date"
  fi
  echo "" >&2
}

scan_workspace_todos() {
  echo "## 📝 Workspace TODOs & Tasks"
  echo "Code comments and inline tasks found in the workspace that may need attention."
  echo ""

  local temp_file
  temp_file=$(mktemp)

  grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build \
    --exclude-dir=coverage --exclude-dir=.next --exclude-dir=test-results \
    -E "(TODO|FIXME|HACK|XXX|NOTE):" . 2>/dev/null | \
    sed 's/:/ - /' | \
    awk -F' - ' '{
      file=$1; gsub(/^\.\//, "", file)
      rest=$2
      for(i=3; i<=NF; i++) rest = rest " - " $i
      print "- `" file "` - " rest
    }' > "$temp_file"

  local todo_count
  todo_count=$(wc -l < "$temp_file" | tr -d ' ')

  if [ "$todo_count" -gt 0 ]; then
    echo "Found **$todo_count** code comments requiring attention:"
    echo ""
    cat "$temp_file"
  else
    echo "**No TODO/FIXME comments found in code** ✅"
  fi

  rm -f "$temp_file"
  echo ""
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

DRY_RUN=false
AUTO_CLOSE=false
DETECT_DUPLICATES=true
UPDATE_LABELS=true
ANALYZE_ACTIVITY=true

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)       DRY_RUN=true;            shift ;;
    --auto-close)    AUTO_CLOSE=true;          shift ;;
    --no-duplicates) DETECT_DUPLICATES=false;  shift ;;
    --no-labels)     UPDATE_LABELS=false;      shift ;;
    --no-analysis)   ANALYZE_ACTIVITY=false;   shift ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --dry-run          Show what would be done without making changes"
      echo "  --auto-close       Automatically close completed issues"
      echo "  --no-duplicates    Skip duplicate detection"
      echo "  --no-labels        Skip automatic label updates"
      echo "  --no-analysis      Skip development activity analysis"
      echo "  --help             Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                           # Normal run with all checks"
      echo "  $0 --auto-close              # Auto-close completed issues"
      echo "  $0 --dry-run --auto-close    # Preview what would be closed"
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      echo "Use --help for usage information" >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="${SCRIPT_DIR}/../ISSUE_PRIORITIES.md"

# ---------------------------------------------------------------------------
# Pre-report issue management
# ---------------------------------------------------------------------------

printf "\n" >&2
log_action "🔍 Running Intelligent Issue Management..."
printf "\n" >&2

[ "$DETECT_DUPLICATES" = true ] && detect_duplicate_issues

check_commits_for_completed_work

if [ "$AUTO_CLOSE" = true ]; then
  if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN: Would auto-close completed issues"
  else
    auto_close_completed_issues
  fi
fi

if [ "$UPDATE_LABELS" = true ]; then
  if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN: Would update issue labels"
  else
    update_issue_labels
  fi
fi

[ "$ANALYZE_ACTIVITY" = true ] && suggest_priority_updates

create_issues_from_todos

printf "\n" >&2
log_action "📊 Generating Issue Priority Report..."
printf "\n" >&2

# Always write the report directly to the output file so bash (not PowerShell) owns the
# file descriptor. This guarantees UTF-8 encoding regardless of how the script is invoked.
exec > "$OUTPUT_FILE"

# ---------------------------------------------------------------------------
# Report header
# ---------------------------------------------------------------------------

echo "# Issue Prioritization"
echo ""
TIMESTAMP_UTC=$(date -u +"%Y-%m-%d %H:%M:%S UTC" 2>/dev/null || date +"%Y-%m-%d %H:%M:%S")
TIMESTAMP_CENTRAL=$(TZ="America/Chicago" date +"%Y-%m-%d %H:%M:%S %Z" 2>/dev/null || date +"%Y-%m-%d %H:%M:%S")
echo "**Last Updated:** ${TIMESTAMP_UTC} / ${TIMESTAMP_CENTRAL}"
echo ""
echo "This file reflects the current state of GitHub issues organized by milestone and priority within each milestone."
echo ""
echo "**Priority is within a milestone** — P0/P1 issues in the active milestone take precedence over all issues in future milestones."
echo ""

# ---------------------------------------------------------------------------
# Fetch once, filter with jq — avoids one API call per priority level
# ---------------------------------------------------------------------------

ALL_ISSUES=$(gh issue list --state open --json number,title,labels,milestone --limit 500 2>/dev/null)
MILESTONES_JSON=$(gh api "repos/:owner/:repo/milestones?state=open&per_page=100&direction=asc" 2>/dev/null)
MILESTONE_COUNT=$(echo "$MILESTONES_JSON" | jq '. | length')

# ---------------------------------------------------------------------------
# Milestone sections (one per open milestone, priority-grouped within each)
# ---------------------------------------------------------------------------

if [ "$MILESTONE_COUNT" -gt 0 ]; then
  echo "$MILESTONES_JSON" | jq -c '.[]' | while IFS= read -r ms_json; do
    ms_title=$(echo "$ms_json" | jq -r '.title')
    ms_open=$(echo "$ms_json" | jq -r '.open_issues')
    ms_due=$(echo "$ms_json" | jq -r 'if .due_on != null then " (due " + (.due_on | split("T")[0]) + ")" else "" end')

    echo "## 🎯 ${ms_title}${ms_due}"
    echo ""

    if [ "$ms_open" -eq 0 ]; then
      echo "**No open issues** ✅"
      echo ""
      echo "---"
      echo ""
      continue
    fi

    ms_issues=$(echo "$ALL_ISSUES" | jq --arg t "$ms_title" '[.[] | select(.milestone.title == $t)]')

    for priority_spec in \
      "P0-critical:### 🔴 P0 - CRITICAL" \
      "P1-high:### 🔴 P1 - HIGH" \
      "P2-medium:### 🟡 P2 - MEDIUM" \
      "P3-low:### 🟢 P3 - LOW" \
      "P4-future:### 📋 P4 - FUTURE"; do

      p_label="${priority_spec%%:*}"
      p_header="${priority_spec#*:}"

      items=$(echo "$ms_issues" | jq -r --arg l "$p_label" \
        '.[] | select(.labels | map(.name) | index($l)) | "- #\(.number) - \(.title)"')

      echo "$p_header"
      if [ -n "$items" ]; then
        echo "$items"
      else
        echo "**No issues** ✅"
      fi
      echo ""
    done

    unp=$(echo "$ms_issues" | jq -r \
      '.[] | select(.labels | map(.name | startswith("P")) | any | not) | "- #\(.number) - \(.title)"')
    if [ -n "$unp" ]; then
      echo "### ⚠️ Unprioritized (need P-label)"
      echo "$unp"
      echo ""
    fi

    echo "---"
    echo ""
  done
else
  echo "**No open milestones configured.** Assign issues to a milestone to use this view."
  echo ""
  echo "---"
  echo ""
fi

# ---------------------------------------------------------------------------
# Issues without any milestone assignment
# ---------------------------------------------------------------------------

echo "## ⚠️ Issues Without Milestone Assignment"
echo ""
echo "These issues need to be assigned to a milestone and prioritized."
echo ""

no_ms=$(echo "$ALL_ISSUES" | jq '[.[] | select(.milestone == null)]')
no_ms_count=$(echo "$no_ms" | jq '. | length')

if [ "$no_ms_count" -eq 0 ]; then
  echo "**All issues are assigned to a milestone** ✅"
  echo ""
else
  found_any=false

  for priority_spec in \
    "P0-critical:### 🔴 P0 - CRITICAL" \
    "P1-high:### 🔴 P1 - HIGH" \
    "P2-medium:### 🟡 P2 - MEDIUM" \
    "P3-low:### 🟢 P3 - LOW" \
    "P4-future:### 📋 P4 - FUTURE"; do

    p_label="${priority_spec%%:*}"
    p_header="${priority_spec#*:}"

    items=$(echo "$no_ms" | jq -r --arg l "$p_label" \
      '.[] | select(.labels | map(.name) | index($l)) | "- #\(.number) - \(.title)"')

    if [ -n "$items" ]; then
      echo "$p_header"
      echo "$items"
      echo ""
      found_any=true
    fi
  done

  unp=$(echo "$no_ms" | jq -r \
    '.[] | select(.labels | map(.name | startswith("P")) | any | not) | "- #\(.number) - \(.title)"')
  if [ -n "$unp" ]; then
    echo "### ⚠️ Unprioritized (No P-label)"
    echo "$unp"
    echo ""
  fi
fi

# ---------------------------------------------------------------------------
# Workspace TODOs
# ---------------------------------------------------------------------------

scan_workspace_todos

# ---------------------------------------------------------------------------
# Priority reference
# ---------------------------------------------------------------------------

echo "## Priority System (Milestone-Aware)"
echo ""
echo "**Key Principle:** Priority is within a milestone. A P1 issue in the active milestone takes precedence over a P0 issue in a future milestone."
echo ""
echo "### Work Order"
echo ""
echo "1. **Active Milestone P0** — Drop everything"
echo "2. **Active Milestone P1** — Current sprint focus"
echo "3. **Active Milestone P2** — Next sprint planning"
echo "4. **Active Milestone P3** — Backlog for this milestone"
echo "5. **Future Milestone P0+** — Long-term planning"
echo ""
echo "### P0 - CRITICAL"
echo "- Application is down or unusable"
echo "- Data loss or corruption"
echo "- Security vulnerabilities"
echo "- **Action:** Drop everything and fix immediately"
echo ""
echo "### P1 - HIGH"
echo "- Core features broken or severely degraded"
echo "- Significant user pain points"
echo "- Blocks important workflows"
echo "- **Action:** Fix in current sprint (1-2 weeks)"
echo ""
echo "### P2 - MEDIUM"
echo "- Feature improvements"
echo "- Moderate user pain points"
echo "- Quality of life enhancements"
echo "- **Action:** Plan for next sprint (2-4 weeks)"
echo ""
echo "### P3 - LOW"
echo "- Minor UX improvements"
echo "- Edge cases"
echo "- Nice-to-have features"
echo "- **Action:** Backlog, address when time permits"
echo ""
echo "### P4 - FUTURE"
echo "- New features"
echo "- Major enhancements"
echo "- Long-term improvements"
echo "- **Action:** Plan for future milestones"
echo ""
echo "## How to Update Priorities"
echo ""
echo "1. Assign issue to a milestone:  \`gh issue edit <N> --milestone \"Public Launch\"\`"
echo "2. Set priority label:           \`gh issue edit <N> --add-label P1-high\`"
echo "3. Regenerate this file:         \`./scripts/update-issue-priorities.sh\`"
echo "4. Commit:                       \`git add ISSUE_PRIORITIES.md && git commit -m \"chore: update issue priorities\"\`"
echo ""
echo "## Managing Workspace TODOs"
echo ""
echo "- Review code comments regularly and convert important ones to GitHub issues"
echo "- Use \`TODO:\` for tasks that should become issues"
echo "- Use \`FIXME:\` for bugs that need attention"
echo "- Use \`HACK:\` for temporary solutions that need proper fixes"
echo "- Use \`NOTE:\` for important information or context"

log_success "Report written to: $OUTPUT_FILE" >&2
