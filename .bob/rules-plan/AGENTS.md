# Plan Mode - Project-Specific Architecture & Planning Context

## Non-Obvious Architectural Constraints

### Database Architecture
- Prisma uses `relationMode = "prisma"` not foreign keys - plan for manual referential integrity
- Connection pooling configured via DATABASE_URL query parameters (connection_limit, pool_timeout)
- GIN trigram indexes on title/description - plan fuzzy search, not LIKE queries
- Database migrations MUST use `./scripts/safe-migrate.sh` - automatic backups required

### Deployment Architecture
- **Two distinct modes**: Local dev (port 5173) vs Container (port 8080)
- Scripts handle mode-specific setup - don't plan manual service management
- Frontend uses esbuild (not rolldown) for ARM/Pi compatibility - constraint for build planning
- Manual chunk splitting in `frontend/vite.config.ts` - test on Pi before modifying

### Secret Management Architecture
- Secrets loaded from `/run/secrets/` or validated file paths only
- Path traversal protection enforced - plan for Docker secrets or validated paths
- Secret validation includes entropy checks - plan for strong secret generation
- `getDatabaseUrl()` constructs connection string - don't plan manual construction

### Caching Architecture
- In-memory cache (node-cache) with 600 second default TTL
- Cache MUST be initialized before use - plan initialization in startup
- `cacheDelPattern()` supports Redis-style patterns - plan pattern-based invalidation
- No distributed cache - single-instance constraint

### Logging Architecture
- Backend: Winston to `/mealplanner/logs` (production) or `./logs` (dev)
- Frontend: Batched logger, production-only, auto-sanitizes sensitive fields
- Frontend uses `navigator.sendBeacon` for non-blocking transmission
- Error throttling: 5 second cooldown, max 50 errors per session

### Testing Architecture
- E2E tests use session reuse - auth state in `e2e/.auth/user.json`
- Tests run sequentially (`workers: 1`) - plan for rate limiting constraints
- Auth tests run WITHOUT saved session - plan separate test categories
- Configurable auth delay via AUTH_DELAY_MS - plan for timing adjustments

### Build System Constraints
- Frontend: Vite + esbuild (ARM/Pi compatibility requirement)
- Backend: tsc + commonjs (not ESM)
- Build target ES2015 for browser compatibility
- Manual chunk splitting configured - plan around existing splits

### Data Model Constraints
- `instructions` field is JSON array, not text - plan for array handling
- `mealTypes` is array enum - plan for array validation
- `cleanupScore` is nullable Int (0-10) - plan range validation
- No foreign keys - plan manual referential integrity checks

### Performance Constraints
- Raspberry Pi 4+ target - plan for modest hardware
- Image caching implemented - plan around existing cache
- Pagination on recipe lists - plan for paginated queries
- No service worker yet - plan offline support separately

### Security Architecture
- JWT-based authentication with refresh tokens
- CSRF protection on state-changing operations
- Input validation via Zod schemas - plan schema-first validation
- Rate limiting on sensitive endpoints - plan rate limit strategy

### Issue Management Architecture
- Priority system: P0 (critical) → P4 (future)
- Weekly maintenance required - plan for maintenance windows
- Issue priorities tracked in `ISSUE_PRIORITIES.md` - plan updates
- Auto-close via commit keywords (Fixes, Closes, Resolves)

### Design Principles Constraints
- User CRUD Authority required - plan full CRUD for user data
- Accessibility first (WCAG AA) - plan semantic HTML and ARIA
- Error prevention over recovery - plan confirmation dialogs
- Mobile-first responsive - plan touch targets 44x44px minimum

### Workflow Constraints
- Plan mode required for 3+ steps or architectural decisions
- Parallel tasks encouraged for research and exploration
- Never mark complete without testing - plan verification steps
- Autonomous problem solving expected - plan self-contained solutions