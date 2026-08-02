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
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FILTER_REPO="C:/Users/admin/AppData/Roaming/Python/Python314/Scripts/git-filter-repo.exe"
MIRROR_DIR="$(mktemp -d)/mealplanner-purge-mirror.git"
DO_PUSH=false
[ "$1" = "--push" ] && DO_PUSH=true

echo "== Step 1: quiet-window check =="
WORKTREE_COUNT=$(git -C "$REPO_DIR" worktree list | wc -l)
if [ "$WORKTREE_COUNT" -gt 1 ]; then
    echo "ABORT: $WORKTREE_COUNT worktrees present (only 'main' expected)."
    echo "Every worktree branch not yet merged/pushed will be stranded by the force-push."
    git -C "$REPO_DIR" worktree list
    exit 1
fi

if [ ! -x "$FILTER_REPO" ]; then
    echo "ABORT: git-filter-repo not found at $FILTER_REPO"
    echo "Install with: python3 -m pip install --user git-filter-repo"
    exit 1
fi

echo "== Step 2: mirror-clone (rewrite happens here, not in your working repo) =="
git clone --mirror "$REPO_DIR" "$MIRROR_DIR"
cd "$MIRROR_DIR"
# Re-point the mirror at the real remote so refs/branches match origin exactly, not this local checkout.
git remote set-url origin "$(git -C "$REPO_DIR" remote get-url origin)"
git fetch origin --prune

echo "== Step 3: rewrite history, stripping both files from every ref =="
"$FILTER_REPO" \
    --path "frontend/e2e/.auth/user.json" \
    --path ".env.backup.20260504_151747" \
    --invert-paths \
    --force

echo "== Step 4: verify the files are gone from every rewritten ref =="
if git log --all --oneline -- "frontend/e2e/.auth/user.json" ".env.backup.20260504_151747" | grep .; then
    echo "ABORT: files still present after rewrite — do not push."
    exit 1
fi
echo "Confirmed clean."

if [ "$DO_PUSH" = false ]; then
    echo
    echo "Dry run complete. Rewritten mirror is at: $MIRROR_DIR"
    echo "Review it, then re-run with --push to force-push all refs to origin."
    exit 0
fi

echo "== Step 5: force-push every rewritten ref to origin =="
read -p "About to force-push ALL branches/tags to origin. Type 'yes' to continue: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted by user."
    exit 1
fi
git push origin --force --all
git push origin --force --tags

echo
echo "== Done. Remaining manual steps (from issue #329): =="
echo "1. Notify anyone with an existing local clone/fork to re-clone (history SHAs changed on every branch)."
echo "2. Recreate any worktrees pointing at now-rewritten branches:"
git -C "$REPO_DIR" worktree list | tail -n +2
echo "   For each: 'git worktree remove <path> --force' then recreate against the new branch tip."
echo "3. Delete the local $REPO_DIR clone's stale refs and re-fetch, or re-clone it fresh."
echo "4. Mirror clone left at $MIRROR_DIR for reference — safe to delete once confirmed."
