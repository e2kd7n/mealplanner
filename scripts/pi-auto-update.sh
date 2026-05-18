#!/bin/bash
#
# Pull the latest backend image from GHCR and redeploy if changed.
# Runs unattended via systemd timer (daily at 01:30) and accepts manual invocation:
#
#   ./scripts/pi-auto-update.sh          # update only if a newer image exists
#   ./scripts/pi-auto-update.sh --force  # pull and redeploy unconditionally

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

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

log "=== Meal Planner Auto-Update ==="

# Disk check — warn but do not block unattended runs
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_USAGE" -gt 80 ]; then
    log "WARNING: Disk at ${DISK_USAGE}% — pull may fail. Consider: podman image prune -a"
fi

if [ -f "$GHCR_TOKEN_FILE" ]; then
    log "Authenticating with GHCR..."
    podman login "$REGISTRY" -u "$IMAGE_OWNER" \
        --password-stdin --log-level=warn < "$GHCR_TOKEN_FILE"
fi

# Record current local image ID so we can detect a real change after pull
BEFORE_ID=$(podman inspect "$LOCAL_IMAGE" --format '{{.Id}}' 2>/dev/null || echo "")

log "Pulling ${REMOTE_IMAGE}..."
if ! podman pull "$REMOTE_IMAGE"; then
    log "ERROR: Pull failed — network issue or image not yet published. Aborting."
    exit 1
fi

podman tag "$REMOTE_IMAGE" "$LOCAL_IMAGE"
AFTER_ID=$(podman inspect "$LOCAL_IMAGE" --format '{{.Id}}' 2>/dev/null || echo "")

# Keep only the local tag; layers are retained
podman rmi "$REMOTE_IMAGE" 2>/dev/null || true

if [ "$BEFORE_ID" = "$AFTER_ID" ] && [ -n "$BEFORE_ID" ] && [ "$FORCE" = false ]; then
    log "Image unchanged (${AFTER_ID:0:12}) — containers not restarted."
    exit 0
fi

log "New image: ${BEFORE_ID:0:12} → ${AFTER_ID:0:12}"

# Extract the compiled React frontend bundled inside the backend image.
# Nginx serves static files from ./data/frontend-dist — there is no frontend container on Pi.
log "Extracting frontend static files..."
extract_frontend_from_image "$LOCAL_IMAGE" >/dev/null
log "Extracted $(ls ./data/frontend-dist | wc -l) files to data/frontend-dist/"

log "Restarting containers..."
podman-compose -f podman-compose.pi.yml down
podman-compose -f podman-compose.pi.yml up -d

log "Waiting for backend to become healthy..."
for i in $(seq 1 12); do
    sleep 5
    if podman healthcheck run meals-backend >/dev/null 2>&1; then
        log "✓ Backend healthy after $((i * 5))s."
        break
    fi
    if [ "$i" -eq 12 ]; then
        log "ERROR: meals-backend did not become healthy after 60s. Last 30 log lines:"
        podman-compose -f podman-compose.pi.yml logs --tail=30 backend >&2
        exit 1
    fi
done

log "Running database migrations..."
PRISMA_BIN=$(podman exec meals-backend find /app/node_modules/.pnpm -name "index.js" -path "*/prisma/build/index.js" 2>/dev/null | head -1)
if [ -z "$PRISMA_BIN" ]; then
    log "WARNING: Prisma CLI not found in container — skipping migration step."
else
    podman exec meals-backend sh -c "
        POSTGRES_PASSWORD=\$(cat /run/secrets/postgres_password)
        export DATABASE_URL=\"postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@\${POSTGRES_HOST}:\${POSTGRES_PORT}/\${POSTGRES_DB}\"
        node $PRISMA_BIN migrate deploy
    " && log "✓ Migrations applied." || log "WARNING: Migration step failed — check logs."
fi

log "✓ Deployment complete."
