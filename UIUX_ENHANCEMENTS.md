# UI/UX Enhancement Backlog

## Meal Planner - Recipe Selection Modal

### Enhancement: Smart Recipe Sorting by Meal Occasion

**Priority:** Medium  
**Status:** Backlog  
**Date Logged:** 2026-03-23

#### Description
When a user clicks the "+" button next to a specific meal occasion (breakfast, lunch, dinner, snack) in the meal planner, the recipe selection modal should intelligently sort/filter the recipe list to show recipes matching that meal type first.

#### Current Behavior
- User clicks "+" next to "Breakfast" 
- Modal opens showing the meal occasion as "Breakfast"
- Recipe list shows all recipes in default order (most recent first)
- User must scroll through all recipes to find breakfast items

#### Desired Behavior
- User clicks "+" next to "Breakfast"
- Modal opens showing the meal occasion as "Breakfast"
- Recipe list is **pre-sorted** to show breakfast recipes first, then other recipes
- If user manually changes the meal occasion dropdown in the modal, the list should **NOT** re-sort (preserve user's current scroll position and context)

#### Implementation Notes
- Initial sort should happen when modal opens based on the meal occasion passed from the parent
- Track whether the meal occasion was changed by the user vs. set by the system
- Only apply smart sorting on initial load, not on user-initiated changes
- Consider showing a visual separator or section headers (e.g., "Breakfast Recipes" / "Other Recipes")

#### Benefits
- Reduces friction in meal planning workflow
- Makes it faster to find appropriate recipes for each meal
- Maintains user control - doesn't interfere if they want to select a different meal type

#### Related Files
- `frontend/src/pages/MealPlanner.tsx` - Parent component with meal occasion context
- Recipe selection modal component (to be identified)
- Recipe list/grid component

---
