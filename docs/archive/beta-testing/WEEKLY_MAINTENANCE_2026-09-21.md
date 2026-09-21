## Weekly Maintenance - 2026-09-21

**Run by:** Cloud maintenance routine (Claude Sonnet 4.6)
**Session:** https://claude.ai/code/session_01HukLW3HapiZG7ThYyzrqEM

---

### Issue and Repository Hygiene

- [x] Reviewed all 21 open issues
- [x] Closed completed issues: #419 (multer fixed), #399 (ws fixed)
- [x] No stale issues found (all issues updated within 28 days; last stale pass was 2026-09-07)
- [x] **Pi-side script note:** `scripts/weekly-repo-hygiene.sh` handles duplicate detection, label
  auto-add, and ISSUE_PRIORITIES.md regeneration. `update-issue-priorities.sh` run is Pi-side; not
  rerun here since no issues were opened or closed in the last 7 days besides the two this run closes.

**Issues closed this run:**
- **#419** — `security: backend HIGH vulns in multer <=2.2.0 (4 advisories)` — CLOSED: resolved by
  multer 2.2.0→2.4.0 upgrade in commit 1444f6b.
- **#399** — `security: 2 remaining ws vulns via socket.io-adapter transitive dep` — CLOSED:
  resolved by the Aug-31 security commit `57231f5` which added a `pnpm-workspace.yaml` override
  bumping ws to >=8.21.0. Confirmed clean in today's `pnpm audit` (no ws advisories in output).

**Issues confirmed still open/in-progress:**
- **#417** — prisma deepmerge-ts/mysql2 HIGH vulns — 2 remaining (mysql2 high+moderate, confirmed
  by today's audit). Still requires breaking Prisma upgrade; tracked and intentionally deferred.
- **#416** — verify maintenance-log pruning — Pi-side action; 21 days since filed, no Pi cron log
  visible from here.
- **#406** — grocery list 404 route mismatch — pre-existing bug, still open.

**No "appears resolved but open" candidates flagged by Pi hygiene script** visible in maintenance
logs (no access to Pi cron logs from cloud environment).

---

### Database Maintenance

- [x] **Backup:** SKIPPED — no live container access in remote cloud environment.
- [x] **Backup script DB name verified:** `scripts/backup-database.sh` correctly references
  `POSTGRES_DB="${POSTGRES_DB:-meal_planner}"` ✓

---

### Security Updates

- [x] `pnpm audit` run in `backend/` and `frontend/`
- [x] `pnpm audit --fix update` applied (non-breaking, no `--force`)
- [x] Changes committed as `fix(deps): pnpm audit fix — weekly maintenance 2026-09-21` (1444f6b)
- [x] Both builds verified passing after fixes

**Backend audit results (before fix):** 14 vulnerabilities (1 low, 5 moderate, 8 high)
**Backend audit results (after fix):** 2 vulnerabilities (1 moderate, 1 high)

Fixes applied:
| Package | From | To | Severity | Advisories |
|---|---|---|---|---|
| multer | 2.2.0 | 2.4.0 | HIGH (×3) + LOW (×1) | GHSA-wc9g-mqfw-jrwm, GHSA-qfvm-cv95-jqjf, GHSA-535w-7cp7-47q4, GHSA-qvfw-j98x-7q72 |
| fast-uri | various | resolved | HIGH (×4) | GHSA-5jgf-p345-68v8, GHSA-f65p-4m7j-42xc, GHSA-fph4-wmhf-6fwf, GHSA-jqff-g426-hqxp |
| qs | various | resolved | moderate (×2) | GHSA-x5fp-wj9c-mxmx, GHSA-4mjr-xmp4-gh2g |
| vitest (backend) | 4.1.10 | 4.1.11 | moderate (dev) | GHSA-82fw-gwwq-j7x9 |

**Frontend audit results (before fix):** vitest/mocker moderate (dev-only)
**Frontend audit results (after fix):** 0 vulnerabilities ✓

Fixes applied:
| Package | From | To | Severity | Advisory |
|---|---|---|---|---|
| vitest (frontend) | 4.1.9 | 4.1.11 | moderate (dev) | GHSA-82fw-gwwq-j7x9 |

**Remaining (tracked, cannot fix without breaking changes):**
- backend: mysql2 HIGH (GHSA-3f6p-5ww8-9rcr) + moderate (GHSA-rgwj-5xj2-c3m3) — tracked in #417
  (transitive via prisma; requires breaking Prisma major version upgrade)

**Secret Rotation status (from `docs/SECRET_ROTATION_STATUS.json`):**
- Last rotated: 2026-08-19
- All secrets due: 2026-11-17 (~57 days away)
- No overdue secrets ✓

**Credential-leak scan:** Not run directly (Pi-side `security-audit.sh` cron handles this). No
suspicious patterns visible in commits since last maintenance (2026-09-14).

---

### Code Quality

- [x] **Backend build:** PASS (`tsc` clean, exit 0)
- [x] **Frontend build:** PASS (`tsc -b && vite build`, exit 0; chunk size warning for react-core
  at 817KB is pre-existing and expected given Pi RAM constraints)
- [x] **Backend lint:** 276 warnings, 0 errors (all `@typescript-eslint/no-explicit-any` in
  `secureLogger.ts` — pre-existing, not regressions)
- [x] **Frontend lint:** 0 errors
- [x] **TODO/FIXME scan:** 0 found in `backend/src` or `frontend/src` ✓

---

### Database Maintenance

- [ ] DB size/growth: SKIPPED (no container access)
- [ ] Slow query logs: SKIPPED (no container access)
- [ ] Connection pool usage: SKIPPED (no container access)

---

### Performance Monitoring

- SKIPPED — requires live container access (`docker/podman stats`, log tailing).

---

### Documentation

- No documentation updates required.

---

### User Feedback

- Pi-side `feedback-log-triage.sh` cron handles automated triage (runs 45m after secret rotation
  on Sundays). No access to `data/maintenance-logs/feedback-triage-status.txt` from cloud
  environment.

---

### Notes

- This run is a week later than usual (last was 2026-09-14). No critical gaps.
- **fast-uri** HIGH vulnerabilities (4 advisories) were resolved by this run's `pnpm audit --fix
  update`. They were not yet tracked as a GitHub issue because the Pi-side `security-audit.sh` cron
  (which would normally file/update the rolling tracker) may not have fired since 2026-09-14.
  Fixed this run — no issue needed.
- The cloud routine's `npm audit fix` in prior runs (2026-09-07, 2026-09-14) only updated
  `package-lock.json`, not `pnpm-lock.yaml`. Today's run uses `pnpm audit --fix update` which
  updates the pnpm lockfile directly. This is why qs moderate re-appeared in today's pre-fix audit
  despite being "fixed" in the 2026-09-07 maintenance run.
- Issue #418 (`clusterctrl not found` PATH fix) was confirmed closed via commit `4e546ff` on
  2026-09-13.
