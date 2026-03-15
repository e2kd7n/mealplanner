# User Testing Issues Log
**Date**: March 15, 2026
**Tester**: Bob (AI Assistant)
**Test Scope**: Smith Family 2-Week Meal Planning Workflow

---

## Test Environment
- **Frontend**: http://localhost:5173 (Vite dev server - Running ✓)
- **Backend**: http://localhost:3000 (Express API - Running ✓)
- **Database**: PostgreSQL via Docker/Podman (Running ✓)
- **Cache**: Redis (Running ✓)
- **Prisma Studio**: Running on background ✓

---

## Issues Found

### Issue #1: Registration Schema Mismatch
**Severity**: Medium
**Component**: Backend API - Auth Registration
**Status**: Documented

**Description**: 
The registration endpoint validation schema doesn't match the README documentation.

**Expected Behavior**:
Based on README, registration should accept:
- email
- password
- name
- familySize

**Actual Behavior**:
Validation schema requires:
- email
- password
- familyName (not "name")
- No familySize field

**Test Case**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPassword123!",
    "name": "Test User",
    "familySize": 4
  }'
```

**Error Response**:
```json
{
  "error": {
    "message": "Validation failed: familyName: Invalid input: expected string, received undefined"
  }
}
```

**Workaround**: Use `familyName` instead of `name`

**Files Involved**:
- `backend/src/validation/schemas.ts` (line 19-23)
- `README.md` (documentation)

---

### Issue #2: Ingredient Creation Requires Undocumented Fields
**Severity**: Medium
**Component**: Backend API - Ingredient Creation
**Status**: Documented

**Description**:
The ingredient creation endpoint requires fields that are not in the validation schema.

**Expected Behavior**:
Based on validation schema (`createIngredientSchema`), should accept:
- name (required)
- category (optional)
- defaultUnit (optional)

**Actual Behavior**:
Controller validation requires:
- name (required)
- category (required)
- unit (required)
- averagePrice (required)

**Test Case**:
```bash
curl -X POST http://localhost:3000/api/ingredients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Chicken Breast",
    "category": "Meat",
    "defaultUnit": "lb"
  }'
```

**Error Response**:
```json
{
  "error": {
    "message": "Name, category, unit, and average price are required"
  }
}
```

**Files Involved**:
- `backend/src/validation/schemas.ts` (line 160-166) - Schema says optional
- `backend/src/controllers/ingredient.controller.ts` (line 156-158) - Controller requires them

**Impact**: Cannot create ingredients without knowing the exact controller requirements

---

## Successful Tests

### ✓ Test #1: Backend Health Check
**Status**: PASSED
**Endpoint**: `GET /health`
**Response Time**: ~18ms
**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-03-15T22:24:44.279Z",
  "uptime": 11117.601135167
}
```

---

### ✓ Test #2: Frontend Accessibility
**Status**: PASSED
**URL**: http://localhost:5173
**Response**: HTML page loads correctly with React app

---

### ✓ Test #3: User Registration (with correct fields)
**Status**: PASSED
**Endpoint**: `POST /api/auth/register`
**Test Data**:
```json
{
  "email": "testuser@example.com",
  "password": "TestPassword123!",
  "familyName": "Smith Family"
}
```
**Response**: 
- User created successfully
- Access token received
- Refresh token received
- User ID: `645a4438-8561-4f5b-b7c4-186c8d76efde`

---

### ✓ Test #4: User Login
**Status**: PASSED
**Endpoint**: `POST /api/auth/login`
**Test Data**:
```json
{
  "email": "testuser@example.com",
  "password": "TestPassword123!"
}
```
**Response**:
- Login successful
- New access token received
- New refresh token received
- Password verification working correctly

---

### ✓ Test #5: Ingredient List Retrieval
**Status**: PASSED
**Endpoint**: `GET /api/ingredients?limit=5`
**Response**: 
- 31 total ingredients in database
- Pagination working correctly
- Sample ingredients include: Black Pepper, Butter, Cheese, Chicken Breast, Dijon mustard

---

### ✓ Test #6: Recipe List Retrieval
**Status**: PASSED
**Endpoint**: `GET /api/recipes?limit=50`
**Response**:
- 1 recipe in database (Test Spaghetti Bolognese)
- Recipe includes full ingredient details
- Recipe includes ratings (average: 5, count: 1)
- Pagination working correctly

---

## Tests Pending

### Pending Test #1: Recipe Creation
**Status**: NOT TESTED
**Reason**: Waiting to document current state before creating test data
**Next Steps**: Test recipe creation with proper ingredient IDs

---

### Pending Test #2: Meal Plan Creation
**Status**: NOT TESTED
**Dependencies**: Need recipes first
**Requirements**: 
- Create meal plan for 2 weeks
- Assign recipes to specific dates
- Test different meal types (breakfast, lunch, dinner)

---

### Pending Test #3: Grocery List Generation
**Status**: NOT TESTED
**Dependencies**: Need meal plan first
**Requirements**:
- Generate grocery list from meal plan
- Test ingredient aggregation
- Test pantry integration

---

### Pending Test #4: Recipe Import from URL
**Status**: NOT TESTED
**Requirements**: Test the recipe scraping functionality

---

### Pending Test #5: Image Caching
**Status**: NOT TESTED
**Requirements**: Test IndexedDB caching for recipe images

---

### Pending Test #6: Offline PWA Functionality
**Status**: NOT TESTED
**Requirements**: Test service worker and offline capabilities

---

### Pending Test #7: Pantry Management
**Status**: NOT TESTED
**Requirements**: 
- Add items to pantry
- Update quantities
- Track expiration dates

---

### Pending Test #8: Family Member Management
**Status**: NOT TESTED
**Requirements**:
- Add family members
- Set dietary restrictions
- Track preferences

---

## Database State

### Current Users
- testuser@example.com (Smith Family) - Created during testing

### Current Recipes
- Test Spaghetti Bolognese (1 recipe)
- Kid-friendly: Yes
- Difficulty: Easy
- Meal Type: Dinner

### Current Ingredients
- 31 ingredients available
- Categories: protein, dairy, produce, grains, spices
- All have pricing information

---

## Recommendations for Smith Family Meal Plan Testing

### Phase 1: Recipe Creation
1. Create 20-25 recipes covering:
   - Kid-friendly dinners (Tuesday/Wednesday)
   - Weekend breakfasts
   - Weekend lunches
   - Weeknight dinners
   - Sunday roasts/braises

### Phase 2: Meal Plan Setup
1. Create Week 1 meal plan (March 17-23, 2026)
2. Create Week 2 meal plan (March 24-30, 2026)
3. Assign recipes to specific dates and meal types

### Phase 3: Grocery List Testing
1. Generate grocery list for Week 1
2. Generate grocery list for Week 2
3. Test pantry integration
4. Test shopping list updates

### Phase 4: Family Workflow Testing
1. Add family members (2 adults, 2 teenagers)
2. Set dietary restrictions
3. Test recipe filtering based on preferences

---

## Notes

- JWT tokens expire after 15 minutes (access token)
- Refresh tokens expire after 7 days
- Redis caching is active and working
- Logging is comprehensive and helpful for debugging
- Error handling provides good stack traces

---

## Next Testing Session

**Focus Areas**:
1. Complete recipe creation workflow
2. Test meal plan creation and management
3. Test grocery list generation
4. Document any additional issues found

**Estimated Time**: 30-45 minutes

---

**Log Updated**: 2026-03-15T22:28:30Z

---

