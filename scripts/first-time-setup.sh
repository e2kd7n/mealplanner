#!/bin/bash

###############################################################################
# First-Time Setup Script for Meal Planner Application
#
# Guides you through initial configuration for any deployment target:
#   1) Local development  — Postgres in container, frontend/backend hot-reload
#   2) Local container    — All services in Podman (production-like)
#   3) Raspberry Pi (registry) — Pull prebuilt image from GHCR (recommended)
#   4) Raspberry Pi (build)    — Compile on Pi from source (~2 hrs first run)
#
# Usage: ./scripts/first-time-setup.sh
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

# ── Welcome ───────────────────────────────────────────────────────────────────
clear
echo -e "${BOLD}${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║           Family Meal Planner - First Time Setup             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# ── Helper: generate any missing secret files ─────────────────────────────────
# Generates secrets without calling the interactive generate-secrets.sh, so
# this script can run non-interactively on a fresh clone.
generate_secrets_if_needed() {
    local SECRETS_DIR="./secrets"
    local all_present=true

    for name in postgres_password jwt_secret jwt_refresh_secret session_secret redis_password; do
        [ ! -f "$SECRETS_DIR/${name}.txt" ] && all_present=false && break
    done

    if $all_present; then
        echo -e "${GREEN}✓ Secrets already exist${NC}"
        return 0
    fi

    echo -e "${YELLOW}ℹ Generating secure secrets...${NC}"
    mkdir -p "$SECRETS_DIR"
    chmod 700 "$SECRETS_DIR"

    gen_secret() {
        local name=$1 length=${2:-32}
        if [ ! -f "$SECRETS_DIR/${name}.txt" ]; then
            openssl rand -base64 $((length * 2)) | tr -d "=+/" | cut -c1-${length} > "$SECRETS_DIR/${name}.txt"
            chmod 600 "$SECRETS_DIR/${name}.txt"
            echo -e "  ${GREEN}✓ ${name}${NC}"
        fi
    }

    gen_secret "postgres_password" 32
    gen_secret "jwt_secret" 64
    gen_secret "jwt_refresh_secret" 64
    gen_secret "session_secret" 48
    gen_secret "redis_password" 32

    echo -e "${GREEN}✓ Secrets generated in ./secrets/${NC}"
}

# ── Helper: assert a command exists ───────────────────────────────────────────
require_cmd() {
    local cmd=$1 install_hint=$2
    if ! command -v "$cmd" &>/dev/null; then
        echo -e "${RED}✗ $cmd not found.${NC} ${install_hint}"
        exit 1
    fi
    echo -e "${GREEN}✓ $cmd${NC}"
}

# ── Choose deployment target ──────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${YELLOW}How would you like to deploy?${NC}"
echo ""
echo -e "  ${BOLD}1)${NC} Local development       — hot-reload, Postgres in container"
echo -e "     ${CYAN}Best for: writing code, fastest iteration${NC}"
echo ""
echo -e "  ${BOLD}2)${NC} Local container mode    — all services in Podman"
echo -e "     ${CYAN}Best for: testing the full stack locally${NC}"
echo ""
echo -e "  ${BOLD}3)${NC} Raspberry Pi via GHCR   — pull prebuilt image (recommended for Pi)"
echo -e "     ${CYAN}Best for: Pi deployment, no compilation needed (~5 min)${NC}"
echo ""
echo -e "  ${BOLD}4)${NC} Raspberry Pi build       — compile from source on Pi"
echo -e "     ${CYAN}Best for: custom builds or when registry is unavailable (~2 hrs first run)${NC}"
echo ""
read -p "Choice [1]: " DEPLOY_CHOICE
DEPLOY_CHOICE=${DEPLOY_CHOICE:-1}
echo ""

# ── Common: create data directories ──────────────────────────────────────────
mkdir -p secrets data/backups data/uploads data/images data/feedback-exports data/frontend-dist
echo -e "${GREEN}✓ Data directories ready${NC}"

# ── Branch per target ─────────────────────────────────────────────────────────
case "$DEPLOY_CHOICE" in

# ── 1: Local development ──────────────────────────────────────────────────────
1)
    echo ""
    echo -e "${BOLD}${CYAN}Checking prerequisites for local development...${NC}"
    require_cmd "node"   "Install Node.js 20+ from https://nodejs.org/"
    require_cmd "podman" "Install Podman from https://podman.io/"
    echo ""

    # local-run.sh handles secrets, .env files, deps, migrations, and seeding
    # on first run — no need to pre-generate them here.
    echo -e "${GREEN}✅ Ready to start!${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}Run this to launch the app:${NC}"
    echo ""
    echo -e "   ${GREEN}./scripts/local-run.sh${NC}"
    echo ""
    echo -e "On first run this will automatically:"
    echo -e "  • Generate secrets"
    echo -e "  • Start PostgreSQL in a container"
    echo -e "  • Install Node.js dependencies"
    echo -e "  • Run database migrations + seed test data"
    echo -e "  • Start backend (port 3000) + frontend (port 5173) with hot reload"
    echo -e "  • Open http://localhost:5173 in your browser"
    echo ""
    echo -e "${BLUE}Test credentials:${NC}  test@example.com / TestPass123!"
    ;;

