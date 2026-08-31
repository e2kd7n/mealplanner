# Weekly Maintenance — 2026-08-31

**Performed by:** Cloud maintenance routine (scheduled)
**Environment:** Remote cloud (no live Pi/container access)
**Date:** 2026-08-31

---

## Issue and Repository Hygiene

- [x] Reviewed all 22 open issues
- [x] Closed completed issues: **#357** (ad-hoc grocery entry — implemented in commits `c208939`, `55b4f53`, `a6f80a6` / PR #412)
- [x] Removed stale closed issues from ISSUE_PRIORITIES.md: #355, #401, #402, #403, #404 (all closed via August 2026 PRs)
- [x] Added new issues #406–#409 (grocery list follow-ups, filed 2026-08-28) to ISSUE_PRIORITIES.md
- [x] Flagged stale issues (no activity 30+ days): **#63** (68d), **#170** (65d), **#84** (63d) — comments left on each
- [x] ISSUE_PRIORITIES.md updated and committed

**Issues closed this run:** #357

**Stale issues flagged:** #63, #84, #170

**New open issues (unflagged before this run):** #406, #407, #408, #409 — four grocery-list follow-ups from the #357/#412 implementation, all filed 2026-08-28. #406 and #407 are likely P1-high (route mismatch = 404s on core generate flow; missing 'name' field = createGroceryList broken). Needs triage and milestone assignment.

**Pi hygiene scripts:** `weekly-repo-hygiene.sh` runs on the Pi via cron (Sun 04:15). No cron log available from cloud — assumed to have run or will run tonight. ISSUE_PRIORITIES.md regenerated manually here since `gh` CLI is not available in the cloud environment.

---

## Database Maintenance

- [x] **Live backup — SKIPPED** (no container access from cloud environment)
- [x] Backup script DB name check — **PASSED**: `backup-database.sh` uses `POSTGRES_DB="${POSTGRES_DB:-meal_planner}"` ✅

**Secret Rotation Status (`docs/SECRET_ROTATION_STATUS.json`):**
- Last rotated: 2026-08-19
- All secrets due: **2026-11-17** — nothing overdue ✅
- Next check needed: ~2026-11-10

---

## Security Updates

### npm audit — Backend

**Before `npm audit fix`:** 8 HIGH vulnerabilities (nanoid <3.3.18, socket.io-parser 4.0.0–4.2.6, undici 7.0.0–7.28.0 ×5, deepmerge-ts <8.0.0 via prisma)

**After `npm audit fix` (non-breaking):** 3 HIGH remaining — all in deepmerge-ts chain:
```
deepmerge-ts < 8.0.0 → @prisma/config → prisma
GHSA-ggr8-5vv4-36mx (stack exhaustion)
Fix requires: npm audit fix --force → prisma@6.12.0 (breaking change — NOT applied)
```

> **Note:** This is the same vulnerability tracked and closed in #392 (via pnpm override in `pnpm-lock.yaml`). The Pi runs `pnpm audit`, which honours the override. npm audit in this cloud environment reads `package-lock.json` (no pnpm override) and still flags it — this is the documented npm/pnpm discrepancy from WEEKLY_MAINTENANCE.md. No new issue created; #392's fix is the right path.

**Also open:** #399 — ws vulns via socket.io-adapter, P1-high, still unresolved. npm audit fix resolved the `socket.io-parser` and `nanoid` and `undici` issues non-breakingly; socket.io-adapter ws chain is tracked separately.

### npm audit — Frontend

**Before `npm audit fix`:** 5 HIGH (nanoid, postcss ×2, socket.io-parser, undici ×4)
**After `npm audit fix`:** **0 vulnerabilities** ✅

Changes committed: `backend/package-lock.json`, `frontend/package-lock.json`

### Credential scan (recent commits)

`git log --since="7 days ago" -p | grep -EnI "AKIA...|SECRET=|TOKEN=|PASSWORD=..."` — **No matches** ✅

### Security issues status
- **#399** (ws via socket.io-adapter): P1-high, open, no fix yet — requires pnpm override for socket.io-adapter >=2.5.8

---

## Code Quality

### Backend build
```
npm run build (tsc)
Result: PASSED — 0 errors ✅
```
> Note: Requires `npm install --legacy-peer-deps` in cloud (typescript@^6.0.3 vs Prisma peer dep). Builds cleanly once installed.

### Frontend build
```
npm run build (tsc -b && vite build)
Result: PASSED — 0 errors ✅
Warning: mui-core chunk 509 kB (> 500 kB limit) — expected, pre-existing, documented in CLAUDE.md
```

### Backend lint
```
npm run lint
Result: 276 warnings, 0 errors — all @typescript-eslint/no-explicit-any
No new errors introduced.
```

### Frontend lint
```
npm run lint
Result: 26 problems (18 errors, 8 warnings)
Notable: RecipeDetail.tsx:105 — setState called synchronously inside useEffect (react-hooks/set-state-in-effect error)
         Various useEffect missing dependency warnings
```
> Frontend lint errors are pre-existing. 18 errors, 8 warnings — no new issues introduced by recent commits. Worth tracking as a follow-up if not already.

### TODO/FIXME scan

**No TODO/FIXME comments found in backend/src or frontend/src** ✅

---

## Performance Monitoring

- **SKIPPED** — no container access from cloud environment (no docker stats, no log tailing)

---

## Documentation

- ISSUE_PRIORITIES.md updated to reflect current GitHub state
- This maintenance report committed to `docs/archive/beta-testing/`

---

## User Feedback Review

- **SKIPPED** — feedback-log-triage.sh runs on Pi via cron (Sun 03:45). No live Postgres access from cloud.

---

## Worktree Hygiene

- **SKIPPED** — prune-worktrees.sh runs locally on the dev machine via Windows Scheduled Task. No access from cloud.

---

## Summary

| Area | Status | Notes |
|---|---|---|
| Issue hygiene | ✅ Done | Closed #357; flagged #63/#84/#170 stale; added #406–409 to priorities |
| DB backup | ⏭️ Skipped | No container access |
| DB name check | ✅ Pass | `meal_planner` confirmed |
| Secret rotation | ✅ OK | All due 2026-11-17 |
| Backend audit fix | ✅ Done | 3 HIGH remain (deepmerge-ts/prisma, known, pnpm override exists) |
| Frontend audit fix | ✅ Done | 0 vulnerabilities |
| Backend build | ✅ Pass | 0 errors |
| Frontend build | ✅ Pass | 0 errors (chunk size warning expected) |
| Backend lint | ✅ Pass | 276 warnings (no-explicit-any), 0 errors |
| Frontend lint | ⚠️ Issues | 18 errors (pre-existing react-hooks violations) |
| TODO/FIXME scan | ✅ Clean | None found |
| Credential scan | ✅ Clean | No matches |
| Performance monitoring | ⏭️ Skipped | No container access |
| User feedback triage | ⏭️ Skipped | Pi-side only |
| Worktree hygiene | ⏭️ Skipped | Local machine only |

## Items Needing Attention

1. **#406 + #407** — Grocery list route mismatch (404s on generate flow) and missing `name` field on createGroceryList — both filed 2026-08-28, no labels or milestone. Likely P1. Assign and fix in next sprint.
2. **#399** — ws vulns via socket.io-adapter: P1-high, still open. Add pnpm override `"socket.io-adapter": ">=2.5.8"` to backend/package.json.
3. **Frontend lint errors** — 18 errors (react-hooks violations). Pre-existing but worth a cleanup pass. RecipeDetail.tsx setState-in-effect is the notable one.
