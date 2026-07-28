# AGENTS.md

This file provides guidance to agents when working with code in this repository.

Please also refer to CLAUDE.md for direction. In the event of a conflict, explain the
conundrum and ask the user how to proceed.

## Security & Privacy Guardrails (MANDATORY)

Adapted from a coordinate/PII leak incident on the sibling `ride-optimizer` project
(2026-07-07, real GPS coordinates and route traces sat in a public repo for months).
No equivalent incident has happened here — apply these preventively, not reactively.

1. **Never hardcode a real secret, token, or family member's PII into a tracked file** —
   not even in a comment, example, or "temporary" debug script. Secrets go through
   `getSecret()`/`getSecretCached()` (`backend/src/utils/secrets.ts`), never `process.env`
   directly or a literal in source.
2. **Debug/one-off scripts that touch real user data** (recipes, family member info, meal
   plans) **must write output to a genuinely gitignored path** — e.g. `logs/` (fully
   ignored) or a `*.tmp`/`*.temp`-suffixed file. Note `.gitignore` only ignores specific
   existing `data/` subdirectories (`data/uploads/`, `data/backups/`, `data/images/`,
   `data/feedback-exports/`, `data/maintenance-logs/`) — a bare `data/<new-path>` is
   **not** ignored and will get `git add`ed. Never write to a path that will be committed.
3. **Security scaffolding must be verified as actually enforced, not just present.** If you
   wire up CSRF protection, `authenticate`/`requireAdmin` middleware, or a rate limiter,
   confirm it actually fires on the route you think it protects — don't assume the
   presence of the middleware/import means the protection is active.
4. **Never log a generated secret/key value itself.** When `generate-secrets.sh` or similar
   logs "generated a new secret," log the file path to retrieve it from, never the value.
5. **Any server-side fetch of a user-supplied URL needs SSRF hardening checked at fetch
   time, not just when the URL is first saved** — DNS can rebind between save and use.
   Applies to `recipeImport.service.ts` and `image.controller.ts`'s `proxyImage`
   (`GET /api/images/proxy?url=...`) — the two endpoints that fetch a caller-supplied URL.
   `spoonacular.service.ts` only calls a hardcoded API base URL, not user input, so it's
   out of scope for this rule.
6. **Before marking any task complete that touched config, logging, caching, or
   URL-fetching code, ask: "would this diff be safe if the repo is public?"** — this repo
   is public on GitHub.

## Workflow & Task Management

### Parallel Operations
- **Use parallel tasks liberally** - spawn new task instances for research, exploration, and independent work
- Multiple agents can work simultaneously on different aspects of complex problems
- Offload research and analysis to separate task instances to keep main context clean
- One focused objective per task for clear execution

### Planning & Execution
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Plans should be broken into sprintly phases of work
- Never mark complete without testing to prove it works

### Autonomous Problem Solving
- When given a bug report: just fix it - don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

### Post-Completion Checklist (MANDATORY)
After marking any task complete:
- [ ] Tests passing (e2e where applicable — see Testing section)
- [ ] No real secrets/PII in the diff (see Security & Privacy Guardrails above)
- [ ] Related GitHub issue(s) closed with a detailed comment (see Issue Closure Protocol)
- [ ] ISSUE_PRIORITIES.md updated if issue state changed
- [ ] Epic/parent issue checked for full closure, if applicable
- [ ] Changes committed with proper message format

## Critical Non-Obvious Patterns

### Database Operations
- **MUST use `withRetry()` wrapper** from `backend/src/utils/prisma.ts` for all Prisma operations - handles transient connection errors with exponential backoff
- Prisma uses `relationMode = "prisma"` (not foreign keys) - manual referential integrity required
- Database migrations MUST use `./scripts/safe-migrate.sh` (never `prisma migrate` directly) - creates automatic backups
- Connection pooling configured via DATABASE_URL query parameters (connection_limit, pool_timeout)

### Secret Management
- **NEVER use `process.env` directly** for secrets - use `getSecret()` or `getSecretCached()` from `backend/src/utils/secrets.ts`
- Secrets loaded from `/run/secrets/` (Docker) or validated file paths only - path traversal protection enforced
- `getDatabaseUrl()` constructs connection string from secrets - don't build manually
- Secret validation includes entropy checks and weak pattern detection

### Logging System
- Backend: Winston logger at `backend/src/utils/logger.ts` - logs to `/mealplanner/logs` in production, `./logs` in dev
- Frontend: Custom batched logger at `frontend/src/utils/logger.ts` - only enabled in production, batches to `/api/logs/client`
- **Frontend logger auto-sanitizes** sensitive fields (password, token, secret, apiKey) - don't log these manually
- Frontend uses `navigator.sendBeacon` for non-blocking log transmission
- Error throttling: 5 second cooldown, max 50 errors per session

