#!/bin/bash
# Purges leaked secrets from git history (issue #329):
#   - frontend/e2e/.auth/user.json     (Playwright storageState, test-account JWT — low risk, already expired)
#   - .env.backup.20260504_151747      (real secret var names; values were rotated 2026-05-16, but still shouldn't
#                                        be readable in a public repo's history)
#
# This rewrites commit history on every branch that descends from the offending commits (b85b8e6 / 936717c5),
# which given the repo's branch graph is effectively every branch touched since 2026-04-20. Every existing
# local clone/worktree becomes stale after the force-push and must be recreated (see step 5).
#
# Safety model: operates ONLY on a throwaway --mirror clone in a temp dir. Your working repo and worktrees
# are never touched by this script directly — they go stale only *after* you force-push from the mirror,
# and only once you choose to.
#
# Usage: ./scripts/purge-git-secrets.sh          # rewrite + show what would push (no push)
#        ./scripts/purge-git-secrets.sh --push   # rewrite AND force-push to origin

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FILTER_REPO="C:/Users/admin/AppData/Roaming/Python/Python314/Scripts/git-filter-repo.exe"
MIRROR_DIR="$(mktemp -d)/mealplanner-purge-mirror.git"
DO_PUSH=false
[ "$1" = "--push" ] && DO_PUSH=true

PURGE_PATHS=("frontend/e2e/.auth/user.json" ".env.backup.20260504_151747")

section "Quiet-Window Check" "🔐"

WORKTREE_COUNT=$(git -C "$REPO_DIR" worktree list | wc -l)
if [ "$WORKTREE_COUNT" -gt 1 ]; then
    echo -e "  ${RED}✗${NC}  ${WORKTREE_COUNT} worktrees present (only 'main' expected)."
    echo -e "  ${YELLOW}   Every worktree branch not yet merged/pushed will be stranded by the force-push.${NC}"
    git -C "$REPO_DIR" worktree list
    exit 1
fi
echo -e "  ${GREEN}✓${NC}  Only the main worktree present."

if [ ! -x "$FILTER_REPO" ]; then
    echo -e "  ${RED}✗${NC}  git-filter-repo not found at ${FILTER_REPO}"
    echo -e "  ${YELLOW}   Install with: python3 -m pip install --user git-filter-repo${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC}  git-filter-repo found."

section "Mirror Clone" "🔐"
echo -e "  ${BLUE}Rewrite happens here, not in your working repo.${NC}"

git clone --mirror "$REPO_DIR" "$MIRROR_DIR"
cd "$MIRROR_DIR"
# Re-point the mirror at the real remote so refs/branches match origin exactly, not this local checkout.
git remote set-url origin "$(git -C "$REPO_DIR" remote get-url origin)"
git fetch origin --prune
echo -e "  ${GREEN}✓${NC}  Mirror ready at ${DIM}${MIRROR_DIR}${NC}"

section "Rewriting History" "🔐"
echo -e "  ${BLUE}Stripping from every ref:${NC}"
for p in "${PURGE_PATHS[@]}"; do
    echo -e "     ${DIM}- ${p}${NC}"
done

"$FILTER_REPO" \
    --path "${PURGE_PATHS[0]}" \
    --path "${PURGE_PATHS[1]}" \
    --invert-paths \
    --force
echo -e "  ${GREEN}✓${NC}  Rewrite complete."

section "Verification" "🔐"
if git log --all --oneline -- "${PURGE_PATHS[@]}" | grep .; then
    echo -e "  ${RED}✗${NC}  Files still present after rewrite — do not push."
    exit 1
fi
echo -e "  ${GREEN}✓${NC}  Confirmed clean — files are gone from every rewritten ref."

if [ "$DO_PUSH" = false ]; then
    echo ""
    echo -e "  ${BLUE}ℹ️  Dry run complete.${NC} Rewritten mirror is at: ${DIM}${MIRROR_DIR}${NC}"
    echo -e "     Review it, then re-run with ${BOLD}--push${NC} to force-push all refs to origin."
    exit 0
fi

section "Force-Push to Origin" "🔐"
echo -e "  ${RED}⚠️  This is a git history rewrite, not a normal push.${NC}"
echo -e "  ${YELLOW}   Purged from every ref: ${PURGE_PATHS[*]}${NC}"
echo -e "  ${YELLOW}   Every commit descending from b85b8e6 / 936717c5 gets a new SHA — effectively${NC}"
echo -e "  ${YELLOW}   every branch touched since 2026-04-20.${NC}"
echo -e "  ${YELLOW}   This force-pushes ALL branches and tags on origin, overwriting the history there.${NC}"
echo -e "  ${YELLOW}   Anyone else with a local clone or worktree of this repo must re-clone or hard-reset —${NC}"
echo -e "  ${YELLOW}   their existing history will silently diverge otherwise. Coordinate with them first.${NC}"
echo ""
read -p "  $(echo -e "${RED}Type 'yes' to force-push and rewrite origin's history (anything else aborts): ${NC}")" CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo -e "  ${YELLOW}Aborted by user — nothing was pushed.${NC}"
    exit 1
fi

git push origin --force --all
git push origin --force --tags
echo -e "  ${GREEN}✓${NC}  Force-push complete."

section "Summary" "🍽️"
echo -e "${BLUE}  Remaining manual steps (from issue #329):${NC}"
echo -e "  ${DIM}1.${NC} Notify anyone with an existing local clone/fork to re-clone (history SHAs changed on every branch)."
echo -e "  ${DIM}2.${NC} Recreate any worktrees pointing at now-rewritten branches:"
git -C "$REPO_DIR" worktree list | tail -n +2 | sed 's/^/     /'
echo -e "     For each: 'git worktree remove <path> --force' then recreate against the new branch tip."
echo -e "  ${DIM}3.${NC} Delete the local ${REPO_DIR} clone's stale refs and re-fetch, or re-clone it fresh."
echo -e "  ${DIM}4.${NC} Mirror clone left at ${MIRROR_DIR} for reference — safe to delete once confirmed."
