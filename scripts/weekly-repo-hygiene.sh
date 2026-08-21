#!/bin/bash
# Weekly Repo Hygiene — runs ON the Pi via a weekly cron entry. Thin wrapper
# around scripts/update-issue-priorities.sh that adds the commit/push step
# the cloud maintenance routine used to do manually (see
# docs/WEEKLY_MAINTENANCE.md "Issue and Repository Hygiene"). Kept separate
# from update-issue-priorities.sh itself so that script stays safe to run
# interactively on a developer machine without an unexpected auto-commit.
#
# Deliberately does NOT pass --auto-close: regex-pattern-based issue closing
# has produced false positives on this repo before (see memory
# feedback_autoclose_bot_false_positives) — a human or the cloud routine's
# LLM judgment reviews "appears complete" candidates before closing them.
#
# Install as a weekly cron job, e.g.:
#   15 4 * * 0  cd /path/to/mealplanner && ./scripts/weekly-repo-hygiene.sh >> data/maintenance-logs/cron-issue-hygiene.log 2>&1

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

LOG_DIR="$PROJECT_ROOT/data/maintenance-logs"
STATUS_FILE="$LOG_DIR/issue-hygiene-status.txt"
mkdir -p "$LOG_DIR"
RUN_STAMP="$(date +"%Y-%m-%d-%H%M%S")"
LOG_FILE="$LOG_DIR/issue-hygiene-$RUN_STAMP.log"

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
    bash "$SCRIPT_DIR/send-notification.sh" "$1" "$2" "$3" "clipboard,recycle" 2>/dev/null || true
}

log "=== Weekly repo hygiene starting ==="
update_status "RUNNING" "Weekly repo hygiene in progress"

if ! "$SCRIPT_DIR/update-issue-priorities.sh" >> "$LOG_FILE" 2>&1; then
    log "ERROR: update-issue-priorities.sh failed — see log."
    update_status "FAILED" "update-issue-priorities.sh exited non-zero — see log"
    notify urgent "Weekly repo hygiene FAILED" "update-issue-priorities.sh failed — check $LOG_FILE"
    exit 1
fi

if git diff --quiet -- ISSUE_PRIORITIES.md 2>/dev/null; then
    log "ISSUE_PRIORITIES.md unchanged."
    update_status "COMPLETE" "No changes to commit"
else
    log "ISSUE_PRIORITIES.md changed — committing/pushing."
    (git add ISSUE_PRIORITIES.md && \
     git commit -m "chore: update issue priorities — weekly maintenance ($(date -u +%Y-%m-%d))" && \
     git push) >> "$LOG_FILE" 2>&1 \
        && update_status "COMPLETE" "ISSUE_PRIORITIES.md updated and pushed" \
        || { log "ERROR: commit/push failed."; update_status "FAILED" "commit/push failed — see log"; notify urgent "Weekly repo hygiene: push failed" "ISSUE_PRIORITIES.md regenerated but commit/push failed — check $LOG_FILE"; exit 1; }
fi

log "=== Done ==="
exit 0
