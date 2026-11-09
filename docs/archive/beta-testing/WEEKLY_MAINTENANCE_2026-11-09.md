## Weekly Maintenance - 2026-11-09

**Run by:** Cloud maintenance routine (automated)
**Environment:** Remote cloud session (no live Pi or container access)

---

### Issue and Repository Hygiene

- [x] Reviewed all 19 open issues
- [x] No issues could be confirmed closed by recent commits — none of the 40 most recent commits reference open issue numbers with `Fixes #` / `Closes #` patterns matching the current open set
- [x] Updated in-progress issues: #436 (security tracker updated with 2026-11-09 audit findings)
- [x] Stale issues flagged (35+ days no activity): #406, #416 — stale check comments added to both
- [x] Labels corrected: #406 updated to `bug`, `P1-high`, `fullstack` (was unlabelled — this is a primary UX flow bug)
- [x] No duplicate issues detected (confirmed by `update-issue-priorities.sh`)
- [x] No TODO comments in codebase warranting new issues
- [x] ISSUE_PRIORITIES.md regenerated via `./scripts/update-issue-priorities.sh`

**Issues reviewed:**

| # | Title | Status | Action |
|---|-------|--------|--------|
| 436 | security: HIGH vulns in backend deps — weekly audit | OPEN | Updated body with 2026-11-09 npm audit findings |
| 416 | Verify maintenance-script logs actually get pruned | OPEN (stale 35d) | Stale comment added; log pruning still not wired into any cron/script |
| 406 | Grocery list generation 404s: route mismatch | OPEN (stale 35d) | Stale comment added; bug still present. Labels corrected to P1-high/bug/fullstack |
| 307 | accessibility: missing aria-labels on icon-only buttons | OPEN | No action — P3-low, last updated 2026-10-28 |
| 261 | perf(e2e): use Playwright storageState | OPEN | No action — last updated 2026-10-28 |
| 200 | Pi: move Postgres data to USB SSD | OPEN | No action — P3-low infrastructure; intentional deferral |
| 170 | Add photo capture and PDF upload | OPEN | No action — P3-low enhancement |
| 116 | Add cost tracking | OPEN | No action — P3-low enhancement |
| 84 | Add recipe document upload | OPEN | No action — P3-low enhancement |
| 66 | Publish Meals to ICS | OPEN | No action — P4-future |
| 64 | Advanced Features (Nutrition Tracking) | OPEN | No action — P4-future |
| 63 | Evaluate Scaling Strategy | OPEN | No action — P4-future |
| 20 | Pantry Integration with Grocery Lists | OPEN | No action — P4-future |
| 19 | Grocery List Regeneration and Sync Detection | OPEN | No action — P4-future |
| 14 | Implement Nutrition Guideline Warnings | OPEN | No action — P3-low |
| 13 | Implement Nutrition Dashboard | OPEN | No action — P3-low |
| 12 | Integrate Nutrition Database | OPEN | No action — P3-low |
| 9 | MyFitnessPal Integration | OPEN | No action — P3-low |
| 8 | Grocery List Optimization | OPEN | No action — P3-low |

**Note:** Pi-side `scripts/weekly-repo-hygiene.sh` runs Sunday mornings on the Pi and handles duplicate detection, label auto-add, and ISSUE_PRIORITIES.md regeneration. The cloud routine only does LLM-judgment closures and stale comments.

---

### Database Maintenance

- [ ] Backup — **SKIPPED** (no container access in cloud environment; Pi cron handles daily backups)
- [x] Backup script DB name verified: `scripts/backup-database.sh` uses `POSTGRES_DB="${POSTGRES_DB:-meal_planner}"` ✓
- [ ] Database size / slow queries — **SKIPPED** (no container access)

---

### Security Updates

