#!/bin/bash
# Worktree hygiene: removes git worktrees that are safe to remove and
# reports everything else for manual review. Never touches a worktree
# with uncommitted changes or commits not reflected in a merged/closed PR.
# Also detects orphaned directories under .claude/worktrees/ that AREN'T
# registered git worktrees at all — leftovers from a removal that hit the
# Windows MAX_PATH limit partway, or a worktree-creation that never fully
# registered — which the git-worktree-list scan above can't see.
#
# Usage:
#   prune-worktrees.sh <repo-path> [--apply]
#   prune-worktrees.sh --all [--apply]   # every git repo directly under
#                                         # the parent of this script's dir
#
# Default is dry-run (report only). Pass --apply to actually remove
# worktrees and delete their local/remote branches — this still asks for
# confirmation once, listing everything that will be removed, before it
# touches anything. Orphaned directories get their own separate
# confirmation prompt (see below) since deleting them is unrecoverable —
# there's no branch/commit to fall back on.
#
# "Safe to remove" = branch has a merged or closed PR, AND the worktree
# has no uncommitted changes (besides .claude/settings.local.json, which
# is local-only noise), AND no commits ahead of the default branch that
# aren't already on it. Anything else is reported as needs-review.
#
# A worktree locked by a session whose owning PID is no longer running
# is treated as unlocked (stale lock) for the purposes of this check.
#
# Orphaned (non-worktree) directories have no git pointer at all, so
# there's no branch/PR signal to check — only their content's own
# modification time. One that hasn't changed in $STALE_ORPHAN_DAYS days is
# offered for removal; anything more recent is always left alone (could be
# a worktree mid-creation, or in-progress content dropped there by hand).

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=utilities.sh
source "$SCRIPT_DIR/utilities.sh"

DEV_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# An orphaned directory younger than this is always left alone, no matter
# what --apply says — it might be a worktree still mid-creation.
STALE_ORPHAN_DAYS=7

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

# Orphaned (non-worktree) directories collected the same way — no branch,
# so nothing to key removal on but the directory path itself.
ORPHAN_DIRS=()
ORPHAN_AGE_DAYS=()
ORPHAN_RECENT_COUNT=0

section "Worktree Hygiene" "🧹"

# `pwd` in Git Bash returns MSYS-style paths (/c/Users/...), but git.exe
# always reports its own `git worktree list` paths Windows-style
# (C:/Users/...) since it's a native Windows binary. Without normalizing,
# string comparisons against git's output (skipping the repo root, matching
# orphan dirs against the registered list) silently never match on Windows.
# `pwd -W` is the Git-Bash builtin that returns the Windows-style form;
# elsewhere (macOS/Linux/Pi) git and pwd already agree, so plain pwd is used.
portable_pwd() {
  if [ "$(detect_os)" = "windows" ]; then
    pwd -W
  else
    pwd
  fi
}

# Age in whole days since the newest file under a directory was modified
# (falls back to the directory's own mtime if it has no files, e.g. empty).
# Handles both GNU stat (Linux/Git-Bash) and BSD stat (macOS) since this
# script is used across Windows, macOS and the Pi.
dir_age_days() {
  local d="$1" newest now
  newest=$(find "$d" -type f -exec stat -c '%Y' {} \; 2>/dev/null | sort -n | tail -1)
  if [ -z "$newest" ]; then
    newest=$(stat -c '%Y' "$d" 2>/dev/null || stat -f '%m' "$d" 2>/dev/null || echo "")
  fi
  [ -z "$newest" ] && { echo 0; return; }
  now=$(date +%s)
  echo $(( (now - newest) / 86400 ))
}

# Shared delete: tries a normal recursive remove first, falls back to a
# robocopy mirror-of-empty (Windows, dodges MAX_PATH) or plain rm -rf
# (macOS/Linux, no MAX_PATH issue so nothing else should make this fail).
force_remove_dir() {
  local target="$1"
  if rm -rf "$target" 2>/dev/null && [ ! -d "$target" ]; then
    return 0
  fi
  if command -v robocopy >/dev/null 2>&1; then
    echo -e "    ${DIM}plain removal failed, falling back to robocopy mirror (Windows)...${NC}"
    local empty
    empty=$(mktemp -d)
    robocopy "$empty" "$target" /MIR /NFL /NDL /NJH /NJS >/dev/null 2>&1
    rm -rf "$empty" 2>/dev/null
    rmdir "$target" 2>/dev/null
  else
    echo -e "    ${DIM}plain removal failed, retrying rm -rf...${NC}"
    rm -rf "$target" 2>/dev/null
  fi
}

