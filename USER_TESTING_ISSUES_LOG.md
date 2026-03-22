# User Testing Issues Log - Post 1.0 Release

## Overview
This log tracks issues discovered during user testing after the 1.0 release. Previous pre-release testing issues have been archived.

---

## Issue Summary by Priority

### 🔴 CRITICAL Priority
```
None - All critical issues resolved!
```

### 🔴 HIGH Priority
```
#1, #3, #7
```
- **#1** - Multiple recipe websites failing to import (AllRecipes, NotQuiteNigella, VeryEatItalian)
- **#3** - Recipes page only shows one recipe despite multiple in database
- **#7** - Grocery list not populated from meal plan recipes

### 🟡 MEDIUM Priority
```
#4, #6
```
- **#4** - HTML tags appearing in recipe descriptions from imports
- **#6** - No image upload/change capability when editing recipes

### 🟢 LOW Priority
```
#5
```
- **#5** - No back button "above the fold" on Create Recipe page

---

## Detailed Issue List

| # | Priority | Status | Description |
|---|----------|--------|-------------|
| [#1](#issue-1-multiple-recipe-websites-failing-to-import) | 🔴 HIGH | 🔍 INVESTIGATING | Multiple recipe websites failing to import |
| [#2](#issue-2-meal-planner-data-not-persisting) | 🔴 CRITICAL | 🔴 OPEN | Meal planner data not persisting |
| [#3](#issue-3-recipes-page-only-shows-one-recipe) | 🔴 HIGH | 🔴 OPEN | Recipes page only shows one recipe |
| [#4](#issue-4-html-tags-in-recipe-descriptions) | 🟡 MEDIUM | 🔴 OPEN | HTML tags in recipe descriptions |
| [#5](#issue-5-no-back-button-above-the-fold-on-create-recipe-page) | 🟢 LOW | 🔴 OPEN | No back button above the fold |
| [#6](#issue-6-no-image-uploadchange-capability-when-editing-recipes) | 🟡 MEDIUM | 🔴 OPEN | No image upload when editing |
| [#7](#issue-7-grocery-list-not-populated-from-meal-plan-recipes) | 🔴 HIGH | 🔴 OPEN | Grocery list not populated |

### Status Legend
- 🔍 **INVESTIGATING** - Root cause analysis in progress
- 🔴 **OPEN** - Identified but not yet started
- 🟡 **IN PROGRESS** - Actively being worked on
- ✅ **RESOLVED** - Fixed and verified

---

## Issue #1: Multiple Recipe Websites Failing to Import

**Date Reported:** 2026-03-22  
**Status:** 🔍 INVESTIGATING  
**Priority:** HIGH  
**Category:** Recipe Import

### Description
Multiple popular recipe websites are failing to import, including AllRecipes.com, NotQuiteNigella.com, and VeryEatItalian.com. The `@rethora/url-recipe-scraper` library may not support all websites or may fail when websites don't have proper schema.org Recipe markup.

### Affected Websites
1. **AllRecipes.com**
   - Test URL: https://www.allrecipes.com/recipe/135383/berry-delicious/
   - Status: ❌ FAILING

2. **NotQuiteNigella.com**
   - Test URL: https://www.notquitenigella.com/2022/03/28/beeramisu/
   - Status: ❌ FAILING

3. **VeryEatItalian.com**
   - Test URL: https://www.veryeatalian.com/beeramisu-tiramisu-with-beer/
   - Status: ❌ FAILING

### Current Behavior
- Recipe import fails with 500 Internal Server Error
- No detailed error information provided to user
- Unable to determine root cause without detailed logging

### Expected Behavior
- Recipe import should work for major recipe websites
- Clear error messages should indicate why import failed
- System should provide guidance on supported websites

### Actions Taken

#### 1. Enhanced Error Logging System
Added comprehensive logging tags to track import lifecycle:
- `[RECIPE_IMPORT_START]` - Import initiated
- `[RECIPE_SCRAPE_SUCCESS]` - Raw data scraped successfully
- `[RECIPE_SCRAPE_FAILED]` - Scraping failed
- `[RECIPE_NO_DATA]` - No recipe data found
- `[RECIPE_NO_INGREDIENTS]` - Missing ingredients
- `[RECIPE_NO_INSTRUCTIONS]` - Missing instructions
- `[RECIPE_PARSE_FAILED]` - Parsing failed
- `[RECIPE_IMPORT_SUCCESS]` - Complete success
- `[RECIPE_IMPORT_FAILED]` - Overall failure

#### 2. Detailed Metadata Capture
Enhanced logging to capture:
- URL and hostname for every attempt
- Data structure analysis (keys, types, counts)
- Error messages and stack traces
- Timestamps for all events
- Sample data for debugging

#### 3. Created Analysis Framework
Created `RECIPE_IMPORT_ANALYSIS.md` document to:
- Track failed imports systematically
- Identify common error patterns
- Document working vs failing websites
- Provide testing checklist
- Guide root cause analysis

### Technical Details

**Files Modified:**
- `backend/src/services/recipeImport.service.ts` - Enhanced logging throughout import process
- Created `RECIPE_IMPORT_ANALYSIS.md` - Tracking and analysis document

**Log Analysis Command:**
```bash
podman logs meals-backend | grep "RECIPE_"
```

### Next Steps
1. Test the three failing URLs with enhanced logging
2. Analyze log output to identify patterns
3. Update RECIPE_IMPORT_ANALYSIS.md with findings
4. Implement parser enhancements based on patterns
5. Consider alternative scraping methods for unsupported sites

### Impact
- Users cannot import recipes from popular websites
- Limits usefulness of recipe import feature
- May require manual recipe entry for many sources

---

## Issue #2: Meal Planner Data Not Persisting

**Date Reported:** 2026-03-22  
**Status:** 🔴 OPEN  
**Priority:** CRITICAL  
**Category:** Meal Planner

### Description
When users add meals to the meal planner and refresh the page, the meals disappear. The MealPlanner component uses local state only and does not save to the backend API.

### Current Behavior
- Meals can be added to the planner
- Meals appear in the UI
- Navigating forward/back a week preserves meals
- Refreshing the page loses all meals
- No API calls are made to save meal data

### Expected Behavior
- Meals should be saved to backend via `/api/meal-plans` endpoints
- Meals should persist across page refreshes
- Meals should be loaded from API on component mount
- All add/edit/delete/copy/paste operations should sync with backend

### Steps to Reproduce
1. Log in to the application
2. Navigate to Meal Planner
3. Add meals for the week (e.g., "Chicken Salad" for lunch each day)
4. Refresh the page
5. Observe: All meals are gone

### Technical Details

**Current Implementation:**
- `frontend/src/pages/MealPlanner.tsx` uses `useState` for meals
- No API integration for saving/loading meals
- Mock data only

**Required Changes:**
1. Integrate with backend meal plan API endpoints
2. Load meals from API on component mount
3. Implement save operations for all meal actions
4. Add loading states and error handling
5. Update Redux slice if needed

### Impact
- Users cannot rely on meal planner for actual planning
- All meal planning work is lost on refresh
- Feature is essentially non-functional for real use

### Priority Justification
CRITICAL - Core feature is non-functional. Users expect meal plans to persist.

---

## Issue #3: Recipes Page Only Shows One Recipe

**Date Reported:** 2026-03-22  
**Status:** 🔴 OPEN  
**Priority:** HIGH  
**Category:** Recipe Display

### Description
The Recipes page displays only one recipe ("Pasta Fazool") despite multiple recipes existing in the database.

### Current Behavior
- Only "Pasta Fazool" recipe is displayed
- Other recipes in database are not shown
- No error messages in console

### Expected Behavior
- All user's recipes should be displayed
- Pagination should work correctly
- Filters should not inadvertently hide recipes

### Possible Causes
1. Redux slice response handling issue
2. API response format mismatch
3. Pagination logic error
4. Unintended filter application

### Technical Details

**Recent Changes:**
- Fixed Redux slice to handle multiple response formats
- Added console logging for debugging
- Updated API response handling

**Files to Check:**
- `frontend/src/store/slices/recipesSlice.ts`
- `frontend/src/pages/Recipes.tsx`
- `backend/src/controllers/recipe.controller.ts`

### Next Steps
1. Check Redux state in browser dev tools
2. Verify API response contains all recipes
3. Check if filters are being applied
4. Review pagination logic

### Impact
- Users cannot see their full recipe collection
- Limits usefulness of recipe management feature

---

## Issue #4: HTML Tags in Recipe Descriptions

**Date Reported:** 2026-03-22  
**Status:** 🔴 OPEN  
**Priority:** MEDIUM  
**Category:** Recipe Import

### Description
Recipe descriptions imported from websites contain HTML tags (e.g., `<p>`, `<br>`, `<strong>`) that are displayed as raw text instead of being rendered or stripped.

### Current Behavior
- Imported recipe descriptions include HTML markup
- Tags are visible to users as text
- Affects readability and appearance

### Expected Behavior
- HTML tags should be stripped during import
- Only plain text should be stored
- Descriptions should be clean and readable

### Example
From ciaoitalia.com import:
```
<p>This is a delicious recipe...</p>
```

### Technical Solution
Add HTML stripping to recipe import service:
1. Use library like `he` or regex to remove HTML tags
2. Apply during recipe parsing before saving to database
3. Preserve line breaks and formatting where appropriate

### Files to Modify
- `backend/src/services/recipeImport.service.ts` - Add HTML stripping function

### Impact
- Affects user experience and readability
- Makes imported recipes look unprofessional

---

## Issue #5: No Back Button "Above the Fold" on Create Recipe Page

**Date Reported:** 2026-03-22  
**Status:** 🔴 OPEN  
**Priority:** LOW  
**Category:** UX/Navigation

### Description
The back button on the Create Recipe page requires scrolling to access, which is inconvenient for users who want to navigate away without scrolling.

### Current Behavior
- Back button is located below the fold
- Users must scroll to find navigation

### Expected Behavior
- Back button should be visible at top of page
- No scrolling required to navigate away

### Recommendation
- Move back button to top of page (above the fold)
- Consider adding to all form pages for consistency

### Impact
- Minor UX inconvenience
- Affects navigation efficiency

---

## Issue #6: No Image Upload/Change Capability When Editing Recipes

**Date Reported:** 2026-03-22  
**Status:** 🔴 OPEN  
**Priority:** MEDIUM  
**Category:** Recipe Management

### Description
Users cannot add or change recipe images when editing existing recipes.

### Current Behavior
- No image URL field in recipe edit form
- No file upload capability
- Images can only be set during initial import

### Expected Behavior
- Users should be able to add image URL when editing
- Optionally support file upload
- Images should integrate with existing image proxy/storage system

### Technical Requirements
1. Add image URL field to recipe edit form
2. Optionally add file upload capability
3. Integrate with image proxy/caching system
4. Validate image URLs

### Impact
- Users cannot customize recipe images
- Limits recipe management flexibility

---

## Issue #7: Grocery List Not Populated from Meal Plan Recipes

**Date Reported:** 2026-03-22  
**Status:** 🔴 OPEN  
**Priority:** HIGH  
**Category:** Grocery List

### Description
The grocery list feature does not automatically populate with ingredients from recipes in the meal plan.

### Current Behavior
- Grocery list is empty or manually managed
- No integration with meal planner
- Users must manually add items

### Expected Behavior
- Grocery list should aggregate ingredients from all meals in plan
- Should handle duplicate ingredients intelligently
- Should allow user adjustments and additions

### Technical Requirements
1. Backend API integration to fetch recipe ingredients
2. Ingredient aggregation logic
3. Duplicate detection and merging
4. User override capability

### Impact
- Core feature is non-functional
- Users cannot leverage meal planning for grocery shopping
- Reduces overall value of application

### Priority Justification
HIGH - This is a key feature that ties meal planning to grocery shopping workflow.

---

## Session Summary (2026-03-22)

### Issues Addressed
1. ✅ Enhanced recipe import error logging
2. ✅ Created recipe import analysis framework
3. ✅ Improved error messages for recipe import failures
4. ✅ Added meal detail dialog enhancements (recipe links, images)
5. ✅ Implemented meal schedule editing
6. ✅ Added copy/paste functionality for meals

### Issues Identified (New)
1. 🔴 Issue #1: Multiple recipe websites failing to import (HIGH)
2. 🔴 Issue #2: Meal planner data not persisting (CRITICAL)
3. 🔴 Issue #3: Recipes page only shows one recipe (HIGH)
4. 🔴 Issue #4: HTML tags in recipe descriptions (MEDIUM)
5. 🔴 Issue #5: No back button above the fold (LOW)
6. 🔴 Issue #6: No image upload/change when editing (MEDIUM)
7. 🔴 Issue #7: Grocery list not populated from meal plan (HIGH)

### Critical Issues Requiring Immediate Attention
1. **Issue #2: Meal Persistence** - Users cannot save meal plans
2. **Issue #1: Recipe Import** - Major websites not working
3. **Issue #3: Recipe Display** - Only showing one recipe
4. **Issue #7: Grocery List** - Core feature not functional

### Next Session Priorities
1. Fix meal planner persistence (CRITICAL)
2. Debug recipe import failures with enhanced logging
3. Fix recipes page display issue
4. Implement grocery list integration
