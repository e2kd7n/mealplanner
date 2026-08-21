#!/bin/bash
# Security Audit — runs ON the Pi, triggered by a weekly cron entry.
# Replaces the npm-audit/npm-audit-fix/issue-filing portion of the cloud
# maintenance routine, which had to be done from a cold clone with no
# incremental state. This runs against the actual deployed checkout, fixes
# what pnpm can fix automatically, and keeps a single rolling GitHub issue
# in sync with whatever HIGH/CRITICAL vulns remain — rather than filing a
# fresh issue every week (see docs/WEEKLY_MAINTENANCE.md "Security Updates").
#
# Also runs the credential-leak commit scan documented in the same section.
# A match is never posted to GitHub (that would publish the very secret
# it found) — it only fires a local notification for a human to act on.
#
# Usage: ./scripts/security-audit.sh [--dry-run]
#   --dry-run   run pnpm audit + audit fix and compute findings, but skip
#               gh issue create/edit/comment/close and the commit/push
#
# Install as a weekly cron job, e.g.:
#   15 4 * * 0  cd /path/to/mealplanner && ./scripts/security-audit.sh >> data/maintenance-logs/cron-security-audit.log 2>&1

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

LOG_DIR="$PROJECT_ROOT/data/maintenance-logs"
STATUS_FILE="$LOG_DIR/security-audit-status.txt"
mkdir -p "$LOG_DIR"
RUN_STAMP="$(date +"%Y-%m-%d-%H%M%S")"
LOG_FILE="$LOG_DIR/security-audit-$RUN_STAMP.log"

TRACKER_LABEL="auto-security-audit"

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
    bash "$SCRIPT_DIR/send-notification.sh" "$1" "$2" "$3" "lock,warning" 2>/dev/null || true
}

log "=== Security audit starting (dry_run=$DRY_RUN) ==="

# ── Preflight ────────────────────────────────────────────────────────────
for cmd in pnpm gh jq; do
    if ! command -v "$cmd" &>/dev/null; then
        log "ERROR: required command '$cmd' not found on PATH."
        update_status "FAILED" "Aborted preflight: '$cmd' not installed"
        notify urgent "Security audit aborted" "'$cmd' is not installed on this host"
        exit 2
    fi
done

GITHUB_TOKEN_FILE="$PROJECT_ROOT/secrets/github_token.txt"
if [ ! -s "$GITHUB_TOKEN_FILE" ]; then
    log "ERROR: $GITHUB_TOKEN_FILE missing or empty."
    update_status "FAILED" "Aborted preflight: secrets/github_token.txt missing or empty"
    notify urgent "Security audit aborted" "secrets/github_token.txt missing or empty — see docs/WEEKLY_MAINTENANCE.md"
    exit 2
fi
export GH_TOKEN
GH_TOKEN="$(cat "$GITHUB_TOKEN_FILE")"

log "Preflight OK."
update_status "RUNNING" "Security audit in progress"

gh label create "$TRACKER_LABEL" --color "b60205" \
    --description "Auto-updated by scripts/security-audit.sh" 2>/dev/null || true

# ── Step 1: credential-leak scan over the last 7 days of commits ─────────
# Never post a match anywhere (GitHub, this log's committed history) —
# only a local notification. The log file itself stays out of git.
log "Scanning last 7 days of commits for credential-shaped strings..."
LEAK_MATCHES=$(git log --since="7 days ago" -p -- . ':(exclude)*.lock' 2>/dev/null \
    | grep -EnI "AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(SECRET|TOKEN|PASSWORD|API_KEY)[[:space:]]*[:=][[:space:]]*['\"][^'\"]{12,}" \
    | wc -l | tr -d ' ')
if [ "$LEAK_MATCHES" -gt 0 ]; then
    log "WARNING: $LEAK_MATCHES possible credential-shaped match(es) in recent commits. Not logging the match content itself."
    notify urgent "Possible leaked credential in recent commits" \
        "$LEAK_MATCHES pattern match(es) in the last 7 days of commit diffs. Run the grep from docs/WEEKLY_MAINTENANCE.md's Security Updates section locally to review — do not paste matches into GitHub."
