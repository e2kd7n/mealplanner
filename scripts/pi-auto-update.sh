#!/bin/bash
#
# Pull the latest backend image from GHCR and redeploy if changed.
# Runs unattended via systemd timer (daily at 01:30) and accepts manual invocation:
#
#   ./scripts/pi-auto-update.sh          # update only if a newer image exists
#   ./scripts/pi-auto-update.sh --force  # pull and redeploy unconditionally
#
# Logs: data/maintenance-logs/auto-update-<timestamp>.log (14 days), plus a
# one-line last-run summary in data/maintenance-logs/auto-update-status.txt.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

cd "$SCRIPT_DIR/.."

REGISTRY="ghcr.io"
IMAGE_OWNER="e2kd7n"
REMOTE_IMAGE="${REGISTRY}/${IMAGE_OWNER}/mealplanner-backend:latest"
LOCAL_IMAGE="meals-backend:latest"
GHCR_TOKEN_FILE="./secrets/ghcr_token.txt"
FORCE=false
[ "${1:-}" = "--force" ] && FORCE=true

# Keep a per-run log on disk. pi4's journald is Storage=volatile (SD-card wear),
# and its RAM journal rotates a 01:30 run's output away within hours, so failed
# nightly runs were undiagnosable after the fact. One small file per run is far
# less write traffic than making the whole journal persistent. stdout still
# reaches the journal (and the terminal on manual runs) via tee.
LOG_DIR="./data/maintenance-logs"
LOG_RETENTION_DAYS=14
mkdir -p "$LOG_DIR"
LOG_FILE="${AUTO_UPDATE_LOG_FILE:-$LOG_DIR/auto-update-$(date '+%Y-%m-%d-%H%M%S').log}"
STATUS_FILE="$LOG_DIR/auto-update-status.txt"
# On a re-exec after a self-update (see Repo Sync below) stdout is already the
# tee pipe inherited from the first process — teeing again would double lines.
[ -z "${AUTO_UPDATE_REEXEC:-}" ] && exec > >(tee -a "$LOG_FILE") 2>&1
find "$LOG_DIR" -maxdepth 1 -name 'auto-update-*.log' -mtime +"$LOG_RETENTION_DAYS" -delete 2>/dev/null || true

# Timestamped log line. When run under cron/systemd (non-TTY), utilities.sh
# already blanks the color vars, so this degrades to plain text automatically.
log()  { echo -e "${DIM}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*"; }
warn() { echo -e "${DIM}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${YELLOW}⚠️  $*${NC}"; }
err()  { echo -e "${DIM}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${RED}✗ $*${NC}"; }

# On failure: dump the last backend log lines so the error is debuggable without
# SSH-ing in, then prune any dangling (untagged) images left by a partial pull.
_on_exit() {
    local exit_code=$?
    if [ "$exit_code" -ne 0 ]; then
        err "Script exited with code $exit_code — last 30 backend log lines:"
        podman logs --tail=30 meals-backend 2>/dev/null || true
        log "Pruning dangling images left by failed update..."
        podman image prune -f 2>/dev/null || true
    fi
    # One-line last-run summary: `cat data/maintenance-logs/auto-update-status.txt`
    echo "$(date '+%Y-%m-%d %H:%M:%S') exit=$exit_code log=$(basename "$LOG_FILE")" > "$STATUS_FILE"
}
trap _on_exit EXIT

section "Meal Planner Auto-Update" "📥"

# ── Repo Sync ──────────────────────────────────────────────────────────────────
# The image pull below only updates app code. Scripts, compose files and nginx
# config live in this checkout and used to reach the Pi only via a manual
# `git pull`. Fast-forward only: if local edits conflict with incoming changes
# the merge refuses, and we warn and carry on with the image update rather than
# fail the whole run.
[ "${AUTO_UPDATE_CONFIG_CHANGED:-0}" = 1 ] && FORCE=true
if [ -z "${AUTO_UPDATE_REEXEC:-}" ]; then
    section "Repo Sync" "🔄"
    if ! git fetch origin main --quiet; then
        warn "git fetch failed — continuing with the current checkout"
    else
        BEHIND=$(git rev-list --count HEAD..origin/main)
        if [ "$BEHIND" -eq 0 ]; then
            log "Checkout is up to date with origin/main ($(git rev-parse --short HEAD))."
        else
            OLD_HEAD=$(git rev-parse HEAD)
            if git merge --ff-only --quiet origin/main; then
                log "Fast-forwarded ${BEHIND} commit(s): ${OLD_HEAD:0:7} → $(git rev-parse --short HEAD)"
                CHANGED_FILES=$(git diff --name-only "$OLD_HEAD" HEAD)
                # Compose/nginx changes only take effect when containers restart,
                # so redeploy even if the image itself turns out unchanged.
                if grep -qE '^(podman-compose[^/]*\.ya?ml|nginx/)' <<<"$CHANGED_FILES"; then
                    log "Compose/nginx config changed — containers will be restarted."
                    FORCE=true
                fi
                # Re-run the updated version of this script so tonight's run uses
                # the new logic, not the copy bash already has in memory.
                if grep -qE '^scripts/(pi-auto-update|utilities)\.sh$' <<<"$CHANGED_FILES"; then
                    log "Auto-update script changed — re-running the new version."
                    AUTO_UPDATE_REEXEC=1 AUTO_UPDATE_LOG_FILE="$LOG_FILE" \
                        AUTO_UPDATE_CONFIG_CHANGED=$([ "$FORCE" = true ] && echo 1 || echo 0) \
                        exec bash "$SCRIPT_DIR/$(basename "$0")" "$@"
                fi
            else
                warn "Can't fast-forward ${BEHIND} commit(s) — local changes conflict. Resolve by hand:"
                git status --short
            fi
        fi
    fi
