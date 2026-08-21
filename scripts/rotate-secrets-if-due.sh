#!/bin/bash
# Secret Rotation — runs ON the Pi (or any host with real secrets/ access),
# triggered by a weekly cron entry, but only takes action when a secret is
# actually due. Most weeks it should be a no-op.
#
# Why this exists: docs/WEEKLY_MAINTENANCE.md's cloud routine can only
# detect+flag overdue secrets (it never has filesystem access to secrets/).
# This script is the piece that actually rotates them, unattended, with a
# health-checked rollback if the rotation breaks the running app.
#
# Usage: ./scripts/rotate-secrets-if-due.sh [--force]
#   --force   rotate now regardless of due date (still does the full
#             preflight/rollback dance — use for manual testing)
#
# Install as a weekly cron job, e.g.:
#   15 3 * * 0  cd /path/to/mealplanner && ./scripts/rotate-secrets-if-due.sh >> data/maintenance-logs/cron-secret-rotation.log 2>&1

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

SECRETS_DIR="./secrets"
LOG_DIR="$PROJECT_ROOT/data/maintenance-logs"
STATUS_FILE="$LOG_DIR/secret-rotation-status.txt"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/secret-rotation-$(date +"%Y-%m-%d-%H%M%S").log"

FORCE=false
[ "${1:-}" = "--force" ] && FORCE=true

log() { echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] $1" | tee -a "$LOG_FILE"; }
update_status() {
    cat > "$STATUS_FILE" <<EOF
STATUS=$1
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
MESSAGE=$2
LOG_FILE=$LOG_FILE
EOF
}

section "Secret Rotation" "🔐"

CONTAINER_CMD="$(detect_container_runtime)"
if [ -z "$CONTAINER_CMD" ]; then
    echo -e "  ${BLUE}ℹ️${NC}  No podman/docker found — nothing to rotate against. Exiting."
    log "No podman/docker found — nothing to rotate against. Exiting."
    exit 0
fi
COMPOSE_FILES="$(clusterhat_compose_files 2>/dev/null || echo "-f podman-compose.pi.yml")"
COMPOSE_CMD="${CONTAINER_CMD}-compose"

notify() {
    # priority, title, body — best-effort, never fails the script
    bash "$SCRIPT_DIR/send-notification.sh" "$1" "$2" "$3" "key,lock" 2>/dev/null || true
}

# ── Step 1: is anything actually due? ────────────────────────────────────
section "Checking Rotation Due Dates" "🔐"

