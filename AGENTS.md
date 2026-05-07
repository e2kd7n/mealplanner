# AGENTS.md

This file provides guidance to agents when working with code in this repository.

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

### Priority System
- **P0-critical**: Drop everything - app down, data loss, security issues
- **P1-high**: Current sprint (1-2 weeks) - core features broken
- **P2-medium**: Next sprint (2-4 weeks) - feature improvements
- **P3-low**: Backlog - minor UX improvements
- **P4-future**: Long-term planning

### Issue Workflow
- All issues tracked in GitHub Issues with priority labels
- Reference issues in commits: `Fixes #123: Description`
- Close issues via commit keywords: Fixes, Closes, Resolves
- Weekly maintenance: review open issues, close completed, update priorities
- Update ISSUE_PRIORITIES.md via `./scripts/update-issue-priorities.sh`

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

### Database (Critical)
- Run backup: `./scripts/pre-migration-backup.sh`
- Verify backup integrity
- Delete backups older than 30 days (keep at least 4)
- Check database health and sizes

### Dependencies
- Check for updates: `npm outdated` in frontend and backend
- Apply critical security updates immediately
- Schedule non-critical updates for next cycle

### Cleanup
- Remove old test artifacts (>7 days)
- Archive logs older than 30 days
- Prune client logs if >10,000 entries
- Clean Docker/Podman images

### Monitoring
- Review error logs
- Check performance metrics
- Verify all services running
- Create issues for recurring errors

## Documentation Organization

### Key Documents
- `README.md` - Project overview and quick start
- `SETUP.md` - Development environment setup
- `DEPLOYMENT.md` - Production deployment guide
- `ISSUE_PRIORITIES.md` - Current issue priorities
- `docs/ARCHITECTURE.md` - System architecture
- `docs/DESIGN_PRINCIPLES.md` - UX/UI design principles
- `/Users/erik/dev/workflow-guidelines.md` - Comprehensive workflow guide
- `docs/releases/maintenance/WEEKLY_MAINTENANCE_CHECKLIST.md` - Maintenance procedures

### Documentation Standards
- Keep docs in sync with code changes
- Update screenshots when UI changes
- Verify setup instructions still work
- Document all architectural decisions