fi

section "Pre-flight Check" "🔍"

# Disk check — warn but do not block unattended runs
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_USAGE" -gt 80 ]; then
    warn "Disk at ${DISK_USAGE}% — pull may fail. Consider: podman image prune -a"
else
    log "Disk usage ${DISK_USAGE}% — OK"
fi

# Prune stopped containers and dangling images before starting so stale remnants
# from a previous failed run do not interfere with the pull.
section "Cleanup" "🧹"
log "Cleaning up stale containers and dangling images..."
podman container prune -f 2>/dev/null || true
podman image prune -f 2>/dev/null || true

if [ -f "$GHCR_TOKEN_FILE" ]; then
    section "Authentication" "🔐"
    log "Authenticating with GHCR..."
    podman login "$REGISTRY" -u "$IMAGE_OWNER" \
        --password-stdin --log-level=warn < "$GHCR_TOKEN_FILE"
fi

# Record current local image ID so we can detect a real change after pull
BEFORE_ID=$(podman inspect "$LOCAL_IMAGE" --format '{{.Id}}' 2>/dev/null || echo "")

section "Pulling Image" "📥"
log "Pulling ${REMOTE_IMAGE}..."
timer_start
if ! podman pull "$REMOTE_IMAGE"; then
    err "Pull failed — network issue or image not yet published. Aborting."
    exit 1
fi
timer_end

podman tag "$REMOTE_IMAGE" "$LOCAL_IMAGE"
AFTER_ID=$(podman inspect "$LOCAL_IMAGE" --format '{{.Id}}' 2>/dev/null || echo "")

# Keep only the local tag; drop the GHCR reference so podman-compose doesn't
# attempt a second pull. Remove the superseded image by ID to prevent it
# accumulating as untagged layers on the Pi's limited storage.
podman rmi "$REMOTE_IMAGE" 2>/dev/null || true
if [ -n "$BEFORE_ID" ] && [ "$BEFORE_ID" != "$AFTER_ID" ]; then
    podman rmi "$BEFORE_ID" 2>/dev/null || true
fi

if [ "$BEFORE_ID" = "$AFTER_ID" ] && [ -n "$BEFORE_ID" ] && [ "$FORCE" = false ]; then
    log "Image unchanged (${AFTER_ID:0:12}) — containers not restarted."
    exit 0
fi

log "New image: ${BEFORE_ID:0:12} → ${AFTER_ID:0:12}"

# Extract the compiled React frontend bundled inside the backend image.
# Nginx serves static files from ./data/frontend-dist — there is no frontend container on Pi.
section "Preparing Assets" "📦"
log "Extracting frontend static files..."
extract_frontend_from_image "$LOCAL_IMAGE" >/dev/null
log "Extracted $(ls ./data/frontend-dist | wc -l) files to data/frontend-dist/"

COMPOSE_FILES=$(clusterhat_compose_files)
if echo "$COMPOSE_FILES" | grep -q "clusterhat"; then
    log "ClusterHAT overlay enabled"
fi

section "Restarting Services" "🚀"
log "Restarting containers..."
# Suppress expected "not found" noise when nothing was running before this update.
# shellcheck disable=SC2086
podman-compose $COMPOSE_FILES down 2>&1 \
    | grep -v "no such container\|no such pod\|no pod with name\|no container with name" \
    || true

# shellcheck disable=SC2086
podman-compose $COMPOSE_FILES up -d

section "Health Check" "🩺"
log "Waiting for backend to become healthy..."
HEALTHY=false
for i in $(seq 1 12); do
    sleep 5
    if podman healthcheck run meals-backend >/dev/null 2>&1; then
        HEALTHY=true
        break
    fi
done
if [ "$HEALTHY" = true ]; then
    log "✓ Backend healthy after $((i * 5))s."
else
    err "meals-backend did not become healthy after 60s. Last 30 log lines:"
    # shellcheck disable=SC2086
    podman-compose $COMPOSE_FILES logs --tail=30 backend >&2
    exit 1
fi

section "Database Migration" "🗄️"
log "Running database migrations..."
PRISMA_BIN=$(podman exec meals-backend find /app/node_modules/.pnpm -name "index.js" -path "*/prisma/build/index.js" 2>/dev/null | head -1)
if [ -z "$PRISMA_BIN" ]; then
    PRISMA_BIN="/app/node_modules/.bin/prisma"
fi
if ! podman exec meals-backend test -f "$PRISMA_BIN" 2>/dev/null; then
    warn "Prisma CLI not found in container — skipping migration step."
else
    podman exec meals-backend sh -c "
        POSTGRES_PASSWORD=\$(cat /run/secrets/postgres_password)
        export DATABASE_URL=\"postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@\${POSTGRES_HOST}:\${POSTGRES_PORT}/\${POSTGRES_DB}\"
        node $PRISMA_BIN migrate deploy
    " && log "✓ Migrations applied." || warn "Migration step failed — check logs."
fi

# Deploy updated backend to Zero W nodes
if detect_clusterhat; then
    section "ClusterHAT Deployment" "🌐"
    log "Deploying updated backend to Zero W nodes..."
    if bash "$SCRIPT_DIR/pi-run.sh" --zeros-only --zero-user="$CLUSTERHAT_ZERO_USER" 2>&1 \
        | while IFS= read -r line; do log "  $line"; done; then
        log "✓ Zero W deployment complete."
    else
        warn "Zero W deployment had errors — check output above"
    fi
fi

# Clean up any images that are now untagged (the superseded build left behind
# by podman after restarting containers).
log "Cleaning up superseded images..."
podman image prune -f 2>/dev/null || true

section "Summary" "🍽️"
log "✓ Deployment complete."