## Issue #6: Recipe Import "Edit Before Saving" Shows Empty Screen
**Severity**: High
**Component**: Frontend - Recipe Import Workflow
**Status**: Documented
**Reported By**: User Testing

**Description**:
When importing a recipe from URL and clicking "Edit Before Saving", the user is taken to an empty edit screen instead of a pre-populated form with the harvested recipe data.

**Expected Behavior**:
1. User imports recipe from URL
2. System scrapes and parses recipe data
3. User clicks "Edit Before Saving"
4. Edit screen should display with all harvested fields pre-populated:
   - Title
   - Description
   - Prep time
   - Cook time
   - Servings
   - Ingredients list
   - Instructions
   - Any other scraped data
5. User can review, adjust, and move data around
6. User saves the edited recipe

**Actual Behavior**:
- User clicks "Edit Before Saving"
- Navigates to edit screen
- Screen is empty/blank
- Harvested data is lost

**Impact**: 
- Users cannot review imported recipes before saving
- Must manually re-enter all data
- Defeats the purpose of recipe import feature

**Root Cause** (Suspected):
- Navigation to edit screen doesn't pass the imported recipe data
- Edit screen doesn't receive or handle pre-populated data
- State management issue between import and edit pages

**Files Involved**:
- `frontend/src/pages/ImportRecipe.tsx`
- `frontend/src/pages/CreateRecipe.tsx` (or edit page)
- Navigation/routing logic

**Recommendation**:
1. Pass imported recipe data via navigation state or Redux store
2. Edit page should check for pre-populated data on mount
3. Display all harvested fields in editable form
4. Allow user to confirm or modify before final save

---

## Issue #7: Recipe Text Paste Parser Feature Request
**Severity**: Medium (Enhancement)
**Component**: Frontend - Recipe Creation
**Status**: Feature Request
**Reported By**: User Testing

**Description**:
Add ability to paste a block of recipe text and have the system parse it into structured fields.

**Requested Behavior**:
1. User has recipe text (from email, document, etc.)
2. User pastes entire text block into a text area
3. System uses AI/parsing logic to extract:
   - Recipe title
   - Ingredients list
   - Instructions/steps
   - Prep/cook times
   - Servings
   - Other metadata
4. System displays parsed data in a confirmation screen
5. User reviews and confirms field mapping
6. User can adjust any incorrectly parsed fields
7. User saves the recipe

**Benefits**:
- Faster recipe entry
- Reduces manual typing
- Handles various recipe formats
- User maintains control with confirmation step

**Implementation Considerations**:
- Use LLM/AI for intelligent parsing
- Support multiple recipe text formats
- Provide clear visual feedback on parsing confidence
- Allow easy field remapping
- Handle edge cases gracefully

**Priority**: Medium - Nice to have for better UX

---

**Log Updated**: 2026-03-15T22:40:00Z

---

## Issue #8: Recipe Import Fails for AllRecipes.com
**Severity**: High
**Component**: Backend - Recipe Import Service
**Status**: Documented
**Reported By**: User Testing

**Description**:
Recipe import fails when trying to import from AllRecipes.com with error "No application/ld+json tags found".

**Test Case**:
- URL: https://www.allrecipes.com/recipe/236601/chef-johns-corned-beef-and-cabbage/
- Error: "Recipe import failed: No application/ld+json tags found"

**Backend Logs**:
```
2026-03-15 17:41:27 [info]: Importing recipe from URL: https://www.allrecipes.com/recipe/236601/chef-johns-corned-beef-and-cabbage/
2026-03-15 17:41:27 [error]: Failed to import recipe from URL: No application/ld+json tags found
2026-03-15 17:41:27 [error]: Recipe import error: Recipe import failed: No application/ld+json tags found
```

**Root Cause**:
The recipe import service only looks for structured data in `application/ld+json` format. AllRecipes may:
1. Not include ld+json structured data
2. Use a different structured data format
3. Have changed their page structure
4. Require different parsing logic

**Impact**:
- Cannot import recipes from AllRecipes.com (major recipe source)
- Users must manually enter recipes from this popular site
- Limits usefulness of import feature

**Recommendation**:
1. Add fallback parsing methods:
   - Check for other structured data formats (microdata, RDFa)
   - Implement HTML scraping as fallback
   - Use CSS selectors specific to AllRecipes layout
2. Add support for multiple recipe sites with site-specific parsers
3. Provide better error messages to user
4. Consider using a recipe parsing library that handles multiple formats

**Files Involved**:
- `backend/src/services/recipeImport.service.ts`
- `backend/src/controllers/recipeImport.controller.ts`

**Priority**: High - AllRecipes is a major recipe source

---

**Log Updated**: 2026-03-15T22:41:30Z

---

## ✓ Successful Test: NY Times Recipe Import Works
**Status**: PASSED
**Component**: Backend - Recipe Import Service
**Tested By**: User Testing

**Test Case**:
- URL: https://cooking.nytimes.com/recipes/1020074-corned-beef-and-cabbage
- Result: SUCCESS

**Backend Logs**:
```
2026-03-15 17:42:07 [info]: Importing recipe from URL: https://cooking.nytimes.com/recipes/1020074-corned-beef-and-cabbage
2026-03-15 17:42:07 [info]: Successfully imported recipe: Corned Beef and Cabbage
2026-03-15 17:42:07 [info]: POST /url 200
```

**Observation**:
NY Times Cooking recipes import successfully because they include proper `application/ld+json` structured data that the import service can parse.

**Recommendation**:
- Document which recipe sites work (NY Times, etc.)
- Add fallback parsing for sites without structured data (AllRecipes, etc.)
- Consider adding a "Supported Sites" list in the UI

---

## Recipe Import Site Compatibility

### ✓ Working Sites:
- **NY Times Cooking** (cooking.nytimes.com) - Has ld+json structured data

### ✗ Not Working Sites:
- **AllRecipes** (allrecipes.com) - Missing ld+json, needs HTML scraping fallback

### Untested Sites:
- Food Network
- Bon Appétit  
- Serious Eats
- Epicurious
- BBC Good Food
- Tasty
- Budget Bytes

**Recommendation**: Test popular recipe sites and document compatibility

---

**Log Updated**: 2026-03-15T22:42:15Z

---

## Issue #9: Recipe Import Save Fails with 400 Error
**Severity**: High
**Component**: Backend - Recipe Import Save

### ✗ Food Network - JSON Parse Error
**URL Tested**: https://www.foodnetwork.com/recipes/ina-garten/irish-soda-bread-recipe-1949134
**Error**: "Unexpected non-whitespace character after JSON at position 29226"
**Issue**: Malformed JSON in ld+json data or parsing error
**Status**: NOT WORKING

### ⚠️ Delish - Import Works, Save Fails
**URL Tested**: https://www.delish.com/cooking/recipe-ideas/a70624433/pistachio-tiramisu-recipe/
**Import Status**: SUCCESS - "Successfully imported recipe: Pistachio Tiramisu"
**Save Status**: FAILED - 400 error, "missing required fields" with no indication which
**Issue**: Same save validation problem as NY Times

### ⚠️ Jewel-Osco - Import Works, Save Fails
**URL Tested**: https://www.jewelosco.com/meal-plans-recipes/shop/slow-cooker-corned-beef-cabbage-garlic-parsley-butter
**Import Status**: SUCCESS - "Successfully imported recipe: Slow Cooker Corned Beef & Cabbage with Garlic-Parsley Butter"
**Save Status**: FAILED - 400 error, "missing required fields"
**Issue**: Same save validation problem
**Status**: PARTIAL - Import works, save broken
**Note**: This is significant because Jewel-Osco is the target grocery store for pricing integration

