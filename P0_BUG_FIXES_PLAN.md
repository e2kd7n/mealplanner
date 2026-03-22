# P0 Critical Bug Fixes - Implementation Plan

**Branch:** `fix/user-testing-critical-bugs`  
**Date:** March 22, 2026

## Bugs to Fix (8 Critical P0)

### 1. Meal Planner Wrong Date (Off-by-One Error)
**Root Cause:** Timezone conversion issue when using `.toISOString().split('T')[0]`
**Files:** `frontend/src/pages/MealPlanner.tsx`
**Fix:** Use local date formatting instead of UTC conversion
- Line 317: Change `selectedDate.toISOString().split('T')[0]` to format date in local timezone
- Line 337: Ensure date parsing maintains local timezone
- Line 505: Same fix for edit schedule

**Solution:**
```typescript
// Helper function to format date without timezone issues
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
```

### 2. Generate Grocery List Button Not Working
**Root Cause:** Function `handleGenerateGroceryList` likely missing or not implemented
**Files:** `frontend/src/pages/MealPlanner.tsx`
**Fix:** Implement the missing function to navigate to grocery list page or generate list

### 3. Recipe Meal Type Filter Broken
**Root Cause:** Backend query doesn't handle mealType parameter correctly
**Files:** 
- `frontend/src/pages/Recipes.tsx`
- `backend/src/controllers/recipe.controller.ts`
**Fix:** Ensure mealType filter is properly handled in API query

### 4. Recipes Not Showing With No Filters
**Root Cause:** Default filter or query limiting results
**Files:**
- `frontend/src/pages/Recipes.tsx`
- `backend/src/controllers/recipe.controller.ts`
**Fix:** Ensure no default filters are applied, return all recipes when no filters specified

### 5. CSP Blocking Recipe Images
**Root Cause:** Content Security Policy doesn't allow blob URLs
**Files:** `nginx/nginx.conf` or `nginx/default.conf`
**Fix:** Add `blob:` to img-src directive in CSP

**Solution:**
```nginx
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: blob: https:; ...";
```

### 6. Date Input Not Accepting Keyboard Entry
**Root Cause:** Date input field configuration
**Files:** `frontend/src/pages/MealPlanner.tsx`
**Fix:** Ensure TextField with type="date" allows keyboard input

### 7. Imported Recipes Not in Meal Planner Picker
**Root Cause:** Recipe not associated with user or missing required fields
**Files:**
- `backend/src/services/recipeImport.service.ts`
- `frontend/src/pages/ImportRecipe.tsx`
**Fix:** Ensure imported recipes have userId and all required fields

### 8. Family Members Not in Add Meal Modal
**Root Cause:** Family members not loaded or not passed to modal
**Files:** `frontend/src/pages/MealPlanner.tsx`
**Fix:** Ensure family members are loaded and displayed in modal

## Implementation Order

1. **Date formatting fix** (Bug #1) - Most critical, affects core functionality
2. **CSP fix** (Bug #5) - Quick nginx config change
3. **Generate grocery list** (Bug #2) - Implement missing function
4. **Recipe filtering** (Bugs #3, #4) - Backend query fixes
5. **Date input** (Bug #6) - Frontend input configuration
6. **Imported recipes** (Bug #7) - Backend service fix
7. **Family members** (Bug #8) - Frontend state management

## Testing Plan

After all fixes:
1. Test meal planning with different dates
2. Test grocery list generation
3. Test recipe filtering by meal type
4. Test recipe list with no filters
5. Verify images load correctly
6. Test date input keyboard entry
7. Import a recipe and verify it appears in picker
8. Add family members and verify they appear in modal

## Success Criteria

- All 8 P0 bugs resolved
- No regressions introduced
- All tests pass
- Ready for PR and merge