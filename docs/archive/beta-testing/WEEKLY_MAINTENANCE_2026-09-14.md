## Weekly Maintenance - 2026-09-14

**Run by:** Cloud maintenance routine (automated)
**Environment:** Remote cloud (no live Pi/container access)

---

### Issue and Repository Hygiene

- [x] Reviewed all 23 open issues
- [x] **Closed 3 issues** resolved by recent commits:
  - **#409** (MobileGroceryList.tsx orphaned) — fixed by `c6b295b` (2026-09-12): file deleted in dead-code removal
  - **#408** (Zod schema not wired on POST /grocery-lists) — fixed by `55b4f53` / PR #412: `createGroceryListSchema` now wired via `validate()` middleware
  - **#407** (createGroceryList name field) — fixed by `55b4f53` / PR #412: `GroceryList` gained `name String?` column and `createGroceryList` now persists it
- [x] **No stale issues** — all open issues were touched within the last 30 days (most updated 2026-09-07 by previous maintenance run)
- [x] **#406 confirmed still open**: `groceryListAPI.generateFromMealPlan` in `frontend/src/services/api.ts:252-253` still calls `POST /grocery-lists/generate` but backend only has `POST /grocery-lists/from-meal-plan/:mealPlanId`. Not addressed by any recent commit. Remains a live 404 bug on the primary "generate grocery list" flow.
- [x] **New security issue created**: #419 (multer HIGH vulns — see Security section)
- [ ] `./scripts/update-issue-priorities.sh` — **SKIPPED** (Pi-side script; requires `gh`/`jq` and `secrets/github_token.txt` on Pi; cloud env does not have these)
- [ ] ISSUE_PRIORITIES.md regeneration — skipped for same reason; Pi weekly cron handles this

**Open issues after this run: 21** (was 23 open, closed 3, opened 1 new)

---

### Database Maintenance

- [ ] Live backup — **SKIPPED** (no container access in cloud environment)
- [x] Backup script DB name verified: `scripts/backup-database.sh` correctly uses `POSTGRES_DB="${POSTGRES_DB:-meal_planner}"` ✓
- [ ] DB size / slow query check — **SKIPPED** (no live container access)

---

### Security Updates

**Secret rotation check (via `docs/SECRET_ROTATION_STATUS.json`):**
- All 5 secrets last rotated 2026-08-19; all `dueBy` 2026-11-17 — no rotation overdue ✓
- Next rotation due: 2026-11-17

**Credential leak scan (last 7 days of commits):**
- Commits this week: `4e546ff`, `57e1439`, `bbf84de`, `c6b295b`, `3638573`, `c81a7ee`
- Pattern scan for AWS keys, private keys, secrets: **no matches found** ✓

**npm audit — backend (`backend/`):**
- 8 vulnerabilities total (3 moderate, 5 HIGH)
- **multer ≤2.2.0** — HIGH (4 advisories): DoS via crafted multipart names, file descriptor leak on aborted uploads, file size bypass via fileFilter race condition, DoS via oversized array index. **Fix available non-breaking via `npm audit fix` / `pnpm audit fix`.**
  - → **New issue #419 created** [P1-high, security]
- **mysql2 ≤3.23.0** — HIGH (2 advisories): auth plugin downgrade leaks credentials, decompression-bomb DoS. Fix requires `--force` (breaking prisma upgrade).
  - → Already tracked in **#417** [P1-high, security]
- 3 moderate vulnerabilities in other packages
- `npm audit fix` — **SKIPPED** (node_modules not installed in cloud env; Pi-side `scripts/security-audit.sh` handles `pnpm audit fix` on the Pi)

**npm audit — frontend (`frontend/`):**
- 3 moderate vulnerabilities: `@vitest/mocker` / `vitest` / `@vitest/coverage-v8` 2.1.0–4.1.10 path traversal (GHSA-82fw-gwwq-j7x9). Fix available non-breaking.
- No HIGH or CRITICAL — no new issue created per policy
- `npm audit fix` — **SKIPPED** (same reason as backend)

---

### Performance Monitoring

- [ ] Container stats / logs — **SKIPPED** (no live Pi/container access)

---

### Code Quality

- [ ] Backend build (`npm run build`) — **SKIPPED** (node_modules not installed in cloud env; reported build failures are environment failures, not code errors. Last clean build confirmed in commit `c6b295b`.)
- [ ] Frontend build (`npm run build`) — **SKIPPED** (same reason)
- [ ] Backend lint (`npm run lint`) — **SKIPPED** (same reason)
- [ ] Frontend lint (`npm run lint`) — **SKIPPED** (same reason)
- [x] TODO/FIXME scan — **0 found** across `backend/src` and `frontend/src` ✓

---

### Documentation

- No documentation changes required this week.

---

### User Feedback

- Feedback/error-log triage is fully automated via Pi-side `scripts/feedback-log-triage.sh` — no cloud action needed.

---

### Notes

**#406 (grocery list 404) is a live bug** affecting the primary "generate grocery list from meal plan" flow. The frontend calls `POST /grocery-lists/generate` but the backend only has `POST /grocery-lists/from-meal-plan/:mealPlanId`. The fix is a one-line change in `frontend/src/services/api.ts` (line 253): change `/grocery-lists/generate` to use the correct path-param route. Not addressed this run (out of scope for maintenance-only task).

**multer HIGH vulns (#419)** are non-breaking to fix. The Pi-side `scripts/security-audit.sh` should handle them on its next weekly run. If urgent, manually run `pnpm audit fix` in `backend/` on the Pi and commit.

**ws/socket.io-adapter vulns (#399)** remain open — require a pnpm override in `backend/package.json` to force `socket.io-adapter ≥ 2.5.8`. Not addressed this run.

**mysql2 / prisma vulns (#417)** remain open — require a breaking prisma upgrade. Not addressed this run.
