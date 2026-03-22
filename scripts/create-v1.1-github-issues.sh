#!/bin/bash

# Script to create GitHub issues for v1.1 features documented in ISSUES.md
# These are enhancement requests and features planned for post-MVP
# Labels will need to be added manually via GitHub UI

echo "Creating GitHub issues for v1.1 features..."
echo ""

# Issue #11: Grocery List Optimization (High Priority)
echo "Creating Issue: Grocery List Optimization..."
gh issue create \
  --title "Grocery List Optimization" \
  --body "## Description
Implement grocery list optimization features including store section grouping and multi-store price comparison.

## Priority
High - Enhanced feature that improves shopping efficiency

## Missing Endpoints
- [ ] \`POST /api/grocery-lists/:id/optimize\` - Optimize list by store/price
- [ ] Store section grouping functionality
- [ ] Multi-store price comparison

## Implementation Tasks
- [ ] Implement optimization algorithm
- [ ] Add store section grouping
- [ ] Create price comparison logic

## Related Documentation
See ISSUES.md Issue #11 for full details"

# Issue #16: MyFitnessPal Integration (Medium Priority)
echo "Creating Issue: MyFitnessPal Integration..."
gh issue create \
  --title "MyFitnessPal Integration" \
  --body "## Description
Integrate with MyFitnessPal API to sync nutrition data and meal plans.

## Priority
Medium - Nice-to-have integration for users already using MyFitnessPal

## Required Features
- MyFitnessPal API authentication
- Sync meal plans to MyFitnessPal
- Import nutrition data from MyFitnessPal
- Two-way sync capabilities

## Related Documentation
See ISSUES.md Issue #16 for full details"

# Issue #17: AllRecipes.com Recipe Import (Medium Priority)
echo "Creating Issue: AllRecipes.com Recipe Import Enhancement..."
gh issue create \
  --title "AllRecipes.com Recipe Import Enhancement" \
  --body "## Description
Enhance recipe import to better support AllRecipes.com and other popular recipe websites.

## Priority
Medium - Improves recipe import reliability

## Current Issues
- AllRecipes.com imports failing or incomplete
- Need better parser for nested instructions
- Better error messages for failed imports

## Implementation Tasks
- [ ] Improve recipe scraping for AllRecipes.com
- [ ] Add support for nested instruction formats
- [ ] Enhance error handling and user feedback
- [ ] Test with multiple recipe websites

## Related Issues
Related to user testing issue #1

## Related Documentation
See ISSUES.md Issue #17 for full details"

# Issue #18: Recipe Card OCR Import (Medium Priority)
echo "Creating Issue: Recipe Card OCR Import..."
gh issue create \
  --title "Recipe Card OCR Import" \
  --body "## Description
Implement OCR-based recipe import allowing users to photograph physical recipe cards and automatically extract recipe data.

## Priority
Medium - Unique feature with high user value

## Required Features
- Image upload and preprocessing
- OCR text extraction (Tesseract, Google Vision API, or AWS Textract)
- Recipe structure parsing from OCR text
- Manual review and correction interface
- Support for handwritten recipes (stretch goal)

## Implementation Tasks
- [ ] Choose OCR service/library
- [ ] Implement image upload and preprocessing
- [ ] Build recipe parser for OCR text
- [ ] Create review/correction UI
- [ ] Test with various recipe card formats

## Related Documentation
See ISSUES.md Issue #18 for full details"

# Issue #20: Integrate Nutrition Database (High Priority)
echo "Creating Issue: Integrate Nutrition Database..."
gh issue create \
  --title "Integrate Nutrition Database for Auto-Population" \
  --body "## Description
Integrate a comprehensive nutrition database (USDA FoodData Central, Nutritionix, or Edamam) to automatically populate nutrition information for recipes.

## Priority
High - Foundation for nutrition features, enables Issues #21 and #22

## Required Features
- Nutrition database integration (USDA FoodData Central primary)
- Ingredient-to-nutrition mapping with NLP parsing
- Automatic nutrition calculation per serving
- Manual override and editing capabilities
- Confidence scoring for auto-calculated data
- Caching layer for API responses

## Related Issues
- Enables Issue #21 (Nutrition Dashboard)
- Enables Issue #22 (Nutrition Guideline Warnings)

## Related Documentation
See ISSUES.md Issue #20 for full details"

# Issue #21: Nutrition Dashboard (High Priority)
echo "Creating Issue: Nutrition Dashboard..."
gh issue create \
  --title "Implement Nutrition Dashboard" \
  --body "## Description
Create a comprehensive nutrition dashboard showing users their nutritional intake based on planned meals, with visualizations, trends, and insights.

## Priority
High - Core feature for health-conscious users

## Required Features
- Daily/weekly/monthly nutrition summaries
- Meal plan integration with aggregation
- Interactive visualizations (charts, graphs, progress rings)
- Family member-specific views
- Goal setting and tracking
- Insights and recommendations
- Export and reporting (CSV, PDF)

## Dependencies
Requires Issue #20 (Nutrition Database Integration)

## Related Issues
- Requires Issue #20 (Nutrition Database)
- Enables Issue #22 (Nutrition Warnings)

## Related Documentation
See ISSUES.md Issue #21 for full details"

# Issue #22: Nutrition Guideline Warnings (High Priority)
echo "Creating Issue: Nutrition Guideline Warnings..."
gh issue create \
  --title "Implement Nutrition Guideline Warnings" \
  --body "## Description
Provide intelligent warnings when nutrition guidelines are exceeded or insufficiently met, with different severity levels based on the situation.

## Priority
High - Important health feature

## Required Features
- Guideline threshold system (age/gender-specific)
- **Gentle warnings** (yellow) for exceeding guidelines (>20% over)
- **Stern warnings** (red) for insufficient nutrition (>20% under)
- **No warning** when meals are missing (incomplete meal plan)
- Smart logic: only warn if meal plan is complete for the day
- Actionable recommendations (recipe suggestions, ingredient swaps)
- User preferences for warning sensitivity

## Warning Logic
- Check meal plan completeness first
- If incomplete: show \"incomplete meal plan\" message, no warnings
- If complete: calculate actual vs recommended, warn if >20% off
- Prioritize warnings by health impact

## Dependencies
Requires Issue #20 (Nutrition Database) and Issue #21 (Nutrition Dashboard)

## Related Documentation
See ISSUES.md Issue #22 for full details"

# Issue #23: System Architecture Documentation (Medium Priority)
echo "Creating Issue: System Architecture Documentation..."
gh issue create \
  --title "Create System Architecture Documentation" \
  --body "## Description
Create comprehensive system architecture documentation including a visual diagram (PNG) and detailed text report.

## Priority
Medium - Important for onboarding and maintenance

## Required Deliverables
- [ ] System architecture diagram (PNG format)
  - [ ] High-level component overview
  - [ ] Frontend architecture (React, Redux, Material-UI)
  - [ ] Backend architecture (Node.js, Express, Prisma)
  - [ ] Database schema (PostgreSQL)
  - [ ] External integrations (Redis, APIs)
  - [ ] Data flow diagrams
  - [ ] Deployment architecture
- [ ] Architecture documentation (Markdown)
  - [ ] System overview and goals
  - [ ] Technology stack rationale
  - [ ] Component descriptions
  - [ ] Design patterns used
  - [ ] Security architecture
  - [ ] Scalability considerations
  - [ ] Integration points
  - [ ] Future architecture plans

## File Locations
- \`docs/architecture-diagram.png\` - Visual diagram
- \`docs/ARCHITECTURE.md\` - Detailed documentation

## Related Documentation
See ISSUES.md Issue #23 for full details"

# Issue #24: Fix Frontend Console Errors (Medium Priority)
echo "Creating Issue: Fix Frontend Console Errors..."
gh issue create \
  --title "Fix Frontend Console Errors" \
  --body "## Description
Address remaining frontend console errors and warnings to improve code quality and accessibility.

## Priority
Medium - Code quality and accessibility improvement

## Known Issues
- Accessibility warnings
- React key warnings
- PropTypes warnings
- Deprecated API usage

## Status
5 out of 9 issues fixed during MVP

## Implementation Tasks
- [ ] Audit all console errors/warnings
- [ ] Fix accessibility issues
- [ ] Resolve React warnings
- [ ] Update deprecated API usage
- [ ] Add proper error boundaries

## Related Documentation
See ISSUES.md Issue #24 for full details"

# Issue #25: Sortable and Filterable Tables/Lists (Medium Priority)
echo "Creating Issue: Sortable and Filterable Tables/Lists..."
gh issue create \
  --title "Add Sortable and Filterable Tables/Lists" \
  --body "## Description
Allow users to sort and filter data by clicking column headers in tables and lists throughout the UI.

## Priority
Medium - Nice-to-have feature that improves user experience

## Affected Components
- Recipe list page
- Pantry inventory list
- Grocery list
- Meal plan calendar view
- Family members list
- Any other data tables/lists

## Implementation Requirements
- Add column header click handlers for sorting (ascending/descending)
- Add filter inputs/dropdowns for each column
- Persist sort/filter preferences in localStorage or user preferences
- Add visual indicators for active sort direction
- Support multi-column sorting (optional)
- Add clear filters button

## Technical Approach
- Use Material-UI Table with TableSortLabel components
- Implement client-side sorting for small datasets
- Implement server-side sorting/filtering for large datasets via API query parameters
- Add Redux state for sort/filter preferences
- Consider using MUI X DataGrid for advanced features

## Related Documentation
See ISSUES.md Issue #25 for full details"

# Issue #27: Ingredient Normalization (Medium Priority)
echo "Creating Issue: Ingredient Normalization..."
gh issue create \
  --title "Implement Ingredient Normalization and Variant System" \
  --body "## Description
The ingredient database lacks deduplication and clustering logic, leading to redundant entries. For example, \"butter\" and \"Salted butter\" exist as separate ingredients when they should be variants of the same base ingredient.

## Priority
Medium - Foundational data quality issue

## Current Behavior
- Each ingredient variation is a separate database entry
- No parent-child or variant relationships
- Examples: \"butter\" vs \"Salted butter\", milk types, cheese types
- Users must choose between similar ingredients without clear guidance
- Grocery lists will have redundant entries

## Expected Behavior
Implement a variant system with:
- Base ingredient: \"Butter\"
- Variants: \"salted\" or \"unsalted\" (stored as attribute)
- Aliases/synonyms for search
- Brand-specific only when necessary

## Impact
- **Data Quality**: Database will become cluttered with duplicates
- **User Confusion**: Which ingredient should I choose?
- **Grocery Lists**: May show duplicates as separate items
- **Search/Filter**: Harder to find ingredients
- **Pantry Management**: Duplicate tracking

## Implementation Phases
**Phase 1 - Immediate (Data Cleanup)**:
1. Audit current ingredients for duplicates
2. Manually consolidate obvious duplicates
3. Establish naming conventions

**Phase 2 - Short Term (Prevention)**:
1. Add fuzzy matching on ingredient creation
2. Show \"Similar ingredients exist\" warning
3. Require admin approval for new ingredients

**Phase 3 - Long Term (Proper Solution)**:
1. Implement variant system in database schema
2. Build ingredient clustering algorithm
3. Create ingredient management admin interface
4. Add bulk deduplication tools
5. Implement smart grocery list consolidation

## Related Documentation
See ISSUES.md Issue #27 for full details"

# Issue #28: Grocery List Regeneration (Medium Priority)
echo "Creating Issue: Grocery List Regeneration..."
gh issue create \
  --title "Implement Grocery List Regeneration and Sync Detection" \
  --body "## Description
Implement grocery list regeneration when meal plans change, with sync detection to prevent overwriting user modifications.

## Priority
Medium - Critical for grocery ordering workflow

## Current Behavior
- Grocery lists are generated once from meal plan
- Changes to meal plan don't update existing grocery lists
- No way to regenerate without losing manual edits

## Expected Behavior
- Detect when meal plan has changed since grocery list generation
- Offer to regenerate grocery list
- Smart merge: preserve user edits (quantities, checked items, custom items)
- Show diff of what would change before regenerating

## Technical Requirements
- Track meal plan version/timestamp on grocery list
- Implement diff algorithm for grocery list changes
- Add regenerate endpoint with merge logic
- UI for reviewing and accepting changes

## Related Documentation
See ISSUES.md Issue #28 for full details"

# Issue #29: Pantry Integration (Medium Priority)
echo "Creating Issue: Pantry Integration..."
gh issue create \
  --title "Implement Pantry Integration with Grocery Lists" \
  --body "## Description
Integrate pantry inventory with grocery list generation to automatically exclude items already in stock.

## Priority
Medium - Reduces food waste and shopping costs

## Expected Behavior
- Check pantry inventory when generating grocery list
- Exclude items with sufficient quantity in pantry
- Show \"In Pantry\" indicator for excluded items
- Allow user to override and add anyway
- Update pantry quantities when marking items as purchased

## Technical Requirements
- Pantry quantity tracking
- Ingredient matching between recipes and pantry
- Smart quantity comparison (account for units)
- Pantry depletion when meals are cooked
- UI for pantry-aware grocery list generation

## Related Documentation
See ISSUES.md Issue #29 for full details"

# Issue #30: Recipe Scaling (Medium Priority)
echo "Creating Issue: Recipe Scaling..."
gh issue create \
  --title "Implement Recipe Scaling" \
  --body "## Description
Allow users to scale recipes up or down by adjusting serving size, with automatic ingredient quantity recalculation.

## Priority
Medium - Common user need for meal planning

## Expected Behavior
- Serving size input/slider on recipe detail page
- Real-time ingredient quantity updates
- Preserve original recipe (don't modify database)
- Handle fractional quantities intelligently
- Scale cooking times (with warnings for non-linear scaling)

## Technical Requirements
- Client-side calculation logic
- Unit conversion system
- Fraction display formatting
- Cooking time scaling algorithm
- Save scaled version to meal plan

## Related Documentation
See ISSUES.md Issue #30 for full details"

# Issue #31: Drag-and-Drop Meal Planner (Medium Priority)
echo "Creating Issue: Drag-and-Drop Meal Planner..."
gh issue create \
  --title "Implement Drag-and-Drop for Meal Planner" \
  --body "## Description
Add drag-and-drop functionality to meal planner for easy meal rescheduling and reorganization.

## Priority
Medium - High user value for meal reorganization

## Expected Behavior
- Drag meals between days
- Drag meals between meal types (breakfast/lunch/dinner)
- Visual feedback during drag (ghost image, drop zones)
- Confirm before moving
- Undo/redo support

## Technical Requirements
- Use react-beautiful-dnd or similar library
- Update backend API on drop
- Optimistic UI updates
- Handle drag conflicts (multiple meals same slot)
- Mobile touch support

## Related Documentation
See ISSUES.md Issue #31 for full details"

# Issue #32: Meal Date Editing and Recurrence (Medium Priority)
echo "Creating Issue: Meal Date Editing and Recurrence..."
gh issue create \
  --title "Implement Meal Date Editing and Recurrence Patterns" \
  --body "## Description
Allow users to edit meal dates/times directly and support recurring meal patterns.

## Priority
Medium - Improves meal planning flexibility

## Expected Behavior
- Click to edit meal date/time in place
- Date picker for selecting new date
- Time picker for meal time
- Recurring patterns (weekly, bi-weekly, monthly)
- Bulk edit for recurring meals

## Technical Requirements
- Inline date/time editing UI
- Recurrence pattern storage in database
- Recurrence expansion algorithm
- Bulk update API endpoints
- Handle exceptions to recurring patterns

## Related Documentation
See ISSUES.md Issue #32 for full details"

# Issue #33: Copy/Paste Meal Planner (Medium Priority)
echo "Creating Issue: Copy/Paste Meal Planner..."
gh issue create \
  --title "Implement Copy/Paste for Meal Planner" \
  --body "## Description
Add copy/paste functionality for meals to quickly duplicate meal plans across days or weeks.

## Priority
Medium - Improves meal planning efficiency

## Expected Behavior
- Right-click context menu or keyboard shortcuts
- Copy single meal or entire day
- Paste to another day/week
- Paste with date offset (e.g., +7 days)
- Visual feedback for copied items

## Technical Requirements
- Clipboard state management
- Copy/paste keyboard shortcuts (Cmd+C, Cmd+V)
- Context menu integration
- Batch create API endpoint
- Handle conflicts on paste

## Related Documentation
See ISSUES.md Issue #33 for full details"

# Issue #34: Dashboard Recent Activity (Medium Priority)
echo "Creating Issue: Dashboard Recent Activity..."
gh issue create \
  --title "Implement Dashboard Recent Activity Feed" \
  --body "## Description
Create a recent activity feed on the dashboard showing user actions and system events.

## Priority
Medium - Improves user engagement and awareness

## Expected Behavior
- Timeline of recent actions (recipes added, meals planned, etc.)
- Family member activity (who cooked what)
- System notifications (grocery list ready, meal reminders)
- Filterable by activity type
- Clickable items to navigate to details

## Technical Requirements
- Activity logging system in backend
- Activity feed API endpoint
- Real-time updates (WebSocket or polling)
- Activity type categorization
- Pagination for long histories

## Related Documentation
See ISSUES.md Issue #34 for full details"

echo ""
echo "✅ All v1.1 GitHub issues created successfully!"
echo ""
echo "Summary:"
echo "- 4 High Priority issues (#11, #20, #21, #22)"
echo "- 12 Medium Priority issues (#16, #17, #18, #23, #24, #25, #27, #28, #29, #30, #31, #32, #33, #34)"
echo ""
echo "Next steps:"
echo "1. Review created issues on GitHub"
echo "2. Add appropriate labels via GitHub UI"
echo "3. Prioritize based on user feedback"
echo "4. Begin implementation of high-priority items"

# Made with Bob