**Status**: PARTIAL - Import works, save broken


**Status**: Documented
**Reported By**: User Testing

**Description**:
After successfully importing a recipe from NY Times, attempting to save it results in a 400 Bad Request error.

**Test Case**:
1. Import recipe from: https://cooking.nytimes.com/recipes/1020074-corned-beef-and-cabbage
2. Recipe imports successfully
3. Click "Save" or "Save Imported Recipe"
4. Error: 400 Bad Request

**Backend Logs**:
```
2026-03-15 17:42:19 [info]: POST /api/recipes/import/url/save
2026-03-15 17:42:19 [warn]: POST /url/save 400
```

**Impact**:
- Recipe imports successfully but cannot be saved
- User loses imported recipe data
- Import feature is non-functional end-to-end

**Root Cause** (Suspected):
- Validation error on save endpoint
- Missing required fields in imported data
- Data format mismatch between import and save
- Ingredient mapping issues

**Recommendation**:
1. Check what validation is failing (need error message in logs)
2. Ensure imported recipe data matches save schema
3. Handle ingredient creation/mapping during import
4. Provide detailed error messages to user
5. Add better logging to identify exact validation failure

**Files Involved**:
- `backend/src/controllers/recipeImport.controller.ts`
- `backend/src/validation/schemas.ts`


---

## Issue #10: Recipe Save Error - No Field Validation Feedback
**Severity**: High
**Component**: Frontend - Recipe Form Validation
**Status**: Documented
**Reported By**: User Testing

**Description**:
When trying to save an imported recipe, the form shows "missing required fields" error but:
- No fields are visually highlighted as required
- No indication of which specific fields are missing
- All visible fields appear to be populated
- User cannot identify what needs to be fixed

**User Experience**:
1. Import NY Times recipe successfully
2. All visible fields are populated with data
3. Click "Save"
4. Error: "Missing required fields"
5. No visual indication of which fields are problematic
6. User is stuck and cannot proceed

**Expected Behavior**:
- Required fields should be marked with asterisk (*)

---

## Issue #11: Meal Planner - No Drag and Drop Functionality
**Severity**: High
**Component**: Frontend - Meal Planner UI
**Status**: Documented
**Reported By**: User Testing

**Description**:
The meal planner does not support drag-and-drop functionality for meal cards, making it difficult to reorganize meals.

**Expected Behavior**:
- User should be able to click and drag meal cards
- Drag meal from one day/time slot to another
- Visual feedback during drag (card follows cursor)
- Drop zones should highlight when hovering
- Meal date/time updates automatically after drop

**Actual Behavior**:
- Meal cards are static
- No drag-and-drop interaction
- Cannot move meals between days/times

**User Impact**:
- Must delete and recreate meals to change dates
- Poor UX for meal planning
- Time-consuming to reorganize weekly plans

**Recommendation**:
Implement drag-and-drop using:
- React DnD library
- HTML5 drag-and-drop API
- Or similar drag-and-drop solution

**Priority**: High - Core meal planning feature

---

## Issue #12: Meal Planner - No Date Edit or Recurrence Pattern
**Severity**: Medium
**Component**: Frontend - Meal Planner Features
**Status**: Documented
**Reported By**: User Testing

**Description**:
There is no mechanism to:
1. Edit the date/time of an existing meal
2. Set up recurring meal patterns (e.g., "Pizza every Friday")

**Missing Features**:

### 1. Edit Meal Date/Time
**Expected**:
- Click on meal card to edit
- Change date picker
- Change meal type (breakfast/lunch/dinner)
- Save changes

**Actual**:
- No edit functionality visible
- Must delete and recreate to change date

### 2. Recurrence Patterns
**Expected**:
- Option to set meal as recurring
- Patterns like:
  - "Every Friday" (Pizza night)
  - "Every Tuesday and Wednesday" (Kids cook)
  - "Every Sunday" (Family roast dinner)
  - Custom patterns
- Apply pattern to current week or multiple weeks

**Actual**:
- No recurrence functionality
- Must manually add same meal to each week

**User Impact**:
- Tedious to set up weekly patterns
- Error-prone (might forget to add recurring meals)

---

## Issue #13: Meal Planner - Copy/Paste Functionality Broken
**Severity**: High
**Component**: Frontend - Meal Planner Copy Feature
**Status**: Documented
**Reported By**: User Testing

**Description**:
The meal planner has a "Copy" button but no "Paste" functionality, making the copy feature useless.

**Current Behavior**:
- User can click "Copy" on a meal card
- No visible paste option appears
- No way to paste the copied meal to a different day/time
- Copy creates duplicate on same day/time (not useful)

**Expected Behavior**:
1. User clicks "Copy" on a meal card
2. Meal is copied to clipboard/memory
3. User navigates to different day/time slot
4. User clicks "Paste" button or right-clicks to paste
5. Copied meal appears in new location
6. User can paste same meal multiple times

**Use Cases**:
- Copy Monday's breakfast to Tuesday-Friday
- Copy a dinner recipe to multiple days
- Duplicate successful meals across weeks
- Quick meal planning without re-adding recipes

**Recommendation**:
Implement proper copy/paste:
1. Add visual indicator when meal is copied (e.g., "Meal copied" toast)
2. Add "Paste" button to empty meal slots
3. Show paste option in meal slot context menu
4. Allow keyboard shortcuts (Ctrl+C, Ctrl+V)
5. Clear clipboard after paste or add "Clear" option


---

## Issue #14: Meal Planner - No Cook Assignment Feature
**Severity**: High
**Component**: Frontend - Meal Planner
**Status**: Documented
**Reported By**: User Testing

**Description**:
There is no way to assign a family member to a meal to indicate who is responsible for cooking it.

**Missing Functionality**:
- No field to assign cook to a meal
- No dropdown to select family member
- No visual indicator of who's cooking
- Cannot track cooking responsibilities

**Expected Behavior**:
1. When adding/editing a meal, show "Assigned Cook" field
2. Dropdown lists family members
3. Select who will cook this meal
4. Meal card displays cook's name/avatar
5. Can filter meals by cook
6. Can view "My cooking days" for each family member

**Use Cases - Smith Family**:
- **Kids cook Tuesday & Wednesday dinners**
  - Need to assign kids to these meals
  - Visual reminder of their responsibility
- **Parents alternate cooking**
  - Track who cooked last
  - Fair distribution of cooking duties
- **Special occasions**
  - Assign specific person for holiday meals
  - Track who's responsible for Sunday roasts

**Benefits**:
- Clear responsibility assignment
- Fair distribution of cooking duties
- Kids can see their cooking days
- Parents can plan around who's cooking
- Accountability for meal preparation

**Database Support**:

---

## Issue #15: Add Meal - Recipe Search Not Working
**Severity**: High
**Component**: Frontend - Meal Planner Add Meal Form
**Status**: Documented
**Reported By**: User Testing

**Description**:
When adding a meal, the "Meal Name" field has placeholder text "Search for a recipe..." but it only accepts text input and doesn't actually perform a search or show recipe suggestions.

**Current Behavior**:
- Field shows placeholder: "Search for a recipe..."
- User types text
- No search is performed
- No dropdown with recipe suggestions
- No autocomplete functionality
- Just a plain text input field

