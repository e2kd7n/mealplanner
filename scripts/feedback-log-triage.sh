#!/bin/bash
# Feedback & Error-Log Triage — runs ON the Pi (needs direct Postgres
# access, which only the Pi has), triggered by a weekly cron entry.
# Queries UserFeedback + error/warn ClientLog, filters test noise, clusters
# recurring problems, dedupes against every existing auto-feedback-triage
# issue (open or closed — a fixed/wontfix'd problem is never re-filed), and
# files real `gh issue create` calls for genuinely new problems only.
#
# See docs/WEEKLY_MAINTENANCE.md's "Feedback & Error-Log Triage" subsection
# (under User Feedback Review) for the full design and the companion change
# required in the separate e2kd7n/backups repo for the private archive to
# actually flow.
#
# Usage: ./scripts/feedback-log-triage.sh [--dry-run]
#   --dry-run   run the full pipeline (including the real `gh issue list`
#               dedup fetch) but log "would create" instead of filing
#
# Install as a weekly cron job, e.g.:
#   45 3 * * 0  cd /path/to/mealplanner && ./scripts/feedback-log-triage.sh >> data/maintenance-logs/cron-feedback-triage.log 2>&1

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

LOG_DIR="$PROJECT_ROOT/data/maintenance-logs"
STATUS_FILE="$LOG_DIR/feedback-triage-status.txt"
CARRYOVER_FILE="$LOG_DIR/feedback-triage-carryover.json"
mkdir -p "$LOG_DIR"
RUN_STAMP="$(date +"%Y-%m-%d-%H%M%S")"
LOG_FILE="$LOG_DIR/feedback-triage-$RUN_STAMP.log"
CANDIDATES_RAW="$LOG_DIR/feedback-triage-candidates-$RUN_STAMP.jsonl"

MAX_ISSUES_PER_RUN="${MAX_ISSUES_PER_RUN:-5}"

DRY_RUN=false
[ "${1:-}" = "--dry-run" ] && DRY_RUN=true

log() { echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] $1" | tee -a "$LOG_FILE"; }
update_status() {
    cat > "$STATUS_FILE" <<EOF
STATUS=$1
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
MESSAGE=$2
LOG_FILE=$LOG_FILE
EOF
}
notify() {
    # priority, title, body — best-effort, never fails the script
    bash "$SCRIPT_DIR/send-notification.sh" "$1" "$2" "$3" "speech_balloon,bug" 2>/dev/null || true
}

log "=== Feedback & error-log triage starting (dry_run=$DRY_RUN) ==="

# ── Preflight ────────────────────────────────────────────────────────────
CONTAINER_CMD="$(detect_container_runtime)"
if [ -z "$CONTAINER_CMD" ]; then
    log "ERROR: no podman/docker found."
    update_status "FAILED" "Aborted preflight: no container runtime found"
    notify urgent "Feedback triage aborted" "No podman/docker found on this host"
    exit 2
fi

if ! $CONTAINER_CMD ps --format '{{.Names}}' | grep -q '^meals-backend$'; then
    log "ERROR: meals-backend container is not running."
    update_status "FAILED" "Aborted preflight: meals-backend not running"
    notify urgent "Feedback triage aborted" "meals-backend not running — nothing was checked"
    exit 2
fi

for cmd in gh jq; do
    if ! command -v "$cmd" &>/dev/null; then
        log "ERROR: required command '$cmd' not found on PATH."
        update_status "FAILED" "Aborted preflight: '$cmd' not installed"
        notify urgent "Feedback triage aborted" "'$cmd' is not installed on this host"
        exit 2
    fi
done

GITHUB_TOKEN_FILE="$PROJECT_ROOT/secrets/github_token.txt"
if [ ! -s "$GITHUB_TOKEN_FILE" ]; then
    log "ERROR: $GITHUB_TOKEN_FILE missing or empty. Create a fine-grained PAT (Issues: read/write on this repo only)."
    update_status "FAILED" "Aborted preflight: secrets/github_token.txt missing or empty"
    notify urgent "Feedback triage aborted" "secrets/github_token.txt missing or empty — see docs/WEEKLY_MAINTENANCE.md"
    exit 2
