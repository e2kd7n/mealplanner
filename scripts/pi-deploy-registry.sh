#!/bin/bash

# Pull pre-built container image from GitHub Container Registry and deploy on Pi.
#
# This is faster than building on Pi because GitHub runners are far more powerful
# than the Pi 4B (more RAM, faster CPU, datacenter-speed npm access) and produce
# ARM64 images via QEMU emulation. The Pi only needs to pull and restart.
#
# The backend image is a multi-stage build that includes the compiled React frontend
# at /app/public/ — so only one image needs to be pulled.
#
# Usage:
#   ./scripts/pi-deploy-registry.sh                # pull latest (= current main)
#   ./scripts/pi-deploy-registry.sh main-abc1234   # pull a specific SHA tag
#
# Prerequisites:
#   - GitHub Actions workflow has built and pushed the image
#   - For private repos: create ./secrets/ghcr_token.txt with a PAT (read:packages scope)
#   - For public repos: no token needed

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

TAG="${1:-latest}"

REGISTRY="ghcr.io"
IMAGE_OWNER="e2kd7n"
REMOTE_IMAGE="${REGISTRY}/${IMAGE_OWNER}/mealplanner-backend:${TAG}"
LOCAL_IMAGE="meals-backend:latest"
GHCR_TOKEN_FILE="./secrets/ghcr_token.txt"

section "Deploy from Registry" "🚀"
echo -e "${BLUE}  Image: ${REMOTE_IMAGE}${NC}"

# ── Check for in-progress GitHub Actions build ──────────────────────────────────

GH_API="https://api.github.com/repos/${IMAGE_OWNER}/mealplanner/actions/workflows/build-and-push.yml/runs?per_page=1&status=in_progress"

section "Pre-flight Check" "🔍"

if command -v curl &> /dev/null; then
    start_spinner "Checking GitHub Actions build status"
    RUNS=$(curl -sf "$GH_API" 2>/dev/null) || true
    stop_spinner ok

    if [ -n "$RUNS" ]; then
        IN_PROGRESS=$(echo "$RUNS" | grep -o '"total_count":[0-9]*' | grep -o '[0-9]*')
        if [ "${IN_PROGRESS:-0}" -gt 0 ]; then
            RUN_URL=$(echo "$RUNS" | grep -o '"html_url":"[^"]*"' | head -1 | grep -o 'https://[^"]*')
            echo -e "${YELLOW}⚠️  A build is currently in progress on GitHub Actions.${NC}"
            echo -e "${YELLOW}   Pulling now will get the PREVIOUS image, not your latest commit.${NC}"
            [ -n "$RUN_URL" ] && echo -e "${BLUE}   ${RUN_URL}${NC}"
            echo ""
            read -p "Wait for it to finish, or continue anyway? [w=wait/c=continue/N=abort]: " -n 1 -r CHOICE
            echo
            if [[ "$CHOICE" =~ ^[Ww]$ ]]; then
                start_spinner "Waiting for build to complete (polling every 30s)"
                while true; do
                    sleep 30
                    RUNS=$(curl -sf "$GH_API" 2>/dev/null) || true
                    IN_PROGRESS=$(echo "$RUNS" | grep -o '"total_count":[0-9]*' | grep -o '[0-9]*')
                    if [ "${IN_PROGRESS:-0}" -eq 0 ]; then
                        stop_spinner ok
                        break
                    fi
                done
            elif [[ ! "$CHOICE" =~ ^[Cc]$ ]]; then
                echo -e "${RED}Aborted.${NC}"
                exit 1
            fi
        else
            echo -e "  ${GREEN}✓${NC}  No build in progress — safe to pull."
        fi
    else
        echo -e "${YELLOW}⚠️  Could not reach GitHub API — skipping build status check.${NC}"
    fi

    # ── Last build info + recent commits ────────────────────────────────────────
    LAST_RUN_FILE=$(mktemp)
    COMMITS_FILE=$(mktemp)
    curl -sf "https://api.github.com/repos/${IMAGE_OWNER}/mealplanner/actions/workflows/build-and-push.yml/runs?per_page=1&status=success" > "$LAST_RUN_FILE" 2>/dev/null || true
    curl -sf "https://api.github.com/repos/${IMAGE_OWNER}/mealplanner/commits?per_page=5" > "$COMMITS_FILE" 2>/dev/null || true

    if command -v python3 &>/dev/null; then
        python3 - "$LAST_RUN_FILE" "$COMMITS_FILE" <<'PYEOF'
import json, sys

BLUE = "\033[0;34m"; GREEN = "\033[0;32m"; YELLOW = "\033[1;33m"
BOLD = "\033[1m"; DIM = "\033[2m"; NC = "\033[0m"

try:
    with open(sys.argv[1]) as f:
        data = json.load(f)
    runs = data.get("workflow_runs", [])
    if runs:
        r = runs[0]
        c = r.get("head_commit", {})
        sha    = r.get("head_sha", "")[:7]
        msg    = c.get("message", "").split("\n")[0]
        ts     = r.get("updated_at", "").replace("T", " ").replace("Z", " UTC")
        author = c.get("author", {}).get("name", "")
        print(f"\n{BLUE}  📋 Last successful build:{NC}")
        print(f"     {BOLD}Built:{NC}  {ts}")
        print(f"     {BOLD}Commit:{NC} {sha} — {msg}")
        if author:
            print(f"     {BOLD}Author:{NC} {author}")
except Exception:
    pass

try:
    with open(sys.argv[2]) as f:
        commits = json.load(f)
    print(f"\n{BLUE}  📝 Recent commits:{NC}")
    for c in commits[:5]:
        sha  = c["sha"][:7]
        msg  = c["commit"]["message"].split("\n")[0][:70]
        date = c["commit"]["committer"]["date"][:10]
        print(f"     {DIM}{date}{NC}  {sha}  {msg}")