**Expected Behavior**:
1. User starts typing recipe name
2. System searches existing recipes in real-time
3. Dropdown shows matching recipes
4. User can select from existing recipes OR
5. User can continue typing to create new meal name
6. Selected recipe auto-fills other fields (servings, etc.)

**User Impact**:
- Misleading placeholder text
- Cannot easily find and add existing recipes
- Must remember exact recipe names
- No way to browse available recipes while planning
- Increases chance of typos/duplicates

**Recommendation**:
Implement autocomplete/search:
1. Use MUI Autocomplete component
2. Fetch recipes as user types (debounced)
3. Show recipe list in dropdown
4. Display recipe details (cuisine, difficulty, etc.)
5. Allow selection or free text entry
6. Pre-fill form when recipe selected

**Alternative**:

---

## Issue #16: Grocery List - No Regeneration After Meal Plan Changes
**Severity**: High
**Component**: Frontend/Backend - Grocery List Management
**Status**: Feature Request
**Reported By**: User Testing

**Description**:
Grocery list generation should be asynchronous, and the system needs to detect when the meal plan has changed and prompt for regeneration before sending the order.

**Current Behavior** (Assumed):
- Grocery list generated once from meal plan
- No tracking of meal plan changes
- No indication that list is out of sync
- No regeneration prompt

**Expected Behavior**:

### 1. Asynchronous Generation
- Generate grocery list in background
- Show loading indicator
- Allow user to continue working
- Notify when complete

### 2. Change Detection
- Track meal plan last modified timestamp
- Track grocery list last generated timestamp
- Detect when meal plan is newer than grocery list
- Show "Out of Sync" indicator on grocery list

### 3. Regeneration Workflow
**When meal plan changes**:
1. Mark grocery list as "Out of Sync"
2. Show warning banner: "Meal plan has changed since this list was generated"
3. Provide "Regenerate List" button
4. Before sending order, block with: "Please regenerate list first"

**Regeneration Options**:
- "Regenerate" - Replace entire list
- "Merge Changes" - Add new items, keep checked items
- "Review Changes" - Show diff of what will change

### 4. Auto-Regeneration (Optional)
- Setting: "Auto-regenerate grocery list when meal plan changes"
- Debounced (wait 30 seconds after last change)
- Notify user: "Grocery list updated"

**Use Cases**:
- User adds meal to plan → List needs updating
- User removes meal → List has extra items
- User changes servings → Quantities wrong
- User about to order → Needs current list

**Benefits**:
- Prevents ordering wrong items
- Keeps list synchronized
- Clear user feedback
- Prevents waste/missing ingredients

---

## Issue #17: Pantry/Ingredient Categories - Incomplete and Illogical
**Severity**: Medium
**Component**: Backend - Ingredient Categories
**Status**: Documented
**Reported By**: User Testing

**Description**:
The ingredient category list is incomplete and doesn't include common food categories like "Proteins" or "Seafood". User tried to add Salmon to pantry but couldn't find an appropriate category.

**Current Categories** (from database):
- produce
- dairy
- grains
- spices
- protein (exists in DB but may not be in dropdown?)
- other

**Missing Common Categories**:
- **Seafood/Fish** - Salmon, tuna, shrimp, etc.
- **Meat** - Beef, pork, lamb (if separate from protein)
- **Poultry** - Chicken, turkey (if separate from protein)
- **Frozen Foods**
- **Canned Goods**
- **Condiments & Sauces**
- **Baking Supplies**
- **Snacks**
- **Beverages**
- **Oils & Vinegars**
- **Nuts & Seeds**
- **Bread & Bakery**
- **Deli**
- **Prepared Foods**

**Recommended Category Structure**:

### Proteins & Seafood:
- Meat (beef, pork, lamb)
- Poultry (chicken, turkey)
- Seafood (fish, shellfish)
- Eggs

### Produce:
- Fresh Vegetables
- Fresh Fruits
- Herbs

### Dairy & Refrigerated:
- Milk & Cream
- Cheese
- Yogurt & Butter
- Refrigerated Items

### Pantry Staples:
- Grains & Pasta
- Canned Goods
- Baking Supplies
- Condiments & Sauces
- Oils & Vinegars
- Spices & Seasonings

### Frozen:
- Frozen Vegetables
- Frozen Fruits
- Frozen Meals
- Ice Cream

### Beverages:
- Non-Alcoholic
- Alcoholic

### Snacks & Sweets:
- Snacks
- Candy & Chocolate
- Cookies & Crackers

### Bakery:
- Bread

---

## Issue #18: Recipe Display - Ingredients Show Placeholder Text
**Severity**: High
**Component**: Frontend - Recipe Detail Display
**Status**: Documented
**Reported By**: User Testing

**Description**:
The Spaghetti Bolognese recipe displays placeholder text instead of actual ingredients.

**Current Behavior**:
- Recipe detail page shows placeholder text for ingredients
- Actual ingredient data exists in database (confirmed by API logs)
- Frontend not rendering ingredient list properly

**Expected Behavior**:
- Display actual ingredient list with quantities and units
- Format: "1 lb Ground Beef", "2 cups Tomato (diced)", etc.
- Show ingredient categories
- Indicate optional ingredients

**Impact**:
- Users cannot see what ingredients are needed
- Cannot use recipe for cooking
- Cannot add to grocery list properly

**Priority**: High - Core recipe functionality broken

---

## Issue #19: "Add to Grocery List" Button Does Nothing
**Severity**: Critical
**Component**: Frontend/Backend - Recipe to Grocery List
**Status**: Documented
**Reported By**: User Testing

**Description**:
Clicking "Add to Grocery List" on a recipe navigates to the grocery list page but doesn't actually add any ingredients.

**Current Behavior**:
1. User views recipe
2. Clicks "Add to Grocery List"
3. App navigates to grocery list page
4. No items added to list
5. No visible change

**Expected Behavior**:
1. User clicks "Add to Grocery List"
2. System adds all recipe ingredients to active grocery list
3. Shows confirmation: "5 ingredients added to grocery list"
4. Navigates to grocery list
5. New items visible with quantities
6. User can:
   - Adjust quantities
   - Remove items they already have
   - Mark items as "have in pantry"

**Advanced Expected Behavior**:
- **Pantry Integration**: 
  - Check pantry for existing ingredients
  - Only add items not in pantry OR
  - Show items with "In Pantry" indicator
  - If user marks "have this", update pantry inventory
  
- **Quantity Adjustment**:
  - Allow user to change quantities before adding
  - Support scaling (e.g., "I'm making 2x this recipe")
  
- **Smart Aggregation**:
  - If ingredient already in list, add quantities
  - Example: List has "1 lb beef", recipe needs "2 lb beef" → Update to "3 lb beef"

