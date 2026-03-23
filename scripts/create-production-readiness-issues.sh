nf #!/bin/bash

# Comprehensive GitHub Issues Creation Script
# Creates issues for production readiness based on senior developer review
# Date: 2026-03-22

set -e

REPO="e2kd7n/mealplanner"

echo "Creating comprehensive GitHub issues for production readiness..."
echo "Repository: $REPO"
echo ""

# Function to create an issue
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"
    
    echo "Creating issue: $title"
    gh issue create \
        --repo "$REPO" \
        --title "$title" \
        --body "$body" \
        --label "$labels" || echo "Failed to create issue: $title"
    sleep 1
}

# ============================================================================
# P0 - CRITICAL BUGS (Must fix before any release)
# ============================================================================

create_issue \
"[P0] Meal Planner Date Off-by-One Error - Meals Added to Wrong Day" \
"## Problem
**CRITICAL BUG**: When adding a meal to the meal planner, the meal is ALWAYS added to the day BEFORE the selected date. This is a consistent off-by-one error affecting all meal additions.

## Impact
- Core meal planning functionality is broken
- Users cannot reliably plan meals for specific dates
- Makes the application essentially unusable for its primary purpose
- Users may not notice and end up with completely wrong meal plans

## Confirmed Test Cases
1. ✗ Selected: Monday, March 23 dinner → Actually added to: Sunday, March 22 dinner
2. ✗ Selected: Thursday, March 26 lunch → Actually added to: Wednesday, March 25 lunch

