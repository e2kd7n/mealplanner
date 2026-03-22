o inci#!/bin/bash

# Script to create GitHub issues from User Testing Session - March 22, 2026
# All issues will be tagged with "user-testing" and "user-testing-2026-03-22"

set -e

REPO_OWNER=$(git config --get remote.origin.url | sed -n 's/.*github.com[:/]\([^/]*\).*/\1/p')
REPO_NAME=$(git config --get remote.origin.url | sed -n 's/.*github.com[:/][^/]*\/\([^.]*\).*/\1/p')

echo "Creating GitHub issues for repository: $REPO_OWNER/$REPO_NAME"
echo "User Testing Session: March 22, 2026"
echo ""

# Issue 1: Wrong Date Bug (CRITICAL)
echo "Creating Issue 1: Meals Added to Wrong Date (Off-by-One Error)..."
gh issue create \
  --title "🚨 CRITICAL: Meals Added to Wrong Date (Off-by-One Error)" \
  --label "bug,critical,P0,user-testing,user-testing-2026-03-22,meal-planner" \
  --body "## Description
When adding a meal to a specific date and meal occasion on the meal planner, the meal is added to the WRONG date. The meal appears on a different day than the one selected in the modal.

## Steps to Reproduce
1. Navigate to Meal Planner page
2. Click on an empty meal slot for a specific date (e.g., Monday, March 23 dinner)
3. Modal opens showing \"Add Meal for Monday, Mar 23\" with DINNER selected
4. Select a recipe (e.g., \"Sheet-Pan Pepperoni Pasta\")
5. Click \"Add Meal\" button
6. Modal closes
7. Observe that the meal appears on a DIFFERENT date (e.g., Sunday, March 22 dinner instead of Monday, March 23)

## Expected Behavior
Meal should be added to the exact date and meal occasion shown in the modal title (Monday, March 23 dinner).

## Actual Behavior
- Meal is added to a different date (typically one day earlier)
- The selected date/time in the modal does not match where the meal actually appears
- This appears to be a consistent off-by-one error

## Confirmed Test Cases
- Selected: Monday, March 23 dinner → Actually added to: Sunday, March 22 dinner
- Selected: Thursday, March 26 lunch → Actually added to: Wednesday, March 25 lunch

## Impact
- **CRITICAL** - Core meal planning functionality is broken
- Users cannot reliably plan meals for specific dates
- Causes confusion and frustration
- Makes the meal planner essentially unusable for accurate planning
- Users may not notice and end up with incorrect meal plans

## Root Cause Analysis
This appears to be a date/timezone handling issue, possibly:
- Off-by-one error in date calculation
- Timezone conversion problem (UTC vs local time)
- Date object manipulation error
- Modal displaying one date but submitting a different date
- Index-based date selection issue

## Files to Investigate
- \`frontend/src/pages/MealPlanner.tsx\` - Modal date selection and submission
- \`frontend/src/store/slices/mealPlansSlice.ts\` - Date handling in state
- \`backend/src/controllers/mealPlan.controller.ts\` - Date parsing in API
- \`backend/src/validation/schemas.ts\` - Date validation rules

## Discovered
User Testing Session - March 22, 2026"

# Issue 2: Generate Grocery List Not Working (CRITICAL)
echo "Creating Issue 2: Generate Grocery List Button Not Working..."
gh issue create \
  --title "🚨 CRITICAL: Generate Grocery List Button Not Working" \
  --label "bug,critical,P0,user-testing,user-testing-2026-03-22,grocery-list" \
  --body "## Description
Clicking the \"Generate Grocery List\" button on the Meal Planner page does not appear to perform any action. There is no visible feedback, navigation, or error message.

## Steps to Reproduce
1. Navigate to Meal Planner page
2. Ensure some meals are planned for the week
3. Click the \"Generate Grocery List\" button at the top of the page
4. Observe no visible action occurs

## Expected Behavior
One of the following should occur:
- Navigate to Grocery List page with newly generated items
- Show a modal/dialog with generated grocery list
- Display a success message indicating list was generated
- Show loading indicator during generation

## Actual Behavior
- No visible response to button click
- No navigation occurs
- No error message displayed
- No loading indicator shown
- Silent failure with no user feedback

## Impact
- Key feature for meal planning workflow is broken
- Users cannot automatically generate grocery lists from meal plans
- Forces manual entry of all grocery items
- Significantly reduces value proposition of the application
- May cause users to abandon the feature

## Possible Causes
- Button click handler not attached or broken
- API call failing silently without error handling
- Missing navigation logic after successful generation
- Backend endpoint not responding
- Frontend state not updating after API call
- Missing user feedback/notification system

## Files to Investigate
- \`frontend/src/pages/MealPlanner.tsx\` - Button click handler
- \`frontend/src/store/slices/groceryListsSlice.ts\` - State management
- \`backend/src/controllers/groceryList.controller.ts\` - API endpoint
- Check browser console for JavaScript errors
- Check backend logs for API errors

## Discovered
User Testing Session - March 22, 2026"

# Issue 3: CSP Image Loading Error
echo "Creating Issue 3: CSP Image Loading Error..."
gh issue create \
  --title "CSP Image Loading Error - Recipe Images Not Displaying" \
  --label "bug,high,P0,user-testing,user-testing-2026-03-22,recipes,security" \
  --body "## Description
Recipe images fail to load due to Content Security Policy violation. Console error: \`Loading the image 'blob:http://localhost:8080/...' violates the following Content Security Policy directive: \"img-src 'self' data:\"\`

## Steps to Reproduce
1. Navigate to Recipes page
2. Observe recipe cards show \"No Image\" placeholder
3. Check browser console for CSP errors

## Expected Behavior
Recipe images should display properly in recipe cards and detail views.

## Actual Behavior
- Recipe images show \"No Image\" placeholder
- Console error indicates CSP violation
- Blob URLs are being blocked by CSP policy

## Impact
- Recipe images show \"No Image\" placeholder
- Reduces visual appeal and user experience
- Makes it harder to identify recipes at a glance

## Recommendation
Update CSP policy in nginx configuration or HTML meta tags to allow blob URLs for images, or convert to data URLs.

## Files Affected
- \`nginx/nginx.conf\` or \`nginx/default.conf\`
- Possibly \`frontend/index.html\`

## Discovered
User Testing Session - March 22, 2026"

# Issue 4: Date Input Not Accepting Numeric Values
echo "Creating Issue 4: Date Input Not Accepting Numeric Values..."
gh issue create \
  --title "Date Input Field Not Accepting Typed Numeric Values in Meal Planner" \
  --label "bug,high,P0,user-testing,user-testing-2026-03-22,meal-planner,ux" \
  --body "## Description
When editing a meal on the meal planner page, the date input field does not accept manually typed numeric values. Users cannot type in a specific date.

## Steps to Reproduce
1. Navigate to Meal Planner page
2. Click on an existing meal to edit it
3. Try to manually type a date in the date input field
4. Observe that numeric input is not registered

## Expected Behavior
Users should be able to manually type dates in the input field (e.g., \"03/25/2026\" or \"25\")

## Actual Behavior
Date input field does not accept typed numeric values

## Impact
- Poor user experience when trying to move meals to different dates
- Forces users to use date picker only, which is slower
- May frustrate users who prefer keyboard input

## Files to Check
- \`frontend/src/pages/MealPlanner.tsx\`
- Any date picker component being used
- Input event handlers for date fields

## Discovered
User Testing Session - March 22, 2026"

# Issue 5: Collapsible Navigation
echo "Creating Issue 5: Collapsible Left Navigation..."
gh issue create \
  --title "UX Enhancement: Collapsible Left Navigation Sidebar" \
  --label "enhancement,P1,user-testing,user-testing-2026-03-22,ui,ux" \
  --body "## Description
The left navigation sidebar takes up significant screen real estate. Users would benefit from the ability to collapse/dock the navigation to show only icons, freeing up more space for content.

## User Feedback
\"Allow the left nav to be docked and show small icons, freeing up screen real estate\"

## Proposed Solution
- Add a toggle button to collapse/expand the sidebar
- When collapsed, show only icons with tooltips
- Persist user preference (localStorage or user settings)
- Smooth animation for collapse/expand transition
- Ensure icons are recognizable and accessible

## Benefits
- More screen space for content (especially on smaller screens)
- Better user control over interface layout
- Modern UX pattern that users expect
- Improved experience on tablets and smaller laptops

## Files to Modify
- \`frontend/src/components/Layout.tsx\`
- Possibly add new component: \`frontend/src/components/CollapsibleNav.tsx\`
- Update CSS/styling for collapsed state
- Add icons for all navigation items

## Discovered
User Testing Session - March 22, 2026"

# Issue 6: Pantry Categories Incomplete
echo "Creating Issue 6: Pantry Categories Incomplete..."
gh issue create \
  --title "Pantry Categories Incomplete - Missing Essential Categories" \
  --label "enhancement,medium,P1,user-testing,user-testing-2026-03-22,pantry" \
  --body "## Description
The pantry management system is missing essential food categories. Currently observed categories include \"Grains & Pasta\", \"Oils & Condiments\", and \"Baking\", but critical categories like \"Produce\" and \"Protein\" are missing.

## User Feedback
\"Check list of categories. Currently produce and protein are missing for sure. There's a logical list of things that should probably be here to start\"

## Current Categories Observed
- Grains & Pasta ✓
- Oils & Condiments ✓
- Baking ✓

## Recommended Standard Categories
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

## Impact
- Users cannot properly categorize common pantry items
- Reduces usefulness of pantry organization
- Makes inventory tracking less effective
- May force users to use incorrect categories

## Files to Modify
- Category definition/enum in backend
- \`frontend/src/pages/Pantry.tsx\` - Category selection
- Database seed data or migration to add categories
- Possibly \`backend/src/validation/schemas.ts\` - Category validation

## Discovered
User Testing Session - March 22, 2026"

# Issue 7: Default Meal Plan Selection
echo "Creating Issue 7: Default to Active Meal Plan..."
gh issue create \
  --title "UX Enhancement: Auto-Select Default Meal Plan When Only One Active" \
  --label "enhancement,low,P2,user-testing,user-testing-2026-03-22,meal-planner,ux" \
  --body "## Description
When only one meal plan is active and a user is adding a recipe to the meal plan, the system should automatically default to that meal plan in the \"Add to Meal Plan\" modal.

## User Feedback
\"When only one meal plan is active and a recipe is being added to the meal plan, default to that meal plan in the 'add to meal plan' modal\"

## Current Behavior
- User must manually select the meal plan even when only one exists
- Extra click/interaction required

## Proposed Behavior
- If only one meal plan is active, automatically select it as the default
- User can still change it if needed
- If multiple meal plans exist, show dropdown as normal

## Benefits
- Reduces friction in common workflow
- Saves user time and clicks
- More intuitive user experience
- Follows principle of smart defaults

## Files to Modify
- \`frontend/src/pages/MealPlanner.tsx\` - Add meal modal logic
- Any other components with \"Add to Meal Plan\" functionality
- State management for meal plan selection

## Discovered
User Testing Session - March 22, 2026"

# Issue 8: Pantry Unit Smart Defaults
echo "Creating Issue 8: Pantry Unit Field Smart Defaults..."
gh issue create \
  --title "UX Enhancement: Pantry Unit Field Smart Defaults and Deduplication" \
  --label "enhancement,low,P2,user-testing,user-testing-2026-03-22,pantry,ux" \
  --body "## Description
When adding items to the pantry, the \"unit\" field should offer prepopulated values based on units already used in the pantry. This would improve consistency and prevent duplicate entries with different unit variations.

## User Feedback
\"'unit' should have prepopulated values based on items in pantry already. list should remain deduplicated\"

## Current Behavior
- Unit field is likely a free-text input
- Users can enter any unit value
- No suggestions or autocomplete
- Can lead to inconsistent units (e.g., \"lbs\" vs \"pounds\" vs \"lb\")

## Proposed Behavior
- Show dropdown/autocomplete with commonly used units from existing pantry items
- Allow custom units but suggest existing ones first
- Standardize unit names to prevent duplicates
- Consider grouping similar items

## Benefits
- Improves data consistency
- Reduces duplicate entries with different unit names
- Faster data entry with autocomplete
- Better inventory tracking and reporting
- Easier to aggregate quantities

## Files to Modify
- \`frontend/src/pages/Pantry.tsx\` - Add item form
- Pantry item input component
- Consider adding a units reference table in database

## Discovered
User Testing Session - March 22, 2026"

# Issue 9: Smart Default Expiry Dates
echo "Creating Issue 9: Smart Default Expiry Dates..."
gh issue create \
  --title "UX Enhancement: Smart Default Expiry Dates Based on Category" \
  --label "enhancement,low,P2,user-testing,user-testing-2026-03-22,pantry,ux" \
  --body "## Description
When adding items to the pantry, if a user doesn't specify an expiry date, the system should automatically infer a logical default expiry date based on the item's category.

## User Feedback
\"When a user fails to specify an expiry date there is a logical expiry date that should be inferred based on the chosen category\"

## Proposed Behavior
- Auto-calculate default expiry date based on category when user doesn't specify one
- Show the calculated date as a suggestion that user can override
- Use typical shelf life for each category

## Suggested Default Expiry Periods by Category

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

## Benefits
- Reduces data entry burden on users
- Ensures all items have expiry tracking
- Helps prevent food waste with proactive warnings
- More accurate \"Expiring Soon\" notifications
- Better inventory management

## Files to Modify
- Category definitions with default expiry periods
- \`frontend/src/pages/Pantry.tsx\` - Add item form logic
- \`backend/src/controllers/pantry.controller.ts\` - Expiry date calculation
- Database schema may need default expiry period per category

## Discovered
User Testing Session - March 22, 2026"

# Issue 10: Image Upload Missing in Recipe Editor
echo "Creating Issue 10: Image Upload Missing in Recipe Editor..."
gh issue create \
  --title "Image Upload Missing or Not Obvious in Recipe Editor" \
  --label "enhancement,medium,P1,user-testing,user-testing-2026-03-22,recipes,ux" \
  --body "## Description
When editing a recipe, there is no obvious way to upload or change the recipe image. The image upload functionality is either missing or not clearly visible in the UI.

## User Feedback
\"Image upload and display is still not present (or not obvious) when editing recipe\"

## Current Behavior
- Recipe editor does not show image upload field
- No clear way to add or change recipe images
- Users cannot upload custom images for their recipes

## Expected Behavior
- Clear image upload button/field in recipe editor
- Ability to upload images from local device
- Preview of current image (if exists)
- Option to change or remove existing image
- Support for common image formats (JPG, PNG, WebP)

## Impact
- Users cannot add visual appeal to their recipes
- Reduces recipe discoverability and recognition
- Inconsistent with modern recipe management expectations
- May force users to rely on default/placeholder images only

## Proposed Solution
- Add prominent image upload field in recipe create/edit form
- Show current image with option to change
- Implement drag-and-drop image upload
- Add image preview before saving
- Include image cropping/resizing options
- Support multiple image formats

## Implementation Considerations
- Add file input field to recipe form
- Implement image upload to backend
- Handle image storage (local filesystem or cloud storage)
- Add image validation (size, format, dimensions)
- Implement image optimization/compression
- Update CSP policy to allow uploaded images (relates to CSP issue)

## Files to Modify
- \`frontend/src/pages/CreateRecipe.tsx\` - Add image upload field
- \`frontend/src/pages/RecipeDetail.tsx\` - Edit mode image upload
- \`backend/src/controllers/recipe.controller.ts\` - Image upload handling
- \`backend/src/controllers/image.controller.ts\` - Image processing
- Image storage configuration

## Discovered
User Testing Session - March 22, 2026"

echo ""
echo "✅ All 10 GitHub issues created successfully!"
echo ""
echo "Issues created:"
echo "1. 🚨 CRITICAL: Meals Added to Wrong Date (Off-by-One Error)"
echo "2. 🚨 CRITICAL: Generate Grocery List Button Not Working"
echo "3. CSP Image Loading Error - Recipe Images Not Displaying"
echo "4. Date Input Field Not Accepting Typed Numeric Values"
echo "5. UX Enhancement: Collapsible Left Navigation Sidebar"
echo "6. Pantry Categories Incomplete - Missing Essential Categories"
echo "7. UX Enhancement: Auto-Select Default Meal Plan"
echo "8. UX Enhancement: Pantry Unit Field Smart Defaults"
echo "9. UX Enhancement: Smart Default Expiry Dates Based on Category"
echo "10. Image Upload Missing or Not Obvious in Recipe Editor"
echo ""
echo "All issues tagged with: user-testing, user-testing-2026-03-22"

# Made with Bob
