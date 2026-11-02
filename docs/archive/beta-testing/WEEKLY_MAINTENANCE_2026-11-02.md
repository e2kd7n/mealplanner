## Weekly Maintenance - 2026-11-02

### Issue and Repository Hygiene
- [x] Reviewed all 18 open issues
- [ ] Closed completed issues: none — no issues confirmed resolved by recent commits
- [x] Updated in-progress issues: n/a
- [x] Stale issues flagged (>30 days no activity): #8, #9, #12, #13, #14, #63, #64, #66, #84, #170 — stale comments added
- [x] `./scripts/update-issue-priorities.sh` run — ISSUE_PRIORITIES.md regenerated
- [x] Credential scan (git log --since 7 days): no leaks found
- [x] Secret rotation check: all secrets due 2026-11-17, nothing overdue; Pi cron on track

**Issue status notes:**
- #406 (grocery-list 404: frontend/backend route mismatch) — still open; mismatch confirmed still present in code (`api.ts:252` calls `/grocery-lists/generate`, backend only has `/from-meal-plan/:mealPlanId`)
- #416 (maintenance log pruning) — still open; `weekly-repo-hygiene.sh` writes logs but does not prune them

**Pi-side automation status (read from repo):**
- `scripts/update-issue-priorities.sh` ran with minor issues (one GraphQL 403 on duplicate-check, and a bash integer comparison warning on line 530) but completed and wrote ISSUE_PRIORITIES.md
- Pi cron scripts (weekly-repo-hygiene, security-audit, feedback-log-triage, rotate-secrets-if-due) not directly observable from cloud — no failure evidence in git history

### Database Maintenance
- [x] Live backup: **SKIPPED** — no container access in cloud environment
- [x] Backup script verified: `scripts/backup-database.sh` uses `POSTGRES_DB="${POSTGRES_DB:-meal_planner}"` — correct DB name confirmed

### Security Updates
- [x] `pnpm audit` run on backend: **32 vulnerabilities** (4 low, 16 moderate, 12 high)
- [x] `pnpm audit` run on frontend: **32 vulnerabilities** (4 low, 16 moderate, 12 high)
- [x] `npm audit fix` attempted: **BLOCKED** — peer dependency conflict (`@vitest/coverage-v8@4.1.10` requires `vitest@4.1.10`); non-breaking fix not possible via npm in this environment
- [x] `pnpm audit fix`: **NOT VALID** — pnpm does not support this subcommand; Pi-side `scripts/security-audit.sh` handles patching via individual package updates
- [x] New security issue created: **#436** (P1-high) tracking 16 HIGH backend vulnerabilities
- [x] Credential scan: clean

**HIGH vulnerabilities (backend):**
| Package | Issue | GHSA |
|---------|-------|------|
| mysql2 | Auth plugin downgrade leaks plaintext DB credentials | GHSA-3f6p-5ww8-9rcr |
| undici (×4) | DoS (WebSocket, TLS, content-encoding, cache poisoning) | multiple |
| brace-expansion (×2) | DoS via stack exhaustion | GHSA-qhr7-859c-m2p7, GHSA-6j4f-fj2g-mc7p |
| engine.io | Socket.IO Protocol Mismatch DoS | GHSA-2gc4-cqfq-p2gv |
| source-map-js | Event-loop DoS | GHSA-68fv-2mgg-jv7q |
| follow-redirects (×3) | Credential header leaks via redirects | multiple |
| vite | fs.existsSync bypass on Windows | GHSA-587h-7wmj-h5pm |
| zod | Memory exhaustion via oversized collections | GHSA-mrhx-c7xc-m3w5 |
| body-parser | DoS via trailing bytes | GHSA-27r3-jxmh-p828 |
| multer | DoS via pending fileFilter | GHSA-q7qp-rjg7-q26m |

**Frontend:** 12 moderate only (ESLint/typescript-eslint toolchain, dev-only — not in production bundle).

### Performance Monitoring
- [ ] Container stats: **SKIPPED** — no container access in cloud environment
- [ ] Log review: **SKIPPED** — no container access

### Code Quality
- [x] Backend TypeScript build: **CLEAN** (no errors via `pnpm run build`)
- [x] Frontend Vite build: **CLEAN** (no errors via `pnpm run build`; large chunk warning for `react-core` at 817kB — pre-existing, noted in CLAUDE.md as expected for Pi RAM constraints)
- [x] Backend lint: **316 warnings, 0 errors** (all `@typescript-eslint/no-explicit-any` — pre-existing, no regression)
- [x] Frontend lint: **7 warnings, 0 errors** (`react-hooks/exhaustive-deps` in LocalLogin, MealPlanner, Profile pages — pre-existing)
- [x] TODO/FIXME scan: **0 matches** — no untracked TODO/FIXME comments in backend/src or frontend/src

**Environment note:** `npm run build` and `npm run lint` fail in this cloud environment (pnpm virtual store not visible to npm resolver). Using `pnpm run` commands instead — this is a cloud-environment limitation, not a code regression.

### Documentation
- [x] No documentation updates required this cycle

### User Feedback
- [ ] `data/maintenance-logs/feedback-triage-status.txt`: **SKIPPED** — Pi-only file, no access from cloud

### Notes

1. **Security (P1):** 16 HIGH backend vulnerabilities tracked in new issue #436. Pi-side `security-audit.sh` should handle patching; recommend verifying it ran this week and checking if the rolling tracker issue aligns with #436.
2. **Issue #406** (grocery list 404): Still open and confirmed present. Route mismatch between `frontend/src/services/api.ts:252` (`POST /grocery-lists/generate`) and backend (`POST /grocery-lists/from-meal-plan/:mealPlanId`). Should be scheduled for P2 fix.
3. **Issue #416** (maintenance log pruning): Still open. The `weekly-repo-hygiene.sh` script has no log pruning. Recommend adding `find "$LOG_DIR" -name "*.log" -mtime +30 -delete` at the top of that script.
4. **Secret rotation:** All 5 secrets due 2026-11-17 — no action needed this week.
5. **10 stale issues** (#8, #9, #12, #13, #14, #63, #64, #66, #84, #170) flagged with stale comments — all P3-low or P4-future enhancements, appropriate to remain open in backlog.