- [x] `npm audit` run on backend: **22 vulnerabilities (16 moderate, 6 HIGH)**
- [x] `npm audit` run on frontend: **10 moderate vulnerabilities** (all in ESLint/minimatch dev-only toolchain)
- [x] `npm audit fix` attempted on both: **BLOCKED** — vitest peer dependency conflict prevents resolution in cloud environment (same blocker as 2026-11-02; see #436 notes)
- [x] No new HIGH/CRITICAL findings not already tracked in #436; issue body updated with 2026-11-09 audit snapshot
- [x] No CRITICAL findings; no immediate escalation required
- [x] Secret rotation status checked via `docs/SECRET_ROTATION_STATUS.json`:
  - Last rotated: **2026-08-19** (all secrets)
  - Due by: **2026-11-17** (8 days from today)
  - Status: **not yet overdue** — Pi cron (`rotate-secrets-if-due.sh`) will act on 2026-11-17 or the first Sunday after
  - No action needed this week

**Backend HIGH findings summary:**
- **undici** (8 CVEs): DoS variants (EventSource, decompress, TLS renegotiation, PONG buffer), SRI bypass, TLS cert validation bypass, cache poisoning, cross-origin redirect disclosure — all transitive; `npm audit fix` resolves when unblocked
- **vite** (5 CVEs): cross-origin script exec (dev server only, not prod risk), files-outside-fs.allow, fs.existsSync bypass — dev-time tool
- **zod** (1 CVE): memory exhaustion on oversized constrained collections — reachable in backend validation; should be patched via Pi's `pnpm audit fix`

**Frontend moderate findings:** All in `eslint` / `@typescript-eslint` / `minimatch` toolchain — dev-only, never shipped to users. Only fixable with `--force` (would trigger breaking ESLint major version bump). Low priority.

**Credential leak scan:** No leaked credentials detected in commits from the past 7 days.

---

### Performance Monitoring

- [ ] Application logs — **SKIPPED** (no container access)
- [ ] API response times — **SKIPPED** (no container access)
- [ ] Container resource usage — **SKIPPED** (no container access)

---

### Code Quality

- [x] Backend TypeScript build: **PASS** (`tsc` exit 0, no errors)
- [x] Frontend Vite build: **PASS** (`tsc -b && vite build` exit 0, 12,188 modules transformed)
  - Chunk size warning: `react-core` chunk at 817KB (> 500KB limit) — **pre-existing**, consistent with Pi's RAM-optimized split strategy in `vite.config.ts`
- [x] Backend ESLint: **PASS** — 316 warnings, 0 errors (all pre-existing `@typescript-eslint/no-explicit-any`)
- [x] Frontend ESLint: **PASS** — 7 warnings, 0 errors (all pre-existing `react-hooks/exhaustive-deps`)
- [x] TODO/FIXME scan: **0 hits** in `backend/src` or `frontend/src`

**Note:** `npm install` fails due to vitest peer conflict in cloud; `pnpm install` used instead (pnpm v11.1.2 available at `/opt/node22/bin/pnpm`).

---

### Documentation

- [x] ISSUE_PRIORITIES.md regenerated (net: -27 lines, consolidated)
- [ ] No other documentation updates needed this cycle

---

### User Feedback

- [ ] Feedback triage log — **SKIPPED** (Pi-side only; `scripts/feedback-log-triage.sh` reads live DB)
- [ ] `data/maintenance-logs/feedback-triage-status.txt` — not accessible from cloud environment

---

### Worktree Hygiene

- [ ] **SKIPPED** — purely local-machine task; no cloud-side check needed per WEEKLY_MAINTENANCE.md

---

### Notes

**Items needing attention:**

1. **#406 (P1-high bug)** — Grocery list generation is broken (frontend POSTs to `/grocery-lists/generate` but backend route is `/from-meal-plan/:mealPlanId`). This is the primary meal-planner → grocery-list flow. No recent commit has addressed it. This should be prioritised before next session.

2. **#436 (security HIGH)** — 6 HIGH backend vulns (primarily undici, vite, zod). `npm audit fix` is blocked in cloud by vitest conflict. The Pi's weekly `pnpm audit fix` cron should resolve this — verify it ran after next Sunday.

3. **Secret rotation due 2026-11-17** — 8 days away. Pi cron will auto-rotate. No action needed unless Pi is offline or cron fails; check `docs/SECRET_ROTATION_STATUS.json` after the week of 2026-11-17 to verify.

4. **#416 (log pruning)** — `data/maintenance-logs/` accumulates log files indefinitely; prune step not automated. Low urgency but worth a one-line fix in `scripts/weekly-repo-hygiene.sh`.

**Skipped (all due to no container access in cloud environment):**
- Live DB backup
- DB size / slow query check
- Container health / resource stats
- Application log review
- Feedback triage status check
