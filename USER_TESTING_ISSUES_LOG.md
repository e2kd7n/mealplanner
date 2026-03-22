# User Testing Issues Log

**Last Updated:** March 22, 2026

This document tracks issues discovered during user testing sessions.

---

## Critical Issues

### 0. All Meals Disappeared from Meal Planner After Bug Fixes
**Severity:** CRITICAL
**Status:** Open
**Discovered:** March 22, 2026 (during P0 bug fix session)

**Description:**
After applying fixes to Bug #1 (date off-by-one error) in MealPlanner.tsx, all previously created meals disappeared from the meal planner view. The calendar grid shows no meals.

**Root Cause:**
The `formatDateForAPI` helper function was added to fix timezone issues, but it's being used in the wrong places. Specifically:
1. Line 327: Used in `fetchMealsForWeek` - this breaks the API call to fetch existing meals
2. Line 347: Used in `ensureMealPlanExists` - this may create meal plans with incorrect dates
3. Line 540: Used in `handleAddMeal` - this affects new meal creation

The function converts dates to local format (YYYY-MM-DD) but the backend expects ISO format or the dates are being mismatched.

**Impact:**
- All existing meals are hidden from view
- Users cannot see their meal plans
- Complete loss of meal planning functionality
- Data may still exist in database but is not being retrieved

**Fix Required:**
1. Revert the `formatDateForAPI` usage in `fetchMealsForWeek` (line 327)
2. Review where timezone conversion is actually needed vs where ISO format should be used
3. Test that existing meals reappear after fix
4. Ensure new meals are created with correct dates

**Files Affected:**
- `frontend/src/pages/MealPlanner.tsx` (lines 327, 347, 540)

---

### 1. Recipe Meal Type Filter Causing Fetch Error
**Severity:** CRITICAL  
**Status:** Open  
**Discovered:** March 22, 2026

**Description:**  
When using the recipe filter to select a meal type, the application returns a "failed to fetch recipes" error. This prevents users from filtering recipes by meal type (breakfast, lunch, dinner, snack).

**Steps to Reproduce:**
1. Navigate to Recipes page
2. Click on "Meal Type" filter dropdown
3. Select any meal type value (e.g., "Breakfast", "Lunch", "Dinner")
4. Observe error message: "Failed to fetch recipes"

**Impact:**
- Recipe filtering by meal type is completely broken
- Users cannot find recipes for specific meals
- Core search/filter functionality is non-functional
- Blocks efficient recipe discovery workflow

**Expected Behavior:**
- Selecting a meal type should filter recipes to show only those tagged with that meal type
- No error should occur
- Filtered results should display immediately

**Possible Root Causes:**
1. Backend API endpoint may not support meal type filtering
2. Frontend may be sending incorrect query parameters
3. Database query may have syntax error with meal type filter
4. Meal type field may have data type mismatch (array vs string)

**Technical Investigation Needed:**
- Check API endpoint: `GET /api/recipes?mealType=...`
- Review backend controller handling of mealType parameter
- Check if mealType is stored as array (multiple meal types per recipe)
- Verify frontend is sending correct query format
- Check browser console for detailed error messages
- Review backend logs for API errors

**Files to Investigate:**
- `frontend/src/pages/Recipes.tsx` - Filter UI and API calls
- `frontend/src/store/slices/recipesSlice.ts` - Redux state management
- `frontend/src/services/api.ts` - API client
- `backend/src/controllers/recipe.controller.ts` - Recipe filtering logic
- `backend/src/routes/recipe.routes.ts` - API endpoint definition
- `backend/prisma/schema.prisma` - Recipe model definition (mealType field)

**Priority Justification:**
This is a CRITICAL bug because:
- Meal type filtering is a core feature for recipe discovery
- Users expect to filter recipes by when they plan to eat them
- Without this, users must manually scroll through all recipes
- Significantly degrades user experience and app usability

---


### 1. CSP Image Loading Error

---

### 11. Recipes Not Showing When No Filters Applied
**Severity:** CRITICAL
**Status:** Open
**Discovered:** March 22, 2026

**Description:**
When viewing the Recipes page with no filters selected, some recipes are not appearing in the list. This suggests a default filtering issue or a problem with the initial recipe fetch query.

