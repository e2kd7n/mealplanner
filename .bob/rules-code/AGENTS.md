# Code Mode - Project-Specific Rules

## Critical Non-Obvious Patterns

### Database Operations
- **MUST use `withRetry()` wrapper** from `backend/src/utils/prisma.ts` for all Prisma operations
- Prisma uses `relationMode = "prisma"` (not foreign keys) - manual referential integrity required
- Never use `prisma migrate` directly - always use `./scripts/safe-migrate.sh`

### Secret Management
- **NEVER use `process.env` directly** for secrets
- Always use `getSecret()` or `getSecretCached()` from `backend/src/utils/secrets.ts`
- Secrets loaded from `/run/secrets/` or validated file paths only

### Validation & Schemas
- All request validation uses Zod schemas from `backend/src/validation/schemas.ts`
- UUIDs validated with `.uuid()` - never use `.string()` for IDs
- Emails auto-lowercased with `.toLowerCase()` in schemas
- Cleanup score must be 0-10 range (validated in `backend/src/utils/cleanupScore.ts`)

### Caching
- Use `cacheGet/cacheSet/cacheDel` from `backend/src/utils/cache.ts` (not direct NodeCache)
- Cache MUST be initialized with `initializeCache()` before use
- Default TTL is 600 seconds
- `cacheDelPattern()` supports Redis-style patterns

### Logging
- Backend: Winston logger at `backend/src/utils/logger.ts`
- Frontend: Custom batched logger at `frontend/src/utils/logger.ts` (auto-sanitizes sensitive fields)
- Never log passwords, tokens, secrets, or apiKeys manually

### Prisma Schema Gotchas
- `instructions` field is JSON (array of strings) - not text
- `mealTypes` is array enum - use `z.array(z.enum([...]))` in validation
- GIN trigram indexes on title/description - don't use LIKE queries
- `cleanupScore` is nullable Int (0-10)

### Build System
- Frontend uses Vite with **esbuild minifier** (not rolldown) for ARM/Pi compatibility
- Don't modify chunk splitting in `frontend/vite.config.ts` without testing Pi build
- Backend uses `tsc` with `commonjs` modules (not ESM)

### Testing
- E2E tests use Playwright with session reuse - auth state in `e2e/.auth/user.json`
- Tests run sequentially (`workers: 1`) to avoid rate limiting
- Run single test: `cd frontend && pnpm test:e2e -- tests/path/to/test.spec.ts`

### Code Quality
- All files MUST have copyright header: `/** Copyright (c) 2026 e2kd7n. All rights reserved. */`
- Files end with `// Made with Bob` comment
- TypeScript strict mode enabled
- No unused locals or parameters

### Tool Restrictions
- No access to MCP tools
- No access to Browser tools
- Use standard file operations and command execution only