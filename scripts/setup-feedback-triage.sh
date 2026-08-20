#!/bin/bash
# One-time setup for scripts/feedback-log-triage.sh — run this ON THE PI.
#
# Automates everything in the go-live checklist that safely can be:
#   1. Confirms the post-merge image build, then pulls/deploys it
#   2. Installs gh/jq if missing
#   3. Prompts for and writes secrets/github_token.txt (input hidden)
#   4. Patches + pushes the companion change in the separate e2kd7n/backups
#      repo, if that repo is cloned locally and isn't patched yet
#   5. Runs a --dry-run against real data so you can eyeball the output
#   6. Installs the weekly crontab entry
#
# Every step is idempotent — safe to re-run if an earlier step failed or was
# skipped (e.g. no token yet). Steps that need a human judgment call (do the
# dry-run's candidates look right? do you want to do the one controlled live
# run + manual-close dedup test?) are deliberately left as printed
# instructions rather than automated.
#
# Usage: ./scripts/setup-feedback-triage.sh

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

section "Feedback & Error-Log Triage — one-time setup" "🛠️"

# ── Step 1: confirm the build, then pull/deploy ────────────────────────────
step "Confirm the arm64 image build finished, then deploy it"
echo -e "  ${CYAN}https://github.com/e2kd7n/mealplanner/actions?query=branch%3Amain${NC}"
read -r -p "  Press Enter once it's green (or Ctrl+C to abort)... "
if ! ./scripts/pi-deploy-registry.sh; then
    echo -e "${RED}✗ pi-deploy-registry.sh failed — fix that before continuing.${NC}"
    exit 1
fi

# ── Step 2: prerequisites ───────────────────────────────────────────────────
step "Install gh/jq if missing"

if command -v jq &>/dev/null; then
    echo -e "  ${GREEN}✓ jq already installed${NC}"
else
    sudo apt-get update -qq && sudo apt-get install -y jq
fi

if command -v gh &>/dev/null; then
    echo -e "  ${GREEN}✓ gh already installed${NC}"
else
    echo -e "  ${YELLOW}Installing GitHub CLI (official apt repo)...${NC}"
    (type -p wget >/dev/null || (sudo apt-get update -qq && sudo apt-get install -y wget)) \
        && sudo mkdir -p -m 755 /etc/apt/keyrings \
        && wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg >/dev/null \
        && sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
        && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null \
        && sudo apt-get update -qq \
        && sudo apt-get install -y gh
fi

# ── Step 3: PAT ──────────────────────────────────────────────────────────────
step "Set up the mealplanner-issues PAT"

TOKEN_FILE="$PROJECT_ROOT/secrets/github_token.txt"
mkdir -p "$PROJECT_ROOT/secrets"

if [ -s "$TOKEN_FILE" ]; then
    echo -e "  ${GREEN}✓ $TOKEN_FILE already present — leaving it as-is${NC}"
else
    echo -e "  ${YELLOW}Create a fine-grained PAT: https://github.com/settings/personal-access-tokens/new${NC}"
    echo -e "  ${YELLOW}  Repository access: only e2kd7n/mealplanner${NC}"
    echo -e "  ${YELLOW}  Permissions: Issues → Read and write${NC}"
    read -r -s -p "  Paste the token (input hidden, not saved to shell history): " TOKEN
    echo ""
    if [ -z "$TOKEN" ]; then
        echo -e "  ${RED}✗ No token entered — skipping. Re-run this script once you have one.${NC}"
    else
        printf '%s' "$TOKEN" > "$TOKEN_FILE"
        chmod 600 "$TOKEN_FILE"
        unset TOKEN
        echo -e "  ${GREEN}✓ Wrote $TOKEN_FILE (mode 600)${NC}"
    fi
fi

# ── Step 4: companion patch in the separate e2kd7n/backups repo ────────────
step "Patch the backups-repo companion script (if cloned locally)"

