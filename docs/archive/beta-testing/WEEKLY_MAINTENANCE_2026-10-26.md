# Weekly Maintenance — 2026-10-26

**Executed by:** Cloud maintenance routine (automated)
**Environment:** Remote cloud (no live Pi/container access)
**Session:** https://claude.ai/code/session_01TKKT6HMsb5Cmk6LoczziS2

---

## Checklist

### Issue and Repository Hygiene
- [x] Reviewed all 20 open issues
- [x] Closed completed issues: #422
- [x] Stale issues: multiple P3-low/P4-future issues (30–63 days). Pi's `weekly-repo-hygiene.sh` handles automated stale-comment flagging; no new judgment-closures warranted this week
- [x] ISSUE_PRIORITIES.md regenerated via `scripts/update-issue-priorities.sh`
- [ ] Pi-flagged "appears resolved" candidates: could not read — `data/maintenance-logs/` is on the Pi only

**Issue details:**

| # | Title | Action |
|---|-------|--------|
| #422 | security: HIGH vuln in braces via nodemon | **Closed** — `braces` (GHSA-vfj7-8cjw-p6xm) no longer appears in `npm audit` after `audit fix`; patched version resolved without breaking nodemon |
| #421 | fix(frontend): 18 lint errors | Still open — 18 ESLint errors confirmed this run |
| #406 | Grocery list generation likely 404s | Still open — no fixing commit found in recent history |
| #416 | Verify maintenance-script logs pruned | Still open — Pi-side question, no recent activity |
| #307, #261, #200, #170, #116, #84, #66, #64, #63, #20, #19, #14, #13, #12, #9, #8 | P3-low / P4-future backlog | Stale (49–63 days), left open — all are long-horizon enhancements or Pi infrastructure tasks; Pi hygiene script manages staleness comments |

---

### Database Maintenance
- [ ] **SKIPPED — no container access.** Cannot run `pg_dump`, check DB size, or test backup restoration from this environment.
- [x] Backup script (`scripts/backup-database.sh`) verified: uses correct DB name `meal_planner` (`POSTGRES_DB="${POSTGRES_DB:-meal_planner}"`).

**Secret Rotation status** (from `docs/SECRET_ROTATION_STATUS.json`):
- Last rotated: 2026-08-19 (all secrets)
- All secrets due: **2026-11-17** (~22 days away)
- Status: ✅ Not overdue — Pi cron is on schedule

---

### Security Updates

**npm audit (pre-fix):**
- Backend: 11 vulnerabilities (4 moderate, 6 high, 1 critical)
  - CRITICAL: dompurify ≤3.4.16 (GHSA-cg2g-xh64-v4q7) — backend `package-lock.json` had 3.4.16 despite `package.json` specifying `^3.4.17`; fixed by `audit fix`
  - HIGH: body-parser, braces (via nodemon), follow-redirects, multer, undici, vite, zod
- Frontend: 7 vulnerabilities (3 moderate, 4 high)
  - HIGH: follow-redirects, undici, vite, zod

**Actions taken:**
- [x] `npm audit fix --legacy-peer-deps` run in `backend/` — changed 28 packages
- [x] `npm audit fix --legacy-peer-deps` run in `frontend/` — added 2 packages
- [x] Post-fix `npm audit` in backend: **0 vulnerabilities** (backend clean)
- [x] Post-fix `npm audit` in frontend: **0 vulnerabilities** (frontend clean)
- [x] `backend/package-lock.json` and `frontend/package-lock.json` updated and committed
- [x] #422 (braces/nodemon HIGH) closed — braces no longer flagged post-fix

**Note:** This repo's Pi-side automation uses `pnpm audit` (per `WEEKLY_MAINTENANCE.md` memory `feedback_audit_pnpm_not_npm`). `npm audit` results may differ from Pi's canonical findings. Pi's `scripts/security-audit.sh` maintains the rolling `auto-security-audit` tracker issue and will sync on its next Sunday run.

**Credential-leak scan** (this week's commits):
```
git log --since="7 days ago" -p -- . ':(exclude)*.lock' | grep -EnI "AKIA|-----BEGIN.*PRIVATE|SECRET|TOKEN|PASSWORD|API_KEY"
```
→ No matches found.

---

### Performance Monitoring
- [ ] **SKIPPED — no container access.** Cannot check API response times, memory usage, or container logs.

---

### Code Quality

**Backend build (`npm run build` / `tsc`):** ✅ Clean — 0 errors

**Frontend build (`npm run build` / `tsc -b && vite build`):** ✅ Clean — 0 errors
- ⚠️ One build warning: `mui-core` chunk is 509.53 kB (over 500 kB Pi limit). This is a known pre-existing issue; chunk splitting for MUI core is already complex.

**Backend lint:** ✅ 0 errors, 316 warnings (all `@typescript-eslint/no-explicit-any` — pre-existing, non-blocking)

**Frontend lint:** ❌ 25 problems (18 errors, 7 warnings) — tracked in **#421**
- Errors: react-hooks violations, `setState` in effect, unused vars
- No change from last week — #421 remains open

**TODO/FIXME scan:**
```
grep -r "TODO\|FIXME" backend/src frontend/src
```
→ 0 matches found.

---

### Documentation
- [x] `ISSUE_PRIORITIES.md` regenerated
- [ ] No other documentation changes needed this week

---

### User Feedback
- [ ] **SKIPPED — no container/DB access.** Pi's `scripts/feedback-log-triage.sh` handles automated triage; check `data/maintenance-logs/feedback-triage-status.txt` on the Pi for latest run status.

---

### Worktree Hygiene
- [ ] **SKIPPED — local-only.** Handled by local Windows Scheduled Task via `scripts/prune-worktrees.sh`.

---

## Summary

| Category | Status |
|----------|--------|
| Issue hygiene | ✅ #422 closed; ISSUE_PRIORITIES.md updated |
| DB backup | ⏭️ Skipped (no container access) |
| Backup script DB name | ✅ Correct (`meal_planner`) |
| Secret rotation check | ✅ Not overdue (due 2026-11-17) |
| npm audit | ✅ Both clean after `audit fix` |
| Backend build | ✅ Clean |
| Frontend build | ✅ Clean (1 chunk size warning) |
| Backend lint | ✅ 0 errors |
| Frontend lint | ❌ 18 errors — tracked #421 |
| TODO/FIXME | ✅ 0 found |

## Open Issues Requiring Attention
- **#421** (P2): Frontend lint errors — 18 react-hooks/unused-vars violations blocking a clean lint pass
- **#406** (no priority label): Grocery list generation 404s — core UX flow broken, needs triage/priority label

## Commits This Run
- `fix(deps): npm audit fix — weekly maintenance` (lockfile updates)
- `chore(maintenance): weekly maintenance 2026-10-26` (ISSUE_PRIORITIES.md + this report)
