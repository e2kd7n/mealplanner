# Recipe Browse User Testing Guide

## Test Environment
- **Frontend URL**: http://localhost:5173
- **Backend URL**: http://localhost:3000
- **Test Date**: 2026-04-20

## Prerequisites
✅ Application is running (backend on port 3000, frontend on 5173)
✅ You are logged in as a test user
✅ Spoonacular API key is configured

---

## Test Scenarios

### 1. Initial Page Load
**Steps:**
1. Navigate to http://localhost:5173 and log in
2. Click on "Browse Recipes" in the navigation menu
3. Wait for the page to load

**Expected Results:**
- ✅ Page displays "Browse Recipes" header with explore icon
- ✅ Search bar is visible and functional
- ✅ Filter controls are displayed (Cuisine, Diet, Meal Type, Sort By)
- ✅ Recipe grid loads with 12 recipes from Spoonacular
- ✅ Recipe cards show: image, title, cooking time, servings, cuisine
- ✅ "Add to Recipe Box" button is visible on each card
- ✅ Total results count is displayed (e.g., "Found 5,224 recipes")
- ✅ Pagination controls appear at the bottom

**Notes:**
_Record any issues or observations here_

---

### 2. Search Functionality
**Test 2.1: Basic Search**
1. Type "pasta" in the search bar
2. Wait 500ms for debounce
3. Observe results

**Expected:**
- ✅ Loading skeleton appears briefly
- ✅ Results update to show pasta-related recipes
- ✅ URL updates with `?q=pasta` parameter
- ✅ Total results count updates

**Test 2.2: Search with Multiple Words**
1. Clear search and type "chicken curry"
2. Wait for results

**Expected:**
- ✅ Results show recipes matching both terms
- ✅ Relevant recipes appear

**Test 2.3: Search with No Results**
1. Type "xyzabc123impossible"
2. Wait for results

**Expected:**
- ✅ Empty state message appears: "No recipes found"
- ✅ Helpful text: "Try different keywords or check your spelling"
- ✅ No error messages

---

### 3. Filter Testing

**Test 3.1: Cuisine Filter**
1. Select "Italian" from Cuisine dropdown
2. Observe results

**Expected:**
- ✅ Results update to show Italian recipes
- ✅ URL includes `?cuisine=Italian`
- ✅ Recipe cards show Italian cuisine tags

**Test 3.2: Diet Filter**
1. Select "Vegetarian" from Diet dropdown
2. Observe results

**Expected:**
- ✅ Results show only vegetarian recipes
- ✅ URL includes `?diet=Vegetarian`

**Test 3.3: Meal Type Filter**
1. Select "Breakfast" from Meal Type dropdown
2. Observe results

**Expected:**
- ✅ Results show breakfast recipes
- ✅ URL includes `?type=breakfast`

**Test 3.4: Sort By**
1. Change Sort By to "Cooking Time"
2. Observe results

**Expected:**
- ✅ Recipes reorder by cooking time (shortest first)
- ✅ URL includes `?sort=time`

**Test 3.5: Max Time Filter**
1. Click "Add Time Filter" button
2. Adjust slider to 30 minutes
3. Observe results

**Expected:**
- ✅ Slider appears with range 15-180 minutes
- ✅ Results show only recipes ≤30 minutes
- ✅ URL includes `?maxTime=30`

**Test 3.6: Combined Filters**
1. Set: Cuisine=Mexican, Diet=Vegetarian, Type=Dinner
2. Observe results

**Expected:**
- ✅ Results match ALL filter criteria
- ✅ URL includes all parameters
- ✅ Appropriate number of results

**Test 3.7: Clear All Filters**
1. Apply multiple filters
2. Click "Clear All" button

**Expected:**
- ✅ All filters reset to default
- ✅ Search query clears
- ✅ Results return to default (popular recipes)
- ✅ URL clears all parameters

---

### 4. Pagination

**Test 4.1: Navigate to Next Page**
1. Scroll to bottom of page
2. Click page "2" in pagination

**Expected:**
- ✅ Page scrolls to top smoothly
- ✅ New set of 12 recipes loads
- ✅ Pagination shows page 2 as active
- ✅ Loading state appears briefly

**Test 4.2: Jump to Last Page**
1. Click "Last" button in pagination
2. Observe results

**Expected:**
- ✅ Jumps to final page
- ✅ Shows remaining recipes (may be < 12)
- ✅ "Next" button is disabled

**Test 4.3: Return to First Page**
1. Click "First" button
2. Observe results

**Expected:**
- ✅ Returns to page 1
- ✅ Shows original recipes

---

### 5. Add to Recipe Box

**Test 5.1: Add Single Recipe**
1. Find a recipe you like
2. Click "Add to Recipe Box" button
3. Wait for response

**Expected:**
- ✅ Button shows loading state
- ✅ Success snackbar appears: "Recipe added to your recipe box!"
- ✅ Button changes to "Added to Recipe Box" with checkmark
- ✅ Button becomes disabled and outlined in green
- ✅ Snackbar auto-dismisses after 3 seconds

**Test 5.2: Add Multiple Recipes**
1. Add 3-4 different recipes
2. Observe each addition

