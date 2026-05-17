#!/bin/bash
#
# Pull the latest backend image from GHCR and redeploy if changed.
# Runs unattended via systemd timer (daily at 01:30) and accepts manual invocation:
#
#   ./scripts/pi-auto-update.sh          # update only if a newer image exists
#   ./scripts/pi-auto-update.sh --force  # pull and redeploy unconditionally

set -euo pipefail

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
mkdir -p ./data/frontend-dist
rm -rf ./data/frontend-dist/*
podman run --rm \
    -v "$(pwd)/data/frontend-dist:/output:z" \
    "$LOCAL_IMAGE" \
    sh -c "cp -rp /app/public/. /output/"
log "Extracted $(ls ./data/frontend-dist | wc -l) files to data/frontend-dist/"

log "Restarting containers..."
podman-compose -f podman-compose.pi.yml down
podman-compose -f podman-compose.pi.yml up -d

log "Waiting for health checks (15s)..."
sleep 15

if podman ps | grep -q "meals-backend"; then
    log "✓ Deployment complete — meals-backend is running."
else
    log "ERROR: meals-backend did not come up. Last 30 log lines:"
    podman-compose -f podman-compose.pi.yml logs --tail=30 backend >&2
    exit 1
fi