**Use Case Flow**:
```
1. User: "Add to Grocery List"
2. System: Shows modal with ingredients
3. User: Reviews list, sees "Tomato - 2 cups"
4. User: Checks "I have this" → Updates pantry

---

## Issue #20: "Add to Meal Plan" - Poor UX and No Context
**Severity**: High
**Component**: Frontend - Recipe to Meal Plan Workflow
**Status**: Documented
**Reported By**: User Testing

**Description**:
Clicking "Add to Meal Plan" on a recipe navigates to the meal planner but provides no context about what's being added and no clear way to complete the action.

**Current Behavior**:
1. User views Spaghetti Bolognese recipe
2. Clicks "Add to Meal Plan"
3. App navigates to meal planner page
4. No indication of what recipe is being added
5. No clear next steps
6. User is confused about how to proceed

**Expected Behavior**:

### Option 1: Modal/Dialog Approach
1. User clicks "Add to Meal Plan"
2. Modal appears showing:
   - Recipe name: "Spaghetti Bolognese"
   - Recipe image thumbnail
   - "Select meal occasions to add this recipe:"
3. Calendar/grid view showing available meal slots
4. User clicks one or more meal occasions:
   - "Monday Dinner"
   - "Wednesday Dinner"
   - etc.
5. Each click adds recipe to that slot
6. Visual confirmation (checkmark or highlight)
7. Buttons:
   - "Add to Selected Meals" (primary)
   - "Cancel"
8. Success message: "Spaghetti Bolognese added to 2 meals"
9. Option to "View Meal Plan" or "Close"

### Option 2: Inline Selection
1. User clicks "Add to Meal Plan"
2. Navigate to meal planner
3. Show banner at top:
   - "Adding: Spaghetti Bolognese [image]"
   - "Click any meal slot to add this recipe"
   - "Click 'Done' when finished"
4. Meal slots highlight on hover
5. Click slot → Recipe added with confirmation
6. Can click multiple slots
7. "Done" button to finish and clear selection mode

### Option 3: Quick Add Dropdown
1. User clicks "Add to Meal Plan"
2. Dropdown appears with:
   - "This Week"
   - "Next Week"
   - "Choose Date..."
3. Select week → Shows meal grid for that week
4. Click meal slot(s) to add
5. Confirm and close

**Key Requirements**:
- **Context**: Always show what recipe is being added
- **Visual Feedback**: Clear indication of selection mode
- **Multiple Additions**: Allow adding to multiple meals at once
- **Confirmation**: Show success message with details
- **Easy Exit**: Clear way to cancel or finish


---

## Issue #21: Dashboard - Recent Activity Not Populating
**Severity**: Medium
**Component**: Frontend - Dashboard
**Status**: Documented
**Reported By**: User Testing

**Description**:
The Dashboard's "Recent Activity" section is empty despite user having performed multiple actions (created meal plan, added meals, viewed recipes, etc.).

**Current Behavior**:
- Dashboard shows "Recent Activity" section
- Section is empty/not populating
- No activity items displayed

**Expected Behavior**:
Recent Activity should show:
- Recipes viewed
- Recipes added to meal plan
- Meal plans created/updated
- Grocery lists generated
- Recipes imported
- Pantry items added
- Recent searches

**Example Activity Items**:
```
- "Added Spaghetti Bolognese to meal plan" - 2 minutes ago
- "Created meal plan: Week 1" - 5 minutes ago
- "Imported recipe: Corned Beef and Cabbage" - 10 minutes ago
- "Viewed recipe: Pistachio Tiramisu" - 15 minutes ago
```

**Possible Causes**:
1. Activity tracking not implemented
2. Activity data not being saved
3. Frontend not fetching activity data
4. Activity API endpoint missing
5. Empty state not handled properly

**Recommendation**:
1. Implement activity logging in backend
2. Create activity feed API endpoint
3. Store user actions in database
4. Display in dashboard with timestamps
5. Add "View All Activity" link
6. Consider activity types: view, create, update, delete, import

**Priority**: Medium - Nice to have but not critical for core functionality

---

**Log Updated**: 2026-03-15T22:55:15Z
**Total Issues Documented**: 21
**User Flow Example**:
```
Recipe Page → "Add to Meal Plan" → 
Modal with calendar → 
Select "Mon Dinner" + "Wed Dinner" → 
"Add to Selected Meals" → 
Success: "Added to 2 meals" → 
"View Meal Plan" or "Close"
```

**Priority**: High - Core workflow has poor UX

---

**Log Updated**: 2026-03-15T22:54:45Z
5. User: Adjusts "Ground Beef" from 1 lb to 2 lb
6. User: Clicks "Add to List"
7. System: Adds items, updates pantry
8. System: Shows "3 items added, 2 already in pantry"
```

**Implementation Needs**:
1. Add ingredients to grocery list endpoint
2. Check pantry before adding
3. Aggregate duplicate ingredients
4. Update pantry when user indicates they have items
5. Show confirmation with details
6. Handle errors gracefully

**Priority**: Critical - Core workflow completely broken

---

**Log Updated**: 2026-03-15T22:53:25Z
- Baked Goods

### Other:
- Deli
- Prepared Foods
- Miscellaneous

**Grocery Store Alignment**:
Categories should match typical grocery store layout (like Jewel-Osco) for easier shopping:
1. Produce
2. Meat & Seafood
3. Dairy
4. Frozen
5. Bakery
6. Deli
7. Pantry/Center Store
8. Beverages
9. Snacks

**Implementation**:
1. Update database enum or category table
2. Update frontend dropdowns
3. Migrate existing ingredients to new categories
4. Allow custom categories (optional)
5. Map to store sections for shopping list organization

**Priority**: Medium - Affects usability but workarounds exist (use "other")

---

**Log Updated**: 2026-03-15T22:50:25Z

**Implementation Considerations**:
1. Add `mealPlanUpdatedAt` and `listGeneratedAt` timestamps
2. Compare timestamps to detect sync status
3. Add regeneration endpoint
4. Show sync status in UI
5. Block order submission if out of sync
6. Consider merge strategies for partial updates

**Priority**: High - Critical for grocery ordering workflow

---

**Log Updated**: 2026-03-15T22:49:40Z
If search is not implemented:
- Change placeholder to "Enter meal name"
- Add separate "Browse Recipes" button
- Link to recipe list with "Add to Meal Plan" action

**Priority**: High - Misleading UI and poor UX

---

**Log Updated**: 2026-03-15T22:48:20Z
Looking at the schema, `planned_meals` table has `assigned_cook` field, so backend supports this - just missing in UI!

**Recommendation**:
1. Add "Assigned Cook" dropdown to meal form
2. Fetch family members from API
3. Display cook name on meal card
4. Add filter: "Show only my meals"
5. Add cook avatar/icon for visual identification
6. Consider color-coding by cook

**Priority**: High - Critical for Smith Family workflow (kids cooking Tues/Wed)

---

**Log Updated**: 2026-03-15T22:47:40Z
**Alternative Solution**:
If copy/paste is too complex, consider:
- "Duplicate to..." button with date/time picker
- "Copy to multiple days" with day selector
- Drag-and-drop with Ctrl key to copy instead of move

**Priority**: High - Copy without paste is a broken feature

---

**Log Updated**: 2026-03-15T22:47:20Z
- Time-consuming for meal planning
- Doesn't support family routines (like "Pizza Friday")

**Use Cases**:
- Smith Family needs:
  - Kids cook Tuesday & Wednesday
  - Pizza every Friday
  - Sunday roast dinners
  - Weekend family breakfasts

**Recommendation**:
1. Add edit modal/dialog for meal cards
2. Implement recurrence pattern selector
3. Add "Apply to all weeks" option
4. Show recurring meal indicators on calendar

**Priority**: Medium - Important for usability but workarounds exist

---

**Log Updated**: 2026-03-15T22:46:50Z
- Missing/invalid fields should be highlighted in red
- Error message should specify which fields are missing
- Example: "Missing required fields: Meal Type, Difficulty"
- Form should scroll to first error field

**Actual Behavior**:
- Generic error message
- No visual feedback
- No field highlighting
- User cannot identify the problem

**Root Cause** (Suspected):
- Frontend validation not matching backend requirements
- Missing field validation UI feedback
- Error messages not being parsed/displayed properly
- Hidden required fields not visible in form