BACKUPS_DIR="${BACKUPS_REPO_DIR:-$HOME/backups}"
BACKUP_TARGET="$BACKUPS_DIR/scripts/backup-mealplanner.sh"

if [ ! -d "$BACKUPS_DIR/.git" ]; then
    echo -e "  ${YELLOW}⚠ $BACKUPS_DIR not found — skipping. Apply the patch manually per docs/WEEKLY_MAINTENANCE.md.${NC}"
elif [ ! -f "$BACKUP_TARGET" ]; then
    echo -e "  ${YELLOW}⚠ $BACKUP_TARGET not found — skipping. Apply the patch manually per docs/WEEKLY_MAINTENANCE.md.${NC}"
elif grep -q "feedback-triage-raw-latest.json" "$BACKUP_TARGET"; then
    echo -e "  ${GREEN}✓ Already patched — skipping${NC}"
else
    ANCHOR_COUNT=$(grep -c 'RESTORE\.md' "$BACKUP_TARGET")
    if [ "$ANCHOR_COUNT" -ne 1 ]; then
        echo -e "  ${RED}✗ Expected exactly one 'RESTORE.md' line in $BACKUP_TARGET as an anchor, found $ANCHOR_COUNT.${NC}"
        echo -e "  ${RED}  The file may have changed — apply the patch manually per docs/WEEKLY_MAINTENANCE.md.${NC}"
    else
        sed -i '/RESTORE\.md/i\
    local raw="${PROJECT_DIR}/data/maintenance-logs/feedback-triage-raw-latest.json"\
    [[ -f "$raw" ]] && mkdir -p "${dest}/feedback-triage" && cp "$raw" "${dest}/feedback-triage/"
' "$BACKUP_TARGET"
        echo -e "  ${CYAN}Diff:${NC}"
        git -C "$BACKUPS_DIR" --no-pager diff -- scripts/backup-mealplanner.sh
        if (cd "$BACKUPS_DIR" && git add scripts/backup-mealplanner.sh \
                && git commit -m "feat: archive feedback-triage raw output for mealplanner" \
                && git push); then
            echo -e "  ${GREEN}✓ Patched and pushed backup-mealplanner.sh${NC}"
        else
            echo -e "  ${RED}✗ Patched locally but commit/push failed — check $BACKUPS_DIR manually.${NC}"
        fi
    fi
fi

# ── Step 5: dry run ──────────────────────────────────────────────────────────
step "Dry run against real data"
echo -e "  ${CYAN}(review the output below and data/maintenance-logs/feedback-triage-*.log)${NC}"
./scripts/feedback-log-triage.sh --dry-run || \
    echo -e "  ${YELLOW}⚠ Dry run reported a failure — check the log before going further (likely a missing token/container).${NC}"

# ── Step 6: crontab ──────────────────────────────────────────────────────────
step "Install the weekly crontab entry"

CRON_LINE="45 3 * * 0  cd $PROJECT_ROOT && ./scripts/feedback-log-triage.sh >> data/maintenance-logs/cron-feedback-triage.log 2>&1"
if crontab -l 2>/dev/null | grep -qF "feedback-log-triage.sh"; then
    echo -e "  ${GREEN}✓ Crontab entry already present — leaving as-is${NC}"
else
    (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
    echo -e "  ${GREEN}✓ Added weekly crontab entry (Sundays 03:45 UTC-relative to cron's TZ)${NC}"
fi

echo ""
echo -e "${BOLD}Still manual, by design:${NC}"
echo -e "  • Review the dry-run output above — does the candidate list/labels look right?"
echo -e "  • Once satisfied, run ${CYAN}./scripts/feedback-log-triage.sh${NC} for real, then manually close one"
echo -e "    filed issue and re-run to confirm the dedup correctly skips it next time."
echo ""
echo -e "${GREEN}${BOLD}Setup complete.${NC}"
