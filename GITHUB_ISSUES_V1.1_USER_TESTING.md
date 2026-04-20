# GitHub Issues for v1.1 User Testing Bugs

**Created:** 2026-04-20  
**Source:** User Testing Results  
**Total Issues:** 14

---

## Issue #1: [P0][Bug] Spoonacular search returns no results - Browse Recipes non-functional

**Priority:** Critical (P0)  
**Labels:** `bug`, `P0`, `user-testing`, `browse-recipes`, `v1.1`  
**Milestone:** v1.1 Release

### Description
Spoonacular search queries return no results, making the Browse Recipes feature completely non-functional. Backend shows 5224 results available, but frontend receives empty array.

### Severity
**Critical (P0)** - Blocking feature release

### Component
Browse Recipes / Frontend-Backend Integration

### Steps to Reproduce
1. Navigate to Browse Recipes page (http://localhost:5173/recipes/browse)
2. Page loads successfully
3. Enter any search query (e.g., 'pasta', 'chicken')
4. Observe results

### Expected Behavior
- Recipe cards should display with search results from Spoonacular
- Results should match the search query
- Pagination should work
- Filters should work

### Actual Behavior
- No recipe cards display
- Search returns empty results
- Frontend receives no data despite backend showing 5224 results
- All dependent features (filters, pagination, add to box) are blocked

### Evidence

**Backend Logs:**
```
2026-04-20 08:28:52 [info]: [SPOONACULAR_SEARCH] Query: undefined, Results: 5224
2026-04-20 08:28:52 [info]: GET /search 200 {"duration":"621ms"}
```

**Frontend State:**
```javascript
state.recipes = action.payload.results || []; // results is undefined or empty
state.pagination.totalResults = 0
```

### Root Cause Analysis
Likely causes:
1. Response serialization issue between backend and frontend
2. Redux state not updating correctly with API response
3. API response format mismatch between backend and expected frontend interface
4. Data transformation issue in Redux slice

### Impact
- Browse Recipes feature is 100% non-functional
- Users cannot discover or add new recipes from Spoonacular
- All search, filter, and pagination tests fail (10+ test cases blocked)
- Core v1.1 feature completely broken

### Test Cases Failed
- A.1: Recipe cards display test
- A.2: All search functionality tests (pasta, chicken, salad, etc.)
- A.3: All filter tests (cuisine, diet, meal type, sort, time)
- A.4: All pagination tests
- A.5: Add to recipe box tests

### Investigation Steps
1. Check Redux DevTools for state updates after API call
2. Inspect Network tab for actual API response body
3. Verify response format matches `SpoonacularRecipe` interface
4. Check for JavaScript errors in browser console
5. Add logging to Redux slice to trace data flow
6. Verify `recipeBrowseAPI.search()` returns correct format

### Related Files
- `frontend/src/store/slices/recipeBrowseSlice.ts`
- `frontend/src/services/api.ts`
- `backend/src/controllers/recipeBrowse.controller.ts`
- `backend/src/services/spoonacular.service.ts`

### Acceptance Criteria
- [ ] Search returns recipe results
- [ ] Recipe cards display with images, titles, time, servings
- [ ] Pagination works correctly
- [ ] Filters work correctly
- [ ] Total results count displays
- [ ] All 10+ blocked test cases pass

---

## Issue #2: [P0][Bug] Meal plan creation and recipe addition completely broken

**Priority:** Critical (P0)  
**Labels:** `bug`, `P0`, `user-testing`, `meal-planning`, `v1.1`  
**Milestone:** v1.1 Release

### Description
Meal planning functionality is completely broken. Cannot create meal plans or add recipes to meal plans. Multiple error messages indicate fundamental issues with meal plan management.

### Severity
**Critical (P0)** - Blocking core feature

### Component
Meal Planning

### Steps to Reproduce

**Scenario 1: Add from Recipe View**
1. Navigate to Recipes page
2. View a recipe
3. Try to add recipe to meal plan
4. Observe error

**Scenario 2: Add from Meal Plan View**
1. Navigate to Meal Planner page
2. Page loads but functionality is limited
3. Try to add recipe from meal plan view
4. Observe error

### Expected Behavior
- Should be able to create meal plans
- Should be able to add recipes to meal plans from recipe view
- Should be able to add recipes from meal plan view
- Drag and drop should work
- Meal plan should persist

### Actual Behavior
- Error: "meal plan does not exist" when adding from recipe view
- Error: "failed to add meal, please try again" from meal plan view
- Page loads but core functionality is broken
- Cannot proceed with meal planning workflow

### Error Messages
```
"meal plan does not exist"
"failed to add meal, please try again"
```

**Backend Logs:**
```
2026-04-20 08:50:37 [warn]: CSRF token validation failed
2026-04-20 08:50:37 [warn]: POST /api/meal-plans 403
2026-04-20 08:51:10 [warn]: CSRF token validation failed
2026-04-20 08:51:10 [warn]: POST /api/meal-plans 403
```

### Root Cause Analysis
Likely causes:
1. CSRF token validation failing on POST requests
2. Meal plan creation endpoint not working
3. Database constraints preventing meal plan creation
4. Authentication/authorization issue
5. Missing meal plan initialization

### Impact
- Core meal planning feature is 100% non-functional
- Users cannot create or manage meal plans
- Blocks grocery list generation (depends on meal plans)
- Testing was abandoned due to this blocker
- Major v1.1 feature completely broken

### Test Cases Failed
- B.3: Create meal plan
- B.3: Add recipes to meal plan
- B.3: Edit meal plan
- B.3: Drag and drop recipes
- B.4: Generate grocery list (blocked)

### Investigation Steps
1. Check CSRF token handling in meal plan endpoints
2. Verify meal plan creation endpoint logic
3. Check database constraints on meal_plans table
4. Test meal plan creation via API directly (Postman/curl)
5. Review authentication middleware
6. Check for missing meal plan initialization on user creation

### Related Files
- `backend/src/controllers/mealPlan.controller.ts`
- `backend/src/routes/mealPlan.routes.ts`
- `backend/src/middleware/csrf.ts`
- `frontend/src/store/slices/mealPlansSlice.ts`
- `backend/prisma/schema.prisma` (meal_plans table)

### Acceptance Criteria
- [ ] Can create meal plan successfully
- [ ] Can add recipes to meal plan from recipe view
- [ ] Can add recipes from meal plan view
- [ ] CSRF token validation works
- [ ] No 403 errors on meal plan operations
- [ ] All meal planning test cases pass

---

## Issue #3: [P0][Bug] Recipe creation fails with "Failed to create recipe" error

**Priority:** Critical (P0)  
**Labels:** `bug`, `P0`, `user-testing`, `recipe-management`, `v1.1`  
**Milestone:** v1.1 Release

### Description
Recipe creation fails when attempting to create a recipe. Error message provides no detail for debugging.

### Severity
**Critical (P0)** - Blocking core feature

### Component
Recipe Management / Recipe Creation

### Steps to Reproduce
1. Navigate to Create Recipe page
2. Fill in recipe details:
   - Title: "hamburgers"
   - Description: (any)
   - Ingredients: (any)
   - Instructions: (any)
3. Click Submit/Save
4. Observe error

### Expected Behavior
- Recipe should be created successfully
- User should be redirected to recipe detail page
- Recipe should appear in My Recipes list
- Success message should display

### Actual Behavior
- Error message: "Failed to create recipe"
- Recipe is not created
- No console log detail available for debugging
- User remains on create page

### Evidence
**User Feedback:**
> "recipe creation failed for 'hamburgers', error: 'Failed to create recipe'. No console log detail available."

### Root Cause Analysis
Likely causes:
1. Validation error not being properly reported
2. Database constraint violation
3. Missing required fields
4. Ingredient creation/linking issue
5. Error handling swallowing actual error details

### Impact
- Users cannot create custom recipes
- Core recipe management feature broken
- Limits application usefulness significantly
- Blocks recipe testing workflow

### Test Cases Failed
- B.2: Create new recipe manually

### Investigation Steps
1. Add detailed error logging to recipe creation endpoint
2. Check database constraints on recipes table
3. Verify all required fields are being sent
4. Test recipe creation via API directly
5. Check ingredient creation/linking logic
6. Review validation schemas

### Related Files
- `backend/src/controllers/recipe.controller.ts` (createRecipe function)
- `backend/src/validation/schemas.ts`
- `frontend/src/pages/CreateRecipe.tsx`
- `backend/prisma/schema.prisma` (recipes table)

### Acceptance Criteria
- [ ] Recipe creation works successfully
- [ ] Detailed error messages display when creation fails
- [ ] Console logs show actual error details
- [ ] All validation errors are user-friendly
- [ ] Recipe appears in My Recipes after creation

---

## Issue #4: [P0][Bug] Recipe editing fails - cannot add ingredients due to foreign key constraint

**Priority:** Critical (P0)  
**Labels:** `bug`, `P0`, `user-testing`, `recipe-management`, `database`, `v1.1`  
**Milestone:** v1.1 Release

### Description
When editing a recipe and trying to add ingredients, the operation fails with a foreign key constraint violation. Valid ingredient input is rejected.

### Severity
**Critical (P0)** - Blocking core feature

### Component
Recipe Management / Recipe Editing / Database

### Steps to Reproduce
1. Navigate to an existing recipe
2. Click Edit
3. Try to add ingredient:
   - Name: "egg"
   - Quantity: "1"
   - Unit: "large"
4. Click Save/Submit
5. Observe error

### Expected Behavior
- Ingredient should be added to recipe
- Recipe should save successfully
- Ingredient should appear in recipe detail view

### Actual Behavior
- Error message: "Please enter an ingredient name and a valid quantity"
- Valid input is rejected
- Recipe is not updated

### Error Details

**Frontend Error:**
```
"Please enter an ingredient name and a valid quantity"
```

**Backend Error:**
```
Foreign key constraint violated on the constraint: `recipe_ingredients_ingredient_id_fkey`
```

**Backend Logs:**
```
Invalid `prisma.recipeIngredient.create()` invocation
Foreign key constraint violated on the constraint: recipe_ingredients_ingredient_id_fkey
```

### Root Cause Analysis
The foreign key constraint error indicates:
1. Ingredient is not being created before recipe_ingredient link
2. Invalid or non-existent ingredient_id is being used
3. Ingredient lookup/creation logic is broken
4. Database migration may have issues

**Expected Flow:**
1. Check if ingredient exists in ingredients table
2. If not, create ingredient first
3. Then create recipe_ingredient link with valid ingredient_id

**Actual Flow:**
1. Attempting to create recipe_ingredient link
2. Using invalid/non-existent ingredient_id
3. Foreign key constraint fails

### Impact
- Users cannot edit recipes to add ingredients
- Recipe management is severely limited
- Cannot update existing recipes
- Core functionality broken

### Test Cases Failed
- B.2: Edit existing recipe (ingredient addition)

### Investigation Steps
1. Review ingredient creation/lookup logic in recipe update endpoint
2. Check if ingredients table is being populated
3. Verify ingredient_id is valid before creating recipe_ingredient
4. Add transaction to ensure ingredient exists before linking
5. Check database schema for ingredients and recipe_ingredients tables
6. Review Prisma schema relationships

### Related Files
- `backend/src/controllers/recipe.controller.ts` (updateRecipe function, lines 500-600)
- `backend/prisma/schema.prisma` (ingredients, recipe_ingredients tables)
- `frontend/src/pages/CreateRecipe.tsx` (ingredient input logic)

### Suggested Fix
```typescript
// In updateRecipe function, before creating recipe_ingredient:

// 1. Check if ingredient exists
let ingredient = await prisma.ingredient.findFirst({
  where: { name: { equals: ingredientName, mode: 'insensitive' } }
});

// 2. If not, create it
if (!ingredient) {
  ingredient = await prisma.ingredient.create({
    data: { name: ingredientName }
  });
}

// 3. Then create recipe_ingredient with valid ingredient_id
await prisma.recipeIngredient.create({
  data: {
    recipeId: recipeId,
    ingredientId: ingredient.id,  // Use valid ID
    quantity: quantity,
    unit: unit
  }
});
```

### Acceptance Criteria
- [ ] Can add ingredients to existing recipes
- [ ] Ingredients are created if they don't exist
- [ ] No foreign key constraint violations
- [ ] Recipe updates save successfully
- [ ] Ingredients display correctly after save

---

## Issue #5: [P1][Bug] Recipe image upload fails with "Failed to update recipe" error

**Priority:** High (P1)  
**Labels:** `bug`, `P1`, `user-testing`, `recipe-management`, `image-upload`, `v1.1`  
**Milestone:** v1.1 Release

### Description
Recipe image upload fails when uploading webp format images. After upload, image shows as white box with error message instead of displaying the image.

### Severity
**High (P1)** - Significant feature degradation

### Component
Recipe Management / Image Upload

### Steps to Reproduce
1. Navigate to recipe "apple pie"
2. Click Edit
3. Upload webp image
4. Edit ingredients simultaneously
5. Click Save
6. Observe error

### Expected Behavior
- Image should upload successfully
- Image should display in recipe detail view
- Recipe should save with new image
- Supports common image formats (jpg, png, webp)

### Actual Behavior
- Error message: "Failed to update recipe"
- Uploaded image shows white box with error message
- Image is not saved
- Recipe may or may not save other changes

### Evidence
**User Feedback:**
> "Failed to update recipe" after image upload and ingredient edit simultaneous on "apple pie". Uploaded webp image shows a white box with an error message in it rather than the image I uploaded.

### Root Cause Analysis
Likely causes:
1. WebP format not supported or not handled correctly
2. Image processing/validation failing
3. File size limit exceeded
4. Simultaneous edits causing conflict
5. Image storage path issue
6. Missing image processing library

### Impact
- Users cannot add custom images to recipes
- Poor user experience with broken images
- Recipes look incomplete without images
- Reduces visual appeal of recipe collection

### Test Cases Failed
- B.2: Recipe image upload

### Investigation Steps
1. Check supported image formats in backend
2. Verify image processing logic
3. Test with different image formats (jpg, png, webp)
4. Check file size limits
5. Test image upload separately from other edits
6. Review image storage configuration
7. Check for image processing errors in logs

### Related Files
- `backend/src/controllers/recipe.controller.ts` (image upload logic)
- `backend/src/middleware/upload.ts` (if exists)
- `frontend/src/pages/CreateRecipe.tsx` (image upload UI)

### Acceptance Criteria
- [ ] Can upload images in common formats (jpg, png, webp)
- [ ] Images display correctly after upload
- [ ] No white box errors
- [ ] Can upload image while editing other fields
- [ ] Appropriate file size limits enforced
- [ ] User-friendly error messages for invalid uploads

---

## Issue #6: [P1][Bug] No delete button for recipes - cannot remove unwanted recipes

**Priority:** High (P1)  
**Labels:** `bug`, `P1`, `user-testing`, `recipe-management`, `ui`, `v1.1`  
**Milestone:** v1.1 Release

### Description
Delete button does not appear anywhere in recipe management UI. Users have no way to remove unwanted recipes from their collection.

### Severity
**High (P1)** - Missing critical functionality

### Component
Recipe Management / UI

### Steps to Reproduce
1. Navigate to My Recipes
2. Click on any recipe to view details
3. Look for delete button
4. Check recipe list view for delete option
5. Check edit page for delete option

### Expected Behavior
- Delete button should be visible in recipe detail view
- Delete button should be visible in recipe list (optional)
- Clicking delete should show confirmation dialog
- After confirmation, recipe should be deleted
- User should be redirected to recipe list
- Success message should display

### Actual Behavior
- No delete button appears anywhere
- No way to remove recipes
- Recipe box becomes cluttered with unwanted recipes

### Evidence
**User Feedback:**
> "there does not seem to be a delete button anywhere"

### Impact
- Users cannot remove unwanted recipes
- Recipe box becomes cluttered over time
- No way to manage/clean up recipe collection
- Poor user experience
- Imported recipes cannot be removed if incorrect

### Test Cases Failed
- B.2: Delete recipe

### UI Locations to Add Delete Button
1. **Recipe Detail Page** (Primary)
   - Add delete button in header or actions section
   - Show confirmation dialog before deletion
   
2. **Recipe List View** (Optional)
   - Add delete icon/button on each recipe card
   - Show confirmation dialog

3. **Recipe Edit Page** (Optional)
   - Add delete button at bottom of form
   - Show confirmation dialog

### Implementation Requirements
- Add delete button to UI
- Implement confirmation dialog
- Add delete API endpoint call
- Handle success/error states
- Redirect after successful deletion
- Show success message
- Update recipe list after deletion

### Related Files
- `frontend/src/pages/RecipeDetail.tsx`
- `frontend/src/pages/Recipes.tsx`
- `backend/src/controllers/recipe.controller.ts` (deleteRecipe function exists?)
- `frontend/src/store/slices/recipesSlice.ts`

### Acceptance Criteria
- [ ] Delete button visible in recipe detail page
- [ ] Confirmation dialog appears before deletion
- [ ] Recipe is deleted successfully
- [ ] User is redirected to recipe list
- [ ] Success message displays
- [ ] Recipe list updates to remove deleted recipe
- [ ] Cannot delete recipes owned by others (if multi-tenant)

---

## Issue #7: [P1][Data] Test database has incomplete recipe data - blocks effective testing

**Priority:** High (P1)  
**Labels:** `bug`, `P1`, `user-testing`, `test-data`, `database`, `testing`, `v1.1`  
**Milestone:** v1.1 Release

### Description
Test database contains sample recipes with no ingredients or instructions, making comprehensive testing very difficult and unrealistic.

### Severity
**High (P1)** - Blocks effective testing and development

### Component
Test Data / Database Seeding

### Current State
- Test database has recipes with titles only
- No ingredients in most recipes
- No instructions in most recipes
- Recipes don't match Spoonacular data format
- Cannot properly test recipe features with incomplete data

### Impact
- Testing is severely hampered
- Cannot verify recipe display functionality properly
- Cannot test meal planning with realistic data
- Cannot test grocery list generation
- Cannot verify ingredient scaling
- Cannot test nutrition display
- Developers cannot see realistic application behavior

### Evidence
**User Feedback:**
> "Current recipes look to be sample data with no ingredients which makes it very hard to test. Suggest matching recipes in the test db with recipes that contain ingredient/instruction details from spoonacular. If there's no match then just delete the recipe from the test database"

### Requirements for Good Test Data

**Recipe Variety:**
- 20-30 complete recipes minimum
- Various cuisines (Italian, Mexican, American, Asian, etc.)
- Different meal types (breakfast, lunch, dinner, snack, dessert)
- Range of cooking times (15 min to 2+ hours)
- Different difficulty levels (easy, medium, hard)
- Mix of dietary options (vegetarian, vegan, gluten-free, etc.)

**Complete Recipe Data:**
- Title and description
- Complete ingredient lists with quantities and units
- Step-by-step instructions
- Cooking and prep times
- Servings count
- Nutrition information
- Images (URLs or local)
- Cuisine type
- Meal type tags
- Difficulty level

**Data Sources:**
1. Fetch from Spoonacular API
2. Use popular recipes with complete data
3. Include family favorites
4. Mix of simple and complex recipes

### Recommended Solution

Create a database seeding script:

```typescript
// scripts/seed-test-recipes.ts

import { spoonacularService } from '../backend/src/services/spoonacular.service';
import prisma from '../backend/src/utils/prisma';

const RECIPE_IDS = [
  // Popular recipes with complete data
  716429, // Pasta with Garlic, Scallions, Cauliflower & Breadcrumbs
  715538, // Bruschetta Style Pork & Pasta
  715497, // Berry Banana Breakfast Smoothie
  // ... add 20-30 recipe IDs
];

async function seedTestRecipes() {
  for (const recipeId of RECIPE_IDS) {
    const recipe = await spoonacularService.getRecipeDetails(recipeId);
    const recipeData = spoonacularService.convertToOurFormat(recipe);
    
    await prisma.recipe.create({
      data: {
        ...recipeData,
        userId: 'test-user-id',
      },
    });
  }
}
```

### Implementation Steps
1. Create seed script to fetch complete recipes from Spoonacular
2. Select 20-30 diverse recipes
3. Convert to application format
4. Seed test database
5. Add to setup/initialization scripts
6. Document seeded recipes
7. Make script idempotent (can run multiple times)

### Related Files
- `backend/seed-recipes.ts` (may already exist)
- `database/init/02-test-data.sql`
- `database/init/03-additional-recipes.sql`
- `scripts/` (new seed script)

### Acceptance Criteria
- [ ] Test database has 20-30 complete recipes
- [ ] All recipes have ingredients with quantities
- [ ] All recipes have step-by-step instructions
- [ ] Recipes cover variety of cuisines and meal types
- [ ] Recipes have nutrition information
- [ ] Recipes have images
- [ ] Seed script is documented and easy to run
- [ ] Script can be run as part of setup process

---

## Issue #8: [P2][UX] Confusing navigation - consolidate "Search Recipes" and "Browse Recipes"

**Priority:** Medium (P2)  
**Labels:** `enhancement`, `P2`, `user-testing`, `ux`, `navigation`, `v1.1`  
**Milestone:** v1.1 Release

### Description
Having both "Search Recipes" and "Browse Recipes" in the left navigation is confusing to users. The distinction between the two is not clear.

### Severity
**Medium (P2)** - UX Enhancement

### Component
Navigation / User Experience

### User Feedback
> "It is a little confusing to have 'search recipes' and 'browse recipes' in the left nav. Condense into a singular 'recipes' then have a facility within for the user to navigate between their own personal/family recipes and a broader recipe search of spoonacular etc - while retaining the recipe import function."

### Current State
Left navigation has:
- Search Recipes (user's own recipes)
- Browse Recipes (Spoonacular recipes)
- Import Recipe (separate)

### Proposed Solution

**Consolidate into single "Recipes" menu item with tabs:**

```
Recipes
├── My Recipes (user's personal/family recipes)
│   ├── Search/filter own recipes
│   ├── Create new recipe
│   └── Import recipe
└── Browse Recipes (Spoonacular)
    ├── Search Spoonacular
    └── Filter by cuisine, diet, etc.
```

**UI Structure:**
1. Single "Recipes" item in left nav
2. Clicking opens Recipes page with tabs:
   - Tab 1: "My Recipes"
   - Tab 2: "Browse"
   - Tab 3: "Import" (or button in My Recipes)
3. Each tab has appropriate functionality

### Benefits
- Clearer mental model for users
- All recipe-related functions in one place
- Easier to discover features
- Reduces navigation clutter
- Better information architecture

### Implementation
1. Update navigation component
2. Create tabbed interface in Recipes page
3. Move Browse Recipes content to tab
4. Move Import Recipe to tab or button
5. Update routing
6. Update documentation

### Related Files
- `frontend/src/components/Layout.tsx` (navigation)
- `frontend/src/App.tsx` (routing)
- `frontend/src/pages/Recipes.tsx`
- `frontend/src/pages/BrowseRecipes.tsx`
- `frontend/src/pages/ImportRecipe.tsx`

### Acceptance Criteria
- [ ] Single "Recipes" menu item in navigation
- [ ] Tabbed interface with "My Recipes" and "Browse" tabs
- [ ] Import functionality accessible from My Recipes
- [ ] All existing functionality preserved
- [ ] Smooth tab transitions
- [ ] Active tab clearly indicated
- [ ] URL reflects current tab
- [ ] Browser back/forward works with tabs

---

## Issue #9: [P2][UX] Recipe creation - ingredient input UX issues

**Priority:** Medium (P2)  
**Labels:** `enhancement`, `P2`, `user-testing`, `ux`, `recipe-creation`, `v1.1`  
**Milestone:** v1.1 Release

### Description
When adding ingredients during recipe creation, the previous ingredient details remain in the search box when a new row is added, creating confusion.

### Severity
**Medium (P2)** - UX Enhancement

### Component
Recipe Creation / Ingredient Input

### User Feedback
> "When new ingredient is added, prior typed ingredient details remain in the search box and a row is added below. Don't do this - have only one section of ingredients and add new rows when the plus button is clicked, then save them all once user clicks 'next'."

### Current Behavior
1. User types ingredient in search box
2. User clicks add
3. New row appears below
4. Previous ingredient text remains in search box
5. Confusing - looks like duplicate entry

### Proposed Behavior
1. User types ingredient in input field
2. User clicks "+" button
3. Ingredient is added to list below
4. Input field clears automatically
5. User can add more ingredients
6. All ingredients saved when user clicks "Next" or "Save"

### Benefits
- Clearer workflow
- No confusion about duplicates
- Standard form behavior (clear after add)
- Better user experience
- Prevents accidental duplicate entries

### Implementation
1. Clear ingredient input after adding
2. Show ingredients in list below input
3. Allow editing/removing from list
4. Save all ingredients on form submit
5. Add visual feedback when ingredient added

### Related Files
- `frontend/src/pages/CreateRecipe.tsx`
- `frontend/src/components/IngredientInput.tsx` (if exists)

### Acceptance Criteria
- [ ] Input field clears after adding ingredient
- [ ] Ingredients display in list below
- [ ] Can edit ingredients in list
- [ ] Can remove ingredients from list
- [ ] All ingredients saved on form submit
- [ ] Visual feedback when ingredient added
- [ ] No confusion about duplicate entries

---

## Issue #10: [P2][UX] Missing ingredient scaling information during recipe creation

**Priority:** Medium (P2)  
**Labels:** `enhancement`, `P2`, `user-testing`, `ux`, `recipe-creation`, `feature-request`, `v1.1`  
**Milestone:** v1.1 Release

### Description
No mechanism for users to indicate which ingredients scale and how they scale when creating recipes. Users need context about serving sizes when inputting ingredients.

### Severity
**Medium (P2)** - UX Enhancement / Missing Feature

### Component
Recipe Creation / Ingredient Management

### User Feedback
> "How will a user indicate which ingredients scale and how they scale? If the app will do this math behind the scenes make sure the user can see the quantity of servings they're inputting ingredients for so they are reminded"

### Current State
- User enters ingredients with quantities
- No indication of serving size context
- No way to specify scaling behavior
- Unclear how ingredients will scale when servings change

### Proposed Solution

**1. Show Serving Size Context**
```
Recipe: Chocolate Chip Cookies
Servings: 24 cookies

Ingredients (for 24 servings):
- 2 cups flour
- 1 cup butter
- 1 cup sugar
...
```

**2. Ingredient Scaling Options**
For each ingredient, allow user to specify:
- ✅ Scales proportionally (default)
- ⚠️ Scales with adjustment (e.g., spices)
- ❌ Does not scale (e.g., "to taste")

**3. Visual Indicators**
- Show serving size prominently during ingredient entry
- Indicate which ingredients will scale
- Preview scaled quantities

### Benefits
- Users understand serving context
- Clear scaling behavior
- Better recipe accuracy when scaling
- Prevents scaling errors (e.g., over-spicing)
- Professional recipe management

### Implementation
1. Add serving size display to ingredient input section
2. Add scaling option for each ingredient
3. Store scaling behavior in database
4. Use scaling info when adjusting servings
5. Show preview of scaled quantities

### Related Files
- `frontend/src/pages/CreateRecipe.tsx`
- `backend/prisma/schema.prisma` (add scaling field to recipe_ingredients)
- `frontend/src/components/RecipeScaling.tsx` (new)

### Acceptance Criteria
- [ ] Serving size displayed prominently during ingredient entry
- [ ] Can specify scaling behavior per ingredient
- [ ] Scaling behavior stored in database
- [ ] Scaled quantities calculated correctly
- [ ] Preview shows scaled quantities
- [ ] Default scaling behavior is proportional
- [ ] Can mark ingredients as "to taste" (no scaling)

---

## Issue #11: [P2][Feature] Add automatic nutrition calculation from ingredients

**Priority:** Medium (P2)  
**Labels:** `enhancement`, `P2`, `user-testing`, `feature-request`, `recipe-creation`, `nutrition`, `v1.1`  
**Milestone:** v1.1 or v1.2

### Description
No way to automatically calculate nutrition information from ingredients list. Users must manually enter nutrition data, which is tedious and error-prone.

### Severity
**Medium (P2)** - Feature Enhancement

### Component
Recipe Creation / Nutrition

### User Feedback
> "Find a way to interpret nutrition information from ingredients list, this can be a user option to 'calculate nutrition' when adding ingredients"

### Current State
- Users must manually enter nutrition information
- No automatic calculation
- Tedious and time-consuming
- Prone to errors
- Many recipes lack nutrition data

### Proposed Solution

**Option 1: Spoonacular API**
- Use Spoonacular's nutrition API
- Calculate nutrition from ingredient list
- Most accurate for common ingredients

**Option 2: USDA Database**
- Use USDA FoodData Central API
- Free and comprehensive
- Good for basic ingredients

**Option 3: Hybrid Approach**
- Try Spoonacular first
- Fall back to USDA
- Allow manual override

### Features
1. "Calculate Nutrition" button in recipe creation
2. Automatic calculation from ingredients
3. Display calculated values
4. Allow manual adjustments
5. Show per-serving nutrition
6. Include common nutrients:
   - Calories
   - Protein
   - Carbohydrates
   - Fat
   - Fiber
   - Sugar
   - Sodium

### Benefits
- Eliminates tedious manual entry
- More accurate nutrition data
- Valuable for health-conscious users
- Improves recipe data quality
- Enables nutrition-based filtering

### Implementation
1. Add nutrition calculation service
2. Integrate with nutrition API (Spoonacular or USDA)
3. Add "Calculate Nutrition" button to UI
4. Parse ingredients and quantities
5. Fetch nutrition data for each ingredient
6. Sum and calculate per-serving values
7. Display results
8. Allow manual override
9. Store in database

### API Options

**Spoonacular (Already integrated):**
```
GET /recipes/{id}/nutritionWidget.json
POST /recipes/parseIngredients
```

**USDA FoodData Central (Free):**
```
GET /v1/foods/search
GET /v1/food/{fdcId}
```

### Related Files
- `backend/src/services/nutrition.service.ts` (new)
- `backend/src/services/spoonacular.service.ts`
- `frontend/src/pages/CreateRecipe.tsx`
- `frontend/src/components/NutritionCalculator.tsx` (new)

### Acceptance Criteria
- [ ] "Calculate Nutrition" button in recipe creation
- [ ] Nutrition calculated from ingredients automatically
- [ ] Displays calories, protein, carbs, fat, fiber, sugar, sodium
- [ ] Shows per-serving values
- [ ] Allows manual override
- [ ] Stores calculated nutrition in database
- [ ] Handles missing ingredient data gracefully
- [ ] User-friendly error messages

---

## Issue #12: [P3][Feature] Add recipe document upload (PDF, images, DOCX)

**Priority:** Low (P3)  
**Labels:** `enhancement`, `P3`, `user-testing`, `feature-request`, `recipe-import`, `v1.2`  
**Milestone:** v1.2 (Future)

### Description
No mechanism to upload images, PDFs, or documents of recipes. Users want to digitize physical recipes and add them to their personal collection.

### Severity
**Low (P3)** - Feature Enhancement

### Component
Recipe Import / Document Processing

### User Feedback
> "Add a mechanism to allow the user to upload images/pdf/documents of recipes which then get added to their own personal/family recipes"

### Current State
- Can only import recipes via URL
- Cannot upload physical recipe photos
- Cannot upload PDF recipes
- Cannot upload recipe documents
- Limits recipe collection growth

### Proposed Solution

**Phase 1: Basic Upload**
1. Allow file upload (PDF, JPG, PNG, DOCX)
2. Store file
3. Create recipe with file attachment
4. Manual entry of recipe details

**Phase 2: OCR/Parsing (Advanced)**
1. Use OCR to extract text from images/PDFs
2. Parse recipe structure (ingredients, instructions)
3. Pre-fill recipe form
4. Allow user to review and edit
5. Save to recipe collection

### Supported Formats
- **Images:** JPG, PNG, HEIC
- **Documents:** PDF, DOCX
- **Text:** TXT, MD

### Technology Options

**OCR:**
- Tesseract.js (open source)
- Google Cloud Vision API
- AWS Textract
- Azure Computer Vision

**Recipe Parsing:**
- Docling (already mentioned in docs)
- Custom NLP/AI parsing
- GPT-4 Vision API

### Benefits
- Users can digitize physical recipes
- Preserves family recipes
- Easier recipe collection growth
- Reduces manual entry
- Valuable for users with recipe books/cards

### Implementation Phases

**Phase 1: Basic Upload (v1.2)**
- File upload UI
- File storage (local or S3)
- Attach file to recipe
- Display file in recipe view

**Phase 2: OCR (v1.3)**
- Integrate OCR service
- Extract text from images/PDFs
- Display extracted text
- Allow editing

**Phase 3: Smart Parsing (v1.4)**
- Parse recipe structure
- Identify ingredients and instructions
- Pre-fill recipe form
- AI-assisted parsing

### Related Files
- `frontend/src/pages/ImportRecipe.tsx`
- `backend/src/services/ocr.service.ts` (new)
- `backend/src/services/recipeParser.service.ts` (new)
- `backend/src/middleware/upload.ts`

### Acceptance Criteria

**Phase 1:**
- [ ] Can upload PDF, JPG, PNG, DOCX files
- [ ] Files stored securely
- [ ] Files attached to recipes
- [ ] Can view uploaded files
- [ ] File size limits enforced
- [ ] Supported formats validated

**Phase 2:**
- [ ] OCR extracts text from images
- [ ] OCR extracts text from PDFs
- [ ] Extracted text displayed for review
- [ ] Can edit extracted text
- [ ] Handles poor quality images gracefully

**Phase 3:**
- [ ] Automatically identifies ingredients
- [ ] Automatically identifies instructions
- [ ] Pre-fills recipe form
- [ ] User can review and edit
- [ ] High accuracy parsing

---

## Issue #13: [Testing] Add automated accessibility and performance tests

**Priority:** Medium (P2)  
**Labels:** `testing`, `P2`, `user-testing`, `accessibility`, `performance`, `automation`, `v1.1`  
**Milestone:** v1.1 Release

### Description
Several testing gaps identified during user testing that need automated test coverage for accessibility and performance.

### Severity
**Medium (P2)** - Testing Infrastructure

### Component
Testing / CI/CD / Quality Assurance

### Missing Test Coverage

#### Accessibility Testing
- [ ] Screen reader compatibility (VoiceOver/NVDA)
- [ ] ARIA labels verification
- [ ] WCAG AA color contrast standards
- [ ] Focus indicators visibility
- [ ] Keyboard navigation
- [ ] Protected routes redirect behavior
- [ ] Token refresh functionality

#### Performance Testing
- [ ] Page load time benchmarks
  - Home page: < 2 seconds
  - Browse Recipes: < 2 seconds
  - Recipe Detail: < 1.5 seconds
  - Meal Plan: < 2 seconds
- [ ] API response time monitoring
  - Recipe search: < 1 second
  - Recipe details: < 500ms
  - Add to box: < 500ms
  - User recipes: < 1 second
- [ ] Bundle size verification
  - Main bundle: < 500KB (gzipped)
  - Vendor bundle: < 300KB (gzipped)
  - Total initial load: < 800KB (gzipped)
- [ ] Memory leak detection
- [ ] Slow network simulation (3G)

### Recommended Tools

#### Accessibility
- **axe-core** - Automated accessibility testing
- **pa11y** - Accessibility testing tool
- **Lighthouse** - Includes accessibility audits
- **jest-axe** - Jest integration for axe-core

#### Performance
- **Lighthouse CI** - Automated performance testing
- **bundlesize** - Bundle size monitoring
- **Playwright Performance APIs** - Performance metrics in E2E tests
- **Web Vitals** - Core Web Vitals monitoring

### Implementation Plan

#### 1. Accessibility Tests
```typescript
// frontend/e2e/tests/accessibility/a11y.spec.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility', () => {
  test('Browse Recipes page should be accessible', async ({ page }) => {
    await page.goto('/recipes/browse');
    await injectAxe(page);
    await checkA11y(page);
  });
});
```

#### 2. Performance Tests
```typescript
// frontend/e2e/tests/performance/performance.spec.ts
import { test, expect } from '@playwright/test';

test('Browse Recipes should load within 2 seconds', async ({ page }) => {
  const start = Date.now();
  await page.goto('/recipes/browse');
  await page.waitForLoadState('networkidle');
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(2000);
});
```

#### 3. Bundle Size Monitoring
```json
// package.json
{
  "bundlesize": [
    {
      "path": "./dist/assets/*.js",
      "maxSize": "500 KB"
    }
  ]
}
```

#### 4. Lighthouse CI
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:5173
            http://localhost:5173/recipes/browse
```

### Integration with CI/CD
1. Run accessibility tests on every PR
2. Run performance tests on every PR
3. Monitor bundle sizes
4. Generate reports
5. Fail builds on regressions
6. Track metrics over time

### Related Files
- `frontend/e2e/tests/accessibility/` (new directory)
- `frontend/e2e/tests/performance/` (new directory)
- `.github/workflows/lighthouse.yml` (new)
- `package.json` (add bundlesize config)
- `playwright.config.ts` (update for a11y)

### Acceptance Criteria
- [ ] Accessibility tests run on every PR
- [ ] Performance tests run on every PR
- [ ] Bundle size monitored automatically
- [ ] Lighthouse CI integrated
- [ ] Test reports generated
- [ ] Builds fail on accessibility violations
- [ ] Builds fail on performance regressions
- [ ] Metrics tracked over time
- [ ] Documentation for running tests locally

---

## Issue #14: [P0][Bug] CSRF token validation failing on meal plan POST requests

**Priority:** Critical (P0)  
**Labels:** `bug`, `P0`, `user-testing`, `security`, `csrf`, `meal-planning`, `v1.1`  
**Milestone:** v1.1 Release

### Description
CSRF token validation is failing on POST requests to meal plan endpoints, resulting in 403 Forbidden errors. This blocks all meal plan creation and modification.

### Severity
**Critical (P0)** - Blocking core feature

### Component
Security / CSRF Protection / Meal Planning

### Evidence
**Backend Logs:**
```
2026-04-20 08:50:37 [warn]: CSRF token validation failed {"ip":"::1","path":"/api/meal-plans","method":"POST"}
2026-04-20 08:50:37 [warn]: POST /api/meal-plans 403 {"duration":"5ms"}
2026-04-20 08:51:10 [warn]: CSRF token validation failed {"ip":"::1","path":"/api/meal-plans","method":"POST"}
2026-04-20 08:51:10 [warn]: POST /api/meal-plans 403 {"duration":"4ms"}
```

### Steps to Reproduce
1. Navigate to Meal Planner page
2. Try to create a meal plan (POST request)
3. Observe 403 error
4. Check browser console and network tab
5. Check backend logs

### Expected Behavior
- CSRF token should be fetched from `/api/csrf-token`
- Token should be included in POST request headers
- Token should be validated successfully
- Request should proceed normally

### Actual Behavior
- CSRF token validation fails
- 403 Forbidden error returned
- Meal plan creation blocked
- No helpful error message to user

### Root Cause Analysis
Possible causes:
1. CSRF token not being fetched before POST request
2. CSRF token not included in request headers
3. CSRF token expired or invalid
4. CSRF middleware configuration issue
5. Token mismatch between cookie and header
6. CORS issue preventing token transmission

### Investigation Steps
1. Check if CSRF token is fetched on app initialization
2. Verify token is stored correctly (cookie or state)
3. Check if token is included in POST request headers
4. Verify CSRF middleware configuration
5. Check token expiration settings
6. Test CSRF token flow manually
7. Review CORS configuration

### Related Code

**Frontend (api.ts):**
```typescript
// Should fetch CSRF token
const fetchCsrfToken = async (): Promise<string> => {
  const response = await axios.get(`${API_BASE_URL}/csrf-token`);
  csrfToken = response.data.csrfToken;
  return csrfToken;
};

// Should include in POST requests
api.interceptors.request.use(async (config) => {
  if (['POST', 'PUT', 'DELETE'].includes(config.method?.toUpperCase() || '')) {
    const token = await getCsrfToken();
    config.headers['X-CSRF-Token'] = token;
  }
  return config;
});
```

**Backend (csrf.ts):**
```typescript
// Should validate token
export const csrfProtection = (req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const token = req.headers['x-csrf-token'];
    if (!token || !validateToken(token)) {
      return res.status(403).json({ error: 'CSRF token validation failed' });
    }
  }
  next();
};
```

### Debugging Checklist
- [ ] CSRF token endpoint returns valid token
- [ ] Token is stored in frontend state/cookie
- [ ] Token is included in POST request headers
- [ ] Header name matches backend expectation
- [ ] Token format is correct
- [ ] Token has not expired
- [ ] CORS allows custom headers
- [ ] Middleware is applied to correct routes

### Related Files
- `frontend/src/services/api.ts` (CSRF token handling)
- `backend/src/middleware/csrf.ts`
- `backend/src/routes/mealPlan.routes.ts`
- `backend/src/index.ts` (middleware setup)

### Acceptance Criteria
- [ ] CSRF token fetched successfully on app load
- [ ] Token included in all POST/PUT/DELETE requests
- [ ] Token validation passes
- [ ] No 403 errors on meal plan operations
- [ ] Meal plan creation works
- [ ] Meal plan updates work
- [ ] Error messages are user-friendly
- [ ] Token refresh works when expired

---

## Summary

**Total Issues:** 14

**By Priority:**
- **P0 (Critical):** 5 issues - Must fix before release
- **P1 (High):** 3 issues - Should fix before release
- **P2 (Medium):** 5 issues - Nice to have for release
- **P3 (Low):** 1 issue - Future enhancement

**By Category:**
- **Browse Recipes:** 1 issue
- **Meal Planning:** 2 issues
- **Recipe Management:** 5 issues
- **UX/Navigation:** 3 issues
- **Testing:** 1 issue
- **Security:** 1 issue
- **Test Data:** 1 issue

**Release Blocker Status:**
❌ **NOT READY FOR RELEASE** - 5 critical (P0) issues must be fixed first

**Next Steps:**
1. Create all 14 issues in GitHub
2. Assign to developers
3. Fix P0 issues first (estimated 3-5 days)
4. Fix P1 issues (estimated 2-3 days)
5. Re-test all functionality
6. Address P2 issues if time permits
7. Final verification before release
