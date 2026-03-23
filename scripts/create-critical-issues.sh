#!/bin/bash

# Script to create GitHub issues for critical bugs found during code review
# Run this script to create issues in your GitHub repository

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Creating GitHub Issues for Critical Bugs${NC}"
echo "=========================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Install it with: brew install gh (macOS) or see https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub${NC}"
    echo "Run: gh auth login"
    exit 1
fi

echo -e "${YELLOW}Creating issues...${NC}"
echo ""

# P1 Issue 1: Insufficient Recipe Data
gh issue create \
  --title "P1: Insufficient Recipe Data for Testing" \
  --label "priority:high,type:data,testing" \
  --body "## Problem
Database only contains 8 recipes (1 breakfast, 2 dessert, 5 dinner, 0 lunch). User testing requirements specify need for 40 recipes (10 per meal type) to properly test meal planning functionality.

## Current State
- Breakfast: 1 recipe
- Lunch: 0 recipes  
- Dinner: 5 recipes
- Dessert: 2 recipes
- **Total: 8 recipes**

## Required State
- Breakfast: 10 recipes
- Lunch: 10 recipes
- Dinner: 10 recipes
- Dessert: 10 recipes
- **Total: 40 recipes**

## Impact
- Cannot create diverse meal plans
- Meal planner filtering may not work correctly with limited data
- Grocery list generation cannot be properly tested
- User experience severely degraded

## Recommended Solution
1. Create script to import 32 additional recipes (9 breakfast, 10 lunch, 5 dinner, 8 dessert)
2. Use recipe import functionality to add real recipes from popular recipe sites
3. Ensure recipes have proper meal type tags and ingredients

## Acceptance Criteria
- [ ] Database contains at least 10 recipes for each meal type
- [ ] All recipes have proper ingredients and instructions
- [ ] Recipes are diverse and realistic
- [ ] Recipe import functionality tested and working"

echo -e "${GREEN}✓${NC} Created: P1: Insufficient Recipe Data for Testing"

# P2 Issue 1: No Environment Variable Validation
gh issue create \
  --title "P2: No Environment Variable Validation on Startup" \
  --label "priority:medium,type:enhancement,backend" \
  --body "## Problem
The backend does not validate that all required environment variables are set on startup. This can lead to cryptic errors later in execution.

## Impact
- Silent failures
- Difficult debugging
- Poor developer experience
- Potential runtime crashes

