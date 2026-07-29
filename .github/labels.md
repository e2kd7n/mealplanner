# GitHub Issue Labels Cache

**Last Updated:** 2026-07-28
**Update Frequency:** Weekly maintenance (refresh via `gh label list --limit 200`)

Do NOT query GitHub for labels ad hoc — use this cache to avoid failed issue creation
from typos or stale label names.

## Priority Labels
- `P0-critical` - Critical priority - immediate attention
- `P1-high` - High priority - must complete for the milestone
- `P2-medium` - Medium priority - should complete for the milestone
- `P3-low` - Low priority - nice to have
- `P4-future` - Future consideration
- `P1` - P1: Required before public release ⚠️ *legacy/duplicate of `P1-high` — same
  priority tier under a different name. Prefer `P1-high` on new issues; consider
  consolidating during a future label cleanup.*

## Type Labels
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `question` - Further information is requested
- `duplicate` - This issue or pull request already exists
- `invalid` - This doesn't seem right
- `wontfix` - This will not be worked on
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed

## Area Labels
- `backend` - Backend changes
- `frontend` - Frontend changes
- `fullstack` - Full-stack changes
- `architecture` - Architecture and infrastructure changes
- `infrastructure` - Infrastructure and system resources
- `database` - Database related
- `docker` - Docker and containerization
- `nginx` - Nginx web server
- `raspberry-pi` - Raspberry Pi specific
- `deployment` - Deployment and DevOps
- `devops` - DevOps, infrastructure, and deployment
- `ci/cd` - Continuous Integration/Continuous Deployment

## Quality & Ops Labels
- `performance` - Performance improvements
- `optimization` - Performance and resource optimization
- `security` - Security vulnerabilities and hardening
- `reliability` - System reliability and stability
- `monitoring` - Monitoring, logging, and observability
- `observability` - System observability
- `testing` - Testing and QA
- `accessibility` - Accessibility improvements
- `data-loss-prevention` - Prevents user data loss
- `error-recovery` - Error handling and recovery
- `safety` - Safety-critical feature

## UX / Design Labels
- `design` - Design and UI
- `ux` - User experience improvements
- `mobile` - Mobile-specific issues
- `design-review` - From design review process
- `ftue` - First Time User Experience
- `collaboration` - Collaboration features
- `quick-win` - Quick win - high impact, low effort
- `user-retention` - Critical for user retention
- `user-testing` - Issues found during user testing sessions
- `beta-testing` - Issues from beta testing
- `blocking-launch` - Cannot launch without fixing this
- `vp-decision` - Priority set by VP of Product

## Automation Labels (bot-managed, don't apply manually)
- `dependencies` - Pull requests that update a dependency file
- `github_actions` - Pull requests that update GitHub Actions code
- `javascript` - Pull requests that update javascript code

## Common Label Combinations
- Bug reports: `P1-high,bug,backend`
- UI/UX enhancements: `P2-medium,enhancement,ux,design,frontend`
- Accessibility: `P1-high,accessibility,ux`
- Performance: `P2-medium,performance,backend`
- Security: `P0-critical,security`