fi
export GH_TOKEN
GH_TOKEN="$(cat "$GITHUB_TOKEN_FILE")"

log "Preflight OK."
update_status "RUNNING" "Feedback triage in progress"

# One-time idempotent bootstrap — safe to run every week.
gh label create auto-feedback-triage --color "5319e7" \
    --description "Auto-filed by scripts/feedback-log-triage.sh" 2>/dev/null || true

# ── Step 1: run the query/clustering script inside the backend container ──
log "Running feedback-triage.js inside meals-backend..."
if ! $CONTAINER_CMD exec meals-backend node dist/scripts/feedback-triage.js \
        > "$CANDIDATES_RAW" 2>>"$LOG_FILE"; then
    log "ERROR: feedback-triage.js failed. See $LOG_FILE."
    update_status "FAILED" "feedback-triage.js failed — see log"
    notify urgent "Feedback triage FAILED" "The DB query/clustering step failed — check $LOG_FILE"
    exit 1
fi

CANDIDATE_COUNT=$(wc -l < "$CANDIDATES_RAW" | tr -d ' ')
if [ "$CANDIDATE_COUNT" -eq 0 ]; then
    log "Nothing to triage this week."
    update_status "COMPLETE" "No candidates this run"
    rm -f "$CANDIDATES_RAW"
    exit 0
fi
log "Found $CANDIDATE_COUNT candidate(s) after filtering/clustering."

# ── Step 2: merge in any carryover from a prior run's spam-guard cap ──────
# Fresh data supersedes a stale carryover entry with the same fingerprint —
# the current run's own version of that cluster (updated occurrence count,
# latest timestamps) is more accurate than what got capped last time.
COMBINED_FILE="$LOG_DIR/.feedback-triage-combined-$RUN_STAMP.jsonl"
: > "$COMBINED_FILE"
if [ -s "$CARRYOVER_FILE" ]; then
    NEW_FINGERPRINTS_FILE="$LOG_DIR/.feedback-triage-new-fp-$RUN_STAMP.txt"
    jq -r '.fingerprint' "$CANDIDATES_RAW" | sort -u > "$NEW_FINGERPRINTS_FILE"
    CARRIED_COUNT=0
    while IFS= read -r item; do
        fp=$(echo "$item" | jq -r '.fingerprint')
        grep -qxF "$fp" "$NEW_FINGERPRINTS_FILE" && continue
        echo "$item" >> "$COMBINED_FILE"
        CARRIED_COUNT=$((CARRIED_COUNT + 1))
    done < <(jq -c '.[]' "$CARRYOVER_FILE" 2>/dev/null)
    rm -f "$NEW_FINGERPRINTS_FILE"
    [ "$CARRIED_COUNT" -gt 0 ] && log "Re-considering $CARRIED_COUNT candidate(s) carried over from a prior capped run."
fi
cat "$CANDIDATES_RAW" >> "$COMBINED_FILE"

# ── Step 3: fetch existing auto-feedback-triage issues once, dedupe locally
# rather than one `gh` call per candidate. --state all so a fixed or
# wontfix'd issue is never re-filed. ───────────────────────────────────────
EXISTING_ISSUES_FILE="$LOG_DIR/.feedback-triage-existing-$RUN_STAMP.json"
if ! gh issue list --state all --label auto-feedback-triage \
        --json number,title,body,state --limit 1000 > "$EXISTING_ISSUES_FILE" 2>>"$LOG_FILE"; then
    log "ERROR: gh issue list failed — cannot safely dedupe. Aborting before filing anything."
    update_status "FAILED" "gh issue list (dedup fetch) failed — see log"
    notify urgent "Feedback triage FAILED" "Could not fetch existing issues for dedup — check $LOG_FILE"
    rm -f "$CANDIDATES_RAW" "$COMBINED_FILE" "$EXISTING_ISSUES_FILE"
    exit 1
fi