# ── 2: Local container mode ───────────────────────────────────────────────────
2)
    echo ""
    echo -e "${BOLD}${CYAN}Checking prerequisites for container mode...${NC}"
    require_cmd "podman" "Install Podman from https://podman.io/"
    echo ""

    generate_secrets_if_needed
    echo ""
    echo -e "${GREEN}✅ Ready to start!${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}Run this to launch all services:${NC}"
    echo ""
    echo -e "   ${GREEN}./scripts/deploy-podman.sh${NC}"
    echo ""
    echo -e "Access the app at: ${GREEN}http://localhost:8080${NC}"
    echo -e "To stop:           ${GREEN}podman-compose down${NC}"
    ;;

# ── 3: Raspberry Pi — GHCR registry (recommended) ────────────────────────────
3)
    echo ""
    echo -e "${BOLD}${CYAN}Checking prerequisites for Pi deployment...${NC}"
    require_cmd "podman" "Install Podman: sudo apt-get install -y podman"
    echo ""

    generate_secrets_if_needed
    echo ""
    echo -e "${GREEN}✅ Ready to deploy!${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}Pull and start from the registry:${NC}"
    echo ""
    echo -e "   ${GREEN}./scripts/pi-deploy-registry.sh${NC}"
    echo ""
    echo -e "To pull a specific build tag:"
    echo -e "   ${GREEN}./scripts/pi-deploy-registry.sh main-abc1234${NC}"
    echo ""
    echo -e "${YELLOW}What this does:${NC}"
    echo -e "  • Checks GitHub Actions for in-progress builds"
    echo -e "  • Pulls the prebuilt ARM64 image from ghcr.io"
    echo -e "  • Extracts the compiled frontend into ./data/frontend-dist/"
    echo -e "  • Starts all services via pi-run.sh"
    echo ""
    echo -e "${BOLD}${YELLOW}If the repo is private:${NC}"
    echo -e "  Create ./secrets/ghcr_token.txt with a GitHub PAT"
    echo -e "  (Settings → Developer settings → Personal access tokens → read:packages)"
    ;;

# ── 4: Raspberry Pi — build from source ──────────────────────────────────────
4)
    echo ""
    echo -e "${BOLD}${CYAN}Checking prerequisites for Pi build...${NC}"
    require_cmd "podman" "Install Podman: sudo apt-get install -y podman"
    echo ""

    generate_secrets_if_needed
    echo ""
    echo -e "${GREEN}✅ Ready to build!${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}Build and start:${NC}"
    echo ""
    echo -e "   ${GREEN}./scripts/build-on-pi.sh${NC}   # First run: ~2 hours on Pi 4B 2GB RAM"
    echo -e "   ${GREEN}./scripts/pi-run.sh${NC}         # Start all services"
    echo ""
    echo -e "${YELLOW}Notes:${NC}"
    echo -e "  • Subsequent builds take ~5-10 minutes"
    echo -e "  • Access at http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo '<Pi-IP>'):8080"
    echo ""
    echo -e "${BOLD}${YELLOW}Tip:${NC} The GHCR registry option (choice 3) is much faster if you"
    echo -e "  have a build in GitHub Actions — no compilation needed on the Pi."
    ;;

*)
    echo -e "${RED}Invalid choice. Run the script again and enter 1, 2, 3, or 4.${NC}"
    exit 1
    ;;
esac

# ── Pi only: offer nightly auto-updates ──────────────────────────────────────
if [[ "$DEPLOY_CHOICE" == "3" || "$DEPLOY_CHOICE" == "4" ]]; then
    echo ""
    echo -e "${BOLD}${YELLOW}Enable nightly auto-updates?${NC}"
    echo -e "  Installs a systemd timer that pulls the latest image from GHCR"
    echo -e "  each night at 01:30 and redeploys if the image has changed."
    echo ""
    read -p "Set up auto-updates now? [y/N]: " AUTO_UPDATE_CHOICE
    AUTO_UPDATE_CHOICE=${AUTO_UPDATE_CHOICE:-N}
    echo ""
    if [[ "$AUTO_UPDATE_CHOICE" =~ ^[Yy]$ ]]; then
        echo -e "${CYAN}Running pi-update-setup.sh...${NC}"
        echo ""
        "$SCRIPT_DIR/pi-update-setup.sh"
        echo ""
        echo -e "${GREEN}✓ Auto-updates enabled — next check tonight at 01:30${NC}"
        echo -e "  Manual update anytime: ${GREEN}./scripts/pi-auto-update.sh${NC}"
        echo -e "  Force redeploy:        ${GREEN}./scripts/pi-auto-update.sh --force${NC}"
    else
        echo -e "${YELLOW}Skipped. You can enable auto-updates later:${NC}"
        echo -e "   ${GREEN}./scripts/pi-update-setup.sh${NC}"
    fi
fi

# ── Common footer ─────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Key reminders:${NC}"
echo -e "  • ${YELLOW}Never commit the secrets/ directory${NC} to version control"
echo -e "  • Back up secrets securely — they cannot be recovered if lost"
echo -e "  • Rotate secrets every 90 days: ${GREEN}./scripts/generate-secrets.sh${NC}"
echo ""
echo -e "${BOLD}Documentation:${NC}"
echo -e "  Dev setup:     ${BLUE}docs/SETUP.md${NC}"
echo -e "  Pi deployment: ${BLUE}docs/RASPBERRY_PI_DEPLOYMENT_GUIDE.md${NC}"
echo -e "  Architecture:  ${BLUE}docs/ARCHITECTURE.md${NC}"
echo -e "  All scripts:   ${GREEN}./scripts/menu.sh${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