### Caching
- Use `cacheGet/cacheSet/cacheDel` from `backend/src/utils/cache.ts` (not direct NodeCache access)
- Cache MUST be initialized with `initializeCache()` before use
- Default TTL is 600 seconds (10 minutes)
- `cacheDelPattern()` supports Redis-style patterns (* and ?)

### Validation
- All request validation uses Zod schemas from `backend/src/validation/schemas.ts`
- UUIDs validated with `.uuid()` - don't use `.string()` for IDs
- Emails auto-lowercased with `.toLowerCase()` in schemas
- Cleanup score validated 0-10 range in `backend/src/utils/cleanupScore.ts`

### Testing
- E2E tests use Playwright with **session reuse** - auth state saved in `e2e/.auth/user.json`
- Tests run sequentially (`workers: 1`) to avoid rate limiting
- Auth tests run WITHOUT saved session, authenticated tests use saved session
- Run single test: `cd frontend && pnpm test:e2e -- tests/path/to/test.spec.ts`
- Configurable auth delay via AUTH_DELAY_MS environment variable

### Build System
- Frontend uses Vite with **esbuild minifier** (not rolldown) for ARM/Pi compatibility
- Manual chunk splitting configured in `frontend/vite.config.ts` - don't modify without testing Pi build
- Backend uses `tsc` with `commonjs` modules (not ESM)
- Build target ES2015 for better browser compatibility

### Deployment Modes
- **Two distinct modes**: Local dev (port 5173) vs Container (port 8080)
- Use `./scripts/menu.sh` to check current mode and switch
- Scripts handle mode-specific setup - don't run services manually
- Never assume which mode is running - always check first

### Project-Specific Utilities
- `backend/src/utils/cleanupScore.ts` - validates cleanup score (0-10 scale)
- `backend/src/utils/sanitize.ts` - DOMPurify wrapper for user input
- `frontend/src/utils/errorHandler.ts` - centralized error handling with retry logic
- `frontend/src/utils/performanceMonitor.ts` - tracks component render times

### Prisma Schema Gotchas
- `instructions` field is JSON (array of strings) - not text
- `mealTypes` is array enum - use `z.array(z.enum([...]))` in validation
- GIN trigram indexes on title/description for fuzzy search - don't use LIKE queries
- `cleanupScore` is nullable Int (0-10) - validate range in schemas

## Issue Management