**Impact**:
- Users cannot save imported recipes
- Poor user experience
- No way to debug what's wrong
- Blocks recipe import workflow

**Recommendation**:
1. Add visual indicators for required fields
2. Highlight invalid/missing fields in red
3. Show specific error messages per field
4. Add form-level error summary
5. Ensure frontend validation matches backend schema
6. Check for hidden required fields (cuisineType, mealType, difficulty, etc.)

**Files Involved**:
- `frontend/src/pages/ImportRecipe.tsx`
- `frontend/src/pages/CreateRecipe.tsx`
- Form validation logic

**Priority**: High - Blocks user workflow with no clear resolution path

---

**Log Updated**: 2026-03-15T22:43:45Z
**Priority**: Critical - Blocks entire recipe import workflow

---

**Log Updated**: 2026-03-15T22:42:25Z

---

## Issue #22: Cannot Select Multiple Meal Types for Recipe

**Severity**: Medium  
**Component**: Recipe Creation Form - Basic Info  
**Date Found**: 2026-03-15

### Description
When creating or editing a recipe, users can only select ONE meal type (breakfast, lunch, dinner, snack, or dessert). Many recipes are suitable for multiple meal types (e.g., eggs can be breakfast or lunch, soup can be lunch or dinner).

### Current Behavior
- Meal Type field is a single-select dropdown
- User can only choose one option: breakfast, lunch, dinner, snack, or dessert
- No way to indicate a recipe works for multiple meal types

### Expected Behavior
- Meal Type should allow multiple selections
- User should be able to check multiple meal types (e.g., both "lunch" and "dinner")
- UI should clearly show all selected meal types

### Steps to Reproduce
1. Navigate to Create Recipe page
2. In Basic Info step, locate "Meal Type" field
3. Try to select multiple meal types
4. Observe: Can only select one at a time

### Technical Details
**File**: `frontend/src/pages/CreateRecipe.tsx`
- Line 68: `mealType` defined as single string value
- Lines 451-466: Rendered as single-select TextField
- Should be: Array of strings with multi-select component

**Database Schema**: Need to verify if `mealType` column supports arrays or if it needs migration

### Impact
- **User Experience**: Limits recipe categorization flexibility
- **Search/Filter**: Users may miss recipes that fit their meal planning needs
- **Real-world Use**: Many recipes work for multiple meals (e.g., breakfast burrito, soup, salad)

### Recommendations
1. **Backend**: Check if database schema supports array of meal types or needs migration
2. **Frontend**: Replace single-select TextField with multi-select Autocomplete or checkbox group
3. **API**: Update validation schema to accept array of meal types
4. **Display**: Show all applicable meal types as chips on recipe cards

### Priority
**P1 - High**: Common use case that affects recipe organization and discoverability

---

## Issue #23: Cannot Add New Ingredients During Recipe Creation

**Severity**: High  
**Component**: Recipe Creation Form - Ingredients Step  
**Date Found**: 2026-03-15

### Description
When adding ingredients to a recipe, users can ONLY select from ingredients that already exist in the database. There is no way to create a new ingredient on-the-fly during recipe creation. This forces users to:
1. Exit recipe creation
2. Navigate to a separate ingredient management page (if it exists)
3. Create the ingredient
4. Return to recipe creation
5. Start over or continue

### Current Behavior
- Ingredient field is an Autocomplete with strict selection from existing ingredients
- If an ingredient doesn't exist in the database, user cannot add it
- No "Add New Ingredient" button or inline creation option
- Workflow is broken and frustrating

### Expected Behavior
- User should be able to type a new ingredient name
- System should either:
  - **Option A**: Allow inline ingredient creation with category/unit selection
  - **Option B**: Show "Create new ingredient: [name]" option in dropdown
  - **Option C**: Use `freeSolo` mode to allow any text, create ingredient on recipe save
- Seamless workflow without leaving recipe creation

### Steps to Reproduce
1. Navigate to Create Recipe page
2. Proceed to Ingredients step
3. Try to add an ingredient not in the database (e.g., "Dragon Fruit")
4. Observe: Cannot add it, no option to create new ingredient

### Technical Details
**File**: `frontend/src/pages/CreateRecipe.tsx`
- Lines 535-550: Autocomplete component for ingredient selection
- No `freeSolo` prop enabled
- No inline creation dialog or form
- `handleAddIngredient` (lines 255-289) requires existing ingredient ID

**Missing Features**:
- Inline ingredient creation form/dialog
- API call to create ingredient on-the-fly
- Category and unit selection for new ingredients

### Impact
- **Critical Blocker**: Users cannot create recipes with uncommon ingredients
- **User Experience**: Extremely frustrating workflow interruption
- **Adoption**: May prevent users from adding their favorite recipes
- **Data Quality**: Users may select wrong "close enough" ingredients instead

### Recommendations
1. **Quick Fix**: Enable `freeSolo` mode and create ingredients automatically with default category
2. **Better Solution**: Add inline ingredient creation:
   - Show "+ Create new ingredient: [name]" option in dropdown
   - Open dialog with category and unit selection
   - Create ingredient via API
   - Add to recipe immediately
3. **Best Solution**: Dedicated "Quick Add Ingredient" button that opens modal form

### Priority
**P0 - Critical**: Blocks recipe creation workflow for any non-standard ingredients

### Related Issues
- Issue #16: Incomplete ingredient categories
- Need robust ingredient management before this can be fully solved

---

## Issue #24: Ingredient Duplication and Lack of Clustering/Normalization

**Severity**: High  
**Component**: Ingredient Management System  
**Date Found**: 2026-03-15

### Description
The ingredient database lacks deduplication and clustering logic, leading to redundant and confusing entries. For example, "butter" and "Salted butter" exist as separate ingredients when they should be variants of the same base ingredient. Without proper normalization, the ingredient list will become unwieldy and difficult to manage.

### Current Behavior
- Each ingredient variation is a separate database entry
- No parent-child or variant relationships
- Examples of duplication:
  - "butter" vs "Salted butter" (should be: butter with salted/unsalted variants)
  - Likely similar issues with: milk (whole/2%/skim), cheese types, etc.
- Users must choose between similar ingredients without clear guidance
- Grocery lists will have redundant entries

### Expected Behavior
**Option A - Variant System**:
- Base ingredient: "Butter"
- Variants: "salted" or "unsalted" (stored as attribute)
- Brand-specific only when necessary (e.g., "Kerrygold Butter")

**Option B - Clustering with Aliases**:
- Primary ingredient: "Butter (salted)"
- Aliases/synonyms: "salted butter", "butter, salted"
- Deduplication on search and display

**Option C - Hierarchical Structure**:
- Category: Dairy → Butter
- Types: Salted, Unsalted, Clarified, Ghee
- Brands: (optional) Kerrygold, Land O'Lakes, etc.

### Real-World Examples
**Butter**:
- Should have: 2 main types (salted, unsalted)
- Brand callouts only when recipe-specific

**Milk**:
- Types: Whole, 2%, 1%, Skim, Lactose-free
- Not separate ingredients

**Cheese**:
- Base: Cheddar
- Variants: Sharp, Mild, Extra Sharp
- Forms: Block, Shredded, Sliced

### Impact
- **Data Quality**: Database will become cluttered with duplicates
- **User Confusion**: Which "butter" should I choose?
- **Grocery Lists**: May show "butter" and "salted butter" as separate items
- **Search/Filter**: Harder to find ingredients
- **Pantry Management**: Duplicate tracking of same ingredient
- **Recipe Import**: May create more duplicates from different recipe sources

