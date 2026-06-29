# Weekly Maintenance — 2026-06-29

## Issue and Repository Hygiene
- [x] Reviewed all 18 open issues
- [x] Confirmed 8 stale issues (30+ days) — all P3-low/P4-future backlog, no action needed
- [x] Linked related issues: #84 ↔ #170 (recipe document upload overlap)
- [x] 15 FTUE issues closed since last update (#232–#248)
- [x] Removed 8 stale/closed issues from ISSUE_PRIORITIES.md (#142, #83, #45, #43, #42, #41, #171, #18)
- [x] Updated ISSUE_PRIORITIES.md to reflect current GitHub state

## Security Updates
- [x] Backend: 9 vulnerabilities → 2 low after `npm audit fix`
  - Fixed: dompurify (8 CVEs), form-data, multer (2 CVEs), undici (7 CVEs), ws
  - Remaining: cookie/csurf (low, archived package — needs replacement)
- [x] Frontend: 5 vulnerabilities → 1 low after `npm audit fix`
  - Fixed: form-data, vite (2 CVEs), ws
  - Remaining: esbuild (low, dev-only, needs breaking change)
- [x] Filed #253 with full audit writeup

## Code Quality
- [x] Frontend TypeScript: ✅ compiles cleanly
- [x] Frontend lint: 4 errors (3 `no-explicit-any` in test, 1 empty block), 7 warnings (useEffect deps)
- [x] Backend TypeScript: ❌ ~109 errors (pre-existing on main)
- [x] Backend lint: 1 error (unused import in test), 132 warnings (mostly `no-explicit-any`)
- [x] Filed #252 for backend TS build failure

## New Issues Filed
- #252 — Backend TypeScript build fails with ~109 type errors (P1-high)
- #253 — Security audit: 14 high vulns fixed, 3 low remain (P2-medium)

## Database Maintenance
- [ ] Skipped (no Pi/container access from this environment)

## Notes
- Public Launch milestone due 2026-06-30 (tomorrow). Two P0 issues remain (#246 mobile swipe, #231 Tracy walkthrough).
- Branch `feat/ftue-cleanup-251` has uncommitted `npm audit fix` changes in both package-lock.json files.
- Prisma `metrics` preview feature is deprecated — will be removed in a future Prisma version.