if [ ! -d "$SECRETS_DIR" ] || ! ls "$SECRETS_DIR"/*.txt.metadata &>/dev/null; then
    echo -e "  ${BLUE}ℹ️${NC}  No secrets/*.txt.metadata found — nothing to check."
    log "No secrets/*.txt.metadata found — nothing to check. Exiting (baseline must be created manually first: ./scripts/generate-secrets.sh)."
    exit 0
fi

now_epoch=$(date -u +%s)
due_now=false
next_due=""
for meta in "$SECRETS_DIR"/*.txt.metadata; do
    secret_name="$(basename "$meta" .txt.metadata)"
    due=$(grep -o '"rotationDue": *"[^"]*"' "$meta" | cut -d'"' -f4)
    if [ -z "$due" ] || [ "$due" = "null" ]; then
        echo -e "  ${BLUE}ℹ️${NC}  ${secret_name} — no rotation date set"
        continue
    fi
    due_epoch=$(date -u -d "$due" +%s 2>/dev/null || echo 0)
    if [ "$due_epoch" -gt 0 ] && [ "$now_epoch" -ge "$due_epoch" ]; then
        due_now=true
        echo -e "  ${YELLOW}⚠️${NC}  ${secret_name} — due now (was due ${due})"
    else
        echo -e "  ${GREEN}✓${NC}  ${secret_name} — not due yet (due ${due})"
    fi
    if [ -z "$next_due" ] || [ "$due" \< "$next_due" ]; then
        next_due="$due"
    fi
done

if [ "$FORCE" = false ] && [ "$due_now" = false ]; then
    echo -e "  ${GREEN}✓${NC}  Nothing due for rotation yet (next due: ${next_due:-unknown})."
    log "No secrets due for rotation yet (next due: ${next_due:-unknown}). Nothing to do."
    exit 0
fi

log "=== Secret rotation starting (forced=$FORCE, due_now=$due_now) ==="
update_status "RUNNING" "Secret rotation in progress"

# ── Step 2: preflight — must be able to talk to Postgres with the CURRENT
# password before we touch anything. Rotating postgres_password requires an
# explicit ALTER USER (the postgres image only reads POSTGRES_PASSWORD_FILE
# on first init of an empty data dir — swapping the secret file alone does
# NOT change the live role password on an existing volume). ────────────────
section "Preflight" "🔐"

if ! $CONTAINER_CMD ps --format '{{.Names}}' | grep -q '^meals-postgres$'; then
    echo -e "  ${RED}✗${NC}  meals-postgres container is not running."
    log "ERROR: meals-postgres container is not running. Aborting before touching any secrets."
    update_status "FAILED" "Aborted preflight: postgres container not running"
    notify urgent "Secret rotation aborted" "meals-postgres not running — nothing was changed"
    exit 3
fi

OLD_PG_PASS="$(cat "$SECRETS_DIR/postgres_password.txt")"
if ! PGPASSWORD="$OLD_PG_PASS" $CONTAINER_CMD exec -e PGPASSWORD meals-postgres \
        psql -U mealplanner -d meal_planner -c "SELECT 1;" &>/dev/null; then
    echo -e "  ${RED}✗${NC}  Cannot authenticate to postgres with the current secret."
    log "ERROR: cannot authenticate to postgres with the current secret. Aborting before touching any secrets."
    update_status "FAILED" "Aborted preflight: could not verify current postgres credentials"
    notify urgent "Secret rotation aborted" "Preflight DB auth check failed — nothing was changed"
    exit 3
fi
echo -e "  ${GREEN}✓${NC}  Current postgres credentials verified."
log "Preflight OK — current postgres credentials verified."

# ── Step 3: rotate the files (backs up .previous + timestamped dir, writes
# docs/SECRET_ROTATION_STATUS.json) ─────────────────────────────────────────
section "Rotating Secrets" "🔐"

log "Running generate-secrets.sh --yes..."
if ! ./scripts/generate-secrets.sh --yes >> "$LOG_FILE" 2>&1; then
    echo -e "  ${RED}✗${NC}  generate-secrets.sh failed."
    log "ERROR: generate-secrets.sh failed. Secrets on disk may be inconsistent — check $SECRETS_DIR manually."
    update_status "FAILED" "generate-secrets.sh failed"
    notify urgent "Secret rotation FAILED" "generate-secrets.sh itself failed — check $LOG_FILE"
    exit 1
fi
NEW_PG_PASS="$(cat "$SECRETS_DIR/postgres_password.txt")"
echo -e "  ${GREEN}✓${NC}  New secret files generated."

# ── Step 4: point the live DB role at the new password, then recreate the
# containers so they pick up all five new secret files. ────────────────────
log "Updating postgres role password to match the rotated secret..."
if ! PGPASSWORD="$OLD_PG_PASS" $CONTAINER_CMD exec -e PGPASSWORD meals-postgres \
        psql -U mealplanner -d meal_planner -c "ALTER USER mealplanner WITH PASSWORD '$NEW_PG_PASS';" >> "$LOG_FILE" 2>&1; then
    echo -e "  ${RED}✗${NC}  ALTER USER failed — DB password NOT changed."
    log "ERROR: ALTER USER failed — DB password NOT changed. Restoring old secret files so nothing drifts out of sync."
    for f in "$SECRETS_DIR"/*.txt.previous; do cp "$f" "${f%.previous}"; done
    update_status "FAILED" "ALTER USER failed; secret files restored to previous values"
    notify urgent "Secret rotation FAILED" "Could not update postgres password — rolled back secret files, containers untouched"
    exit 1
fi
echo -e "  ${GREEN}✓${NC}  Postgres role password updated."

log "Recreating postgres, redis, backend to pick up new secrets (this logs everyone out — JWT/session secrets rotated)..."
echo -e "  ${YELLOW}⚠️${NC}  Recreating postgres, redis, backend — this logs every signed-in user out."
# shellcheck disable=SC2086
$COMPOSE_CMD $COMPOSE_FILES up -d --force-recreate postgres redis backend >> "$LOG_FILE" 2>&1

# ── Step 5: health check with rollback on failure ───────────────────────────
section "Health Check" "🔐"

if wait_for "waiting for backend to become healthy" 90 5 \
        bash -c "$CONTAINER_CMD exec meals-backend wget -q --spider http://127.0.0.1:3000/health" \
        >> "$LOG_FILE" 2>&1; then
    echo -e "  ${GREEN}✓${NC}  Backend healthy on new secrets."
    log "=== Rotation succeeded — all services healthy on new secrets. ==="
    update_status "COMPLETE" "Rotated all 5 secrets successfully; next due per docs/SECRET_ROTATION_STATUS.json"
    notify high "Secrets rotated" "Weekly check rotated all 5 secrets successfully. All users were logged out."
    (git add docs/SECRET_ROTATION_STATUS.json && \
     git commit -m "chore: rotate secrets ($(date -u +%Y-%m-%d))" && \
     git push) >> "$LOG_FILE" 2>&1 || log "Note: could not commit/push docs/SECRET_ROTATION_STATUS.json (not fatal — do it manually)."
    section "Summary" "🍽️"
    echo -e "  ${GREEN}✓${NC}  All 5 secrets rotated successfully. Log: ${DIM}${LOG_FILE}${NC}"
    exit 0
fi

echo -e "  ${RED}✗${NC}  Backend did not become healthy after rotation. Rolling back..."
log "ERROR: backend did not become healthy after rotation. Rolling back to previous secrets..."
section "Rolling Back" "🔐"
PGPASSWORD="$NEW_PG_PASS" $CONTAINER_CMD exec -e PGPASSWORD meals-postgres \
    psql -U mealplanner -d meal_planner -c "ALTER USER mealplanner WITH PASSWORD '$OLD_PG_PASS';" >> "$LOG_FILE" 2>&1
for f in "$SECRETS_DIR"/*.txt.previous; do cp "$f" "${f%.previous}"; done
# shellcheck disable=SC2086
$COMPOSE_CMD $COMPOSE_FILES up -d --force-recreate postgres redis backend >> "$LOG_FILE" 2>&1

if wait_for "waiting for backend to recover on rolled-back secrets" 90 5 \
        bash -c "$CONTAINER_CMD exec meals-backend wget -q --spider http://127.0.0.1:3000/health" \
        >> "$LOG_FILE" 2>&1; then
    echo -e "  ${YELLOW}⚠️${NC}  Rollback succeeded — app is healthy again on the OLD secrets."
    log "Rollback succeeded — app is healthy again on the OLD secrets. Rotation did not take effect."
    update_status "FAILED" "Rotation failed health check; rolled back successfully to previous secrets"
    notify urgent "Secret rotation rolled back" "New secrets broke health check — reverted to previous secrets successfully. Investigate before next attempt."
    section "Summary" "🍽️"
    echo -e "  ${YELLOW}⚠️${NC}  Rotation failed and was rolled back. App is healthy on old secrets. Log: ${DIM}${LOG_FILE}${NC}"
    exit 1
else
    echo -e "  ${RED}✗${NC}  CRITICAL: rollback ALSO failed to reach healthy."
    log "CRITICAL: rollback ALSO failed to reach healthy. Manual intervention required NOW."
    update_status "FAILED" "CRITICAL: rotation AND rollback both failed health check — app may be down"
    notify urgent "CRITICAL: secret rotation broke the app" "Rollback also failed health check. SSH in immediately — see $LOG_FILE"
    section "Summary" "🍽️"
    echo -e "  ${RED}✗${NC}  CRITICAL — rotation and rollback both failed. App may be down. SSH in now. Log: ${DIM}${LOG_FILE}${NC}"
    exit 2
fi