## Recommended Solution
Add startup validation in \`backend/src/index.ts\`:

\`\`\`typescript
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'SESSION_SECRET',
  'NODE_ENV',
  'PORT'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(\`FATAL: Required environment variable \${envVar} is not set\`);
    process.exit(1);
  }
}
\`\`\`

## Acceptance Criteria
- [ ] All required environment variables are validated on startup
- [ ] Clear error messages indicate which variables are missing
- [ ] Application exits with non-zero code if validation fails
- [ ] Validation runs before any database connections or server startup"

echo -e "${GREEN}✓${NC} Created: P2: No Environment Variable Validation on Startup"

# P2 Issue 2: Missing Rate Limiting on Auth Endpoints
gh issue create \
  --title "P2: Missing Rate Limiting on Authentication Endpoints" \
  --label "priority:medium,type:security,backend" \
  --body "## Problem
While rate limiting middleware exists (\`backend/src/middleware/rateLimiter.ts\`), it's not clear if it's applied to authentication endpoints. This leaves the application vulnerable to credential stuffing and brute force attacks.

## Security Risk
- **Severity:** Medium
- **Attack Vector:** Brute force password attacks
- **Impact:** Unauthorized account access

## Recommended Solution
1. Verify rate limiter is applied to \`/api/auth/login\` and \`/api/auth/register\`
2. Implement stricter rate limits for auth endpoints (e.g., 5 attempts per 15 minutes)
3. Add account lockout after repeated failed attempts
4. Log failed authentication attempts for security monitoring

## Example Implementation
\`\`\`typescript
// Stricter rate limiter for auth endpoints
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later'
});

router.post('/login', authRateLimiter, authController.login);
router.post('/register', authRateLimiter, authController.register);
\`\`\`

## Acceptance Criteria
- [ ] Rate limiting applied to all authentication endpoints
- [ ] Failed login attempts are logged
- [ ] Clear error messages for rate limit exceeded
- [ ] Rate limits are configurable via environment variables
- [ ] Documentation updated with rate limit information"

echo -e "${GREEN}✓${NC} Created: P2: Missing Rate Limiting on Authentication Endpoints"

# P2 Issue 3: Inconsistent Error Handling
gh issue create \
  --title "P2: Inconsistent Error Handling in Frontend" \
  --label "priority:medium,type:enhancement,frontend" \
  --body "## Problem
Frontend error handling appears inconsistent. Some errors may not be properly caught and displayed to users, leading to silent failures or cryptic error messages.

## Impact
- Poor user experience
- Unclear error messages
- Silent failures
- Difficult debugging for users

## Recommended Solution
1. Implement global error boundary in React
2. Add toast notifications for all API errors
3. Standardize error message format
4. Add user-friendly error messages for common scenarios

## Example Implementation
\`\`\`typescript
// Global error boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
    // Show user-friendly error message
    toast.error('Something went wrong. Please try again.');
  }
}

// API error handling
try {
  const response = await api.get('/recipes');
  return response.data;
} catch (error) {
  const message = error.response?.data?.message || 'Failed to load recipes';
  toast.error(message);
  throw error;
}
\`\`\`

## Acceptance Criteria
- [ ] Global error boundary implemented
- [ ] Toast notifications for all API errors
- [ ] Standardized error message format
- [ ] User-friendly messages for common errors
- [ ] Error logging for debugging
- [ ] Network error handling (offline, timeout, etc.)"

echo -e "${GREEN}✓${NC} Created: P2: Inconsistent Error Handling in Frontend"

# P3 Issue 1: Documentation Out of Sync
gh issue create \
  --title "P3: Documentation Out of Sync with Implementation" \
  --label "priority:low,type:documentation" \
  --body "## Problem
Several documentation files reference features or configurations that don't match the actual implementation:
- \`DEPLOYMENT.md\` references port 8080 but nginx should be on port 80
- \`BUILD_LOCALLY.md\` mentions both frontend and backend images but podman-compose.yml was missing frontend
- \`README.md\` may not reflect current deployment status

## Impact
- Developer confusion
- Deployment issues
- Wasted time troubleshooting
- Poor onboarding experience

## Recommended Solution
1. Audit all documentation files
2. Update to reflect actual implementation
3. Add \"Last Updated\" dates to documentation
4. Create documentation review checklist for future changes

## Files to Review
- [ ] README.md
- [ ] DEPLOYMENT.md
- [ ] BUILD_LOCALLY.md
- [ ] LOCAL_DEVELOPMENT.md
- [ ] SETUP.md
- [ ] RASPBERRY_PI_QUICKSTART.md

## Acceptance Criteria
- [ ] All documentation matches current implementation
- [ ] Port numbers are correct throughout
- [ ] Service names are consistent
- [ ] Commands are tested and working
- [ ] Screenshots/examples are up to date
- [ ] \"Last Updated\" dates added to all docs"

echo -e "${GREEN}✓${NC} Created: P3: Documentation Out of Sync with Implementation"

# P3 Issue 2: No Automated Testing
gh issue create \
  --title "P3: No Automated Testing Evidence" \
  --label "priority:low,type:testing,enhancement" \
  --body "## Problem
No evidence of automated tests found in the codebase. This increases risk of regressions and makes refactoring dangerous.

## Impact
- Unknown code quality
- High regression risk
- Difficult refactoring
- No confidence in changes
- Manual testing burden

## Recommended Solution
1. Add unit tests for critical business logic
2. Add integration tests for API endpoints
3. Add E2E tests for critical user flows
4. Set up CI/CD pipeline to run tests automatically

## Test Coverage Goals
- **Unit Tests:** 70%+ coverage of business logic
- **Integration Tests:** All API endpoints
- **E2E Tests:** Critical user flows (login, create recipe, meal planning)

## Example Test Structure
\`\`\`
backend/
  src/
    __tests__/
      unit/
        services/
        utils/
      integration/
        controllers/
        routes/

frontend/
  src/
    __tests__/
      unit/
        components/
        hooks/
      integration/
        pages/
      e2e/
        user-flows/
\`\`\`

## Acceptance Criteria
- [ ] Unit test framework set up (Jest/Vitest)
- [ ] Integration test framework set up (Supertest)
- [ ] E2E test framework set up (Playwright/Cypress)
- [ ] CI/CD pipeline runs tests on PR
- [ ] Test coverage reports generated
- [ ] Critical paths have test coverage
- [ ] Documentation for running tests"

echo -e "${GREEN}✓${NC} Created: P3: No Automated Testing Evidence"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Successfully created 6 GitHub issues!${NC}"
echo ""
echo "View all issues: gh issue list"
echo ""

# Made with Bob
