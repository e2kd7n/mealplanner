#!/bin/bash

# Start the Meal Planner application on Raspberry Pi using Podman.
# Usage: ./scripts/pi-run.sh [--clusterhat] [--zero-user=<user>]
#
# --clusterhat      Detect Zero W nodes, fix Nginx IPs, expose Postgres/Redis
#                   on the ClusterHAT bridge, and deploy the backend to each
#                   reachable Zero W via SSH.
# --zero-user=USER  SSH user on Zero W nodes (default: pi)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

CLUSTERHAT=false
ZEROS_ONLY=false
ZERO_USER="pi"
ZERO_IPS=("172.19.181.1" "172.19.181.2" "172.19.181.3" "172.19.181.4")
BRIDGE_IP="172.19.181.254"
REACHABLE_ZEROS=()
# Match the Node.js version in the backend container image
NODE_VERSION="22.22.3"
NODE_TAR_CACHE="/tmp/node-${NODE_VERSION}-linux-armv6l.tar.xz"

for arg in "$@"; do
    case $arg in
        --clusterhat)    CLUSTERHAT=true ;;
        --zeros-only)    ZEROS_ONLY=true; CLUSTERHAT=true ;;
        --zero-user=*)   ZERO_USER="${arg#*=}" ;;
    esac
done

# ---------------------------------------------------------------------------
# Zero W deployment helpers
# ---------------------------------------------------------------------------

deploy_to_zero() {
    local ip="$1"
    local slot="$2"
    echo -e "  ${BLUE}→ p${slot} (${ip})${NC}"

    local ssh_opts="-o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new -o BatchMode=yes"

    # Ensure matching Node.js is installed
    # Nodesource does not support armhf; use unofficial-builds.nodejs.org instead.
    # The tarball is downloaded once to the Pi 4B (NODE_TAR_CACHE) and rsynced.
    # shellcheck disable=SC2029
    if ! ssh $ssh_opts "${ZERO_USER}@${ip}" \
            "node --version 2>/dev/null | grep -qE '^v${NODE_VERSION//./\\.}'" 2>/dev/null; then
        echo -e "    ${YELLOW}Installing Node.js ${NODE_VERSION} on p${slot}...${NC}"
        rsync -az "$NODE_TAR_CACHE" "${ZERO_USER}@${ip}:/tmp/node.tar.xz"
        ssh $ssh_opts "${ZERO_USER}@${ip}" \
            'sudo tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 \
             && rm -f /tmp/node.tar.xz'
    fi

    # Create app directory owned by the SSH user
    ssh $ssh_opts "${ZERO_USER}@${ip}" \
        'sudo mkdir -p /opt/mealplanner && sudo chown "$(id -u):$(id -g)" /opt/mealplanner'

    # Sync compiled backend + prisma schema + package manifest
    echo -e "    Syncing backend to p${slot}..."
    rsync -az --delete \
        backend/dist/ "${ZERO_USER}@${ip}:/opt/mealplanner/dist/"
    rsync -az \
        backend/prisma/ "${ZERO_USER}@${ip}:/opt/mealplanner/prisma/"
    rsync -az \
        backend/package.json "${ZERO_USER}@${ip}:/opt/mealplanner/"
    # Include lockfile if present (enables npm ci)
    if [ -f backend/package-lock.json ]; then
        rsync -az backend/package-lock.json "${ZERO_USER}@${ip}:/opt/mealplanner/"
    fi

    # Install production dependencies directly on the Zero W so npm fetches
    # the correct armhf native binaries (Prisma, bufferutil, etc.)
    echo -e "    ${YELLOW}Installing production deps on p${slot} (slow on first run)...${NC}"
    if ssh $ssh_opts "${ZERO_USER}@${ip}" 'test -f /opt/mealplanner/package-lock.json' 2>/dev/null; then
        ssh $ssh_opts "${ZERO_USER}@${ip}" \
            'cd /opt/mealplanner && npm ci --production --no-audit --no-fund 2>&1 | tail -5'
    else
        ssh $ssh_opts "${ZERO_USER}@${ip}" \
            'cd /opt/mealplanner && npm install --production --no-audit --no-fund 2>&1 | tail -5'
    fi

    # Regenerate Prisma query engine for linux-arm-openssl (armhf)
    echo -e "    Generating Prisma client for armhf on p${slot}..."
    ssh $ssh_opts "${ZERO_USER}@${ip}" \
        'cd /opt/mealplanner && npx prisma generate 2>&1 | tail -3' \
        || echo -e "    ${YELLOW}⚠  Prisma generate failed on p${slot} — check internet access${NC}"

    # Write .env via a local temp file so secrets never appear in argv/SSH args
    local tmp_env
    tmp_env=$(mktemp)
    chmod 600 "$tmp_env"
    cat > "$tmp_env" << EOF
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
POSTGRES_HOST=${BRIDGE_IP}
POSTGRES_PORT=5432
POSTGRES_DB=meal_planner
POSTGRES_USER=mealplanner
POSTGRES_PASSWORD=$(cat secrets/postgres_password.txt)
DATABASE_URL=postgresql://mealplanner:$(cat secrets/postgres_password.txt)@${BRIDGE_IP}:5432/meal_planner
REDIS_HOST=${BRIDGE_IP}
REDIS_PORT=6379
REDIS_PASSWORD=$(cat secrets/redis_password.txt)
JWT_SECRET=$(cat secrets/jwt_secret.txt)
JWT_REFRESH_SECRET=$(cat secrets/jwt_refresh_secret.txt)
SESSION_SECRET=$(cat secrets/session_secret.txt)
NODE_OPTIONS=--max-old-space-size=128 --optimize-for-size
EOF
    rsync -az "$tmp_env" "${ZERO_USER}@${ip}:/opt/mealplanner/.env"
    ssh $ssh_opts "${ZERO_USER}@${ip}" 'chmod 600 /opt/mealplanner/.env'
    rm -f "$tmp_env"

    # Install systemd service unit via temp file
    local tmp_unit
    tmp_unit=$(mktemp)
    cat > "$tmp_unit" << 'UNITEOF'
[Unit]
Description=Meal Planner Backend
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/mealplanner
EnvironmentFile=/opt/mealplanner/.env
ExecStart=/usr/local/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNITEOF
    rsync -az "$tmp_unit" "${ZERO_USER}@${ip}:/tmp/mealplanner.service"
    rm -f "$tmp_unit"
    ssh $ssh_opts "${ZERO_USER}@${ip}" \
        'sudo mv /tmp/mealplanner.service /etc/systemd/system/mealplanner.service \
         && sudo systemctl daemon-reload \
         && sudo systemctl enable mealplanner \
         && sudo systemctl restart mealplanner'

    sleep 3
    if ssh $ssh_opts "${ZERO_USER}@${ip}" 'systemctl is-active --quiet mealplanner' 2>/dev/null; then
        echo -e "    ${GREEN}✓ p${slot} backend running${NC}"
    else
        echo -e "    ${YELLOW}⚠  p${slot} backend may not have started${NC}"
        echo -e "    Check: ssh ${ZERO_USER}@${ip} 'journalctl -u mealplanner -n 50'"
    fi
}

