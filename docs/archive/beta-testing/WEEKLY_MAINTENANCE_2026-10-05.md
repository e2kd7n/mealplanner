# Weekly Maintenance — 2026-10-05

**Run by:** Cloud maintenance routine (automated)
**Environment:** Remote cloud container — no live Pi/container access

---

## Issue and Repository Hygiene

- [x] Reviewed all 19 open issues
- [x] No issues identified as newly completed by recent commits (only two commits since 2026-09-28: issue priorities regen + prior maintenance report)
- [x] Stale issues flagged (see below)
- [x] ISSUE_PRIORITIES.md regenerated via `./scripts/update-issue-priorities.sh` ✅

**Stale issues (30+ days since last update, today 2026-10-05):**
- **#416** (last updated 2026-08-31 — 35 days): "Verify maintenance-script logs actually get pruned automatically" — actionable task, stale comment posted
- **#406** (last updated 2026-09-28 — 7 days, but still unresolved): Grocery list generation 404 — P1 bug, still open, status comment posted
- **#170** (2026-08-31 — 35 days): Add photo capture — P3-low enhancement, intentionally deferred
- **#84** (2026-08-31 — 35 days): Recipe doc upload — P3-low enhancement, intentionally deferred
- **#66, #64, #63** (2026-08-24/31 — 35+ days): P4-future items, intentionally deferred
- **#14, #13, #12, #9, #8** (2026-08-24 — 41 days): Nutrition/grocery backlog — P3-low, intentionally deferred

P4-future and P3-low staleness is expected; stale comments not added to intentional long-term backlog items.

---

## Database Maintenance

- [x] **SKIPPED — no container access.** Cannot run `backup-database.sh` from cloud environment.
- [x] Backup script DB name verified: `POSTGRES_DB="${POSTGRES_DB:-meal_planner}"` ✅

---

## Security Updates

**pnpm audit — backend (before fixes):** 34 vulnerabilities (14 high, 16 moderate, 4 low)
**pnpm audit — frontend (before fixes):** 25 vulnerabilities (11 high, 11 moderate, 3 low)

**Action taken — axios upgraded to 1.20.0 (non-breaking):**
- Backend: `^1.19.0` → `^1.20.0` (fixed 7 HIGH axios vulns)
- Frontend: `^1.18.1` → `^1.20.0` (same fix)
- Advisories fixed: GHSA-x97p-jq2g-jp4f (prototype pollution), GHSA-3pq3-5fj3-cg6v (HTTP/2 DNS bypass), GHSA-542g-h47m-68v8 (DoS unhandled error), GHSA-m8m8-qj5v-23w3 (socket hijack), GHSA-r4gj-5m52-g5wh (SSRF via maxRedirects), and 2 more

**pnpm audit — backend (after fixes):** 22 vulnerabilities (7 high, 11 moderate, 4 low)
**pnpm audit — frontend (after fixes):** 25 vulnerabilities (11 high, 11 moderate, 3 low)

**Remaining HIGH vulnerabilities:**

| Package | Severity | Notes | Tracked |
|---|---|---|---|
| `mysql2` | HIGH | Transitive via `prisma` — requires breaking Prisma upgrade | #417 |
| `undici` (×2) | HIGH | Via `cheerio` (prod scraper path) + `jsdom`/`vitest` (test) | **#420** (new) |
| `brace-expansion` (×2) | HIGH | Via `eslint` (dev only) | **#420** (new) |
| `engine.io` | HIGH | Via `socket.io` (prod) | **#420** (new) |
| `braces` | HIGH | Via tooling (dev) | **#420** (new) |

**New issue created:** #420 — "security: HIGH vulns in undici, brace-expansion, engine.io, braces" (P1-high, security)

**Credential-leak scan (last 7 days):** No matches found ✅

**Secret rotation check (`docs/SECRET_ROTATION_STATUS.json`):**
- Last rotated: 2026-08-19
- All secrets due: **2026-11-17** (~43 days away)
- Status: ✅ No action needed this week

---

## Performance Monitoring

- **SKIPPED — no container access.** Cannot check container stats, logs, or resource usage from cloud environment.

---

## Code Quality

**Backend TypeScript build (`pnpm run build`):** ✅ Clean — no errors

**Frontend build (`pnpm run build`):** ✅ Clean — built successfully
- Warning: `react-core` chunk at 817.89 kB gzip:257kB — known issue (vite config splits aggressively for Pi RAM; see CLAUDE.md)

**Backend lint (`pnpm run lint`):** ⚠️ 276 warnings, 0 errors
- All `@typescript-eslint/no-explicit-any` and `no-prototype-builtins` warnings
- No new errors; same as prior weeks

**Frontend lint (`pnpm run lint`):** ⚠️ 276 warnings, 0 errors
- Same pattern as backend

**TODO/FIXME scan:** ✅ 0 found in `backend/src/` and `frontend/src/`

---

## Documentation

- No documentation updates needed this week

---

## User Feedback Review

- **SKIPPED — no live DB access.** `feedback-log-triage.sh` runs on Pi via cron.
- No `data/maintenance-logs/feedback-triage-status.txt` present in this clone (Pi-side output, not committed).

---

## Worktree Hygiene

- **SKIPPED — Pi/local-machine only.** `prune-worktrees.sh` runs via local Windows Scheduled Task.

---

## Summary

**Actions taken:**
1. Upgraded axios to 1.20.0 in both frontend and backend — fixes 7 HIGH vulns (prototype pollution, SSRF, DoS, socket hijack)
2. Created issue #420 for remaining new HIGH vulns (undici, brace-expansion, engine.io, braces)
3. Added stale comment to #416 (log pruning verification)
4. Added status comment to #406 (grocery list 404 still open)
5. Regenerated ISSUE_PRIORITIES.md

**Skipped (no container/Pi access):**
- DB backup
- Container stats / log review
- Feedback triage (Pi-side cron)
- Worktree hygiene (local-machine cron)

**Items needing attention:**
- **#417** — Prisma/mysql2 HIGH vulns require breaking upgrade; needs human decision on Prisma 6→7 migration
- **#420** — undici/engine.io via production deps (cheerio, socket.io) — should be investigated for non-breaking updates
- **#416** — Maintenance log auto-pruning not yet automated on Pi
- **#406** — Grocery list 404 bug still unresolved (P1-high)