### Priority System (Milestone-Aware)
**Priority is within a milestone.** A P1 issue in the active milestone (e.g. "Public
Launch") takes precedence over a P0 issue in a future milestone — finish the active
milestone's priorities before starting future-milestone work, regardless of label.
Milestones are named (`Beta Launch`, `Public Launch`, `v1.1`), not strictly semver.

**Work Order Priority:**
1. **Active Milestone P0** - Drop everything
2. **Active Milestone P1** - Current focus
3. **Active Milestone P2** - Next up within the milestone
4. **Active Milestone P3** - Backlog for this milestone
5. **Future Milestone P0** - Plan for future critical work
6. **Future Milestone P1+** - Long-term planning

**Priority Definitions (within a milestone):**
- **P0-critical**: Drop everything - app down, data loss, security issues
- **P1-high**: Must complete before the milestone ships - core features broken
- **P2-medium**: Should complete for the milestone - feature improvements
- **P3-low**: Can defer to next milestone - minor UX improvements
- **P4-future**: Explicitly deferred to later milestones - long-term planning

### GitHub Labels Cache
Use `.bob/github_labels.md` for available labels - refreshed during weekly maintenance.
**Do NOT query GitHub for labels ad hoc** - use the cache to avoid failed issue creation
from typos or stale label names.

### Issue Workflow
- All issues tracked in GitHub Issues with priority labels
- Reference issues in commits: `Fixes #123: Description`
- Close issues via commit keywords: Fixes, Closes, Resolves
- Weekly maintenance: review open issues, close completed, update priorities
- Update ISSUE_PRIORITIES.md via `./scripts/update-issue-priorities.sh`

### Issue Closure Protocol
After completing and testing any work tied to an issue:
1. Close it immediately — don't wait for weekly maintenance
2. Use a detailed closure comment with commit reference and acceptance-criteria checklist:
   ```
   Completed in commit [hash] - [title]

   ✅ [Acceptance criterion 1]
   ✅ [Acceptance criterion 2]

   Files modified: [list]
   ```
3. For issues with sub-issues (e.g. an FTUE-style epic), verify all child issues are
   closed before closing the parent
4. Update ISSUE_PRIORITIES.md via `./scripts/update-issue-priorities.sh`
5. Verify closure by confirming the issue no longer appears in ISSUE_PRIORITIES.md

### Creating Issues
- Use template with Description, Type, Priority, Technical Details, Acceptance Criteria
- Add appropriate labels immediately (priority + category)
- Link related issues
- Include reproduction steps for bugs

## Design Principles

### User CRUD Authority
- Users must have full Create, Read, Update, Delete control over their data
- Delete actions require confirmation
- All user-created content must have visible CRUD operations

### Consistency & Predictability
- Similar actions work the same way throughout app
- Consistent button placement and color scheme
- Standard confirmation patterns for destructive actions

### Accessibility First
- Semantic HTML structure required
- ARIA labels for interactive elements
- Keyboard navigation support mandatory
- WCAG AA minimum color contrast

### Error Prevention & Recovery
- Validation before submission
- Confirmation dialogs for destructive actions
- Clear error messages with actionable guidance
- No undo for deletions yet (known gap)

## Code Quality Standards

### Copyright & Attribution
- All source files MUST have copyright header: `/** Copyright (c) 2026 e2kd7n. All rights reserved. */`
- Files end with `// Made with Bob` comment

### Commit Messages
- Format: `<type>: <subject>` with optional body and footer
- Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build
- Always reference issue numbers: `Fixes #123`

### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- No unused locals or parameters
- Explicit return types preferred

## Weekly Maintenance Tasks

### Quick Start (Parallel Execution)
**⚡ Speed up maintenance by 40% using background tasks:**
```bash
# Start long-running issue check in background
./scripts/maintenance-issue-check.sh --background

# Continue with other maintenance tasks
# Check status anytime: ./scripts/maintenance-check-status.sh
```

### Database (Critical)
- Run backup: `./scripts/pre-migration-backup.sh`
- Verify backup integrity
- Delete backups older than 30 days (keep at least 4)
- Check database health and sizes

### Issue Management (Can Run in Background)
- **Background mode:** `./scripts/maintenance-issue-check.sh --background`
- **Check status:** `./scripts/maintenance-check-status.sh`
- **View results:** `./scripts/maintenance-check-status.sh --summary`
- Manual mode: `./scripts/update-issue-priorities.sh`
- Review and close completed issues
- Triage unprioritized issues
- Update ISSUE_PRIORITIES.md

### Dependencies
- Check for updates: `npm outdated` in frontend and backend
- Apply critical security updates immediately
- Schedule non-critical updates for next cycle

### Cleanup
- Remove old test artifacts (>7 days)
- Archive logs older than 30 days
- Prune client logs if >10,000 entries
- Clean Docker/Podman images
- Clean maintenance logs: `find data/maintenance-logs -name "*.log" -mtime +30 -delete`

### Monitoring
- Review error logs
- Check performance metrics
- Verify all services running
- Create issues for recurring errors

## Documentation Organization

### Key Documents
- `README.md` - Project overview and quick start
- `docs/development/SETUP.md` - Development environment setup
- `docs/deployment/DEPLOYMENT.md` - Production deployment guide
- `ISSUE_PRIORITIES.md` - Current issue priorities
- `docs/ARCHITECTURE.md` - System architecture
- `docs/design/DESIGN_PRINCIPLES.md` - UX/UI design principles
- `plans/README.md` - Index of implementation plans, organized by milestone
- `/Users/erik/dev/workflow-guidelines.md` - Comprehensive workflow guide
- `docs/releases/maintenance/WEEKLY_MAINTENANCE_CHECKLIST.md` - Maintenance procedures

### Plans Directory Structure (MANDATORY)
All implementation plans, epics, and technical planning documents MUST be stored in
`/plans/` organized by milestone — see `plans/README.md`. Prior planning docs in this
repo were scattered ad hoc (e.g. under `docs/archive/`); `/plans/<milestone-slug>/`
replaces that with one predictable location going forward. Determine the target
milestone from `gh api repos/:owner/:repo/milestones` before creating a plan.

### Documentation Structure
- `docs/development/` - Development setup, workflow, CI/CD
- `docs/deployment/` - Deployment guides (local, Pi, production)
- `docs/design/` - Design principles, accessibility, UX guidelines
- `docs/infrastructure/` - Database, logging, monitoring, performance
- `docs/security/` - Security setup, secrets management, policies
- `docs/testing/` - Testing environment and strategies
- `docs/features/` - Feature-specific documentation
- `docs/archive/` - Historical documentation and completed work

### Documentation Standards
- Keep docs in sync with code changes
- Update screenshots when UI changes
- Verify setup instructions still work
- Document all architectural decisions

## Shared Pi Infrastructure

### Pi Health Stats File

A snapshot of the Pi's hardware, OS, containers, services, and performance is written to `/home/admin/pi-stats.txt` by cron jobs installed from the `couponclipper` project (`scripts/pi-diag.sh`). Updated daily at 3am and on every reboot (45s after boot).

Reference this file when:
- Diagnosing memory pressure or CPU spikes affecting this app
- Checking container inventory before deploying a new image
- Identifying optimization opportunities (disk usage, image sizes, running services)
- Verifying what else is running on the Pi that could compete for resources

```bash
cat ~/pi-stats.txt                          # full report
grep -A 30 "CONTAINER RUNTIME" ~/pi-stats.txt
grep -A 10 "QUICK HEALTH CHECK" ~/pi-stats.txt
```