except Exception:
    pass

print()
PYEOF
    fi

    rm -f "$LAST_RUN_FILE" "$COMMITS_FILE"
fi

# ── Prerequisites ───────────────────────────────────────────────────────────────

if ! command -v podman &> /dev/null; then
    echo -e "${RED}❌ Podman is not installed${NC}"
    echo "Install with: sudo apt-get install -y podman"
    exit 1
fi

if ! podman-compose --version &> /dev/null; then
    echo -e "${RED}❌ podman-compose is not installed${NC}"
    echo "Install with: pip3 install podman-compose"
    exit 1
fi

# ── Git state check ─────────────────────────────────────────────────────────────

if git fetch origin main --quiet 2>/dev/null; then
    BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
    if [ "${BEHIND}" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Local repo is ${BEHIND} commit(s) behind origin/main.${NC}"
        echo -e "${YELLOW}   Config changes (compose, nginx, secrets) won't take effect until you run: git pull${NC}"
        echo ""
    fi
fi

# ── Disk space check ────────────────────────────────────────────────────────────

DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 70 ]; then
    echo -e "${YELLOW}⚠️  Disk usage is ${DISK_USAGE}% — pulling a new image may fail${NC}"
    echo -e "${YELLOW}   Consider running first: ./scripts/cleanup-pi.sh${NC}"
    echo -e "${YELLOW}   Or prune old images:    podman image prune -a${NC}"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# ── Deployment secrets check ───────────────────────────────────────────────────

missing_secret=false
for secret in \
    secrets/postgres_password.txt \
    secrets/redis_password.txt \
    secrets/jwt_secret.txt \
    secrets/jwt_refresh_secret.txt \
    secrets/session_secret.txt; do
    if [ ! -f "$secret" ]; then
        echo -e "${RED}❌ Missing secret: ${secret}${NC}"
        missing_secret=true
    fi
done
if [ "$missing_secret" = true ]; then
    echo -e "${YELLOW}   Generate all secrets with: ./scripts/generate-secrets.sh${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC}  All deployment secrets present."

# ── GHCR authentication ─────────────────────────────────────────────────────────

section "Authentication" "🔐"

if [ ! -f "$GHCR_TOKEN_FILE" ]; then
    echo -e "${RED}❌ No token file at ${GHCR_TOKEN_FILE}${NC}"
    echo -e "${YELLOW}   Create it with a classic PAT (read:packages scope):${NC}"
    echo -e "      echo 'ghp_yourtoken' > ./secrets/ghcr_token.txt${NC}"
    exit 1
fi

GHCR_TOKEN=$(cat "$GHCR_TOKEN_FILE")
start_spinner "Logging into GitHub Container Registry"
if echo "$GHCR_TOKEN" | podman login "$REGISTRY" -u "$IMAGE_OWNER" --password-stdin &>/dev/null; then
    stop_spinner ok
else
    stop_spinner fail
    echo -e "${RED}   Login failed — check the token in ${GHCR_TOKEN_FILE}${NC}"
    echo -e "${YELLOW}   Token needs 'read:packages' scope (classic PAT)${NC}"
    exit 1
fi

# ── Pull image ──────────────────────────────────────────────────────────────────

section "Pulling Image" "📥"
echo -e "${BLUE}  This typically takes 3–8 minutes on a home connection.${NC}"
timer_start

if ! podman pull "$REMOTE_IMAGE"; then
    echo ""
    echo -e "${RED}❌ Pull failed${NC}"
    echo -e "${YELLOW}Common causes:${NC}"
    echo -e "   - GitHub Actions hasn't finished building (check the Actions tab)"
    echo -e "   - Package is private and no token was provided"
    echo -e "   - Tag '${TAG}' doesn't exist (available: latest, main, develop, main-<sha>)"
    echo -e "   - Network issue — retry in a moment"
    exit 1
fi

timer_end

# ── Retag + extract + cleanup ────────────────────────────────────────────────────

section "Preparing Assets" "📦"

start_spinner "Tagging as ${LOCAL_IMAGE}"
podman tag "$REMOTE_IMAGE" "$LOCAL_IMAGE"
stop_spinner ok

# The backend image is a multi-stage build. The compiled React app lives at
# /app/public/ inside the image. Nginx on Pi serves these files directly from
# ./data/frontend-dist/ — there is no frontend container on the Pi.
start_spinner "Extracting frontend static files"
extract_frontend_from_image "$LOCAL_IMAGE" >/dev/null
FILE_COUNT=$(ls ./data/frontend-dist | wc -l)
stop_spinner ok
echo -e "  ${DIM}${FILE_COUNT} files → ./data/frontend-dist/${NC}"

# podman pull leaves two references to the same layers: the remote tag and the
# local tag we just created. Removing the remote tag frees the name without
# touching the underlying layers.
start_spinner "Removing remote tag (layers kept under ${LOCAL_IMAGE})"
podman rmi "$REMOTE_IMAGE" 2>/dev/null || true
stop_spinner ok

# ── Summary ─────────────────────────────────────────────────────────────────────

section "Summary" "🍽️"
echo -e "${BLUE}  Local image:${NC}"
podman images | grep "meals-backend" | sed 's/^/    /'
echo ""
echo -e "${BLUE}  Frontend dist (first 10):${NC}"
ls ./data/frontend-dist | head -10 | sed 's/^/    /'

# ── Hand off to pi-run.sh ───────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}  ✓ Image ready — starting services...${NC}"
echo ""
bash ./scripts/pi-run.sh

