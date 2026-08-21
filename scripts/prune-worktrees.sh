#!/bin/bash
# Worktree hygiene: removes git worktrees that are safe to remove and
# reports everything else for manual review. Never touches a worktree
# with uncommitted changes or commits not reflected in a merged/closed PR.
#
# Usage:
#   prune-worktrees.sh <repo-path> [--apply]
#   prune-worktrees.sh --all [--apply]   # every git repo directly under
#                                         # the parent of this script's dir
#
# Default is dry-run (report only). Pass --apply to actually remove
# worktrees and delete their local/remote branches — this still asks for
# confirmation once, listing everything that will be removed, before it
# touches anything.
#
# "Safe to remove" = branch has a merged or closed PR, AND the worktree
# has no uncommitted changes (besides .claude/settings.local.json, which
# is local-only noise), AND no commits ahead of the default branch that
# aren't already on it. Anything else is reported as needs-review.
#
# A worktree locked by a session whose owning PID is no longer running
# is treated as unlocked (stale lock) for the purposes of this check.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

DEV_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

APPLY=""
TARGETS=()

for arg in "$@"; do
  case "$arg" in
    --apply) APPLY="--apply" ;;
    --all) TARGETS=() ;;
    *) TARGETS+=("$arg") ;;
  esac
done

if [ ${#TARGETS[@]} -eq 0 ]; then
  for d in "$DEV_ROOT"/*/; do
    [ -d "$d/.git" ] && TARGETS+=("${d%/}")
  done
fi

# Collected during the scan pass; only acted on after the confirmation gate.
SAFE_REMOVE_REPOS=()
SAFE_REMOVE_WTS=()
SAFE_REMOVE_BRANCHES=()
NEEDS_REVIEW_COUNT=0
KEEP_COUNT=0

section "Worktree Hygiene" "🧹"

prune_repo() {
  local repo="$1"
  cd "$repo" || return
  [ -d .git ] || return

  local default_branch
  default_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
  [ -z "$default_branch" ] && default_branch="main"
  git fetch origin --quiet 2>/dev/null || true

  local wt_list
  wt_list=$(git worktree list --porcelain)
  [ -z "$wt_list" ] && return

  local any_extra=0
  echo -e "${CYAN}${BOLD}📂 ${repo}${NC} ${DIM}(default: ${default_branch})${NC}"

  local wt="" branch=""
  while IFS= read -r line; do
    case "$line" in
      worktree\ *) wt="${line#worktree }" ;;
      branch\ *)
        branch="${line#branch }"
        branch="${branch#refs/heads/}"
        ;;
      "")
        if [ -n "$wt" ] && [ "$wt" != "$repo" ] && [ "$branch" != "$default_branch" ]; then
          any_extra=1
          evaluate_worktree "$repo" "$wt" "$branch" "$default_branch"
        fi
        wt=""; branch=""
        ;;
    esac
  done <<< "$wt_list"$'\n'

  [ "$any_extra" = 0 ] && echo -e "  ${DIM}(no extra worktrees)${NC}"
  echo
}

evaluate_worktree() {
  local repo="$1" wt="$2" branch="$3" default_branch="$4"

  local lockfile="$repo/.git/worktrees/$(basename "$wt")/locked"
  if [ -f "$lockfile" ]; then
    local pid
    pid=$(grep -oE 'pid [0-9]+' "$lockfile" | grep -oE '[0-9]+' | head -1)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo -e "  ${BLUE}ℹ️${NC}  ${branch} — locked, owning pid ${pid} still running, skipping"
      (( KEEP_COUNT++ ))
      return
    fi
    echo -e "  ${YELLOW}⚠️${NC}  ${branch} — locked but owning pid ${pid:-unknown} is dead (stale lock)"
  fi

  local dirty ahead pr_state
  dirty=$(git -C "$wt" status --porcelain 2>/dev/null | grep -v '\.claude/settings\.local\.json')
  ahead=$(git -C "$wt" log "origin/$default_branch..HEAD" --oneline 2>/dev/null)
  pr_state=$(gh pr list --repo "$(git -C "$repo" remote get-url origin 2>/dev/null | sed -E 's#.*github\.com[:/]([^/]+/[^/.]+)(\.git)?#\1#')" \
    --state all --head "$branch" --json state --jq '.[0].state' 2>/dev/null)

  if [ "$pr_state" = "MERGED" ] || [ "$pr_state" = "CLOSED" ]; then
    if [ -z "$dirty" ] && [ -z "$ahead" ]; then
      echo -e "  ${GREEN}✓${NC}  ${branch} — PR ${pr_state}, clean, nothing unmerged"
      SAFE_REMOVE_REPOS+=("$repo")
      SAFE_REMOVE_WTS+=("$wt")
      SAFE_REMOVE_BRANCHES+=("$branch")
    else
      echo -e "  ${YELLOW}⚠️${NC}  ${branch} — PR ${pr_state}, but has uncommitted or unpushed work:"
      [ -n "$dirty" ] && echo -e "${DIM}$(echo "$dirty" | sed 's/^/      /')${NC}"
      [ -n "$ahead" ] && echo -e "${DIM}$(echo "$ahead" | sed 's/^/      unpushed: /')${NC}"
      (( NEEDS_REVIEW_COUNT++ ))
    fi
  else
    echo -e "  ${BLUE}ℹ️${NC}  ${branch} — PR state: ${pr_state:-none/open}"
    (( KEEP_COUNT++ ))
  fi
}

remove_worktree() {
  local repo="$1" wt="$2" branch="$3"
  cd "$repo" || return

  if ! git worktree remove --force "$wt" 2>/dev/null; then
    if command -v robocopy >/dev/null 2>&1; then
      # Windows: git worktree remove's recursive delete hits MAX_PATH on
      # deep node_modules trees even with core.longpaths set. robocopy's
      # mirror-of-empty trick deletes via the long-path-aware Win32 API.
      echo -e "    ${DIM}long-path removal failed, falling back to robocopy mirror (Windows)...${NC}"
      local empty
      empty=$(mktemp -d)
      robocopy "$empty" "$wt" /MIR /NFL /NDL /NJH /NJS >/dev/null 2>&1
      rm -rf "$empty" 2>/dev/null
      rmdir "$wt" 2>/dev/null
    else
      # macOS/Linux: no MAX_PATH limit, so a plain rm -rf covers whatever
      # else made git's own removal fail.
      echo -e "    ${DIM}git worktree remove failed, falling back to rm -rf...${NC}"
      rm -rf "$wt" 2>/dev/null
    fi
    git worktree prune
  fi

  git branch -D "$branch" 2>/dev/null
  git push origin --delete "$branch" 2>/dev/null
  echo -e "    ${GREEN}✓${NC}  removed worktree and branch: ${branch}"
}

section "Scanning" "🔍"

for repo in "${TARGETS[@]}"; do
  prune_repo "$repo"
done

section "Summary" "🍽️"

safe_count=${#SAFE_REMOVE_BRANCHES[@]}
echo -e "  ${GREEN}✓${NC}  ${safe_count} safe to remove"
echo -e "  ${YELLOW}⚠️${NC}  ${NEEDS_REVIEW_COUNT} need review"
echo -e "  ${BLUE}ℹ️${NC}  ${KEEP_COUNT} kept (active or open PR)"

if [ "$safe_count" -eq 0 ]; then
  echo -e "\n  ${DIM}Nothing to remove.${NC}"
  exit 0
fi

if [ -z "$APPLY" ]; then
  echo -e "\n  ${DIM}(dry run — pass --apply to remove the ✓ safe-remove worktrees above)${NC}"
  exit 0
fi

echo ""
echo -e "  ${RED}⚠️  About to permanently remove ${safe_count} worktree(s) and their local/remote branches:${NC}"
for i in "${!SAFE_REMOVE_BRANCHES[@]}"; do
  echo -e "     ${RED}-${NC} ${SAFE_REMOVE_BRANCHES[$i]}  ${DIM}(${SAFE_REMOVE_WTS[$i]})${NC}"
done
echo ""
read -p "  $(echo -e "${RED}Remove these now? (y/N):${NC}") " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "  ${YELLOW}Aborted — nothing removed.${NC}"
  exit 1
fi

echo ""
for i in "${!SAFE_REMOVE_BRANCHES[@]}"; do
  remove_worktree "${SAFE_REMOVE_REPOS[$i]}" "${SAFE_REMOVE_WTS[$i]}" "${SAFE_REMOVE_BRANCHES[$i]}"
done