## Root Cause
Timezone conversion issue when using \`.toISOString().split('T')[0]\` in MealPlanner.tsx. The UTC conversion shifts dates backward for users in negative UTC timezones.

## Files Affected
- \`frontend/src/pages/MealPlanner.tsx\` (lines 317, 337, 505)

## Solution
Replace UTC-based date formatting with local timezone formatting:
\`\`\`typescript
// Helper function already exists at line 79-84
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return \`\${year}-\${month}-\${day}\`;
};
\`\`\`

## Testing Required
- Test meal additions across all days of the week
- Test in different timezones
- Verify meals appear on correct dates
- Test different meal types (breakfast, lunch, dinner, snack)

## References
- USER_TESTING_SUMMARY.md
- P0_BUG_FIXES_PLAN.md" \
"priority: critical,bug,P0,meal-planner"

create_issue \
"[P0] Generate Grocery List Button Not Working" \
"## Problem
The \"Generate Grocery List\" button on the Meal Planner page does not respond when clicked. No visible action, navigation, or error message occurs.

## Impact
- Key automation feature is broken
- Users cannot generate grocery lists from meal plans
- Forces manual entry of all items
- Significantly reduces application value proposition

## Root Cause
Function \`handleGenerateGroceryList\` is likely missing or not properly implemented in MealPlanner.tsx.

## Files Affected
- \`frontend/src/pages/MealPlanner.tsx\`

## Expected Behavior
Button should either:
1. Navigate to grocery list page with pre-populated items from meal plan, OR
2. Generate a new grocery list and show success message

## Testing Required
- Click \"Generate Grocery List\" button
- Verify navigation or list creation occurs
- Verify grocery items are correctly extracted from meal plan recipes
- Test with empty meal plan (should show appropriate message)

## References
- USER_TESTING_SUMMARY.md" \
"priority: critical,bug,P0,meal-planner,grocery-list"

create_issue \
"[P0] CSP Policy Blocks Recipe Images (blob: URLs)" \
"## Problem
Recipe images show \"No Image\" placeholder due to Content Security Policy blocking blob: URLs. Console error: \"Refused to load the image 'blob:...' because it violates the following Content Security Policy directive\"

## Impact
- All recipe images fail to display
- Severely impacts visual appeal and usability
- Users cannot see what recipes look like
- Makes recipe browsing less effective

## Root Cause
Nginx CSP configuration doesn't include \`blob:\` in \`img-src\` directive.

## Files Affected
- \`nginx/default.conf\` or \`frontend/nginx.conf\`

## Solution
Add CSP header with blob: support:
\`\`\`nginx
add_header Content-Security-Policy \"default-src 'self'; img-src 'self' data: blob: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';\" always;
\`\`\`

## Testing Required
- Verify recipe images load correctly
- Test with imported recipes (external URLs)
- Test with uploaded images
- Check browser console for CSP errors

## References
- USER_TESTING_SUMMARY.md
- P0_BUG_FIXES_PLAN.md" \
"priority: critical,bug,P0,images,security"

create_issue \
"[P0] Recipe Meal Type Filter Not Working" \
"## Problem
Filtering recipes by meal type (breakfast, lunch, dinner, etc.) returns no results or incorrect results.

## Impact
- Users cannot find recipes for specific meal types
- Makes meal planning workflow inefficient
- Core search functionality broken

## Root Cause
Backend query doesn't handle mealType parameter correctly. Schema changed from single \`mealType\` to array \`mealTypes\` but query logic wasn't updated.

## Files Affected
- \`backend/src/controllers/recipe.controller.ts\`
- \`frontend/src/pages/Recipes.tsx\`
- \`backend/prisma/schema.prisma\` (line 82: mealTypes is now an array)

## Solution
Update backend query to handle array field:
\`\`\`typescript
if (mealType) {
  where.mealTypes = {
    has: mealType as MealType
  };
}
\`\`\`

## Testing Required
- Filter by each meal type
- Verify correct recipes are returned
- Test with recipes having multiple meal types
- Test with no filters (should return all recipes)

## References
- P0_BUG_FIXES_PLAN.md" \
"priority: critical,bug,P0,recipes,backend"

create_issue \
"[P0] No Recipes Showing When No Filters Applied" \
"## Problem
Recipe list shows no results when no filters are applied, even though recipes exist in the database.

## Impact
- Users cannot browse all available recipes
- Makes recipe discovery impossible
- Core functionality broken

## Root Cause
Default filter or query limiting results incorrectly.

## Files Affected
- \`backend/src/controllers/recipe.controller.ts\`
- \`frontend/src/pages/Recipes.tsx\`

## Solution
Ensure no default filters are applied and all recipes are returned when no filters specified.

## Testing Required
- Load recipes page with no filters
- Verify all recipes are displayed
- Test pagination
- Test with various filter combinations

## References
- P0_BUG_FIXES_PLAN.md" \
"priority: critical,bug,P0,recipes,backend"

# ============================================================================
# P1 - HIGH PRIORITY (Should fix before release)
# ============================================================================

create_issue \
"[P1] Date Input Field Not Accepting Keyboard Entry" \
"## Problem
Date input fields in meal planner modal don't accept keyboard input. Users are forced to use the date picker only.

## Impact
- Poor user experience for power users
- Slower workflow for frequent users
- Accessibility concerns

## Files Affected
- \`frontend/src/pages/MealPlanner.tsx\`

## Solution
Ensure TextField with type=\"date\" allows keyboard input. May need to adjust input props or use different date component.

## Testing Required
- Try typing dates manually
- Verify date picker still works
- Test with various date formats
- Test keyboard navigation

## References
- USER_TESTING_SUMMARY.md" \
"priority: high,bug,P1,meal-planner,ux"

create_issue \
"[P1] Imported Recipes Not Appearing in Meal Planner Picker" \
"## Problem
Recipes imported from URLs don't appear in the meal planner recipe picker, even though they're visible in the recipes list.

## Impact
- Users cannot use imported recipes in meal plans
- Defeats purpose of recipe import feature
- Forces manual recipe creation

## Root Cause
Imported recipes may not be associated with userId or missing required fields.

## Files Affected
- \`backend/src/services/recipeImport.service.ts\`
- \`backend/src/controllers/recipeImport.controller.ts\`
- \`frontend/src/pages/ImportRecipe.tsx\`

## Solution
Ensure imported recipes have:
1. userId set correctly
2. All required fields populated
3. Proper meal type assignment

## Testing Required
- Import a recipe from URL
- Verify it appears in recipes list
- Verify it appears in meal planner picker
- Test adding imported recipe to meal plan

## References
- P0_BUG_FIXES_PLAN.md" \
"priority: high,bug,P1,recipe-import,meal-planner"

create_issue \
"[P1] Family Members Not Showing in Add Meal Modal" \
"## Problem
Family members don't appear in the \"Assign Cook\" dropdown when adding meals to the meal planner.

## Impact
- Cannot assign cooking responsibilities
- Key family feature not working
- Reduces application value for families

## Root Cause
Family members not loaded or not passed to modal component.

## Files Affected
- \`frontend/src/pages/MealPlanner.tsx\`

## Solution
Ensure family members are:
1. Fetched from API on component mount
2. Passed to meal modal component
3. Displayed in dropdown with proper formatting

## Testing Required
- Add family members via profile/settings
- Open add meal modal
- Verify family members appear in dropdown
- Test assigning cook to meal
- Verify assignment persists

## References
- P0_BUG_FIXES_PLAN.md" \
"priority: high,bug,P1,meal-planner,family-members"

create_issue \
"[P1] Missing Test Coverage - No Automated Tests" \
"## Problem
The application has NO automated tests despite claiming \"MVP Production Ready\" status. The package.json shows:
\`\`\`json
\"test\": \"echo \\\"Error: no test specified\\\" && exit 1\"
\`\`\`

## Impact
- Cannot verify functionality after changes
- High risk of regressions
- Not production-ready without tests
- Cannot safely refactor or add features

## Required Test Coverage
### Backend Tests
- [ ] Authentication flow tests
- [ ] Recipe CRUD operation tests
- [ ] Meal plan creation/modification tests
- [ ] Grocery list generation tests
- [ ] Date handling tests (critical for timezone bug)
- [ ] API endpoint integration tests

### Frontend Tests
- [ ] Component unit tests
- [ ] Redux slice tests
- [ ] Date formatting utility tests
- [ ] User flow E2E tests
- [ ] Meal planner interaction tests

## Files to Create
- \`backend/src/**/*.test.ts\`
- \`frontend/src/**/*.test.tsx\`
- \`frontend/src/**/*.spec.tsx\`
- E2E test suite

## Recommended Tools
- Backend: Jest, Supertest
- Frontend: Vitest, React Testing Library
- E2E: Playwright or Cypress

## References
- BUILD_STATUS.md (claims 10% testing coverage)
- backend/package.json line 17" \
"priority: high,technical-debt,P1,testing,quality"

create_issue \
"[P1] No Error Handling for Failed API Calls" \
"## Problem
Frontend lacks comprehensive error handling for API failures. Users see no feedback when requests fail.

## Impact
- Poor user experience during network issues
- Users don't know if actions succeeded or failed
- Silent failures lead to confusion
- No retry mechanism for transient failures

## Files Affected
- \`frontend/src/services/api.ts\`
- All Redux slices in \`frontend/src/store/slices/\`
- All page components making API calls

## Required Improvements
1. Global error boundary component
2. Toast/snackbar notifications for errors
3. Retry logic for failed requests
4. Loading states for all async operations
5. Offline detection and messaging
6. Specific error messages (not just \"Error occurred\")

## Testing Required
- Simulate network failures
- Test with slow connections
- Verify error messages are user-friendly
- Test retry mechanisms" \
"priority: high,enhancement,P1,error-handling,ux"

# ============================================================================
# P2 - MEDIUM PRIORITY (Should fix soon)
# ============================================================================

create_issue \
"[P2] Missing Environment Variable Validation" \
"## Problem
No validation of required environment variables on startup. Application may fail with cryptic errors if env vars are missing or invalid.

## Impact
- Difficult to debug deployment issues
- Poor developer experience
- Silent failures in production

## Files Affected
- \`backend/src/index.ts\`
- \`frontend/src/main.tsx\`

## Solution
Add startup validation:
\`\`\`typescript
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'CORS_ORIGIN'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(\`Missing required environment variable: \${varName}\`);
  }
});
\`\`\`

## Testing Required
- Start app with missing env vars
- Verify clear error messages
- Test with invalid values" \
"priority: medium,enhancement,P2,configuration,devops"

create_issue \
"[P2] Hardcoded Database Password in podman-compose.yml" \
"## Problem
Database password is hardcoded in podman-compose.yml line 51:
\`\`\`yaml
DATABASE_URL: postgresql://mealplanner:d8teYPprK7X%2B5N%2Fws05YlIzTu6c3pryezNuvtxyiKjQ%3D@postgres:5432/meal_planner?schema=public
\`\`\`

## Security Risk
- Password visible in version control
- Cannot rotate credentials easily
- Violates security best practices
- Exposed in container inspect commands

## Solution
Use Docker secrets properly:
\`\`\`yaml
DATABASE_URL: postgresql://mealplanner:\${POSTGRES_PASSWORD}@postgres:5432/meal_planner
\`\`\`

Or construct URL from secrets at runtime in application code.

## Files Affected
- \`podman-compose.yml\`
- \`backend/src/index.ts\`

## References
- SECRETS_MANAGEMENT.md" \
"priority: medium,security,P2,configuration"

create_issue \
"[P2] Redis Not Actually Used - Only In-Memory Cache" \
"## Problem
Despite Redis being in podman-compose.yml and documentation claiming Redis caching, the application only uses NodeCache (in-memory).

## Evidence
- \`backend/src/utils/cache.ts\` uses NodeCache, not Redis
- No Redis client initialization
- Redis container serves no purpose
- Misleading documentation

## Impact
- Cache doesn't persist across restarts
- Cannot scale horizontally
- Wasted resources running Redis
- Documentation inaccuracy

## Options
1. **Remove Redis** - Update docs, remove from compose file
2. **Implement Redis** - Replace NodeCache with Redis client

## Files Affected
- \`backend/src/utils/cache.ts\`
- \`podman-compose.yml\`
- \`README.md\`
- \`docs/ARCHITECTURE.md\`

## Recommendation
Remove Redis for MVP, add back when horizontal scaling is needed." \
"priority: medium,technical-debt,P2,caching,architecture"

create_issue \
"[P2] No Database Migration Strategy for Production" \
"## Problem
No documented strategy for running database migrations in production. Dockerfile doesn't run migrations automatically.

## Impact
- Manual migration steps required for deployments
- Risk of schema/code mismatch
- Difficult to rollback
- No migration history tracking

## Files Affected
- \`backend/Dockerfile\`
- \`scripts/deploy-podman.sh\`
- \`DEPLOYMENT.md\`

## Solution
Add migration step to deployment:
1. Run migrations before starting app
2. Add migration status check endpoint
3. Document rollback procedure
4. Consider migration locking for multi-instance deployments

## Testing Required
- Test fresh deployment
- Test upgrade deployment
- Test rollback scenario" \
"priority: medium,devops,P2,database,deployment"

create_issue \
"[P2] Frontend Version Mismatch (0.0.0 vs 1.0.0)" \
"## Problem
Frontend package.json shows version 0.0.0 while README claims v1.0.0 MVP Production Ready.

## Files Affected
- \`frontend/package.json\` line 4
- \`README.md\` line 3

## Solution
Update frontend/package.json to match project version:
\`\`\`json
\"version\": \"1.0.0\"
\`\`\`

## Also Check
- Backend version consistency
- Git tags
- Changelog entries" \
"priority: medium,documentation,P2,versioning"

create_issue \
"[P2] Inconsistent Error Response Format" \
"## Problem
Backend error responses don't follow a consistent format across controllers.

## Impact
- Frontend error handling is fragile
- Difficult to display user-friendly messages
- Inconsistent user experience

## Files Affected
- \`backend/src/middleware/errorHandler.ts\`
- All controllers in \`backend/src/controllers/\`

## Solution
Standardize error response format:
\`\`\`typescript
{
  \"success\": false,
  \"error\": {
    \"code\": \"MEAL_NOT_FOUND\",
    \"message\": \"User-friendly message\",
    \"details\": {} // Optional technical details
  }
}
\`\`\`

## Testing Required
- Test various error scenarios
- Verify frontend handles all error types
- Check error logging" \
"priority: medium,enhancement,P2,backend,api"

create_issue \
"[P2] No Rate Limiting on Authentication Endpoints" \
"## Problem
Rate limiting is applied to /api/ routes but authentication endpoints need stricter limits to prevent brute force attacks.

## Security Risk
- Vulnerable to credential stuffing
- No protection against brute force
- Could lead to account compromise

## Files Affected
- \`backend/src/middleware/rateLimiter.ts\`
- \`backend/src/routes/auth.routes.ts\`

## Solution
Add stricter rate limiting for auth endpoints:
\`\`\`typescript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

router.post('/login', authLimiter, login);
\`\`\`

## Testing Required
- Test rate limit triggers correctly
- Verify error messages
- Test limit reset after window" \
"priority: medium,security,P2,authentication"

create_issue \
"[P2] Missing Input Sanitization for Recipe Instructions" \
"## Problem
Recipe instructions accept arbitrary HTML/text without sanitization, potential XSS vulnerability.

## Security Risk
- Stored XSS attacks possible
- Malicious scripts could be injected
- User data at risk

## Files Affected
- \`backend/src/controllers/recipe.controller.ts\`
- \`backend/src/validation/schemas.ts\`
- \`frontend/src/pages/CreateRecipe.tsx\`

## Solution
1. Sanitize HTML input on backend
2. Use DOMPurify or similar on frontend
3. Validate instruction format
4. Escape output properly

## Testing Required
- Test with malicious input
- Verify sanitization works
- Check legitimate HTML is preserved" \
"priority: medium,security,P2,recipes,validation"

# ============================================================================
# P3 - LOW PRIORITY (Nice to have)
# ============================================================================

create_issue \
"[P3] Add Collapsible Navigation Sidebar" \
"## Feature Request
User requested ability to collapse navigation sidebar to icon-only mode to free up screen space.

## Benefits
- More screen space for content
- Better mobile experience
- User preference support

## Files Affected
- \`frontend/src/components/Layout.tsx\`

## Implementation
- Add collapse/expand button
- Store preference in localStorage
- Animate transition
- Show tooltips on hover when collapsed

## References
- USER_TESTING_SUMMARY.md" \
"priority: low,enhancement,P3,ux,navigation"

create_issue \
"[P3] Auto-Select Default Meal Plan" \
"## Feature Request
When only one meal plan is active, automatically select it instead of requiring user to select from dropdown.

## Benefits
- Reduces clicks in common workflow
- Better UX for single-plan users
- Faster meal planning

## Files Affected
- \`frontend/src/pages/MealPlanner.tsx\`

## Implementation
- Check if only one meal plan exists
- Auto-select on component mount
- Still allow manual selection

## References
- USER_TESTING_SUMMARY.md" \
"priority: low,enhancement,P3,meal-planner,ux"

create_issue \
"[P3] Add Recipe Image Upload Functionality" \
"## Feature Request
Allow users to upload custom images for recipes instead of relying on external URLs.

## Benefits
- Better control over images
- Works offline
- No broken external links

## Files Affected
- \`frontend/src/pages/CreateRecipe.tsx\`
- \`backend/src/controllers/recipe.controller.ts\`
- \`backend/src/routes/image.routes.ts\`

## Implementation
- Add file upload component
- Implement image processing (resize, optimize)
- Store in /app/images directory
- Add image deletion on recipe delete

## Testing Required
- Test various image formats
- Test large files
- Test upload errors
- Verify storage cleanup" \
"priority: low,enhancement,P3,recipes,images"

create_issue \
"[P3] Add Recipe Rating and Review System" \
"## Feature Request
Allow users to rate recipes and leave reviews after cooking them.

## Benefits
- Track favorite recipes
- Remember what worked well
- Family feedback collection

## Database Schema
Already exists in schema.prisma:
- RecipeRating model (lines 267-286)

## Files Affected
- \`frontend/src/pages/RecipeDetail.tsx\`
- \`backend/src/controllers/recipe.controller.ts\`

## Implementation
- Star rating component
- Review text field
- Average rating display
- Filter by rating

## References
- BUILD_STATUS.md mentions this as medium priority" \
"priority: low,enhancement,P3,recipes,social"

create_issue \
"[P3] Implement PWA Offline Functionality" \
"## Feature Request
Add Progressive Web App features for offline usage.

## Benefits
- Works without internet
- Installable on mobile
- Better mobile experience
- Faster load times

## Files Affected
- \`frontend/vite.config.ts\`
- \`frontend/public/manifest.json\` (create)
- Service worker files (create)

## Implementation
- Add Workbox for service worker
- Cache static assets
- Cache API responses
- Add offline indicator
- Add install prompt

## Testing Required
- Test offline mode
- Test install on mobile
- Test cache updates
- Test background sync

## References
- BUILD_STATUS.md lists this as low priority
- README mentions PWA capabilities" \
"priority: low,enhancement,P3,pwa,mobile"

# ============================================================================
# TECHNICAL DEBT
# ============================================================================

create_issue \
"[Tech Debt] Remove Unused Docker Compose Reference File" \
"## Problem
\`docker-compose.yml.REFERENCE_ONLY\` file exists but is not used. Causes confusion about which compose file to use.

## Impact
- Confusing for new developers
- Outdated reference
- Clutters repository

## Solution
Either:
1. Delete the file if not needed
2. Move to docs/ if it's documentation
3. Update and use it if it's better than podman-compose.yml

## Files Affected
- \`docker-compose.yml.REFERENCE_ONLY\`" \
"priority: low,technical-debt,cleanup"

create_issue \
"[Tech Debt] Consolidate Multiple User Testing Documentation Files" \
"## Problem
Multiple overlapping user testing files:
- USER_TESTING_SUMMARY.md
- USER_TESTING_BUG_SUMMARY.md (doesn't exist but referenced)
- USER_TESTING_ISSUES_LOG.md
- P0_BUG_FIXES_PLAN.md

## Impact
- Information scattered
- Difficult to track status
- Duplicate information

## Solution
Consolidate into single source of truth or clear hierarchy:
1. USER_TESTING_SUMMARY.md - High-level summary
2. USER_TESTING_ISSUES.md - Detailed issue list
3. Archive fixed issues

## Files Affected
- All USER_TESTING_*.md files" \
"priority: low,technical-debt,documentation"

create_issue \
"[Tech Debt] Remove Unused setFamilyMembersLoading Variable" \
"## Problem
Line 97 in MealPlanner.tsx has unused variable:
\`\`\`typescript
const [, setFamilyMembersLoading] = useState(false);
\`\`\`

## Impact
- Dead code
- Confusing for developers
- Linter warnings

## Solution
Either use it for loading state or remove it.

## Files Affected
- \`frontend/src/pages/MealPlanner.tsx\` line 97" \
"priority: low,technical-debt,cleanup"

create_issue \
"[Tech Debt] Inconsistent Date Handling Across Application" \
"## Problem
Date handling is inconsistent:
- Some places use Date objects
- Some use ISO strings
- Some use formatted strings
- Timezone handling varies

## Impact
- Source of bugs (like the off-by-one error)
- Difficult to maintain
- Confusing for developers

## Solution
Create centralized date utility module:
\`\`\`typescript
// utils/dateHelpers.ts
export const formatForAPI = (date: Date): string => { ... }
export const parseFromAPI = (dateStr: string): Date => { ... }
export const formatForDisplay = (date: Date): string => { ... }
\`\`\`

## Files Affected
- All files handling dates
- Create \`frontend/src/utils/dateHelpers.ts\`
- Create \`backend/src/utils/dateHelpers.ts\`" \
"priority: medium,technical-debt,P2,dates,refactoring"

create_issue \
"[Tech Debt] No Logging Strategy for Frontend" \
"## Problem
Frontend has no structured logging. Console.log statements scattered throughout code.

## Impact
- Difficult to debug production issues
- No error tracking
- Cannot monitor user issues

## Solution
Implement logging strategy:
1. Use structured logger (e.g., loglevel)
2. Send errors to monitoring service (Sentry)
3. Add log levels (debug, info, warn, error)
4. Remove console.log statements

## Files Affected
- All frontend files
- Create \`frontend/src/utils/logger.ts\`" \
"priority: low,technical-debt,logging,monitoring"

# ============================================================================
# DOCUMENTATION ISSUES
# ============================================================================

create_issue \
"[Docs] README Claims Production Ready But Critical Bugs Exist" \
"## Problem
README.md line 3 states \"Version: 1.0.0 (MVP) - ✅ Production Ready\" but multiple P0 critical bugs exist that make the application unusable.

## Issues
1. Meal planner date bug (P0)
2. Generate grocery list broken (P0)
3. Recipe filtering broken (P0)
4. No automated tests
5. Security vulnerabilities

## Solution
Update README to reflect actual status:
\`\`\`markdown
**Version:** 1.0.0 (MVP) - ⚠️ Beta - Critical Bugs Being Fixed
\`\`\`

Add known issues section linking to GitHub issues.

## Files Affected
- \`README.md\`
- \`MVP_RELEASE_SUMMARY.md\`" \
"priority: high,documentation,P1,accuracy"

create_issue \
"[Docs] Missing API Documentation" \
"## Problem
README line 364 mentions \"Interactive API docs (when running)\" at http://localhost:3000/api-docs but this endpoint doesn't exist.

## Impact
- Developers cannot understand API
- Integration difficult
- No contract documentation

## Solution
Add Swagger/OpenAPI documentation:
1. Install swagger-jsdoc and swagger-ui-express
2. Document all endpoints
3. Add request/response examples
4. Include authentication requirements

## Files Affected
- \`backend/src/index.ts\`
- Create \`backend/src/swagger.ts\`
- All route files (add JSDoc comments)" \
"priority: medium,documentation,P2,api"

create_issue \
"[Docs] Outdated Build Status Document" \
"## Problem
BUILD_STATUS.md last updated 2026-03-15 but claims 85% complete. User testing revealed multiple critical bugs.

## Solution
Update BUILD_STATUS.md with:
1. Current actual status
2. Known critical bugs
3. Realistic completion percentage
4. Updated testing metrics

## Files Affected
- \`BUILD_STATUS.md\`" \
"priority: low,documentation,P3"

create_issue \
"[Docs] Missing Troubleshooting Guide" \
"## Problem
No comprehensive troubleshooting guide for common issues.

## Needed Sections
1. Database connection issues
2. Authentication problems
3. Image loading failures
4. Port conflicts
5. Container startup issues
6. Migration failures

## Solution
Create TROUBLESHOOTING.md with:
- Common error messages
- Step-by-step solutions
- Debug commands
- Log locations

## Files Affected
- Create \`TROUBLESHOOTING.md\`" \
"priority: low,documentation,P3,support"

echo ""
echo "✅ All issues created successfully!"
echo ""
echo "Next steps:"
echo "1. Review issues at: https://github.com/$REPO/issues"
echo "2. Prioritize P0 issues for immediate fix"
echo "3. Create milestone for v1.1 release"
echo "4. Assign issues to team members"
echo ""

# Made with Bob