else
    log "No credential-shaped matches found."
fi

# ── Step 2: pnpm audit + audit fix, per app ───────────────────────────────
FINDINGS_FILE="$LOG_DIR/.security-audit-findings-$RUN_STAMP.json"
echo "[]" > "$FINDINGS_FILE"
ANY_CRITICAL=false
CHANGED_LOCKFILES=false

for APP in backend frontend; do
    log "── $APP ──"
    (
        cd "$PROJECT_ROOT/$APP" || exit 1

        log "  pnpm audit (before fix)..."
        pnpm audit --json > "$LOG_DIR/.audit-pre-$APP-$RUN_STAMP.json" 2>>"$LOG_FILE" || true

        if [ "$DRY_RUN" = true ]; then
            log "  DRY RUN: skipping pnpm audit fix (would write to package.json/lockfile) — reporting pre-fix findings."
            cp "$LOG_DIR/.audit-pre-$APP-$RUN_STAMP.json" "$LOG_DIR/.audit-post-$APP-$RUN_STAMP.json"
        else
            log "  pnpm audit fix (non-breaking, no --force)..."
            pnpm audit fix >> "$LOG_FILE" 2>&1 || log "  Note: pnpm audit fix exited non-zero (some vulns may be unfixable without --force) — continuing."

            log "  pnpm audit (after fix)..."
            pnpm audit --json > "$LOG_DIR/.audit-post-$APP-$RUN_STAMP.json" 2>>"$LOG_FILE" || true
        fi
    )
done

if ! git diff --quiet -- backend/package.json backend/pnpm-lock.yaml frontend/package.json frontend/pnpm-lock.yaml 2>/dev/null; then
    CHANGED_LOCKFILES=true
fi

for APP in backend frontend; do
    POST_FILE="$LOG_DIR/.audit-post-$APP-$RUN_STAMP.json"
    [ -s "$POST_FILE" ] || continue
    jq -c --arg app "$APP" \
        '(.advisories // {}) | to_entries[] | .value | select(.severity=="high" or .severity=="critical") | {app:$app, id, severity, module_name, title}' \
        "$POST_FILE" 2>/dev/null | while IFS= read -r item; do
        jq --argjson item "$item" '. + [$item]' "$FINDINGS_FILE" > "$FINDINGS_FILE.tmp" && mv "$FINDINGS_FILE.tmp" "$FINDINGS_FILE"
    done
done

FINDING_COUNT=$(jq 'length' "$FINDINGS_FILE")
CRITICAL_COUNT=$(jq '[.[] | select(.severity=="critical")] | length' "$FINDINGS_FILE")
log "Remaining HIGH/CRITICAL after audit fix: $FINDING_COUNT (critical: $CRITICAL_COUNT)"
[ "$CRITICAL_COUNT" -gt 0 ] && ANY_CRITICAL=true

# ── Step 3: commit/push if audit fix changed anything ─────────────────────
if [ "$CHANGED_LOCKFILES" = true ]; then
    log "audit fix modified package.json/lockfile(s)."
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: would commit/push dependency changes."
    else
        (git add backend/package.json backend/pnpm-lock.yaml frontend/package.json frontend/pnpm-lock.yaml 2>/dev/null && \
         git commit -m "fix(deps): pnpm audit fix — weekly maintenance ($(date -u +%Y-%m-%d))" && \
         git push) >> "$LOG_FILE" 2>&1 || log "Note: could not commit/push dependency changes (not fatal — do it manually)."
    fi
else
    log "No dependency changes from audit fix."
fi

# ── Step 4: sync the single rolling tracker issue ──────────────────────────
EXISTING=$(gh issue list --state open --label "$TRACKER_LABEL" --limit 1 --json number 2>>"$LOG_FILE")
TRACKER_NUM=$(echo "$EXISTING" | jq -r '.[0].number // empty')

