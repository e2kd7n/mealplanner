## Issue Title
[P0] Recipe Creation - Ingredient Add Button Not Working

## Labels
- P0-critical
- bug
- recipes
- user-blocking

## Description

### Summary
The "+" button to add ingredients in the recipe creation form does not function, completely blocking users from creating new recipes.

### Impact
- **Severity:** Critical (P0)
- **User Impact:** Users cannot create recipes - core functionality is broken
- **Workaround:** None available

### Steps to Reproduce
1. Navigate to Recipes page
2. Click "Create Recipe" button
3. Fill in recipe name and description
4. Click the "+" button next to "Ingredients" section
5. **Expected:** New ingredient input field appears
6. **Actual:** Nothing happens - no response, no error

### Technical Details
- **Component:** CreateRecipe page
- **Button:** Ingredient add button ("+")
- **Observed Behavior:**
  - Button appears clickable
  - No visual feedback on click
  - No JavaScript errors in console
  - No network requests fired
  - No new ingredient field added to form

### Environment
- **Browser:** Chrome/Safari
- **Test Date:** 2026-05-06
- **Test Account:** Smith Family (Quick Test Login)
- **URL:** http://localhost:5173/recipes/create

### Investigation Needed
1. Check click handler for ingredient add button in CreateRecipe component
2. Verify state management for ingredients array
3. Check if event handler is properly bound
4. Review any recent changes to CreateRecipe component

### Related Files
- `frontend/src/pages/CreateRecipe.tsx`
- Possibly related form components

### Acceptance Criteria
- [ ] Clicking "+" button adds new ingredient input field
- [ ] Multiple ingredients can be added
- [ ] Ingredient fields can be filled with name and quantity
- [ ] Recipe can be saved with multiple ingredients
- [ ] No console errors during ingredient addition

### Priority Justification
This is a P0 critical issue because:
1. Blocks core recipe creation functionality
2. No workaround available
3. Affects all users attempting to create recipes
4. Discovered during UAT testing for meal planner search fix

### Related Issues
- Part of UAT findings documented in `docs/usertesting/MEAL_PLANNER_SEARCH_UAT_FINDINGS.md`