# Find directories under <repo>/.claude/worktrees/ that aren't in git's own
# worktree list — i.e. plain content left behind by a removal that didn't
# fully complete, or a worktree that never finished registering.
scan_orphan_dirs() {
  local repo="$1" registered="$2"
  local wt_base="$repo/.claude/worktrees"
  [ -d "$wt_base" ] || return

  local any_orphan=0
  local d
  for d in "$wt_base"/*/; do
    d="${d%/}"
    [ -d "$d" ] || continue
    grep -Fxq "$d" <<< "$registered" && continue

    any_orphan=1
    local age
    age=$(dir_age_days "$d")
    local size
    size=$(du -sh "$d" 2>/dev/null | cut -f1)
    if [ "$age" -ge "$STALE_ORPHAN_DAYS" ]; then
      echo -e "  ${YELLOW}⚠️${NC}  orphan: ${d#"$repo"/} — not a registered git worktree, ${size:-?}, untouched ${age}d — candidate for removal"
      ORPHAN_DIRS+=("$d")
      ORPHAN_AGE_DAYS+=("$age")
    else
      echo -e "  ${BLUE}ℹ️${NC}  orphan: ${d#"$repo"/} — not a registered git worktree, ${size:-?}, modified ${age}d ago (too recent, left alone)"
      (( ORPHAN_RECENT_COUNT++ ))
    fi
  done
  [ "$any_orphan" = 1 ] && echo
}

prune_repo() {
  local repo="$1"
  cd "$repo" || return
  [ -d .git ] || return
  # Re-derive repo in the same path representation git worktree list uses
  # (see portable_pwd above) so later string comparisons actually match.
  repo="$(portable_pwd)"

  local default_branch
  default_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
  [ -z "$default_branch" ] && default_branch="main"
  git fetch origin --quiet 2>/dev/null || true

  local wt_list
  wt_list=$(git worktree list --porcelain)
  [ -z "$wt_list" ] && return

  local registered_paths
  registered_paths=$(grep '^worktree ' <<< "$wt_list" | sed 's/^worktree //')

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

  scan_orphan_dirs "$repo" "$registered_paths"
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

  # git worktree remove's recursive delete hits Windows's MAX_PATH limit on
  # deep node_modules trees even with core.longpaths set; force_remove_dir
  # falls back to a robocopy mirror-of-empty trick there.
  if ! git worktree remove --force "$wt" 2>/dev/null; then
    force_remove_dir "$wt"
    git worktree prune
  fi

  git branch -D "$branch" 2>/dev/null
  git push origin --delete "$branch" 2>/dev/null
  echo -e "    ${GREEN}✓${NC}  removed worktree and branch: ${branch}"
}

remove_orphan_dir() {
  local d="$1"
  force_remove_dir "$d"
  echo -e "    ${GREEN}✓${NC}  removed orphaned directory: ${d}"
}

section "Scanning" "🔍"

for repo in "${TARGETS[@]}"; do
  prune_repo "$repo"
done

section "Summary" "🍽️"

safe_count=${#SAFE_REMOVE_BRANCHES[@]}
orphan_count=${#ORPHAN_DIRS[@]}
echo -e "  ${GREEN}✓${NC}  ${safe_count} safe to remove"
echo -e "  ${YELLOW}⚠️${NC}  ${NEEDS_REVIEW_COUNT} need review"
echo -e "  ${BLUE}ℹ️${NC}  ${KEEP_COUNT} kept (active or open PR)"
echo -e "  ${YELLOW}⚠️${NC}  ${orphan_count} orphaned director$( [ "$orphan_count" = 1 ] && echo y || echo ies ) stale enough to remove"
[ "$ORPHAN_RECENT_COUNT" -gt 0 ] && echo -e "  ${BLUE}ℹ️${NC}  ${ORPHAN_RECENT_COUNT} orphaned but too recent, left alone"

if [ "$safe_count" -eq 0 ] && [ "$orphan_count" -eq 0 ]; then
  echo -e "\n  ${DIM}Nothing to remove.${NC}"
  exit 0
fi

if [ -z "$APPLY" ]; then
  echo -e "\n  ${DIM}(dry run — pass --apply to remove the ✓ safe-remove worktrees and stale orphaned directories above)${NC}"
  exit 0
fi

if [ "$safe_count" -gt 0 ]; then
  echo ""
  echo -e "  ${RED}⚠️  About to permanently remove ${safe_count} worktree(s) and their local/remote branches:${NC}"
  for i in "${!SAFE_REMOVE_BRANCHES[@]}"; do
    echo -e "     ${RED}-${NC} ${SAFE_REMOVE_BRANCHES[$i]}  ${DIM}(${SAFE_REMOVE_WTS[$i]})${NC}"
  done
  echo ""
  read -p "  $(echo -e "${RED}Remove these now? (y/N):${NC}") " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "  ${YELLOW}Aborted — no worktrees removed.${NC}"
  else
    echo ""
    for i in "${!SAFE_REMOVE_BRANCHES[@]}"; do
      remove_worktree "${SAFE_REMOVE_REPOS[$i]}" "${SAFE_REMOVE_WTS[$i]}" "${SAFE_REMOVE_BRANCHES[$i]}"
    done
  fi
fi

if [ "$orphan_count" -gt 0 ]; then
  echo ""
  echo -e "  ${RED}⚠️  About to permanently delete ${orphan_count} orphaned director$( [ "$orphan_count" = 1 ] && echo y || echo ies ) — these aren't git worktrees, so this is NOT recoverable via git:${NC}"
  for i in "${!ORPHAN_DIRS[@]}"; do
    echo -e "     ${RED}-${NC} ${ORPHAN_DIRS[$i]}  ${DIM}(untouched ${ORPHAN_AGE_DAYS[$i]}d)${NC}"
  done
  echo ""
  read -p "  $(echo -e "${RED}Delete these now? (y/N):${NC}") " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "  ${YELLOW}Aborted — no orphaned directories removed.${NC}"
    exit 1
  fi

  echo ""
  for d in "${ORPHAN_DIRS[@]}"; do
    remove_orphan_dir "$d"
  done
fi