deploy_zeros() {
    if [ ! -d "backend/dist" ]; then
        echo -e "${RED}❌ backend/dist not found — run 'npm run build' in backend/ first${NC}"
        return 1
    fi

    # Download Node.js armv6l tarball once to the Pi 4B; rsynced to each Zero.
    if [ ! -f "$NODE_TAR_CACHE" ]; then
        echo -e "${BLUE}Downloading Node.js ${NODE_VERSION} armv6l...${NC}"
        curl -fsSL \
            "https://unofficial-builds.nodejs.org/download/release/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-armv6l.tar.xz" \
            -o "$NODE_TAR_CACHE"
        echo -e "${GREEN}✓ Node.js tarball cached at ${NODE_TAR_CACHE}${NC}"
    fi

    local missing_secret=false
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
    [ "$missing_secret" = true ] && return 1

    # Launch all Zero W deployments in parallel; buffer output per node so
    # lines from different nodes don't interleave in the terminal.
    declare -A zero_pids
    declare -A zero_logs

    for entry in "${REACHABLE_ZEROS[@]}"; do
        local ip="${entry%:*}"
        local slot="${entry#*:}"
        local log
        log=$(mktemp)
        zero_logs[$slot]="$log"
        deploy_to_zero "$ip" "$slot" >"$log" 2>&1 &
        zero_pids[$slot]=$!
        echo -e "  ${BLUE}→ p${slot} (${ip}) — deploying in background (PID ${zero_pids[$slot]})${NC}"
    done

    echo ""
    local any_failed=false
    for slot in $(echo "${!zero_pids[@]}" | tr ' ' '\n' | sort -n); do
        wait "${zero_pids[$slot]}"
        local exit_code=$?
        echo -e "${BLUE}─── p${slot} output ─────────────────────────────${NC}"
        cat "${zero_logs[$slot]}"
        rm -f "${zero_logs[$slot]}"
        if [ $exit_code -ne 0 ]; then
            echo -e "  ${YELLOW}⚠  p${slot} deployment failed${NC}"
            any_failed=true
        fi
        echo ""
    done

    [ "$any_failed" = true ] && echo -e "${YELLOW}⚠  One or more Zero W deployments failed — check output above${NC}"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

echo "🚀 Starting Meal Planner on Raspberry Pi..."

# --zeros-only: skip container management and deploy straight to Zero W nodes
if [ "$ZEROS_ONLY" = true ]; then
    echo -e "${BLUE}🎛️  Zero W deploy-only mode${NC}"

    if [ ! -d "backend/dist" ]; then
        echo -e "${YELLOW}backend/dist not found — extracting from running container...${NC}"
        podman cp meals-backend:/app/dist backend/dist
        podman cp meals-backend:/app/prisma backend/prisma
        podman cp meals-backend:/app/package.json backend/package.json
        echo -e "${GREEN}✓ Extracted backend assets from container${NC}"
    fi

    echo -e "${BLUE}Checking Zero W nodes...${NC}"
    for i in "${!ZERO_IPS[@]}"; do
        ip="${ZERO_IPS[$i]}"
        slot=$((i + 1))
        if ping -c 1 -W 2 "$ip" &>/dev/null; then
            echo -e "  ${GREEN}✓ p${slot} (${ip}) reachable${NC}"
            REACHABLE_ZEROS+=("${ip}:${slot}")
        else
            echo -e "  ${YELLOW}⚠  p${slot} (${ip}) not reachable — skipping${NC}"
        fi
    done

    if [ ${#REACHABLE_ZEROS[@]} -eq 0 ]; then
        echo -e "${RED}❌ No Zero W nodes reachable${NC}"
        exit 1
    fi

    deploy_zeros
    exit 0
fi

# Always ensure meals-network exists — podman-compose does not auto-create it
# reliably across all versions; pre-creating is idempotent and safe.
if ! podman network exists meals-network 2>/dev/null; then
    echo -e "${YELLOW}Creating meals-network...${NC}"
    podman network create meals-network
fi

# Check if podman-compose is installed
if ! command -v podman-compose &>/dev/null; then
    echo -e "${RED}❌ podman-compose is not installed${NC}"
    echo "Install with: pip3 install podman-compose"
    exit 1
fi

# Check if containers are already running
if podman ps | grep -q "meals-backend"; then
    echo -e "${YELLOW}⚠️  Application is already running${NC}"
    echo ""
    echo -e "${BLUE}Container status:${NC}"
    podman-compose -f podman-compose.pi.yml ps
    echo ""
    echo -e "${BLUE}To restart, use: ./scripts/pi-bounce.sh${NC}"
    exit 0
fi

# Remove any stopped/failed containers from a previous run so Podman does not
# inherit stale systemd timer units (symptom: "timer unit already loaded" error).
if podman ps -a | grep -qE "meals-(postgres|redis|backend|nginx)"; then
    echo -e "${YELLOW}Removing stopped containers from previous run...${NC}"
    podman rm -f meals-postgres meals-redis meals-backend meals-nginx >/dev/null 2>&1 || true
fi
# Reset any lingering failed systemd units (stale health-check timers).
systemctl --user reset-failed 2>/dev/null || true

# Check if images exist
if ! podman images | grep -q "meals-backend"; then
    echo -e "${RED}❌ Container images not found${NC}"
    echo -e "${YELLOW}Please build or load images first:${NC}"
    echo -e "   Option 1 - Pull from GitHub Container Registry (fastest): ${GREEN}./scripts/pi-deploy-registry.sh${NC}"
    echo -e "   Option 2 - Build directly on Pi: ${GREEN}./scripts/build-on-pi.sh${NC}"
    echo -e "   Option 3 - Load pre-built images from tar:"
    echo -e "      a. Transfer: scp pi-images/*.tar.gz pi@pihole.local:~/mealplanner/pi-images/"
    echo -e "      b. Load: ./scripts/load-pi-images.sh"
    exit 1
fi

if [ ! -f "./data/frontend-dist/index.html" ]; then
    echo -e "${RED}❌ Frontend static files not found in ./data/frontend-dist/${NC}"
    echo -e "${YELLOW}Please build first:${NC}"
    echo -e "   Option 1 - Build directly on Pi: ${GREEN}./scripts/build-on-pi.sh${NC}"
    echo -e "   Option 2 - Load pre-built files:"
    echo -e "      a. Transfer: scp pi-images/frontend-dist.tar.gz pi@raspberrypi.local:~/mealplanner/pi-images/"
    echo -e "      b. Load: ${GREEN}./scripts/load-pi-images.sh${NC}"
    exit 1
fi

COMPOSE_FILES="-f podman-compose.pi.yml"

if [ "$CLUSTERHAT" = true ]; then
    echo ""
    echo -e "${BLUE}🎛️  ClusterHAT mode${NC}"

    if ! command -v clusterctrl &>/dev/null; then
        echo -e "${RED}❌ clusterctrl not found — is ClusterHAT software installed?${NC}"
        exit 1
    fi

    # Fix Nginx upstream IPs if still pointing at the old 172.19.180.x subnet
    if grep -q "172\.19\.180\." nginx/default.conf; then
        echo -e "${YELLOW}Updating Nginx upstream IPs: 172.19.180.x → 172.19.181.x${NC}"
        sed -i 's/172\.19\.180\./172.19.181./g' nginx/default.conf
        echo -e "${GREEN}✓ nginx/default.conf updated${NC}"
    fi

    # Detect reachable Zero W nodes
    echo -e "${BLUE}Checking Zero W nodes...${NC}"
    for i in "${!ZERO_IPS[@]}"; do
        ip="${ZERO_IPS[$i]}"
        slot=$((i + 1))
        if ping -c 1 -W 2 "$ip" &>/dev/null; then
            echo -e "  ${GREEN}✓ p${slot} (${ip}) reachable${NC}"
            REACHABLE_ZEROS+=("${ip}:${slot}")
        else
            echo -e "  ${YELLOW}⚠  p${slot} (${ip}) not reachable — skipping${NC}"
        fi
    done

    if [ ${#REACHABLE_ZEROS[@]} -eq 0 ]; then
        echo -e "${RED}❌ No Zero W nodes reachable — are they powered on?${NC}"
        exit 1
    fi

    # Add ClusterHAT overlay: exposes Postgres/Redis on the bridge interface
    # so Zero W processes at 172.19.181.x can connect
    COMPOSE_FILES="$COMPOSE_FILES -f podman-compose.pi.clusterhat.yml"
    echo -e "${GREEN}✓ ClusterHAT overlay enabled (Postgres/Redis → ${BRIDGE_IP})${NC}"
fi

# Start Pi 4B services
echo ""
echo -e "${GREEN}🚀 Starting services...${NC}"
# shellcheck disable=SC2086
podman-compose $COMPOSE_FILES up -d

start_spinner "Waiting for services to start..."
sleep 10
stop_spinner ok

echo ""
echo -e "${GREEN}📊 Service status:${NC}"
podman-compose -f podman-compose.pi.yml ps

if podman ps | grep -q "meals-backend"; then
    if [ "$CLUSTERHAT" = true ] && [ ${#REACHABLE_ZEROS[@]} -gt 0 ]; then
        echo ""
        echo -e "${BLUE}🎛️  Deploying backend to Zero W nodes...${NC}"
        deploy_zeros
    fi

    if command -v glances &>/dev/null; then
        echo ""
        echo -e "${BLUE}📊 Starting monitoring...${NC}"
        GLANCES_ARGS=""
        [ "$CLUSTERHAT" = true ] && GLANCES_ARGS="--clusterhat"
        # shellcheck disable=SC2086
        bash ./scripts/start-glances.sh $GLANCES_ARGS
    fi

    echo ""
    echo -e "${GREEN}✅ Application started successfully!${NC}"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo ""

    if [ -f "./scripts/check-deployment-mode.sh" ]; then
        bash ./scripts/check-deployment-mode.sh || true
    else
        echo -e "${BLUE}Access the application:${NC}"
        echo -e "   🌐 Web: http://$(hostname -I | awk '{print $1}'):8080"
        echo -e "   🌐 Local: http://localhost:8080"
        echo ""
    fi

    if command -v glances &>/dev/null; then
        echo -e "   📊 Monitoring: http://$(hostname 2>/dev/null).local:8080/monitoring"
        echo ""
    fi

    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo -e "   📝 View logs: podman-compose -f podman-compose.pi.yml logs -f"
    echo -e "   🛑 Stop: ./scripts/pi-stop.sh"
    echo -e "   🔄 Restart: ./scripts/pi-bounce.sh"
    echo -e "   📊 Diagnostics: ./scripts/pi-diagnostics.sh"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Failed to start backend container${NC}"
    echo -e "${YELLOW}Checking logs...${NC}"
    podman-compose -f podman-compose.pi.yml logs backend
    exit 1
fi