BODY_FILE="$LOG_DIR/.security-audit-body-$RUN_STAMP.md"
{
    echo "Auto-updated by \`scripts/security-audit.sh\` — this issue always reflects the **current** state, not a historical log. Do not edit the table by hand; add commentary below it instead."
    echo ""
    echo "**Last checked:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
    echo ""
    if [ "$FINDING_COUNT" -gt 0 ]; then
        echo "**$FINDING_COUNT unresolved HIGH/CRITICAL finding(s)** after \`pnpm audit fix\` (non-breaking only, no \`--force\`):"
        echo ""
        echo "| App | Severity | Module | Advisory | Title |"
        echo "|---|---|---|---|---|"
        jq -r '.[] | "| \(.app) | \(.severity) | \(.module_name) | \(.id) | \(.title) |"' "$FINDINGS_FILE"
        echo ""
        echo "Fixing these requires either a breaking upgrade (\`pnpm audit fix --force\` — review changelogs first) or an upstream patch. Some may already be tracked in older manually-filed \`security\`-labeled issues from before this automation existed — worth a quick cross-check rather than assuming this is the only tracker."
    else
        echo "**No unresolved HIGH/CRITICAL findings.** All clear as of this run."
    fi
} > "$BODY_FILE"

if [ "$FINDING_COUNT" -gt 0 ]; then
    PRIORITY_LABEL="P1-high"
    [ "$ANY_CRITICAL" = true ] && PRIORITY_LABEL="P0-critical"

    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: would $([ -n "$TRACKER_NUM" ] && echo "update #$TRACKER_NUM" || echo "create a new tracker issue") with $FINDING_COUNT finding(s)."
    elif [ -n "$TRACKER_NUM" ]; then
        gh issue edit "$TRACKER_NUM" --body-file "$BODY_FILE" >> "$LOG_FILE" 2>&1 \
            && log "Updated tracker issue #$TRACKER_NUM." \
            || log "ERROR: failed to update tracker issue #$TRACKER_NUM."
    else
        NEW_NUM=$(gh issue create --title "security: automated weekly vulnerability tracker" \
            --body-file "$BODY_FILE" --label "security,$TRACKER_LABEL,$PRIORITY_LABEL" 2>>"$LOG_FILE" \
            | grep -oE '[0-9]+$')
        if [ -n "$NEW_NUM" ]; then
            log "Filed new tracker issue #$NEW_NUM."
        else
            log "ERROR: failed to create tracker issue."
        fi
    fi

    if [ "$ANY_CRITICAL" = true ]; then
        notify urgent "Security audit: CRITICAL vulnerability found" \
            "$CRITICAL_COUNT critical finding(s) remain after pnpm audit fix — see the auto-security-audit tracker issue."
    fi
else
    if [ -n "$TRACKER_NUM" ]; then
        if [ "$DRY_RUN" = true ]; then
            log "DRY RUN: would close tracker issue #$TRACKER_NUM (all clear)."
        else
            gh issue edit "$TRACKER_NUM" --body-file "$BODY_FILE" >> "$LOG_FILE" 2>&1
            gh issue close "$TRACKER_NUM" --comment "All HIGH/CRITICAL findings resolved as of $(date -u +%Y-%m-%d)." >> "$LOG_FILE" 2>&1 \
                && log "Closed tracker issue #$TRACKER_NUM (all clear)." \
                || log "ERROR: failed to close tracker issue #$TRACKER_NUM."
        fi
    else
        log "Nothing to track — no open tracker issue and no findings."
    fi
fi

rm -f "$LOG_DIR"/.audit-pre-*-"$RUN_STAMP".json "$LOG_DIR"/.audit-post-*-"$RUN_STAMP".json "$FINDINGS_FILE" "$BODY_FILE"

# ── Step 5: report ──────────────────────────────────────────────────────
SUMMARY="findings=$FINDING_COUNT critical=$CRITICAL_COUNT lockfiles_changed=$CHANGED_LOCKFILES leak_scan_matches=$LEAK_MATCHES dry_run=$DRY_RUN"
log "=== Done: $SUMMARY ==="
update_status "COMPLETE" "$SUMMARY"
exit 0