**Expected:**
- ✅ Each recipe can be added independently
- ✅ Success message appears for each
- ✅ Previously added recipes stay marked as "Added"

**Test 5.3: Verify in My Recipes**
1. Navigate to "My Recipes" page
2. Check if added recipes appear

**Expected:**
- ✅ Added recipes appear in your recipe list
- ✅ Recipe details are complete (title, image, ingredients, instructions)

---

### 6. Recipe Card Interaction

**Test 6.1: Hover Effects**
1. Hover over recipe cards
2. Observe visual feedback

**Expected:**
- ✅ Card lifts up slightly (translateY)
- ✅ Shadow increases
- ✅ Smooth transition animation

**Test 6.2: Recipe Card Information**
1. Examine multiple recipe cards
2. Verify all information displays correctly

**Expected:**
- ✅ Recipe image loads (or placeholder if missing)
- ✅ Title is visible and not truncated awkwardly
- ✅ Cooking time chip shows with clock icon
- ✅ Servings chip displays
- ✅ Cuisine type shows below chips (if available)

---

### 7. Loading States

**Test 7.1: Initial Load**
1. Refresh the Browse Recipes page
2. Observe loading behavior

**Expected:**
- ✅ 8 skeleton cards appear immediately
- ✅ Skeletons show placeholder for image, title, and button
- ✅ Skeletons disappear when real data loads

**Test 7.2: Filter Change Loading**
1. Change a filter
2. Observe loading state

**Expected:**
- ✅ Skeleton cards appear during fetch
- ✅ Previous results remain visible until new ones load (optional)

---

### 8. Error Handling

**Test 8.1: Network Error Simulation**
1. Open browser DevTools → Network tab
2. Set throttling to "Offline"
3. Try to search or change filters
4. Restore network

**Expected:**
- ✅ Error alert appears with helpful message
- ✅ Error can be dismissed
- ✅ Page remains functional after error

**Test 8.2: API Rate Limit**
_Note: This may be hard to test without making 150+ requests_

**Expected (if triggered):**
- ✅ Error message indicates rate limit
- ✅ Suggests trying again later

---

### 9. URL State Management

**Test 9.1: Direct URL Access**
1. Copy URL with filters: `http://localhost:5173/recipes/browse?q=pasta&cuisine=Italian&diet=Vegetarian`
2. Open in new tab
3. Observe page state

**Expected:**
- ✅ Page loads with filters pre-applied
- ✅ Search query is populated
- ✅ Filter dropdowns show selected values
- ✅ Results match the filters

**Test 9.2: Browser Back/Forward**
1. Apply several filters in sequence
2. Click browser back button multiple times
3. Click forward button

**Expected:**
- ✅ Each back click restores previous filter state
- ✅ Results update accordingly
- ✅ Forward button works correctly

**Test 9.3: Bookmark and Return**
1. Apply filters and bookmark the page
2. Close browser
3. Open bookmark

**Expected:**
- ✅ Page loads with bookmarked filters
- ✅ Results match the saved state

---

### 10. Responsive Design

**Test 10.1: Mobile View (375px)**
1. Open DevTools and set viewport to iPhone SE (375px)
2. Navigate through the page

**Expected:**
- ✅ Recipe grid shows 1 column
- ✅ Filters stack vertically
- ✅ Search bar is full width
- ✅ Pagination is usable
- ✅ Cards are properly sized

**Test 10.2: Tablet View (768px)**
1. Set viewport to iPad (768px)
2. Navigate through the page

**Expected:**
- ✅ Recipe grid shows 2 columns
- ✅ Filters may wrap to 2 rows
- ✅ Layout is balanced

**Test 10.3: Desktop View (1920px)**
1. Set viewport to large desktop
2. Navigate through the page

**Expected:**
- ✅ Recipe grid shows 4 columns
- ✅ Filters display in single row
- ✅ Content is centered with max-width
- ✅ No awkward spacing

---

### 11. Performance

**Test 11.1: Page Load Time**
1. Open DevTools → Network tab
2. Refresh page
3. Check load time

**Expected:**
- ✅ Initial page load < 2 seconds
- ✅ Recipe data loads < 1 second after page ready

**Test 11.2: Filter Response Time**
1. Change filters rapidly
2. Observe debouncing

**Expected:**
- ✅ Search debounces (waits 500ms)
- ✅ No excessive API calls
- ✅ Smooth transitions

**Test 11.3: Scroll Performance**
1. Scroll through recipe grid
2. Observe smoothness

**Expected:**
- ✅ Smooth scrolling (60fps)
- ✅ No jank or stuttering
- ✅ Images load progressively

---

## Issues Found

### Critical Issues
_List any blocking issues here_

### Major Issues
_List significant problems here_

### Minor Issues
_List small issues or improvements here_

### Suggestions
_List enhancement ideas here_

---

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

---

## Summary

**Total Tests Completed:** ___/50+
**Pass Rate:** ___%
**Critical Issues:** ___
**Overall Assessment:** ___

**Tester:** _______________
**Date:** _______________
**Time Spent:** _______________

---

## Next Steps

Based on testing results:
1. Fix critical issues first
2. Address major issues
3. Consider minor improvements
4. Plan for enhancement suggestions
