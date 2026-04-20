#!/bin/bash

# Script to create GitHub issues for v1.1 user testing bugs
# Usage: ./scripts/create-user-testing-issues-v1.1.sh

set -e

echo "Creating GitHub issues for v1.1 user testing bugs..."
echo ""

# Issue 1: Spoonacular search returns no results
echo "Creating Issue #1: Spoonacular search returns no results..."
gh issue create \
  --title "[P0][Bug] Spoonacular search returns no results - Browse Recipes non-functional" \
  --body "## Description
Spoonacular search queries return no results, making the Browse Recipes feature completely non-functional. Backend shows 5224 results available, but frontend receives empty array.

## Severity
**Critical (P0)** - Blocking feature release

## Component
Browse Recipes / Frontend-Backend Integration

## Steps to Reproduce
1. Navigate to Browse Recipes page (http://localhost:5173/recipes/browse)
2. Page loads successfully
3. Enter any search query (e.g., 'pasta', 'chicken')
4. Observe results

## Expected Behavior
- Recipe cards should display with search results from Spoonacular
- Results should match the search query
- Pagination should work
- Filters should work

## Actual Behavior
- No recipe cards display
- Search returns empty results
- Frontend receives no data despite backend showing 5224 results
- All dependent features (filters, pagination, add to box) are blocked

## Evidence
Backend logs show: \`[SPOONACULAR_SEARCH] Query: undefined, Results: 5224\`
Frontend state: \`state.recipes = []\` (empty)

## Impact
- Browse Recipes feature is 100% non-functional
- Users cannot discover or add new recipes from Spoonacular
- All search, filter, and pagination tests fail (10+ test cases blocked)

## Related Files
- frontend/src/store/slices/recipeBrowseSlice.ts
- frontend/src/services/api.ts
- backend/src/controllers/recipeBrowse.controller.ts
- backend/src/services/spoonacular.service.ts

## Source
User Testing v1.1 (2026-04-20)" \
  --label "bug,P0-critical,user-testing"

echo "✓ Issue #1 created"
echo ""

# Issue 2: Meal planning broken
echo "Creating Issue #2: Meal planning broken..."
gh issue create \
  --title "[P0][Bug] Meal plan creation and recipe addition completely broken" \
  --body "## Description
Meal planning functionality is completely broken. Cannot create meal plans or add recipes to meal plans.

## Severity
**Critical (P0)** - Blocking core feature

## Component
Meal Planning

## Steps to Reproduce
1. Navigate to Meal Planner page
2. Try to add recipe from recipe view → Error: \"meal plan does not exist\"
3. Try to add recipe from meal plan view → Error: \"failed to add meal, please try again\"

## Expected Behavior
- Should be able to create meal plans
- Should be able to add recipes to meal plans
- Drag and drop should work

## Actual Behavior
- CSRF token validation failing (403 errors)
- Cannot create or modify meal plans
- Core functionality broken

## Backend Logs
\`\`\`
2026-04-20 08:50:37 [warn]: CSRF token validation failed
2026-04-20 08:50:37 [warn]: POST /api/meal-plans 403
\`\`\`

## Impact
- Core meal planning feature is 100% non-functional
- Blocks grocery list generation
- Testing abandoned due to this blocker

## Source
User Testing v1.1 (2026-04-20)" \
  --label "bug,P0-critical,user-testing"

echo "✓ Issue #2 created"
echo ""

# Issue 3: Recipe creation fails
echo "Creating Issue #3: Recipe creation fails..."
gh issue create \
  --title "[P0][Bug] Recipe creation fails with \"Failed to create recipe\" error" \
  --body "## Description
Recipe creation fails when attempting to create a recipe. Error message provides no detail for debugging.

## Severity
**Critical (P0)** - Blocking core feature

## Component
Recipe Management / Recipe Creation

## Steps to Reproduce
1. Navigate to Create Recipe page
2. Fill in recipe details (title: \"hamburgers\", description, ingredients, instructions)
3. Click Submit/Save
4. Observe error

## Expected Behavior
- Recipe should be created successfully
- User should be redirected to recipe detail page
- Recipe should appear in My Recipes list

## Actual Behavior
- Error message: \"Failed to create recipe\"
- Recipe is not created
- No console log detail available for debugging

## Impact
- Users cannot create custom recipes
- Core recipe management feature broken

## Related Files
- backend/src/controllers/recipe.controller.ts (createRecipe function)
- backend/src/validation/schemas.ts
- frontend/src/pages/CreateRecipe.tsx

## Source
User Testing v1.1 (2026-04-20)" \
  --label "bug,P0-critical,user-testing"

echo "✓ Issue #3 created"
echo ""

# Issue 4: Recipe editing fails
echo "Creating Issue #4: Recipe editing fails..."
gh issue create \
  --title "[P0][Bug] Recipe editing fails - cannot add ingredients due to foreign key constraint" \
  --body "## Description
When editing a recipe and trying to add ingredients, the operation fails with a foreign key constraint violation.

## Severity
**Critical (P0)** - Blocking core feature

## Component
Recipe Management / Recipe Editing / Database

## Steps to Reproduce
1. Navigate to an existing recipe
2. Click Edit
3. Try to add ingredient: \"egg\", quantity \"1\", unit \"large\"
4. Click Save
5. Observe error

## Expected Behavior
- Ingredient should be added to recipe
- Recipe should save successfully

## Actual Behavior
- Error: \"Please enter an ingredient name and a valid quantity\"
- Backend error: \`Foreign key constraint violated: recipe_ingredients_ingredient_id_fkey\`

## Root Cause
Ingredient is not being created before recipe_ingredient link is attempted.

## Impact
- Users cannot edit recipes to add ingredients
- Recipe management is severely limited

## Related Files
- backend/src/controllers/recipe.controller.ts (updateRecipe function)
- backend/prisma/schema.prisma (ingredients, recipe_ingredients tables)

## Source
User Testing v1.1 (2026-04-20)" \
  --label "bug,P0-critical,user-testing"

echo "✓ Issue #4 created"
echo ""

# Issue 5: CSRF token validation failing
echo "Creating Issue #5: CSRF token validation failing..."
gh issue create \
  --title "[P0][Bug] CSRF token validation failing on meal plan POST requests" \
  --body "## Description
CSRF token validation is failing on POST requests to meal plan endpoints, resulting in 403 Forbidden errors.

## Severity
**Critical (P0)** - Blocking core feature

## Component
Security / CSRF Protection / Meal Planning

## Evidence
\`\`\`
2026-04-20 08:50:37 [warn]: CSRF token validation failed
2026-04-20 08:50:37 [warn]: POST /api/meal-plans 403
\`\`\`

## Steps to Reproduce
1. Navigate to Meal Planner page
2. Try to create a meal plan (POST request)
3. Observe 403 error

## Expected Behavior
- CSRF token should be fetched and validated successfully
- Request should proceed normally

## Actual Behavior
- CSRF token validation fails
- 403 Forbidden error returned
- Meal plan creation blocked

## Impact
- All meal plan POST/PUT/DELETE operations blocked
- Core feature non-functional

## Related Files
- frontend/src/services/api.ts (CSRF token handling)
- backend/src/middleware/csrf.ts
- backend/src/routes/mealPlan.routes.ts

## Source
User Testing v1.1 (2026-04-20)" \
  --label "bug,P0-critical,user-testing"

echo "✓ Issue #5 created"
echo ""

# Issue 6: Recipe image upload fails
echo "Creating Issue #6: Recipe image upload fails..."
gh issue create \
  --title "[P1][Bug] Recipe image upload fails with \"Failed to update recipe\" error" \
  --body "## Description
Recipe image upload fails when uploading webp format images. After upload, image shows as white box with error message.

## Severity
**High (P1)** - Significant feature degradation

## Component
Recipe Management / Image Upload

## Steps to Reproduce
1. Navigate to recipe \"apple pie\"
2. Click Edit
3. Upload webp image
4. Edit ingredients simultaneously
5. Click Save
6. Observe error

## Expected Behavior
- Image should upload successfully
- Image should display in recipe detail view
- Supports common image formats (jpg, png, webp)

## Actual Behavior
- Error: \"Failed to update recipe\"
- Uploaded image shows white box with error message
- Image is not saved

## Impact
- Users cannot add custom images to recipes
- Poor user experience with broken images

## Related Files
- backend/src/controllers/recipe.controller.ts (image upload logic)
- frontend/src/pages/CreateRecipe.tsx

## Source
User Testing v1.1 (2026-04-20)" \
  --label "bug,P1-high,user-testing"

echo "✓ Issue #6 created"
echo ""

# Issue 7: No delete button
echo "Creating Issue #7: No delete button for recipes..."
gh issue create \
  --title "[P1][Bug] No delete button for recipes - cannot remove unwanted recipes" \
  --body "## Description
Delete button does not appear anywhere in recipe management UI. Users have no way to remove unwanted recipes.

## Severity
**High (P1)** - Missing critical functionality

## Component
Recipe Management / UI

## Steps to Reproduce
1. Navigate to My Recipes
2. Click on any recipe to view details
3. Look for delete button
4. Check recipe list view for delete option
5. Check edit page for delete option

## Expected Behavior
- Delete button should be visible in recipe detail view
- Clicking delete should show confirmation dialog
- After confirmation, recipe should be deleted

## Actual Behavior
- No delete button appears anywhere
- No way to remove recipes
- Recipe box becomes cluttered

## Impact
- Users cannot remove unwanted recipes
- Recipe box becomes cluttered over time
- No way to manage/clean up recipe collection

## Implementation
- Add delete button to recipe detail page
- Implement confirmation dialog
- Add delete API endpoint call
- Handle success/error states

## Related Files
- frontend/src/pages/RecipeDetail.tsx
- frontend/src/pages/Recipes.tsx
- backend/src/controllers/recipe.controller.ts

## Source
User Testing v1.1 (2026-04-20)" \
  --label "bug,P1-high,user-testing"

echo "✓ Issue #7 created"
echo ""

# Issue 8: Test database incomplete
echo "Creating Issue #8: Test database has incomplete data..."
gh issue create \
  --title "[P1][Data] Test database has incomplete recipe data - blocks effective testing" \
  --body "## Description
Test database contains sample recipes with no ingredients or instructions, making comprehensive testing very difficult.

## Severity
**High (P1)** - Blocks effective testing and development

## Component
Test Data / Database Seeding

## Current State
- Test database has recipes with titles only
- No ingredients in most recipes
- No instructions in most recipes
- Cannot properly test recipe features with incomplete data

## Impact
- Testing is severely hampered
- Cannot verify recipe display functionality
- Cannot test meal planning with realistic data
- Cannot test grocery list generation

## Recommendation
Create database seeding script to:
1. Fetch 20-30 complete recipes from Spoonacular
2. Include variety of cuisines, meal types, difficulty levels
3. Ensure all recipes have ingredients, instructions, nutrition info
4. Make script idempotent and easy to run

## Related Files
- backend/seed-recipes.ts
- database/init/02-test-data.sql
- scripts/ (new seed script)

## Source
User Testing v1.1 (2026-04-20)" \
  --label "bug,P1-high,user-testing,testing"

echo "✓ Issue #8 created"
echo ""

# Issue 9: Confusing navigation
echo "Creating Issue #9: Confusing navigation structure..."
gh issue create \
  --title "[P2][UX] Confusing navigation - consolidate \"Search Recipes\" and \"Browse Recipes\"" \
  --body "## Description
Having both \"Search Recipes\" and \"Browse Recipes\" in the left navigation is confusing to users.

## Severity
**Medium (P2)** - UX Enhancement

## Component
Navigation / User Experience

## User Feedback
> \"It is a little confusing to have 'search recipes' and 'browse recipes' in the left nav. Condense into a singular 'recipes' then have a facility within for the user to navigate between their own personal/family recipes and a broader recipe search of spoonacular etc.\"

## Proposed Solution
Consolidate into single \"Recipes\" menu item with tabs:
- Tab 1: \"My Recipes\" (user's personal/family recipes)
- Tab 2: \"Browse\" (Spoonacular recipes)
- Tab 3: \"Import\" (or button in My Recipes)

## Benefits
- Clearer mental model for users
- All recipe-related functions in one place
- Easier to discover features
- Better information architecture

## Related Files
- frontend/src/components/Layout.tsx (navigation)
- frontend/src/App.tsx (routing)
- frontend/src/pages/Recipes.tsx

## Source
User Testing v1.1 (2026-04-20)" \
  --label "enhancement,P2-medium,user-testing"

echo "✓ Issue #9 created"
echo ""

# Issue 10: Recipe creation UX issues
echo "Creating Issue #10: Recipe creation UX issues..."
gh issue create \
  --title "[P2][UX] Recipe creation - ingredient input UX issues" \
  --body "## Description
When adding ingredients during recipe creation, the previous ingredient details remain in the search box when a new row is added, creating confusion.

## Severity
**Medium (P2)** - UX Enhancement

## Component
Recipe Creation / Ingredient Input

## User Feedback
> \"When new ingredient is added, prior typed ingredient details remain in the search box and a row is added below. Don't do this - have only one section of ingredients and add new rows when the plus button is clicked, then save them all once user clicks 'next'.\"

## Proposed Behavior
1. User types ingredient in input field
2. User clicks \"+\" button
3. Ingredient is added to list below
4. Input field clears automatically
5. All ingredients saved when user clicks \"Next\" or \"Save\"

## Benefits
- Clearer workflow
- No confusion about duplicates
- Standard form behavior
- Better user experience

## Related Files
- frontend/src/pages/CreateRecipe.tsx

## Source
User Testing v1.1 (2026-04-20)" \
  --label "enhancement,P2-medium,user-testing"

echo "✓ Issue #10 created"
echo ""

# Issue 11: Missing ingredient scaling
echo "Creating Issue #11: Missing ingredient scaling information..."
gh issue create \
  --title "[P2][UX] Missing ingredient scaling information during recipe creation" \
  --body "## Description
No mechanism for users to indicate which ingredients scale and how they scale when creating recipes.

## Severity
**Medium (P2)** - UX Enhancement / Missing Feature

## Component
Recipe Creation / Ingredient Management

## User Feedback
> \"How will a user indicate which ingredients scale and how they scale? If the app will do this math behind the scenes make sure the user can see the quantity of servings they're inputting ingredients for so they are reminded\"

## Proposed Solution
1. Show serving size prominently during ingredient entry
2. Allow user to specify scaling behavior per ingredient:
   - ✅ Scales proportionally (default)
   - ⚠️ Scales with adjustment (e.g., spices)
   - ❌ Does not scale (e.g., \"to taste\")
3. Preview scaled quantities

## Benefits
- Users understand serving context
- Clear scaling behavior
- Better recipe accuracy when scaling
- Prevents scaling errors

## Related Files
- frontend/src/pages/CreateRecipe.tsx
- backend/prisma/schema.prisma (add scaling field)

## Source
User Testing v1.1 (2026-04-20)" \
  --label "enhancement,P2-medium,user-testing"

echo "✓ Issue #11 created"
echo ""

# Issue 12: Missing nutrition calculation
echo "Creating Issue #12: Missing nutrition calculation..."
gh issue create \
  --title "[P2][Feature] Add automatic nutrition calculation from ingredients" \
  --body "## Description
No way to automatically calculate nutrition information from ingredients list. Users must manually enter nutrition data.

## Severity
**Medium (P2)** - Feature Enhancement

## Component
Recipe Creation / Nutrition

## User Feedback
> \"Find a way to interpret nutrition information from ingredients list, this can be a user option to 'calculate nutrition' when adding ingredients\"

## Proposed Solution
- Add \"Calculate Nutrition\" button in recipe creation
- Use Spoonacular or USDA API to fetch nutrition data
- Calculate per-serving values
- Allow manual override
- Include: calories, protein, carbs, fat, fiber, sugar, sodium

## Benefits
- Eliminates tedious manual entry
- More accurate nutrition data
- Valuable for health-conscious users
- Enables nutrition-based filtering

## Related Files
- backend/src/services/nutrition.service.ts (new)
- backend/src/services/spoonacular.service.ts
- frontend/src/pages/CreateRecipe.tsx

## Source
User Testing v1.1 (2026-04-20)" \
  --label "enhancement,P2-medium,user-testing"

echo "✓ Issue #12 created"
echo ""

# Issue 13: Automated testing gaps
echo "Creating Issue #13: Automated testing gaps..."
gh issue create \
  --title "[Testing] Add automated accessibility and performance tests" \
  --body "## Description
Several testing gaps identified during user testing that need automated test coverage.

## Severity
**Medium (P2)** - Testing Infrastructure

## Component
Testing / CI/CD / Quality Assurance

## Missing Test Coverage

### Accessibility Testing
- Screen reader compatibility (VoiceOver/NVDA)
- ARIA labels verification
- WCAG AA color contrast standards
- Focus indicators visibility
- Keyboard navigation

### Performance Testing
- Page load time benchmarks (< 2 seconds)
- API response time monitoring (< 1 second)
- Bundle size verification (< 500KB gzipped)
- Memory leak detection
- Slow network simulation (3G)

## Recommended Tools
- axe-core for accessibility
- Lighthouse CI for performance
- bundlesize for bundle monitoring
- Playwright performance APIs

## Implementation
1. Add accessibility tests to E2E suite
2. Integrate Lighthouse CI
3. Add bundle size monitoring
4. Run on every PR
5. Track metrics over time

## Related Files
- frontend/e2e/tests/accessibility/ (new)
- frontend/e2e/tests/performance/ (new)
- .github/workflows/lighthouse.yml (new)

## Source
User Testing v1.1 (2026-04-20)" \
  --label "testing,P2-medium,user-testing"

echo "✓ Issue #13 created"
echo ""

# Issue 14: Recipe document upload
echo "Creating Issue #14: Recipe document upload feature..."
gh issue create \
  --title "[P3][Feature] Add recipe document upload (PDF, images, DOCX)" \
  --body "## Description
No mechanism to upload images, PDFs, or documents of recipes. Users want to digitize physical recipes.

## Severity
**Low (P3)** - Feature Enhancement

## Component
Recipe Import / Document Processing

## User Feedback
> \"Add a mechanism to allow the user to upload images/pdf/documents of recipes which then get added to their own personal/family recipes\"

## Proposed Solution

### Phase 1: Basic Upload
- Allow file upload (PDF, JPG, PNG, DOCX)
- Store file
- Create recipe with file attachment

### Phase 2: OCR/Parsing (Advanced)
- Use OCR to extract text from images/PDFs
- Parse recipe structure (ingredients, instructions)
- Pre-fill recipe form
- Allow user to review and edit

## Technology Options
- Tesseract.js (OCR)
- Docling (recipe parsing)
- GPT-4 Vision API (AI parsing)

## Benefits
- Users can digitize physical recipes
- Preserves family recipes
- Easier recipe collection growth

## Related Files
- frontend/src/pages/ImportRecipe.tsx
- backend/src/services/ocr.service.ts (new)
- backend/src/services/recipeParser.service.ts (new)

## Source
User Testing v1.1 (2026-04-20)" \
  --label "enhancement,P3-low,user-testing"

echo "✓ Issue #14 created"
echo ""

echo "=========================================="
echo "✓ All 14 GitHub issues created successfully!"
echo "=========================================="
echo ""
echo "Summary:"
echo "- 5 Critical (P0) issues"
echo "- 3 High (P1) issues"
echo "- 4 Medium (P2) issues"
echo "- 1 Low (P3) issue"
echo "- 1 Testing infrastructure issue"
echo ""
echo "View all issues:"
echo "gh issue list --label user-testing"

# Made with Bob