### Technical Considerations
**Database Schema Changes Needed**:
1. Add `baseIngredientId` (self-referencing foreign key for variants)
2. Add `variant` field (e.g., "salted", "unsalted", "2%")
3. Add `aliases` field (JSON array of alternative names)
4. Add `brandName` field (optional, for brand-specific ingredients)

**Application Logic Needed**:
1. **Fuzzy Matching**: Detect similar ingredient names during creation
2. **Deduplication Suggestions**: "Did you mean: Butter (salted)?"
3. **Smart Search**: Search across base ingredient + variants + aliases
4. **Grocery List Consolidation**: Combine variants when generating lists
5. **Import Normalization**: Map imported ingredients to existing base ingredients

**UI/UX Changes**:
1. Ingredient creation: Suggest existing similar ingredients
2. Recipe creation: Show variants grouped under base ingredient
3. Grocery list: Option to consolidate variants or keep separate
4. Pantry: Track variants separately but display grouped

### Steps to Reproduce
1. Navigate to ingredient list or Prisma Studio
2. Search for "butter"
3. Observe: Multiple butter entries without clear relationship
4. Try to add recipe with butter
5. Confusion: Which butter entry to use?

### Recommendations

**Phase 1 - Immediate (Data Cleanup)**:
1. Audit current ingredients for duplicates
2. Manually consolidate obvious duplicates
3. Establish naming conventions (e.g., "Butter (salted)" not "Salted butter")

**Phase 2 - Short Term (Prevention)**:
1. Add fuzzy matching on ingredient creation
2. Show "Similar ingredients exist" warning
3. Require admin approval for new ingredients

**Phase 3 - Long Term (Proper Solution)**:
1. Implement variant system in database schema
2. Build ingredient clustering algorithm
3. Create ingredient management admin interface
4. Add bulk deduplication tools
5. Implement smart grocery list consolidation

**Phase 4 - Advanced (ML/AI)**:
1. Use NLP to detect ingredient similarities
2. Auto-suggest variant relationships
3. Learn from user corrections
4. Auto-normalize imported recipe ingredients

### Priority
**P1 - High**: Will become critical as ingredient database grows. Better to solve early than migrate later.

### Related Issues
- Issue #23: Cannot add new ingredients (will make duplication worse)
- Issue #16: Incomplete ingredient categories (related to organization)
- Issue #1: Recipe import save failures (may create duplicate ingredients)

### Example Data Structure
```typescript
// Proposed schema
interface Ingredient {
  id: string;
  name: string; // "Butter"
  baseIngredientId?: string; // null for base, ID for variants
  variant?: string; // "salted", "unsalted", "2%", etc.
  brandName?: string; // "Kerrygold" (optional)
  aliases: string[]; // ["salted butter", "butter, salted"]
  category: string;
  unit: string;
  // ... other fields
}

// Display name generation:
// Base: "Butter"
// Variant: "Butter (salted)"
// Brand: "Kerrygold Butter (salted)"
```

### User Quote
> "Right now we have 'butter' and 'Salted butter' but really there's only 2 kinds of butter (salted and unsalted) unless a specific brand needs to be called out"

---

## Issue #25: Instructions Input Too Rigid - Need Bulk Text Paste with Auto-Parsing

**Severity**: Medium  
**Component**: Recipe Creation Form - Instructions Step  
**Date Found**: 2026-03-15

### Description
The current instructions interface requires users to manually click "Add Step" for each instruction, then type into individual text fields. This is tedious and doesn't match how people naturally work with recipes. Users should be able to paste a block of text and have the system automatically parse it into steps.

### Current Behavior
- User must click "Add Step" button for each instruction
- Each step has its own text field
- No way to paste multiple instructions at once
- Very manual, click-heavy workflow
- Lines 627-662 in CreateRecipe.tsx

### Expected Behavior

**Primary Mode - Bulk Text Input**:
- Large text area where users can type or paste entire instruction block
- System auto-detects steps based on:
  - Numbered lines (1., 2., 3. or 1), 2), 3))
  - Line breaks (each paragraph = step)
  - Bullet points (•, -, *)
- Real-time preview showing parsed steps
- Edit button to switch to manual step-by-step mode

**Advanced Mode - Staged Instructions** (Optional):
- Allow users to define stages: Prep, Cooking, Rising, Resting, Cooling, Freezing
- Each stage can have multiple steps
- Useful for complex recipes (bread, fermentation, multi-day recipes)

**Example Input**:
```
1. Preheat oven to 350°F
2. Mix flour, sugar, and salt in large bowl
3. In separate bowl, beat eggs and add milk
4. Combine wet and dry ingredients
5. Pour into greased pan and bake 30 minutes
```

**Auto-Parsed Output**:
- Step 1: Preheat oven to 350°F
- Step 2: Mix flour, sugar, and salt in large bowl
- Step 3: In separate bowl, beat eggs and add milk
- Step 4: Combine wet and dry ingredients
- Step 5: Pour into greased pan and bake 30 minutes

### Steps to Reproduce
1. Navigate to Create Recipe
2. Proceed to Instructions step
3. Try to paste multiple instructions at once
4. Observe: Must manually add each step individually

### Impact
- **User Experience**: Tedious, time-consuming workflow
- **Recipe Entry**: Discourages users from adding detailed instructions
- **Copy/Paste**: Can't easily import instructions from existing recipes
- **Efficiency**: 10+ clicks for a 10-step recipe vs. 1 paste

### Technical Implementation

**UI Changes Needed**:
```typescript
// Add mode toggle
const [instructionMode, setInstructionMode] = useState<'bulk' | 'manual'>('bulk');

// Bulk text state
const [bulkInstructions, setBulkInstructions] = useState('');

// Parser function
const parseInstructions = (text: string): InstructionStep[] => {
  // Split by numbered lines, bullets, or double line breaks
  const lines = text.split(/\n+/);
  return lines
    .map((line, index) => {
      // Remove numbering: "1.", "1)", etc.
      const cleaned = line.replace(/^\d+[\.\)]\s*/, '').trim();
      return cleaned ? { step: index + 1, instruction: cleaned } : null;
    })
    .filter(Boolean);
};
```

**UI Layout**:
```
┌─────────────────────────────────────────┐
│ Cooking Instructions                     │
│                                          │
│ [Bulk Text] [Step-by-Step] ← Mode Toggle│
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ Paste or type instructions here...  │ │
│ │                                      │ │
│ │ 1. Preheat oven to 350°F            │ │
│ │ 2. Mix dry ingredients              │ │
│ │ 3. Combine wet ingredients          │ │
│ │ ...                                  │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ Preview (5 steps detected):              │
│ ✓ Step 1: Preheat oven to 350°F        │
│ ✓ Step 2: Mix dry ingredients           │
│ ✓ Step 3: Combine wet ingredients      │
│ ...                                      │
└─────────────────────────────────────────┘
```

**Advanced Features** (Future):
1. **Stage Support**:
   ```
   [Prep]
   1. Chop vegetables
   2. Measure ingredients
   
   [Cooking]
   3. Heat oil in pan
   4. Sauté onions
   
   [Resting]
   5. Let cool for 10 minutes
   ```

2. **Smart Detection**:
   - Detect time mentions: "30 minutes", "overnight"
   - Detect temperature: "350°F", "medium heat"
   - Highlight ingredients mentioned in instructions

3. **Import from URL**:
   - If recipe URL provided, auto-extract instructions
   - Parse from ld+json or HTML

### Recommendations

