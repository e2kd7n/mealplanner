## Weekly Maintenance - 2026-09-07

**Run by:** Cloud maintenance routine (automated)
**Environment:** Remote cloud (no live Pi/container access)

---

### Issue and Repository Hygiene

- [x] Reviewed all 22 open issues
- [x] No issues closed — none were clearly completed by recent commits
- [x] Grocery list issues #406–#409 verified still open (confirmed in current codebase — see notes below)
- [x] Stale issue comments posted on 6 issues with 30+ days no activity: #307, #261, #200, #116, #20, #19
- [ ] `./scripts/update-issue-priorities.sh` — **SKIPPED** (Pi-side script; needs `secrets/github_token.txt` and `gh`/`jq` installed on Pi — cloud env does not have these)
- [ ] ISSUE_PRIORITIES.md regeneration — skipped for same reason; Pi weekly cron handles this

**Grocery list issues still open (confirmed vs. current codebase):**
- **#406** (route mismatch): `groceryListAPI.generateFromMealPlan` in `frontend/src/services/api.ts:252-253` still calls `POST /grocery-lists/generate` but backend only has `POST /grocery-lists/from-meal-plan/:mealPlanId` — will 404. NOT fixed by #412.
- **#407** (name field): `createGroceryList` requires `name` in request body but `GroceryList` Prisma model has no `name` field — value validated and silently dropped. Still open.
- **#408** (Zod schemas not wired): `createGroceryListSchema` / `updateGroceryListSchema` still not wired as middleware. Still open.
- **#409** (orphaned component): `MobileGroceryList.tsx` still has zero consumers outside its own file. Still open.

**No issues flagged as "appears resolved" by Pi hygiene script this run** (checked git log —
recent commits #412–#415, f764313 do not reference #406–#409 or other open issues via `Fixes/Closes` keywords).

**New issue created:**
- #417: `security: backend HIGH vulns in deepmerge-ts + mysql2 (transitive via prisma) require breaking prisma upgrade` [P1-high, security, backend]

---

### Database Maintenance

- [ ] Live backup — **SKIPPED** (no container access in cloud environment)
- [x] Backup script DB name verified: `scripts/backup-database.sh` correctly uses `POSTGRES_DB="${POSTGRES_DB:-meal_planner}"` ✓
- [ ] DB size / slow query check — **SKIPPED** (no live container access)

---

### Security Updates

**Secret rotation check:**
- All 5 secrets last rotated 2026-08-19; all `dueBy` 2026-11-17 — no rotation overdue ✓
- Next rotation due: 2026-11-17

**Credential leak scan** (last 7 days of commits):
- `git log --since="7 days ago" -p` scan found **no matches** for credential patterns ✓

**npm audit — backend (`backend/`):**
- Before fix: 5 vulnerabilities (1 moderate, 4 high)
  - `qs` moderate (GHSA-x5fp-wj9c-mxmx, GHSA-4mjr-xmp4-gh2g) — **FIXED** by `npm audit fix`
  - `deepmerge-ts` HIGH (GHSA-ggr8-5vv4-36mx) via `@prisma/config` — unfixed (requires `--force`, breaking prisma upgrade)
  - `mysql2` HIGH ×2 (GHSA-3f6p-5ww8-9rcr, GHSA-rgwj-5xj2-c3m3) via `prisma` — unfixed (same reason)
- After fix: 4 high severity remaining — **tracked in #417**
- `npm audit fix --force` not run (breaking change; requires careful prisma migration testing)

**npm audit — frontend (`frontend/`):**
- Before fix: 1 high severity vulnerability
  - `browserslist` HIGH (GHSA-c83g-rgw3-j3cx, GHSA-73wf-gq98-2v4g) — **FIXED** by `npm audit fix`
- After fix: **0 vulnerabilities** ✓

**Committed:** `fix(deps): npm audit fix — weekly maintenance` (commit `c81a7ee`, pushed to `main`)

**Existing open security issues:**
- #399: `security: 2 remaining ws vulns via socket.io-adapter transitive dep` [P1-high] — still open, last updated 2026-08-24

---

### Performance Monitoring

- [ ] Container stats, API response times, memory usage — **SKIPPED** (no live Pi/container access)

---

### Code Quality

**Backend build:**
- `npm run build` (tsc): **PASS** ✓
  - Note: Prisma client must be generated first (`npx prisma generate`) in a fresh clone — the generated client is not committed. TypeScript errors about missing `@prisma/client` exports are expected without it.

**Frontend build:**
- `npm run build` (Vite): **PASS** ✓
  - Warning: `mui-core` chunk is 509.53 kB (>500 kB limit) — pre-existing, tracked by Pi's chunk-split config

**Backend lint:**
- `npm run lint`: **0 errors, 276 warnings** ✓ (all `no-explicit-any` / utility type warnings — pre-existing, no regressions)

**Frontend lint:**
- `npm run lint`: **18 errors, 8 warnings**
  - Error types: "Calling setState synchronously within an effect" (×9), "Cannot access variable before it is declared" (×9)
  - Build still passes (these are ESLint rules, not TypeScript errors)
  - Pre-existing lint errors — present before this maintenance run. Worth tracking as a cleanup issue.

**TODO/FIXME scan:**
- `grep -r "TODO\|FIXME" backend/src frontend/src`: **0 findings** ✓

---

### Documentation

- [x] Maintenance report written: `docs/archive/beta-testing/WEEKLY_MAINTENANCE_2026-09-07.md` (this file)
- No other documentation updates required

---

### User Feedback

- [ ] Feedback triage script results — **SKIPPED** (Pi-side; `data/maintenance-logs/feedback-triage-status.txt` not available in cloud env)

---

### Notes

1. **Backend build requires Prisma generate in fresh clones.** The `@prisma/client` generated output is gitignored. Any CI or cloud environment that runs `tsc` without first running `npx prisma generate` will see spurious TS errors. Consider adding a `prisma generate` step to the build script or a `prepare` npm hook.

2. **Frontend has 18 ESLint errors.** These are pre-existing but accumulating. Main categories: synchronous `setState` inside `useEffect` (React anti-pattern — can cause cascading renders) and `Cannot access variable before it is declared` (potential ordering bug). Low priority but worth a one-time cleanup pass.

3. **Grocery list issues (#406–#409) predate and survived the #412 merge.** The route mismatch (#406) means the primary "generate grocery list from meal plan" button in `MealPlanner.tsx` will 404 in production. This is a functional regression that affects the core feature.

4. **`update-issue-priorities.sh` not run.** This is designed to run on the Pi with `gh` + `jq` installed. The Pi's weekly cron (`15 4 * * 0`) handles ISSUE_PRIORITIES.md regeneration. No cloud-side action needed.

---

### Closed Issues

None closed this run.

### Issues Opened

| # | Title | Labels |
|---|---|---|
| #417 | security: backend HIGH vulns in deepmerge-ts + mysql2 (transitive via prisma) | P1-high, security, backend |

### Issues Commented (stale flag)

| # | Title | Days Inactive |
|---|---|---|
| #307 | accessibility: missing aria-labels on icon-only buttons | 33 |
| #261 | perf(e2e): use Playwright storageState to avoid per-test UI login | 37 |
| #200 | Pi: move Postgres data volume to USB SSD | 37 |
| #116 | [P2][UX] Add Cost Tracking for Budget-Conscious Users | 33 |
| #20 | Implement Pantry Integration with Grocery Lists | 35 |
| #19 | Implement Grocery List Regeneration and Sync Detection | 34 |
