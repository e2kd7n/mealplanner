#!/bin/bash

# Script to create GitHub issues from User Testing Session - March 22, 2026
# All issues will be tagged with "user-testing" and "user-testing-2026-03-22"
# All issues will be related to parent issue #30

set -e

echo "Creating GitHub issues for User Testing Session: March 22, 2026"
echo "All issues will be linked to parent issue #30"
echo ""

# Issue 1: Wrong Date Bug (CRITICAL)
echo "Creating Issue 1: Meals Added to Wrong Date..."
gh issue create \
  --title "🚨 CRITICAL: Meals Added to Wrong Date (Off-by-One Error)" \
  --label "bug,P0-critical,user-testing,user-testing-2026-03-22,meal-planner" \
  --milestone "v1.1" \
  --body "## Description
When adding a meal to a specific date, the meal is added to the WRONG date (typically one day earlier).

## Steps to Reproduce
1. Navigate to Meal Planner
2. Click meal slot for Monday, March 23 dinner
3. Select a recipe
4. Click \"Add Meal\"
5. Meal appears on Sunday, March 22 instead

## Impact
🚨 **CRITICAL** - Core meal planning broken, users cannot reliably plan meals

## Root Cause
Likely timezone/UTC conversion issue or off-by-one error in date calculation

## Files to Investigate
- \`frontend/src/pages/MealPlanner.tsx\`
- \`frontend/src/store/slices/mealPlansSlice.ts\`
- \`backend/src/controllers/mealPlan.controller.ts\`

## Related
- Parent: #30 (User Testing Cycle)"

# Issue 2: Generate Grocery List Not Working (CRITICAL)
echo "Creating Issue 2: Generate Grocery List Button Not Working..."
gh issue create \
  --title "🚨 CRITICAL: Generate Grocery List Button Not Working" \
  --label "bug,P0-critical,user-testing,user-testing-2026-03-22,grocery-list" \
  --milestone "v1.1" \
  --body "## Description
\"Generate Grocery List\" button does not respond - no action, feedback, or error message.

## Steps to Reproduce
1. Navigate to Meal Planner with planned meals
2. Click \"Generate Grocery List\" button
3. Nothing happens

## Impact
🚨 **CRITICAL** - Key automation feature completely broken

## Possible Causes
- Button click handler not attached
- API call failing silently
- Missing navigation logic

## Files to Investigate
- \`frontend/src/pages/MealPlanner.tsx\`
- \`frontend/src/store/slices/groceryListsSlice.ts\`
- \`backend/src/controllers/groceryList.controller.ts\`

## Related
- Parent: #30 (User Testing Cycle)"

# Issue 3: Recipe Meal Type Filter Broken (CRITICAL)
echo "Creating Issue 3: Recipe Meal Type Filter Broken..."
gh issue create \
  --title "🚨 CRITICAL: Recipe Meal Type Filter Causes \"Failed to Fetch Recipes\" Error" \
  --label "bug,P0-critical,user-testing,user-testing-2026-03-22,recipes" \
  --milestone "v1.1" \
  --body "## Description
Selecting a meal type filter on Recipes page causes \"Failed to fetch recipes\" error.

## Steps to Reproduce
1. Navigate to Recipes page
2. Click \"Meal Type\" filter
3. Select any meal type (Breakfast, Lunch, Dinner)
4. Error: \"Failed to fetch recipes\"

## Impact
🚨 **CRITICAL** - Recipe filtering by meal type completely broken

## Possible Causes
- Backend API doesn't support mealType parameter
- Data type mismatch (array vs string)
- Query syntax error

## Files to Investigate
- \`frontend/src/pages/Recipes.tsx\`
- \`backend/src/controllers/recipe.controller.ts\`
- \`backend/prisma/schema.prisma\` (mealType field)

## Related
- Parent: #30 (User Testing Cycle)"

# Issue 4: Recipes Not Showing With No Filters (CRITICAL)
echo "Creating Issue 4: Recipes Not Showing When No Filters Applied..."
gh issue create \
  --title "🚨 CRITICAL: Some Recipes Not Showing When No Filters Applied" \
  --label "bug,P0-critical,user-testing,user-testing-2026-03-22,recipes" \
  --milestone "v1.1" \
  --body "## Description
When viewing Recipes page with no filters selected, some recipes are missing from the list.

## Steps to Reproduce
1. Navigate to Recipes page
2. Clear all filters
3. Observe some recipes are not displayed

## Expected Behavior
ALL recipes should be visible with no filters applied

## Impact
🚨 **CRITICAL** - Users cannot see their full recipe library

## Possible Causes
- Default filter being applied unintentionally
- Pagination issue
- Query limiting results
- User-specific filtering

## Files to Investigate
- \`frontend/src/pages/Recipes.tsx\`
- \`frontend/src/store/slices/recipesSlice.ts\`
- \`backend/src/controllers/recipe.controller.ts\`

## Related
- Parent: #30 (User Testing Cycle)
- May be related to meal type filter issue"

# Issue 5: CSP Blocking Images (HIGH)
echo "Creating Issue 5: CSP Blocking Recipe Images..."
gh issue create \
  --title "🔴 HIGH: CSP Blocking Recipe Images (Blob URLs)" \
  --label "bug,P0-critical,user-testing,user-testing-2026-03-22,recipes,security" \
  --milestone "v1.1" \
  --body "## Description
Recipe images fail to load due to Content Security Policy blocking blob URLs.

## Console Error
\`Loading the image 'blob:http://localhost:8080/...' violates CSP directive: \"img-src 'self' data:\"\`

## Impact
- Recipe images show \"No Image\" placeholder
- Reduces visual appeal and usability

## Solution
Update CSP policy to allow blob URLs or convert to data URLs

## Files to Modify
- \`nginx/nginx.conf\` or \`nginx/default.conf\`
- Possibly \`frontend/index.html\`

## Related
- Parent: #30 (User Testing Cycle)"

# Issue 6: Date Input Not Accepting Keyboard Entry (HIGH)
echo "Creating Issue 6: Date Input Not Accepting Keyboard Entry..."
gh issue create \
  --title "🔴 HIGH: Date Input Not Accepting Typed Numeric Values" \
  --label "bug,P0-critical,user-testing,user-testing-2026-03-22,meal-planner,ux" \
  --milestone "v1.1" \
  --body "## Description
Date input field in meal planner does not accept manually typed dates - forces use of date picker only.

## Steps to Reproduce
1. Open meal editor modal
2. Try to type a date in the date field
3. Numeric input is not registered

## Impact
Poor UX - forces slower date picker interaction

## Files to Investigate
- \`frontend/src/pages/MealPlanner.tsx\`
- Date picker component configuration

## Related
- Parent: #30 (User Testing Cycle)"

# Issue 7: Imported Recipes Not in Meal Planner Picker (CRITICAL)
echo "Creating Issue 7: Imported Recipes Not Appearing in Meal Planner..."
gh issue create \
  --title "🚨 CRITICAL: Imported Recipes Not Appearing in Meal Planner Picker" \
  --label "bug,P0-critical,user-testing,user-testing-2026-03-22,recipes,meal-planner,recipe-import" \
  --milestone "v1.1" \
  --body "## Description
Recipes imported via URL do not appear in the meal planner's \"Add Meal\" recipe picker, making recipe import feature useless.

## Steps to Reproduce
1. Import recipe: https://barefeetinthekitchen.com/homemade-ice-cream-recipe/
2. Navigate to Meal Planner
3. Click to add a meal
4. Search for \"ice\" in recipe picker
5. Imported recipe does not appear

## Impact
🚨 **CRITICAL** - Recipe import feature is useless if recipes can't be used for meal planning

## Possible Causes
- Recipe not associated with user
- Recipe missing required fields (mealType)
- Redux state not updated after import
- Different query for picker vs recipe list

## Files to Investigate
- \`frontend/src/pages/ImportRecipe.tsx\`
- \`frontend/src/pages/MealPlanner.tsx\`
- \`backend/src/services/recipeImport.service.ts\`
- \`frontend/src/store/slices/recipesSlice.ts\`

## Related
- Parent: #30 (User Testing Cycle)
- Similar pattern to family members issue"

# Issue 8: Family Members Not in Add Meal Modal (CRITICAL)
echo "Creating Issue 8: Family Members Not Appearing in Add Meal Modal..."
gh issue create \
  --title "🚨 CRITICAL: Family Members Not Appearing in Add Meal Modal" \
  --label "bug,P0-critical,user-testing,user-testing-2026-03-22,meal-planner,family-members" \
  --milestone "v1.1" \
  --body "## Description
After adding family members in Profile, they do not appear in the \"Add Meal\" modal's family member selector.

## Steps to Reproduce
1. Navigate to Profile
2. Add family members (e.g., \"John\", \"Sarah\")
3. Save
4. Navigate to Meal Planner
5. Click to add a meal
6. Family members do not appear in modal

## Impact
🚨 **CRITICAL** - Family member feature completely broken, cannot assign meals to family members

## Possible Causes
- Frontend not fetching family members for modal
- Redux state not updated after adding members
- Family members not passed to modal component
- Page refresh required

## Files to Investigate
- \`frontend/src/pages/Profile.tsx\`
- \`frontend/src/pages/MealPlanner.tsx\`
- \`frontend/src/store/slices/authSlice.ts\`
- \`backend/src/controllers/familyMember.controller.ts\`

## Related
- Parent: #30 (User Testing Cycle)
- Similar pattern to imported recipes issue"

# Issue 9: Image Upload Missing in Recipe Editor (HIGH)
echo "Creating Issue 9: Image Upload Missing in Recipe Editor..."
gh issue create \
  --title "🔴 HIGH: Image Upload Missing or Not Obvious in Recipe Editor" \
  --label "enhancement,P1-high,user-testing,user-testing-2026-03-22,recipes,ux" \
  --milestone "v1.1" \
  --body "## Description
No obvious way to upload or change recipe images in the recipe editor.

## Expected Behavior
- Clear image upload button/field
- Preview of current image
- Support for common formats (JPG, PNG, WebP)

## Impact
Users cannot add visual appeal to recipes

## Files to Modify
- \`frontend/src/pages/CreateRecipe.tsx\`
- \`backend/src/controllers/image.controller.ts\`

## Related
- Parent: #30 (User Testing Cycle)
- Related to CSP image issue"

# Issue 10: Pantry Categories Incomplete (HIGH)
echo "Creating Issue 10: Pantry Categories Incomplete..."
gh issue create \
  --title "🔴 HIGH: Pantry Categories Incomplete - Missing 9 Essential Categories" \
  --label "enhancement,P1-high,user-testing,user-testing-2026-03-22,pantry" \
  --milestone "v1.1" \
  --body "## Description
Pantry is missing essential categories: Produce, Protein, Dairy, Frozen, Canned, Snacks, Beverages, Spices, Bread.

## Current Categories
- Grains & Pasta ✓
- Oils & Condiments ✓
- Baking ✓

## Recommended Categories
1. Produce
2. Protein
3. Dairy & Eggs
4. Frozen Foods
5. Canned Goods
6. Snacks
7. Beverages
8. Spices & Seasonings
9. Bread & Bakery

## Impact
Users cannot properly categorize common pantry items

## Files to Modify
- Category definitions in backend
- \`frontend/src/pages/Pantry.tsx\`
- Database seed data

## Related
- Parent: #30 (User Testing Cycle)"

# Issue 11: Collapsible Navigation (MEDIUM)
echo "Creating Issue 11: Collapsible Navigation..."
gh issue create \
  --title "💡 MEDIUM: Collapsible Left Navigation Sidebar" \
  --label "enhancement,P2-medium,user-testing,user-testing-2026-03-22,ui,ux" \
  --milestone "v1.1" \
  --body "## Description
Add ability to collapse left navigation to icon-only mode to free up screen space.

## User Request
\"Allow the left nav to be docked and show small icons, freeing up screen real estate\"

## Proposed Solution
- Toggle button to collapse/expand
- Icon-only mode with tooltips
- Persist preference in localStorage
- Smooth animation

## Files to Modify
- \`frontend/src/components/Layout.tsx\`

## Related
- Parent: #30 (User Testing Cycle)"

# Issue 12: Auto-Select Default Meal Plan (LOW)
echo "Creating Issue 12: Auto-Select Default Meal Plan..."
gh issue create \
  --title "💡 LOW: Auto-Select Default Meal Plan When Only One Active" \
  --label "enhancement,P3-low,user-testing,user-testing-2026-03-22,meal-planner,ux" \
  --milestone "v1.1" \
  --body "## Description
When only one meal plan is active, automatically select it in the \"Add Meal\" modal.

## Benefit
Reduces clicks in common workflow

## Files to Modify
- \`frontend/src/pages/MealPlanner.tsx\`

## Related
- Parent: #30 (User Testing Cycle)"

# Issue 13: Pantry Unit Smart Defaults (LOW)
echo "Creating Issue 13: Pantry Unit Smart Defaults..."
gh issue create \
  --title "💡 LOW: Pantry Unit Field Smart Defaults and Deduplication" \
  --label "enhancement,P3-low,user-testing,user-testing-2026-03-22,pantry,ux" \
  --milestone "v1.1" \
  --body "## Description
Unit field should offer prepopulated values from existing pantry items to improve consistency.

## User Request
\"'unit' should have prepopulated values based on items in pantry already. list should remain deduplicated\"

## Benefit
- Improves data consistency
- Prevents duplicates (\"lbs\" vs \"pounds\")
- Faster data entry

## Files to Modify
- \`frontend/src/pages/Pantry.tsx\`

## Related
- Parent: #30 (User Testing Cycle)"

# Issue 14: Smart Default Expiry Dates (LOW)
echo "Creating Issue 14: Smart Default Expiry Dates..."
gh issue create \
  --title "💡 LOW: Smart Default Expiry Dates Based on Category" \
  --label "enhancement,P3-low,user-testing,user-testing-2026-03-22,pantry,ux" \
  --milestone "v1.1" \
  --body "## Description
Auto-calculate default expiry dates based on category when user doesn't specify one.

## Suggested Defaults
- Produce: 7 days
- Protein: 3 days
- Dairy: 14 days
- Frozen: 90 days
- Canned: 365 days

## Benefit
- Reduces data entry
- Ensures expiry tracking
- Prevents food waste

## Files to Modify
- \`frontend/src/pages/Pantry.tsx\`
- \`backend/src/controllers/pantry.controller.ts\`

## Related
- Parent: #30 (User Testing Cycle)"

echo ""
echo "✅ All 14 GitHub issues created successfully!"
echo ""
echo "Summary:"
echo "- 8 Critical (P0) bugs"
echo "- 3 High (P1) priority issues"
echo "- 3 Medium/Low (P2/P3) enhancements"
echo ""
echo "All issues:"
echo "- Tagged with: user-testing, user-testing-2026-03-22"
echo "- Linked to parent issue #30"
echo "- Assigned to milestone v1.1"
echo ""
echo "Next: Fix all P0 critical bugs before proceeding to Phase 2"

# Made with Bob