**Steps to Reproduce:**
1. Navigate to Recipes page
2. Ensure no filters are selected (clear all filters)
3. Observe the recipe list
4. Compare with total recipe count in database

**Expected Behavior:**
- With no filters applied, ALL recipes should be visible
- Recipe list should show complete inventory
- No recipes should be hidden by default

**Actual Behavior:**
- Some recipes are missing from the list
- Not all recipes are displayed
- Unclear which recipes are hidden or why

**Impact:**
- Users cannot see all available recipes
- Recipes may be "lost" and inaccessible
- Affects recipe discovery and meal planning
- Data integrity concern - are recipes actually missing or just not displayed?

**Possible Root Causes:**
1. Default filter being applied unintentionally
2. Pagination issue (not loading all pages)
3. Query limiting results without user awareness
4. Recipes without certain fields being filtered out
5. User-specific filtering (only showing user's recipes?)
6. Database query issue (JOIN or WHERE clause problem)

**Investigation Needed:**
- Check browser console for errors
- Verify total recipe count in database vs displayed count
- Check network tab for API request parameters
- Review default filter state in Redux store
- Check if pagination is working correctly
- Verify which recipes are missing (pattern analysis)

**Questions to Answer:**
- How many recipes are in the database total?
- How many recipes are displayed with no filters?
- Is there a pattern to which recipes are missing?
- Are the missing recipes owned by specific users?
- Do missing recipes have certain fields empty?
- Is there a default "my recipes only" filter?

**Files to Investigate:**
- `frontend/src/pages/Recipes.tsx` - Recipe list component
- `frontend/src/store/slices/recipesSlice.ts` - Recipe state management
- `frontend/src/services/api.ts` - API calls
- `backend/src/controllers/recipe.controller.ts` - Recipe query logic

---

### 12. Imported Recipes Not Appearing in Meal Planner Picker
**Severity:** CRITICAL
**Status:** FIXED
**Discovered:** March 22, 2026
**Fixed:** March 22, 2026

**Description:**
Recipes imported via URL do not appear in the "Add Meal" recipe picker in the meal planner, even though the import appears to succeed. This makes imported recipes unusable for meal planning.

**Steps to Reproduce:**
1. Navigate to Import Recipe page
2. Enter URL: https://barefeetinthekitchen.com/homemade-ice-cream-recipe/
3. Click Import button
4. Import appears to succeed (no error message)
5. Navigate to Meal Planner page
6. Click on a meal slot to add a meal
7. Modal opens with recipe picker
8. Search for "ice" or scroll through recipes
9. Imported recipe does not appear in the picker

**Expected Behavior:**
- Imported recipe should appear in meal planner recipe picker immediately
- Recipe should be searchable in the picker
- Recipe should be selectable for adding to meal plan

**Actual Behavior:**
- Imported recipe does not appear in picker
- Recipe is not available for meal planning
- Recipe appears to be "lost" or inaccessible

**Impact:**
- Recipe import feature is effectively useless
- Users cannot use imported recipes for meal planning
- Blocks primary workflow: import recipe → add to meal plan
- Severe user frustration
- Makes recipe import feature pointless

**Possible Root Causes:**
1. Recipe saved to database but not associated with current user
2. Recipe saved with wrong status (draft, inactive, etc.)
3. Meal planner picker queries different endpoint than recipe list
4. Recipe missing required fields for meal planning (mealType, etc.)
5. Frontend not refreshing recipe list after import
6. Redux state not updated after import
7. Recipe picker has different filtering logic than recipe list
8. Permission/visibility issue

**Investigation Needed:**
- Check if recipe appears in main Recipes page
- Check database: Is recipe saved with correct userId?
- Check recipe status/visibility fields in database
- Compare recipe list query vs meal planner picker query
- Check if recipe has mealType field populated
- Verify all required fields are populated during import
- Check browser console for errors
- Test if manually created recipes appear in picker

**Comparison Test:**
- Does a manually created recipe appear in the picker? ✓
- Does the imported recipe appear in main Recipes page? (Need to test)
- Can the recipe be accessed via direct URL? (Need to test)

**Files to Investigate:**

---

### 13. Family Members Not Appearing in Add Meal Modal
**Severity:** CRITICAL
**Status:** Open
**Discovered:** March 22, 2026

**Description:**
After adding family members to the user profile, they do not appear in the "Add Meal" modal's family member selector. This prevents users from assigning meals to specific family members.

**Steps to Reproduce:**
1. Navigate to Profile page
2. Add one or more family members (e.g., "John", "Sarah")
3. Save family members
4. Navigate to Meal Planner page
5. Click on a meal slot to add a meal
6. Modal opens with "Add Meal" form
7. Look for family member selector/checkboxes
8. Family members do not appear or are not selectable

**Expected Behavior:**
- Family members added in profile should appear in meal modal
- User should be able to select which family members the meal is for
- Family member list should update immediately after adding new members
- All family members should be available for selection

**Actual Behavior:**
- Family members do not appear in the modal
- Cannot assign meals to specific family members
- Family member feature is non-functional for meal planning

**Impact:**
- Family member feature is completely broken
- Cannot track who meals are for
- Blocks multi-person household meal planning
- Key differentiating feature is unusable
- Severe impact on families using the app

**Possible Root Causes:**
1. Frontend not fetching family members for meal modal
2. Redux state not updated after adding family members
3. Family member data not passed to meal modal component
4. API endpoint not returning family members
5. Family members saved but not associated with user correctly
6. Modal component missing family member selector UI
7. Page refresh required to load family members

**Investigation Needed:**
- Check if family members are saved to database correctly
- Verify family members are associated with correct userId
- Check if Profile page refreshes family member list after save
- Test if page refresh makes family members appear in modal
- Check Redux state for family members
- Verify meal modal component has family member selector
- Check API calls when opening meal modal
- Review family member data flow: Profile → Redux → Meal Modal

**Data Verification:**
- Are family members in the database?
- Are they associated with the correct user?
- What fields are populated?
- Can they be fetched via API?

**Files to Investigate:**
- `frontend/src/pages/Profile.tsx` - Family member management
- `frontend/src/pages/MealPlanner.tsx` - Meal modal component
- `frontend/src/store/slices/authSlice.ts` - User/family member state
- `backend/src/controllers/familyMember.controller.ts` - Family member API
- `backend/src/controllers/user.controller.ts` - User profile with family members
- `backend/src/routes/familyMember.routes.ts` - Family member endpoints

**Test Cases:**
1. Add family member "John" in profile
2. Navigate to meal planner
3. Open add meal modal
4. Expected: "John" appears in family member selector
5. Actual: No family members shown

**Priority Justification:**
This is CRITICAL because:
- Family member feature is a core differentiator
- Essential for household meal planning
- Feature is completely non-functional
- Blocks multi-person household use case
- High user expectation for this feature
- Severe impact on target user base (families)

**Related Issues:**
- Similar pattern to imported recipes not appearing (#12)
- Suggests broader issue with state management or data refresh

---

- `frontend/src/pages/ImportRecipe.tsx` - Import flow and state update
- `frontend/src/pages/MealPlanner.tsx` - Meal picker component and query
- `backend/src/controllers/recipeImport.controller.ts` - Import logic
- `backend/src/services/recipeImport.service.ts` - Recipe parsing and saving
- `frontend/src/store/slices/recipesSlice.ts` - Recipe state management
- `backend/src/controllers/recipe.controller.ts` - Recipe queries

**Test Case:**
- URL: https://barefeetinthekitchen.com/homemade-ice-cream-recipe/
- Expected: Recipe appears in meal planner picker
- Actual: Recipe does not appear

**Priority Justification:**
This is CRITICAL because:
- Breaks the core user workflow: import → plan → shop
- Recipe import feature is useless if recipes can't be used
- Blocks primary use case for the application
- Severe impact on user experience and trust
- May indicate data integrity or query logic issues

**Related Issues:**
- May be related to issue #11 (recipes not showing with no filters)
- Both suggest problems with recipe visibility or query logic

---

- `backend/src/routes/recipe.routes.ts` - Recipe endpoints

**Priority Justification:**
This is CRITICAL because:
- Core functionality of viewing all recipes is broken
- Users cannot access their full recipe library
- May indicate data integrity or query logic issues
- Blocks effective use of the application
- Could lead to user confusion and frustration

---

**Severity:** High  
**Status:** Open  
**Discovered:** March 22, 2026

**Description:**  
Recipe images fail to load due to Content Security Policy violation. Console error: `Loading the image 'blob:http://localhost:8080/...' violates the following Content Security Policy directive: "img-src 'self' data:"`

**Impact:**  
- Recipe images show "No Image" placeholder
- Reduces visual appeal and user experience
- Makes it harder to identify recipes at a glance

**Recommendation:**  
Update CSP policy in nginx configuration or HTML meta tags to allow blob URLs for images, or convert to data URLs.

**Files Affected:**
- `nginx/nginx.conf` or `nginx/default.conf`
- Possibly `frontend/index.html`

---

## High Priority Bugs

### 2. Meals Added to Wrong Date in Meal Planner
**Severity:** CRITICAL
**Status:** Open
**Discovered:** March 22, 2026

**Description:**
When adding a meal to a specific date and meal occasion on the meal planner, the meal is added to the WRONG date. The meal appears on a different day than the one selected in the modal.

**Steps to Reproduce:**
1. Navigate to Meal Planner page
2. Click on an empty meal slot for a specific date (e.g., Monday, March 23 dinner)
3. Modal opens showing "Add Meal for Monday, Mar 23" with DINNER selected
4. Select a recipe (e.g., "Sheet-Pan Pepperoni Pasta")
5. Click "Add Meal" button
6. Modal closes
7. Observe that the meal appears on a DIFFERENT date (e.g., Sunday, March 22 dinner instead of Monday, March 23)

**Expected Behavior:**
Meal should be added to the exact date and meal occasion shown in the modal title (Monday, March 23 dinner).

**Actual Behavior:**
- Meal is added to a different date (typically one day earlier)
- The selected date/time in the modal does not match where the meal actually appears
- This appears to be a consistent off-by-one error

**Impact:**
- **CRITICAL** - Core meal planning functionality is broken
- Users cannot reliably plan meals for specific dates
- Causes confusion and frustration
- Makes the meal planner essentially unusable for accurate planning
- Explains why "Pasta Fazool" appeared to fail - it was likely added to the wrong date
- Users may not notice and end up with incorrect meal plans

**Root Cause Analysis:**
This appears to be a date/timezone handling issue, possibly:
- Off-by-one error in date calculation
- Timezone conversion problem (UTC vs local time)
- Date object manipulation error
- Modal displaying one date but submitting a different date
- Index-based date selection issue

**Recommendation:**
1. **URGENT**: Investigate date handling in meal addition logic
2. Check how the selected date is passed from modal to API
3. Verify timezone handling (UTC vs local time conversions)
4. Add logging to track: modal date → submitted date → stored date
5. Test with various dates and timezones
6. Add validation to ensure submitted date matches displayed date

**Files to Investigate (PRIORITY):**
- `frontend/src/pages/MealPlanner.tsx` - Modal date selection and submission
- `frontend/src/store/slices/mealPlansSlice.ts` - Date handling in state
- `backend/src/controllers/mealPlan.controller.ts` - Date parsing in API
- `backend/src/validation/schemas.ts` - Date validation rules

**Testing Needed:**
- Test adding meals to each day of the week
- Verify meals appear on the correct date
- Check if issue is consistent (always off by 1 day) or variable
- Test across different timezones if possible

---

### 3. Generate Grocery List Button Not Working
**Severity:** High
**Status:** Open
**Discovered:** March 22, 2026

**Description:**
Clicking the "Generate Grocery List" button on the Meal Planner page does not appear to perform any action. There is no visible feedback, navigation, or error message.

**Steps to Reproduce:**
1. Navigate to Meal Planner page
2. Ensure some meals are planned for the week
3. Click the "Generate Grocery List" button at the top of the page
4. Observe no visible action occurs

**Expected Behavior:**
One of the following should occur:
- Navigate to Grocery List page with newly generated items
- Show a modal/dialog with generated grocery list
- Display a success message indicating list was generated
- Show loading indicator during generation

**Actual Behavior:**
- No visible response to button click
- No navigation occurs
- No error message displayed
- No loading indicator shown
- Silent failure with no user feedback

**Impact:**
- Key feature for meal planning workflow is broken
- Users cannot automatically generate grocery lists from meal plans
- Forces manual entry of all grocery items
- Significantly reduces value proposition of the application
- May cause users to abandon the feature

**Possible Causes:**
- Button click handler not attached or broken
- API call failing silently without error handling
- Missing navigation logic after successful generation
- Backend endpoint not responding
- Frontend state not updating after API call
- Missing user feedback/notification system

**Recommendation:**
1. Check if button click handler is properly attached
2. Verify API endpoint is working (check backend logs)
3. Add proper error handling and user feedback
4. Implement loading state during generation
5. Add success notification after generation
6. Ensure navigation to grocery list page after generation
7. Add console logging to debug the flow

**Files to Investigate:**
- `frontend/src/pages/MealPlanner.tsx` - Button click handler
- `frontend/src/store/slices/groceryListsSlice.ts` - State management
- `backend/src/controllers/groceryList.controller.ts` - API endpoint
- Check browser console for JavaScript errors
- Check backend logs for API errors

---

### 4. Date Input Not Accepting Numeric Values in Meal Planner
**Severity:** High  
**Status:** Open  
**Discovered:** March 22, 2026

**Description:**  
When editing a meal on the meal planner page, the date input field does not accept manually typed numeric values. Users cannot type in a specific date.

**Steps to Reproduce:**
1. Navigate to Meal Planner page
2. Click on an existing meal to edit it
3. Try to manually type a date in the date input field
4. Observe that numeric input is not registered

**Expected Behavior:**  
Users should be able to manually type dates in the input field (e.g., "03/25/2026" or "25")

**Actual Behavior:**  
Date input field does not accept typed numeric values

**Impact:**  
- Poor user experience when trying to move meals to different dates
- Forces users to use date picker only, which is slower
- May frustrate users who prefer keyboard input

**Recommendation:**  
Investigate the date input component in MealPlanner.tsx and ensure it properly handles keyboard input events for numeric values.

**Files to Check:**
- `frontend/src/pages/MealPlanner.tsx`
- Any date picker component being used
- Input event handlers for date fields

---

## Medium Priority Enhancements

### 3. Collapsible Left Navigation
**Severity:** Medium (UX Enhancement)  
**Status:** Open  
**Discovered:** March 22, 2026

**Description:**  
The left navigation sidebar takes up significant screen real estate. Users would benefit from the ability to collapse/dock the navigation to show only icons, freeing up more space for content.

**User Feedback:**  
"Allow the left nav to be docked and show small icons, freeing up screen real estate"

**Proposed Solution:**
- Add a toggle button to collapse/expand the sidebar
- When collapsed, show only icons with tooltips
- Persist user preference (localStorage or user settings)
- Smooth animation for collapse/expand transition
- Ensure icons are recognizable and accessible

**Benefits:**
- More screen space for content (especially on smaller screens)
- Better user control over interface layout
- Modern UX pattern that users expect

**Implementation Considerations:**
- Update Layout component to support collapsed state
- Add icon-only versions of navigation items
- Implement tooltip system for collapsed state
- Store preference in localStorage or user profile
- Ensure accessibility (keyboard navigation, screen readers)

**Files to Modify:**
- `frontend/src/components/Layout.tsx`
- Possibly add new component: `frontend/src/components/CollapsibleNav.tsx`
- Update CSS/styling for collapsed state

---

### 7. Pantry Unit Field Should Have Smart Defaults
**Severity:** Low (UX Enhancement)
**Status:** Open
**Discovered:** March 22, 2026

**Description:**
When adding items to the pantry, the "unit" field should offer prepopulated values based on units already used in the pantry. This would improve consistency and prevent duplicate entries with different unit variations.

**User Feedback:**
"'unit' should have prepopulated values based on items in pantry already. list should remain deduplicated"

**Current Behavior:**
- Unit field is likely a free-text input
- Users can enter any unit value
- No suggestions or autocomplete
- Can lead to inconsistent units (e.g., "lbs" vs "pounds" vs "lb")

**Proposed Behavior:**
- Show dropdown/autocomplete with commonly used units from existing pantry items
- Allow custom units but suggest existing ones first
- Standardize unit names to prevent duplicates
- Consider grouping similar items (e.g., "Rice - 5 lbs" and "Rice - 2 cups" should be recognized as the same item)

**Benefits:**
- Improves data consistency
- Reduces duplicate entries with different unit names
- Faster data entry with autocomplete
- Better inventory tracking and reporting
- Easier to aggregate quantities

**Implementation Considerations:**
- Extract unique units from existing pantry items
- Provide dropdown with common units (lbs, oz, cups, tbsp, tsp, etc.)
- Add autocomplete functionality
- Consider unit conversion/standardization
- Implement deduplication logic for similar items
- May need unit normalization (e.g., "lb" → "lbs")

**Files to Modify:**
- `frontend/src/pages/Pantry.tsx` - Add item form
- Pantry item input component
- Consider adding a units reference table in database

---

### 8. Pantry Categories Incomplete - Missing Essential Categories
**Severity:** Medium
**Status:** Open
**Discovered:** March 22, 2026

**Description:**
The pantry management system is missing essential food categories. Currently observed categories include "Grains & Pasta", "Oils & Condiments", and "Baking", but critical categories like "Produce" and "Protein" are missing.

**User Feedback:**
"Check list of categories. Currently produce and protein are missing for sure. There's a logical list of things that should probably be here to start"

**Current Categories Observed:**
- Grains & Pasta ✓
- Oils & Condiments ✓
- Baking ✓

**Missing Essential Categories:**
- Produce (fruits, vegetables)
- Protein (meat, poultry, fish, eggs)
- Dairy
- Frozen Foods
- Canned Goods
- Snacks
- Beverages
- Spices & Seasonings
- Bread & Bakery

**Impact:**
- Users cannot properly categorize common pantry items
- Reduces usefulness of pantry organization
- Makes inventory tracking less effective
- May force users to use incorrect categories

**Recommended Standard Categories:**
1. **Produce** - Fruits, vegetables, fresh herbs
2. **Protein** - Meat, poultry, fish, eggs, tofu
3. **Dairy & Eggs** - Milk, cheese, yogurt, butter
4. **Grains & Pasta** - Rice, pasta, bread, cereals
5. **Canned Goods** - Canned vegetables, beans, soups
6. **Frozen Foods** - Frozen vegetables, meals, ice cream
7. **Baking** - Flour, sugar, baking powder, vanilla
8. **Oils & Condiments** - Cooking oils, sauces, dressings
9. **Spices & Seasonings** - Salt, pepper, herbs, spices
10. **Snacks** - Chips, crackers, nuts
11. **Beverages** - Coffee, tea, juice, soda
12. **Bread & Bakery** - Fresh bread, rolls, bagels

**Implementation:**
- Add missing categories to the system
- Ensure categories are available in dropdown/selection
- Consider making categories configurable by users
- Add category icons for better visual organization

**Files to Modify:**
- Category definition/enum in backend
- `frontend/src/pages/Pantry.tsx` - Category selection
- Database seed data or migration to add categories
- Possibly `backend/src/validation/schemas.ts` - Category validation

---

### 9. Smart Default Expiry Dates for Pantry Items
**Severity:** Low (UX Enhancement)
**Status:** Open
**Discovered:** March 22, 2026

**Description:**
When adding items to the pantry, if a user doesn't specify an expiry date, the system should automatically infer a logical default expiry date based on the item's category.

**User Feedback:**
"When a user fails to specify an expiry date there is a logical expiry date that should be inferred based on the chosen category"

**Current Behavior:**
- User must manually enter expiry date for each item
- No default or suggested expiry dates
- Items without expiry dates may not trigger low stock warnings appropriately

**Proposed Behavior:**
- Auto-calculate default expiry date based on category when user doesn't specify one
- Show the calculated date as a suggestion that user can override
- Use typical shelf life for each category

**Suggested Default Expiry Periods by Category:**

| Category | Default Shelf Life | Expiry Date Calculation |
|----------|-------------------|------------------------|
| Produce | 7 days | Today + 7 days |
| Protein (fresh) | 3-5 days | Today + 3 days |
| Dairy & Eggs | 14 days | Today + 14 days |
| Bread & Bakery | 7 days | Today + 7 days |
| Frozen Foods | 90 days | Today + 90 days |
| Canned Goods | 365 days | Today + 1 year |
| Grains & Pasta (dry) | 180 days | Today + 6 months |
| Baking | 180 days | Today + 6 months |
| Oils & Condiments | 180 days | Today + 6 months |
| Spices & Seasonings | 365 days | Today + 1 year |
| Snacks | 90 days | Today + 90 days |
| Beverages | 90 days | Today + 90 days |

**Benefits:**
- Reduces data entry burden on users
- Ensures all items have expiry tracking
- Helps prevent food waste with proactive warnings
- More accurate "Expiring Soon" notifications
- Better inventory management

**Implementation Considerations:**
- Add default expiry period to each category definition
- Calculate expiry date on item creation if not provided
- Show calculated date in UI as editable suggestion
- Allow users to override with custom date
- Consider adding "Never expires" option for some items
- Store both entered date and calculated date for reference

**Files to Modify:**
- Category definitions with default expiry periods
- `frontend/src/pages/Pantry.tsx` - Add item form logic
- `backend/src/controllers/pantry.controller.ts` - Expiry date calculation
- Database schema may need default expiry period per category

---

### 10. Image Upload Missing or Not Obvious in Recipe Editor
**Severity:** Medium
**Status:** Open
**Discovered:** March 22, 2026

**Description:**
When editing a recipe, there is no obvious way to upload or change the recipe image. The image upload functionality is either missing or not clearly visible in the UI.

**User Feedback:**
"Image upload and display is still not present (or not obvious) when editing recipe"

**Current Behavior:**
- Recipe editor does not show image upload field
- No clear way to add or change recipe images
- Users cannot upload custom images for their recipes

**Expected Behavior:**
- Clear image upload button/field in recipe editor
- Ability to upload images from local device
- Preview of current image (if exists)
- Option to change or remove existing image
- Support for common image formats (JPG, PNG, WebP)

**Impact:**
- Users cannot add visual appeal to their recipes
- Reduces recipe discoverability and recognition
- Inconsistent with modern recipe management expectations
- May force users to rely on default/placeholder images only

**Proposed Solution:**
- Add prominent image upload field in recipe create/edit form
- Show current image with option to change
- Implement drag-and-drop image upload
- Add image preview before saving
- Include image cropping/resizing options
- Support multiple image formats

**Implementation Considerations:**
- Add file input field to recipe form
- Implement image upload to backend
- Handle image storage (local filesystem or cloud storage)
- Add image validation (size, format, dimensions)
- Implement image optimization/compression
- Update CSP policy to allow uploaded images (relates to Issue #1)

**Files to Modify:**
- \`frontend/src/pages/CreateRecipe.tsx\` - Add image upload field
- \`frontend/src/pages/RecipeDetail.tsx\` - Edit mode image upload
- \`backend/src/controllers/recipe.controller.ts\` - Image upload handling
- \`backend/src/controllers/image.controller.ts\` - Image processing
- Image storage configuration

---

## Testing Notes

### Test Session: March 22, 2026
**Tester:** User feedback  
**Environment:** http://localhost:8080/meal-planner  
**Test Account:** Smith Family (Quick Test Login)

**Features Tested:**
- ✅ Authentication & Login
- ✅ Dashboard
- ⚠️ Recipe Browsing (CSP image issue)
- ✅ Recipe Detail View
- ⚠️ Meal Planner (date input issue)
- ✅ Grocery List
- ✅ Pantry Inventory
- ✅ Recipe Import UI
- ✅ User Profile & Settings

**Overall Assessment:**
Application is functional and user-friendly with identified issues that should be addressed to improve user experience.

---

## Issue Priority Matrix

| Issue | Severity | Impact | Effort | Priority |
|-------|----------|--------|--------|----------|
| CSP Image Loading | High | High | Medium | P0 |
| Date Input Bug | High | Medium | Low | P0 |
| Collapsible Nav | Medium | Medium | Medium | P1 |

---

## Next Steps

1. **Immediate (P0):**
   - Fix date input field to accept numeric keyboard input
   - Resolve CSP image loading issue

2. **Short-term (P1):**
   - Implement collapsible navigation feature
   - Add user preference persistence

3. **Future Considerations:**
   - Mobile responsiveness testing
   - Performance optimization
   - Additional accessibility improvements