**Phase 1 - Quick Win**:
1. Add bulk text area with simple line-break parsing
2. Show preview of parsed steps
3. Keep manual mode as fallback

**Phase 2 - Smart Parsing**:
1. Detect numbered lists, bullets
2. Handle various numbering formats
3. Clean up common formatting issues

**Phase 3 - Advanced**:
1. Add stage support (Prep, Cook, Rest, etc.)
2. Time and temperature detection
3. Ingredient highlighting

**Phase 4 - AI Enhancement**:
1. Use NLP to improve parsing
2. Auto-suggest missing steps
3. Detect recipe structure patterns

### Priority
**P1 - High**: Significantly improves recipe entry UX and efficiency

### Related Issues
- Issue #1: Recipe import save failures (could benefit from better instruction parsing)
- Would complement recipe import workflow improvements

### User Quote
> "Allow someone to just type and or paste a block of text and infer steps, don't make the user explicitly click to add steps unless they want to specify stages like prep, cooking, rising, resting, cooling down, freezing, etc."

### Example Parsing Logic
```typescript
// Handle various formats
const formats = [
  /^\d+[\.\)]\s+(.+)$/,           // "1. Step" or "1) Step"
  /^[-•*]\s+(.+)$/,                // "- Step" or "• Step"
  /^Step\s+\d+:\s+(.+)$/i,        // "Step 1: Do this"
];

// Detect stages
const stageKeywords = [
  'prep', 'preparation', 'cooking', 'baking', 
  'rising', 'resting', 'cooling', 'freezing', 
  'marinating', 'chilling'
];
```

---

## Issue #26: Recipe Creation Redirect Fails - Goes to /recipes/undefined

**Severity**: High  
**Component**: Recipe Creation - Submit/Redirect  
**Date Found**: 2026-03-15

### Description
After successfully creating a recipe, the application redirects to `/recipes/undefined` instead of the actual recipe detail page. The recipe IS created successfully in the database, but the redirect URL is malformed.

### Evidence from Console Logs
```
:3000/api/recipes/undefined:1 Failed to load resource: 404 (Not Found)
```

### Technical Details
**File**: `frontend/src/pages/CreateRecipe.tsx` Lines 364-367

**Problem**: `response.data.id` not being returned or accessed correctly

### Impact
Recipe created but user can't view it immediately

### Priority
**P1 - High**: Confusing UX even though recipe saves successfully

---

## Issue #27: CORS Errors Blocking External Recipe Images

**Severity**: Medium  
**Component**: Image Caching System  
**Date Found**: 2026-03-15

### Description
When importing recipes with external images (e.g., from gordonramsayrestaurants.com), the browser blocks image fetching due to CORS policy. The image cache system tries to fetch and cache images directly from the frontend, which violates CORS.

### Current Behavior
```
Access to fetch at 'https://www.gordonramsayrestaurants.com/assets/...' 
from origin 'http://localhost:5173' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present
```

### Expected Behavior
- Images should be proxied through backend to avoid CORS
- OR use backend to download and serve images
- OR display external images directly without caching (accept CORS limitations)

### Technical Details
**Files**: 
- `frontend/src/utils/imageCache.ts` (line 114, 163)
- `frontend/src/hooks/useCachedImage.ts` (line 62)

**Problem**: Frontend trying to fetch cross-origin images directly

### Impact
- Recipe images fail to load
- Image caching system broken for external URLs
- Poor user experience with missing images

### Recommendations
1. **Backend Proxy**: Add `/api/images/proxy?url=...` endpoint
2. **Backend Download**: Download images on import, serve from backend
3. **Direct Display**: Skip caching for external images, use `<img src>` directly
4. **Hybrid**: Cache only same-origin images, display others directly

### Priority
**P1 - High**: Affects recipe display quality and user experience

---

## Issue #28: Recipe Import Returns 500 Internal Server Error

**Severity**: Critical  
**Component**: Recipe Import Service  
**Date Found**: 2026-03-15

### Description
Recipe import from URL fails with 500 Internal Server Error. Multiple attempts show consistent failure.

### Evidence from Console Logs
```
:3000/api/recipes/import/url:1 Failed to load resource: 500 (Internal Server Error)
```

### Current Behavior
- User enters recipe URL
- Import request sent to backend
- Backend returns 500 error
- No error message shown to user
- Multiple retry attempts all fail

### Expected Behavior
- Import succeeds OR
- Clear error message explaining what went wrong
- Suggestions for user (check URL, try different site, etc.)

### Impact
- **Critical**: Recipe import completely broken
- No feedback to user about what failed
- Blocks primary recipe entry workflow

### Technical Details
**Endpoint**: `POST /api/recipes/import/url`  
**File**: `backend/src/controllers/recipeImport.controller.ts`

**Need to check backend logs for**:
- Stack trace
- Parsing errors
- Network errors
- Schema validation errors

### Priority
**P0 - Critical**: Core feature completely broken

---

## Issue #29: Recipe Import Save Returns 400 Bad Request (Multiple Attempts)

**Severity**: Critical  
**Component**: Recipe Import - Save Step  
**Date Found**: 2026-03-15

### Description
After importing a recipe (when import succeeds), attempting to save it returns 400 Bad Request. User tried multiple times with same result. This is the same as Issue #1 but with more evidence.

### Evidence from Console Logs
```
:3000/api/recipes/import/url/save:1 Failed to load resource: 400 (Bad Request)
```
(Repeated 4 times in logs)

### Current Behavior
- Recipe imports successfully (sometimes)
- User clicks "Save Recipe"
- Backend returns 400 Bad Request
- No validation error details shown
- Recipe not saved to database

### Expected Behavior
- Recipe saves successfully OR
- Clear validation errors shown to user
- User can fix issues and retry

### Impact
- **Critical Blocker**: Cannot save ANY imported recipes
- Frustrating user experience (import works, save fails)
- Forces manual recipe entry

### Technical Details
**Endpoint**: `POST /api/recipes/import/url/save`  
**File**: `backend/src/controllers/recipeImport.controller.ts`

**Likely Causes** (from Issue #1):
- Schema validation mismatch
- Missing required fields
- Incorrect data types
- Instructions format issues

### Priority
**P0 - Critical**: Blocks entire recipe import workflow

---

## Issue #30: JWT Token Expiration During Recipe Creation

**Severity**: Medium  
**Component**: Authentication - Token Refresh  
**Date Found**: 2026-03-15

### Description
JWT access token expired during recipe creation workflow, causing 401 Unauthorized error. While the refresh token mechanism worked, it interrupted the user's workflow.

### Evidence from Console Logs
```
:3000/api/recipes:1 Failed to load resource: 401 (Unauthorized)
```

### Current Behavior
- User working on recipe creation (takes time)
- Access token expires (15 min)
- Recipe save attempt fails with 401
- Refresh token kicks in
- User must retry save

### Expected Behavior
- Automatic token refresh before expiration
- OR longer token expiry for active sessions
- OR seamless retry after refresh
- No user interruption

### Impact
- Workflow interruption
- User must click "Save" again
- Potential data loss if user doesn't retry
- Confusing error message

### Recommendations
1. **Proactive Refresh**: Refresh token 2-3 minutes before expiry
2. **Activity Extension**: Extend token on user activity
3. **Automatic Retry**: Retry failed request after refresh
4. **Better UX**: Show "Session refreshed" message, not error

### Priority
**P2 - Medium**: Annoying but has workaround (refresh works)

### Related Issues
- Affects any long-running user activity
- Recipe creation, meal planning, etc.