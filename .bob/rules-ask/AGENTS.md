# Ask Mode - Project-Specific Documentation Context

## Non-Obvious Documentation Patterns

### Documentation Organization
- Main docs in `docs/` directory with subdirectories for releases, architecture, design
- Workflow guidelines at `/Users/erik/dev/workflow-guidelines.md` (external to project)
- Weekly maintenance checklists in `docs/releases/maintenance/`
- Issue priorities tracked in `ISSUE_PRIORITIES.md` at project root

### Architecture Documentation
- System architecture in `docs/ARCHITECTURE.md` - simplified 2-container setup (not 3-tier)
- Design principles in `docs/DESIGN_PRINCIPLES.md` - emphasizes CRUD authority and accessibility
- Frontend logging system documented in `docs/FRONTEND_LOGGING.md` - batched, production-only

### Hidden or Counterintuitive Patterns
- Database uses `relationMode = "prisma"` not foreign keys - manual referential integrity
- Frontend logger only runs in production (disabled in dev) - check `import.meta.env.PROD`
- Two deployment modes (local dev vs container) with different ports - use `./scripts/menu.sh` to check
- E2E tests use session reuse pattern - auth state saved in `e2e/.auth/user.json`
- Secrets management has path traversal protection - only reads from `/run/secrets/` or validated paths

### Testing Documentation
- E2E tests run sequentially (`workers: 1`) to avoid rate limiting
- Auth tests run WITHOUT saved session, authenticated tests use saved session
- Playwright config at `frontend/playwright.config.ts` has configurable auth delay

### Build & Deployment
- Frontend uses esbuild (not rolldown) for ARM/Pi compatibility
- Manual chunk splitting in `frontend/vite.config.ts` - don't modify without Pi testing
- Safe migration script at `./scripts/safe-migrate.sh` creates automatic backups

### Issue Management Context
- All issues tracked in GitHub with priority labels (P0-P4)
- Priority document auto-generated via `./scripts/update-issue-priorities.sh`
- Weekly maintenance checklist at `docs/releases/maintenance/WEEKLY_MAINTENANCE_CHECKLIST.md`
- Issue template includes Description, Type, Priority, Technical Details, Acceptance Criteria

### Design Principles Context
- User CRUD Authority is primary principle - users must control their data
- Accessibility first - WCAG AA minimum, semantic HTML required
- Error prevention over recovery - confirmation dialogs for destructive actions
- Mobile-first responsive design - touch targets minimum 44x44px

### Code Organization Context
- Backend utilities in `backend/src/utils/` - prisma, logger, cache, secrets, sanitize
- Frontend utilities in `frontend/src/utils/` - logger, errorHandler, performanceMonitor
- Validation schemas centralized in `backend/src/validation/schemas.ts`
- All files require copyright header and end with `// Made with Bob` comment

### Non-Standard Patterns
- Prisma `instructions` field is JSON array, not text
- `mealTypes` is array enum - requires special Zod validation
- GIN trigram indexes on title/description - use for fuzzy search, not LIKE
- Cleanup score is nullable Int (0-10) - validate range in schemas