is_duplicate() {
    jq -e --arg fp "$1" 'any(.[]; .body // "" | test("fingerprint=" + $fp))' \
        "$EXISTING_ISSUES_FILE" >/dev/null 2>&1
}

# Fuzzy title match (same normalization as update-issue-priorities.sh's
# detect_duplicate_issues()) — logged as a hint in the filed issue's body,
# never auto-suppressed. Fingerprint match above is the sole authoritative
# dedup signal.
find_fuzzy_related() {
    local norm
    norm=$(echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 ]//g')
    jq -r --arg norm "$norm" \
        '.[] | select((.title | ascii_downcase | gsub("[^a-z0-9 ]"; "")) == $norm) | .number' \
        "$EXISTING_ISSUES_FILE" | head -1
}

# ── Step 4: file (or preview) each candidate, respecting the spam guard ───
FILED_COUNT=0
DUPLICATE_COUNT=0
PARTIAL_FAILURE=false
SUPPRESSED_FILE="$LOG_DIR/.feedback-triage-suppressed-$RUN_STAMP.jsonl"
: > "$SUPPRESSED_FILE"

while IFS= read -r item; do
    fingerprint=$(echo "$item" | jq -r '.fingerprint')

    if is_duplicate "$fingerprint"; then
        DUPLICATE_COUNT=$((DUPLICATE_COUNT + 1))
        log "Skipping duplicate of an existing auto-feedback-triage issue (fingerprint $fingerprint)"
        continue
    fi

    if [ "$FILED_COUNT" -ge "$MAX_ISSUES_PER_RUN" ]; then
        echo "$item" >> "$SUPPRESSED_FILE"
        continue
    fi
    FILED_COUNT=$((FILED_COUNT + 1))

    title=$(echo "$item" | jq -r '.title')
    body=$(echo "$item" | jq -r '.body')
    labels=$(echo "$item" | jq -r '.labels | join(",")')

    related=$(find_fuzzy_related "$title")
    if [ -n "$related" ]; then
        log "Note: #$related has a similar title — flagging as possibly related, not auto-suppressing"
        body="$body

> **Possibly related:** #$related — please verify before treating as a new issue."
    fi

    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: would create issue: [$labels] $title"
    else
        if gh issue create --title "$title" --body "$body" --label "$labels" >> "$LOG_FILE" 2>&1; then
            log "Filed issue: $title"
        else
            log "ERROR: gh issue create failed for: $title"
            PARTIAL_FAILURE=true
        fi
    fi
done < "$COMBINED_FILE"

SUPPRESSED_COUNT=$(wc -l < "$SUPPRESSED_FILE" | tr -d ' ')
if [ "$SUPPRESSED_COUNT" -gt 0 ]; then
    jq -s '.' "$SUPPRESSED_FILE" > "$CARRYOVER_FILE"
    log "Carried over $SUPPRESSED_COUNT candidate(s) suppressed by MAX_ISSUES_PER_RUN=$MAX_ISSUES_PER_RUN to next run."
else
    echo '[]' > "$CARRYOVER_FILE"
fi

rm -f "$COMBINED_FILE" "$EXISTING_ISSUES_FILE" "$SUPPRESSED_FILE"

# ── Step 5: report ──────────────────────────────────────────────────────
SUMMARY="candidates=$CANDIDATE_COUNT filed=$FILED_COUNT duplicates=$DUPLICATE_COUNT suppressed=$SUPPRESSED_COUNT dry_run=$DRY_RUN"
log "=== Done: $SUMMARY ==="

if [ "$PARTIAL_FAILURE" = true ]; then
    update_status "FAILED" "Partial failure — some gh issue create calls failed ($SUMMARY)"
    notify urgent "Feedback triage: partial failure" "Some issues failed to file — check $LOG_FILE ($SUMMARY)"
    exit 3
fi

update_status "COMPLETE" "$SUMMARY"
if [ "$FILED_COUNT" -gt 0 ] && [ "$DRY_RUN" = false ]; then
    notify default "Feedback triage filed $FILED_COUNT issue(s)" "$SUMMARY — review labels/priority in GitHub"
fi
exit 0
