# Weekly Maintenance — 2026-07-28

Note: no report was filed for the ~4 weeks between 2026-06-29 and this run. This maintenance
run also included, for the first time, a live SSH check of the actual running Pi/ClusterHAT
infrastructure and its logs, not just repo/CI state — that's what turned up the most severe
finding (#281).

## Issue and Repository Hygiene
- [x] Reviewed all 16 open issues + 8 open PRs
- [x] Confirmed 6 P0/P1 issues from the last report (#252, #251, #246, #231, #230, #209) were
      closed 2026-07-01/07-02, shortly after the last report — carried forward untracked since
      no report was filed in between
- [x] Found and reopened #210 (csurf replacement) — falsely auto-closed 2026-05-26 by an
      automation referencing an unrelated commit; `csurf@1.11.0` is still a direct dependency
      today and still trips the same low-severity CVE. Worth someone spot-checking whether the
      auto-close bot has produced other false positives — it appears to close on a loose
      "appears resolved" heuristic rather than verifying the commit actually addresses the issue.
- [x] Closed #253 (last week's security audit) — its numbers were based on `npm audit` against
      a lockfile nothing actually uses; superseded by #285 below.
- [x] Flagged #261 as unlabeled/untriaged (no priority label)
- [x] Updated ISSUE_PRIORITIES.md to reflect current GitHub state

## CI Investigation

All 8 open PRs (4 dependency-upgrade branches open since 2026-07-02, 4 Dependabot PRs since
2026-07-20/27) show at least one red CI check. Root-caused two distinct, real bugs on `main`
itself (not artifacts of any individual PR):

- **#282** — `backend/prisma/seed.ts` still imports the removed `bcrypt` package (PR #262
  switched everything else to `bcryptjs` on 2026-07-01 but missed this file). Breaks the
  `e2e-tests` workflow's database-seed step via a TypeScript compile error, on every push/PR
  since 2026-07-01.
- **#283** — Dependabot PRs touching `backend/` fail `pnpm install --frozen-lockfile` with
  `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`. Confirmed this is *not* a `main`-branch problem (`main`
  installs cleanly) — it's specific to how Dependabot regenerates `backend/pnpm-lock.yaml`,
  which doesn't reconcile the `pnpm.overrides` block in `package.json`.

Note: initially suspected a frontend ESLint rule regression (`eslint-plugin-react-hooks@7.0.1`)
and a broader lockfile drift as additional causes — both turned out to be artifacts of testing
with plain `npm install` in a project whose CI/deployment is pnpm-only. Verified against actual
CI run logs and a clean `pnpm install --frozen-lockfile` on `main` before ruling them out.

Once #282 lands, most of the 8 PRs should go substantially greener; the four dependency-upgrade
branches (#266/#267/#268/#269, all open since 2026-07-02) likely just need a rebase afterward.

## Security Updates

Corrected a real reporting gap this run — see **#285**. Past audits (including 2026-06-29's)
ran `npm audit` against `backend/package-lock.json` / `frontend/package-lock.json`, but this
repo's CI and deployment install exclusively via `pnpm` against `pnpm-lock.yaml`. The two
lockfiles have diverged, and `npm audit` was substantially undercounting real exposure:

- **Backend:** `pnpm audit` found **27 vulnerabilities (9 high, 10 moderate, 8 low)** vs. the
  6 `npm audit` reported. Ran `pnpm audit --fix=update` (semver-compatible only) →
  **4 remain** (`ws` high+moderate via `socket.io`, `qs` moderate, `cookie` low via `csurf`/#210).
  Verified `tsc --noEmit` and lint still pass clean afterward.
- **Frontend:** `pnpm audit` found **6 vulnerabilities (4 high, 1 moderate, 1 low)**. Fixed
  down to **3 remain** (`ws` high+moderate via `socket.io-client`, `react-router` high —
  RSC Mode CSRF bypass, GHSA-qwww-vcr4-c8h2, needs a breaking downgrade/forward-fix, not
  auto-applied). Verified build still passes.
- Filed #285 with the full writeup and recommendation to audit via `pnpm` going forward.

## Code Quality

- [x] Backend: `pnpm exec tsc --noEmit` clean, `pnpm run lint` clean (0 errors, 261 warnings,
      all `@typescript-eslint/no-explicit-any`) — **matching what CI actually runs.**
- [x] Frontend: `pnpm run build` clean, `pnpm run lint` clean (0 errors, 7 warnings)
- [x] Filed #284 — plain `npm install && npm run build` (the workflow CLAUDE.md documents)
      is currently broken on a fresh clone: npm blocks `@prisma/client`'s postinstall script,
      so the generated Prisma Client goes stale and ~19 TS errors appear across
      `auth.ts`, `visualAuth.controller.ts`, `appSettings.service.ts`. `pnpm` has an
      `onlyBuiltDependencies` allowlist that avoids this, which is why CI never caught it.
      Likely the same underlying gap that caused the ~109-error failure fixed in #252.

## Server Log Examination (Pi 4B + ClusterHAT, via SSH — new this run)

- **Pi 4B containers** (`meals-postgres`, `meals-redis`, `meals-backend`, `meals-nginx`): all
  healthy, up 4 days, **zero errors/warnings in 7 days of logs**.
- **nginx access log: 0 requests recorded** in its entire 4-day container uptime — only
  `/health` checks reach the Pi 4B backend directly (bypassing nginx). Not filed as a bug, but
  worth the user confirming real traffic is actually reaching the app.
- **Zero W ClusterHAT cluster: all 4 nodes crash-looping**, ~76,000 restarts on 3 of 4 nodes
  over their ~27-day uptime (≈ a crash every 30 seconds, continuously). Root cause: Prisma
  Client on the Zero Ws was generated for `linux-musl-arm64-openssl-3.0.x` instead of the
  actual `linux-arm-openssl-3.0.x` (32-bit ARMv6) they run — `backend/prisma/schema.prisma`'s
  `binaryTargets` is missing the correct target. **Filed as #281 (P0)** — this means the
  cluster has likely never served a real request since the 2026-07-01 deployment; all traffic
  has silently gone through nginx's Pi-4B-local fallback instead. Previous status ("all 4
  nodes active on boot") was based on a transient `systemctl is-active` read during the
  restart loop, not sustained health — memory corrected.
- Pi 4B memory: 119Mi free / 902Mi available of 1.8Gi (expected, within known constraints).
  Two unrelated containers (`ride-optimizer`, `jewel-coupon-clipper`) share the same box —
  not a mealplanner issue, just a capacity note.
- **nginx resolver is still hardcoded to Docker's `127.0.0.11`**, confirmed live via
  `podman exec meals-nginx cat /etc/resolv.conf` showing the real Podman aardvark-dns address
  is `10.89.1.1`. A fix for this (commit `4dcd96a`) exists but only on an orphaned local branch
  that never reached `main`. **Filed as #286 (P1)** — this specifically breaks the
  `@backend_local` fallback path's DNS re-resolution, and that fallback is *currently the only
  thing serving traffic* given #281, so this compounds into a real risk of a full outage on
  the next nginx reload or backend container recreation.

## New Issues Filed
- #281 — **P0** — Zero W cluster crash-looping on wrong Prisma binary target
- #286 — **P1** — nginx resolver hardcoded to Docker's address instead of Podman's, breaking the fallback path #281 now depends on entirely
- #282 — **P1** — `seed.ts` bcrypt import breaks e2e DB seeding
- #283 — **P2** — Dependabot backend PRs fail on pnpm lockfile mismatch
- #284 — **P2** — `npm install` workflow broken on backend (Prisma postinstall blocked)
- #285 — **P2** — Corrected security audit (pnpm vs npm lockfile gap)
- #210 — reopened — csurf replacement never actually happened

## Database Maintenance
- [ ] Skipped (no direct Postgres access from this environment beyond container health/logs,
      which were clean)

## Notes
- No active milestone — Public Launch closed 2026-06-30 with all 56 issues resolved. Nothing
  has been assigned to a new milestone yet.
- Recommend prioritizing #281 and #286 together first (the cluster is down and its only
  fallback has a latent DNS bug), then #282 (unblocks e2e CI), then the PR backlog.
- `mui-core` bundle chunk is currently 493-501KB against the CI's 512KB warning threshold
  (not a failure) — worth a rebuild check once the pending MUI 9 upgrade (#269) merges, since
  that's likely to push it over.
