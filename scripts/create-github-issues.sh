#!/bin/bash
# Script to create GitHub issues from USER_TESTING_ISSUES_LOG.md

cd "$(dirname "$0")/.."

echo "Creating GitHub Issues from testing log..."

# Issue #1 - Recipe Import Failures (HIGH - INVESTIGATING)
gh issue create \
  --title "Multiple recipe websites failing to import" \
  --body "**Priority:** HIGH
**Status:** INVESTIGATING
**Category:** Recipe Import

## Affected Websites
- AllRecipes.com
- NotQuiteNigella.com  
- VeryEatItalian.com

## Actions Taken
- Enhanced error logging system
- Created RECIPE_IMPORT_ANALYSIS.md

## Next Steps
- Test with enhanced logging
- Analyze patterns
- Implement parser fixes" \
  --label "bug"

# Issue #2 - Meal Planner Persistence (CRITICAL - RESOLVED)
gh issue create \
  --title "Meal planner data not persisting" \
  --body "**Priority:** CRITICAL
**Status:** ✅ RESOLVED
**Category:** Meal Planner

## Resolution
Complete backend integration implemented:
- Added loadMealsForWeek() API integration
- All CRUD operations now persist to database
- Meals survive page refresh
- Week navigation loads correct data

## Files Modified
- frontend/src/pages/MealPlanner.tsx" \
  --label "bug" \
  --label "resolved"

# Issue #3 - Recipes Page Display (HIGH - OPEN)
gh issue create \
  --title "Recipes page only shows one recipe" \
  --body "**Priority:** HIGH
**Status:** OPEN
**Category:** Recipe Display

## Current Behavior
Only one recipe displayed despite multiple in database

## Possible Causes
- Redux slice response handling
- API response format mismatch
- Pagination logic error

## Next Steps
- Check Redux state
- Verify API response
- Review pagination logic" \
  --label "bug"

# Issue #4 - HTML Tags in Descriptions (MEDIUM - OPEN)
gh issue create \
  --title "HTML tags appearing in recipe descriptions" \
  --body "**Priority:** MEDIUM
**Status:** OPEN
**Category:** Recipe Import

## Current Behavior
Imported descriptions contain HTML markup (e.g., <p>, <br>)

## Expected Behavior
HTML tags should be stripped during import

## Solution
Add HTML stripping to recipe import service using 'he' library or regex" \
  --label "bug"

# Issue #5 - Back Button UX (LOW - OPEN)
gh issue create \
  --title "No back button above the fold on Create Recipe page" \
  --body "**Priority:** LOW
**Status:** OPEN
**Category:** UX/Navigation

## Current Behavior
Back button requires scrolling to access

## Expected Behavior
Back button should be visible at top of page

## Recommendation
Move to top of page for all form pages" \
  --label "enhancement"

# Issue #6 - Image Upload (MEDIUM - OPEN)
gh issue create \
  --title "No image upload/change capability when editing recipes" \
  --body "**Priority:** MEDIUM
**Status:** OPEN
**Category:** Recipe Management

## Current Behavior
Cannot add or change recipe images when editing

## Expected Behavior
- Add image URL field to edit form
- Optionally support file upload
- Integrate with image proxy/storage

## Requirements
- Image URL field
- File upload capability
- Image validation" \
  --label "enhancement"

# Issue #7 - Grocery List Integration (HIGH - OPEN)
gh issue create \
  --title "Grocery list not populated from meal plan recipes" \
  --body "**Priority:** HIGH
**Status:** OPEN
**Category:** Grocery List

## Current Behavior
Grocery list is empty or manually managed

## Expected Behavior
- Auto-populate from meal plan recipes
- Aggregate ingredients intelligently
- Handle duplicates
- Allow user adjustments

## Requirements
- Backend API integration
- Ingredient aggregation logic
- Duplicate detection
- User override capability" \
  --label "bug"

echo "✅ All GitHub issues created successfully!"

# Made with Bob
