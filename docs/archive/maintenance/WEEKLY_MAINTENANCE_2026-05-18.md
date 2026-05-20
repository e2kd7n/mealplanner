# Weekly Maintenance — 2026-05-18

**Date:** 2026-05-18  
**Overall Status:** ⚠️ Warning (moderate vulns in runtime deps)

---

## Issue Management ✅

Background task completed successfully. `ISSUE_PRIORITIES.md` regenerated.

Current open issues by priority:
- P0: None
- P1: #197 (Zero W systemd units), #194 (redis secret), #193 (frontend-dist)
- P2: 16 open
- P3: 11 open
- P4: 7 open
- Unprioritized: None

---

## Security Audit ⚠️

### Frontend — 2 moderate

| Package | Severity | Via | Fix |
|---|---|---|---|
| `ws` <8.20.1 | moderate | `socket.io-client > engine.io-client` | Update `socket.io-client` |
| `brace-expansion` <5.0.6 | moderate | `typescript-eslint > minimatch` | Dev dep, low risk |

### Backend — 4 vulnerabilities (1 low, 3 moderate)

| Package | Severity | Via | Fix |
|---|---|---|---|
| `ip-address` <=10.1.0 | moderate | `express-rate-limit` | Update `express-rate-limit` to >=8.5.2 |
| `ws` <8.20.1 | moderate | `socket.io > engine.io` | Update `socket.io` |
| `brace-expansion` <5.0.6 | moderate | `typescript-eslint > minimatch` | Dev dep, low risk |
| `cookie` <0.7.0 | low | `csurf` | `csurf` is deprecated — tracked in backlog |

**Action items:**
- Update `express-rate-limit` (8.3.1 → 8.5.2 already in "wanted" range — run `pnpm update express-rate-limit`)
- Update `socket.io` / `socket.io-client` (fixes `ws` on both sides)

---

## Dependency Updates

### Frontend — minor updates available
Notable: `@playwright/test` 1.59→1.60, `react`/`react-dom` 19.2.4→19.2.6, `vite` 8.0.9→8.0.13, `axios` 1.15→1.16

Major versions pending (schedule separately): MUI 7→9, TypeScript 5→6

### Backend — minor updates available
Notable: `express` 4.22.1→4.22.2, `express-rate-limit` 8.3.1→8.5.2, `dompurify` 3.4.1→3.4.5

Major versions pending (schedule separately): Prisma 6→7, Express 4→5, TypeScript 5→6, dotenv 16→17

---

## Disk & Data

| Directory | Size | Files |
|---|---|---|
| data/uploads | ~0 MB | 1 |
| data/backups | ~0 MB | 1 |
| data/images | ~0 MB | 1 |
| data/feedback-exports | ~0 MB | 2 |
| data/frontend-dist | not present (local dev) | — |
| data/maintenance-logs | ~0 MB | 12 |

**⚠️ Only 1 backup exists** — checklist calls for 4+ weekly backups. Production backup lives on Pi.

---

## Error Logs ✅

Backend error.log (11.6 KB): All errors are `P1001 - Can't reach database server at localhost:5432`. Expected — database not running in local dev. Last occurrence: 2026-05-17.

---

## Test Artifacts ✅

No test artifacts older than 7 days. Nothing to clean up.

---

## Recommendations for Next Week

1. Run `pnpm update express-rate-limit socket.io socket.io-client` in backend/frontend to clear runtime vulns
2. Ensure Pi backups are running — only 1 backup on record locally
3. Schedule minor dep updates (playwright, react, vite, axios, dompurify) as a batch PR
