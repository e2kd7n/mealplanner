#!/bin/bash

# Create UX Issues from Evaluation Report
# Based on docs/UX_EVALUATION_REPORT.md findings

set -e

echo "Creating UX Issues from Evaluation Report..."
echo "=============================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed."
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "Error: Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

# Function to create issue
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"
    local priority="$4"
    
    echo "Creating: $title"
    gh issue create \
        --title "$title" \
        --body "$body" \
        --label "$labels" \
        --label "$priority" \
        --label "ux" \
        --label "design" || echo "  ⚠️  Failed to create issue (may already exist)"
    echo ""
}

# Reference to Design Principles
DESIGN_PRINCIPLES_REF="**Reference:** See [Design Principles](../docs/DESIGN_PRINCIPLES.md) for evaluation criteria.

**Evaluation Report:** See [UX Evaluation Report](../docs/UX_EVALUATION_REPORT.md) for complete findings."

echo "Creating P0 (Critical) UX Issues..."
echo "-----------------------------------"

# P0-1: Accessibility - ARIA Labels
create_issue \
"[UX] Add ARIA labels to all interactive elements" \
"## Problem
Many interactive elements lack proper ARIA labels, making the application difficult to use with screen readers.

## Impact
- **Severity:** Critical
- **Users Affected:** All users relying on assistive technology
- **WCAG Compliance:** Fails WCAG 2.1 AA requirements

## Requirements
- [ ] Audit all buttons, links, and interactive elements
- [ ] Add aria-label or aria-labelledby to all icon buttons
- [ ] Add aria-describedby for complex interactions
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)

## Acceptance Criteria
- All interactive elements have descriptive ARIA labels
- Screen reader announces all actions clearly
- Passes automated accessibility testing (axe, WAVE)

## Related Issues
- Part of accessibility compliance initiative
- Blocks WCAG 2.1 AA certification

$DESIGN_PRINCIPLES_REF" \
"accessibility,a11y" \
"P0"

# P0-2: Accessibility - Focus Indicators
create_issue \
"[UX] Implement visible focus indicators (2px minimum)" \
"## Problem
Focus indicators are insufficient or missing, making keyboard navigation difficult.

## Impact
- **Severity:** Critical
- **Users Affected:** Keyboard-only users, motor impairment users
- **WCAG Compliance:** Fails WCAG 2.1 AA 2.4.7 (Focus Visible)

## Requirements
- [ ] Add 2px minimum focus outline to all interactive elements
- [ ] Ensure focus indicators have 3:1 contrast ratio
- [ ] Test keyboard navigation through entire application
- [ ] Ensure focus order is logical

## Acceptance Criteria
- All focusable elements have visible 2px+ outline
- Focus indicators meet contrast requirements
- Keyboard navigation works for all features
- Focus order follows visual layout

## Related Issues
- Part of accessibility compliance initiative
- Related to keyboard navigation improvements

$DESIGN_PRINCIPLES_REF" \
"accessibility,a11y" \
"P0"

# P0-3: Accessibility - Skip Navigation
create_issue \
"[UX] Add skip navigation links" \
"## Problem
No skip navigation links exist, forcing keyboard users to tab through entire navigation on every page.

## Impact
- **Severity:** Critical
- **Users Affected:** Keyboard-only users
- **WCAG Compliance:** Fails WCAG 2.1 AA 2.4.1 (Bypass Blocks)

## Requirements
- [ ] Add \"Skip to main content\" link at page top
- [ ] Add \"Skip to navigation\" link
- [ ] Ensure links are visible on focus
- [ ] Test with keyboard navigation

## Acceptance Criteria
- Skip links appear on Tab key press
- Links jump to correct page sections
- Works on all pages
- Passes WCAG 2.1 AA 2.4.1

## Implementation Notes
\`\`\`tsx
// Add to Layout.tsx
<a href=\"#main-content\" className=\"skip-link\">
  Skip to main content
</a>
\`\`\`

$DESIGN_PRINCIPLES_REF" \
"accessibility,a11y" \
"P0"

# P0-4: Error Recovery - Auto-save
create_issue \
"[UX] Implement auto-save for recipe creation/editing" \
"## Problem
Users lose all work if they navigate away or encounter an error during recipe creation/editing.

## Impact
- **Severity:** Critical
- **Users Affected:** All users creating/editing recipes
- **User Frustration:** High - data loss is extremely frustrating

## Requirements
- [ ] Auto-save recipe drafts every 30 seconds
- [ ] Store drafts in localStorage or IndexedDB
- [ ] Restore drafts on page return
- [ ] Show \"Draft saved\" indicator
- [ ] Allow manual save
- [ ] Clear drafts after successful save

## Acceptance Criteria
- Recipe data persists across page refreshes
- Users can resume editing after navigation
- Draft indicator shows save status
- Drafts cleared after successful save
- Works offline

## Technical Notes
- Use localStorage for simple implementation
- Consider IndexedDB for larger recipes
- Implement debounced save (30s after last change)

$DESIGN_PRINCIPLES_REF" \
"enhancement,data-loss-prevention" \
"P0"

echo ""
echo "Creating P1 (High Priority) UX Issues..."
echo "----------------------------------------"

# P1-1: Bulk Operations
create_issue \
"[UX] Add bulk selection and operations for recipes" \
"## Problem
Users cannot select multiple recipes for batch operations (delete, tag, export).

## Impact
- **Severity:** High
- **Users Affected:** Power users, users with many recipes
- **Efficiency:** Significantly impacts workflow efficiency

## Requirements
- [ ] Add checkbox selection to recipe lists
- [ ] Implement \"Select All\" functionality
- [ ] Add bulk delete with confirmation
- [ ] Add bulk tag/categorize
- [ ] Add bulk export
- [ ] Show selection count

## Acceptance Criteria
- Users can select multiple recipes
- Bulk operations work correctly
- Confirmation dialog shows count
- Selection persists during pagination
- Clear selection button available

## Design Mockup Needed
- Checkbox placement
- Bulk action toolbar
- Confirmation dialog design

$DESIGN_PRINCIPLES_REF" \
"enhancement,efficiency" \
"P1"

# P1-2: Undo Functionality
create_issue \
"[UX] Implement undo functionality for destructive actions" \
"## Problem
No way to undo deletions or other destructive actions.

## Impact
- **Severity:** High
- **Users Affected:** All users
- **User Confidence:** Users hesitant to delete due to permanence

## Requirements
- [ ] Implement undo toast for deletions (5-second window)
- [ ] Store deleted items temporarily
- [ ] Add \"Undo\" button to success messages
- [ ] Implement for: recipe delete, meal plan delete, ingredient delete
- [ ] Clear undo queue after timeout

## Acceptance Criteria
- Undo toast appears after deletion
- Undo button restores deleted item
- Toast auto-dismisses after 5 seconds
- Permanent deletion occurs after timeout
- Works for all destructive actions

## Technical Notes
\`\`\`typescript
// Soft delete pattern
interface DeletedItem {
  id: string;
  type: 'recipe' | 'mealPlan' | 'ingredient';
  data: any;
  deletedAt: Date;
}
\`\`\`

$DESIGN_PRINCIPLES_REF" \
"enhancement,error-recovery" \
"P1"

# P1-3: Unsaved Changes Warning
create_issue \
"[UX] Warn users before leaving pages with unsaved changes" \
"## Problem
Users can navigate away from forms with unsaved changes without warning.

## Impact
- **Severity:** High
- **Users Affected:** All users editing content
- **Data Loss:** Accidental data loss is frustrating

## Requirements
- [ ] Detect unsaved changes in forms
- [ ] Show confirmation dialog on navigation attempt
- [ ] Show confirmation on browser close/refresh
- [ ] Provide \"Save and Continue\" option
- [ ] Provide \"Discard Changes\" option

## Acceptance Criteria
- Dialog appears when navigating with unsaved changes
- Dialog shows on browser close/refresh
- Users can save or discard changes
- Works for all forms (recipe, meal plan, profile)
- No false positives

## Technical Notes
\`\`\`typescript
// Use beforeunload event
window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = '';
  }
});
\`\`\`

$DESIGN_PRINCIPLES_REF" \
"enhancement,data-loss-prevention" \
"P1"

# P1-4: Mobile Tap Targets
create_issue \
"[UX] Audit and fix tap target sizes (44x44px minimum)" \
"## Problem
Some interactive elements are too small for comfortable mobile interaction.

## Impact
- **Severity:** High
- **Users Affected:** Mobile users
- **WCAG Compliance:** Fails WCAG 2.1 AAA 2.5.5 (Target Size)

## Requirements
- [ ] Audit all interactive elements
- [ ] Ensure minimum 44x44px tap targets
- [ ] Add adequate spacing between targets
- [ ] Test on actual mobile devices
- [ ] Document exceptions (if any)

## Acceptance Criteria
- All buttons/links are 44x44px minimum
- Adequate spacing between adjacent targets
- Comfortable to tap on mobile devices
- Passes mobile usability testing

## Areas to Check
- Icon buttons
- Checkbox/radio inputs
- Close buttons on modals
- Navigation menu items
- Card action buttons

$DESIGN_PRINCIPLES_REF" \
"mobile,accessibility,a11y" \
"P1"

# P1-5: Toast Notification System
create_issue \
"[UX] Implement toast notification system" \
"## Problem
Application uses browser alerts which are disruptive and not customizable.

## Impact
- **Severity:** High
- **Users Affected:** All users
- **User Experience:** Alerts interrupt workflow

## Requirements
- [ ] Implement toast notification component
- [ ] Support success, error, warning, info types
- [ ] Auto-dismiss after configurable duration
- [ ] Allow manual dismissal
- [ ] Stack multiple toasts
- [ ] Position: bottom-right or top-right
- [ ] Accessible (ARIA live region)

## Acceptance Criteria
- Toasts appear for all feedback messages
- Auto-dismiss after 3-5 seconds
- Users can dismiss manually
- Multiple toasts stack properly
- Screen readers announce messages
- No browser alerts used

## Design Requirements
- Match application theme
- Include appropriate icons
- Smooth animations
- Mobile-friendly

## Technical Notes
Consider using: react-hot-toast or react-toastify

$DESIGN_PRINCIPLES_REF" \
"enhancement,ui-component" \
"P1"

# P1-6: Contextual Help - Tooltips
create_issue \
"[UX] Add tooltips to all icon buttons" \
"## Problem
Icon buttons lack labels, making their purpose unclear.

## Impact
- **Severity:** High
- **Users Affected:** All users, especially new users
- **Discoverability:** Features are hard to discover

## Requirements
- [ ] Add tooltips to all icon-only buttons
- [ ] Ensure tooltips are descriptive
- [ ] Show on hover (desktop) and long-press (mobile)
- [ ] Accessible (aria-describedby)
- [ ] Consistent positioning

## Acceptance Criteria
- All icon buttons have tooltips
- Tooltips appear on hover/long-press
- Tooltips are descriptive and helpful
- Accessible to screen readers
- Consistent styling

## Icon Buttons to Label
- Edit button
- Delete button
- Share button
- Favorite button
- Filter buttons
- Sort buttons
- Navigation icons

$DESIGN_PRINCIPLES_REF" \
"enhancement,help,accessibility" \
"P1"

# P1-7: Visual Consistency - Card Standardization
create_issue \
"[UX] Standardize card components across application" \
"## Problem
Recipe cards vary in size, layout, and information density across different pages.

## Impact
- **Severity:** High
- **Users Affected:** All users
- **Consistency:** Inconsistent UI reduces trust and usability

## Requirements
- [ ] Audit all card components
- [ ] Create standard card component
- [ ] Define card variants (compact, standard, detailed)
- [ ] Ensure consistent spacing and typography
- [ ] Document card usage guidelines

## Acceptance Criteria
- Single card component used throughout
- Consistent visual appearance
- Responsive behavior standardized
- Documentation created
- All pages updated

## Card Locations
- Recipe list page
- Browse recipes page
- Meal planner
- Dashboard
- Search results

$DESIGN_PRINCIPLES_REF" \
"enhancement,consistency,ui-component" \
"P1"

echo ""
echo "Creating P2 (Medium Priority) UX Issues..."
echo "------------------------------------------"

# P2-1: Progressive Disclosure - Filter Sections
create_issue \
"[UX] Implement collapsible filter sections on Browse page" \
"## Problem
Browse Recipes page shows all filters at once, overwhelming users.

## Impact
- **Severity:** Medium
- **Users Affected:** All users browsing recipes
- **Cognitive Load:** Too many options visible at once

## Requirements
- [ ] Group filters into logical sections
- [ ] Make sections collapsible
- [ ] Remember expanded/collapsed state
- [ ] Show active filter count on collapsed sections
- [ ] Add \"Clear All\" button

## Acceptance Criteria
- Filters grouped into sections (Dietary, Cuisine, Time, etc.)
- Sections can be expanded/collapsed
- State persists across sessions
- Active filters visible when collapsed
- Mobile-friendly

## Suggested Sections
1. Dietary Restrictions
2. Cuisine Type
3. Cooking Time
4. Difficulty Level
5. Ingredients

$DESIGN_PRINCIPLES_REF" \
"enhancement,progressive-disclosure" \
"P2"

# P2-2: Recipe Detail Tabs
create_issue \
"[UX] Add tabbed interface to Recipe Detail page" \
"## Problem
Recipe detail page shows all information at once, creating a long scrolling page.

## Impact
- **Severity:** Medium
- **Users Affected:** All users viewing recipes
- **Usability:** Hard to find specific information

## Requirements
- [ ] Implement tab component
- [ ] Create tabs: Overview, Ingredients, Instructions, Nutrition
- [ ] Remember last viewed tab
- [ ] Mobile-friendly tab design
- [ ] Keyboard accessible

## Acceptance Criteria
- Recipe information organized into tabs
- Tabs are keyboard accessible
- Active tab persists on page refresh
- Works well on mobile
- Smooth transitions

## Tab Content
- **Overview:** Image, description, tags, metadata
- **Ingredients:** Ingredient list with scaling
- **Instructions:** Step-by-step instructions
- **Nutrition:** Nutritional information

$DESIGN_PRINCIPLES_REF" \
"enhancement,progressive-disclosure" \
"P2"

# P2-3: First-Time User Onboarding
create_issue \
"[UX] Create first-time user onboarding flow" \
"## Problem
New users don't understand key features or how to get started.

## Impact
- **Severity:** Medium
- **Users Affected:** New users
- **Adoption:** Poor onboarding reduces user retention

## Requirements
- [ ] Design onboarding flow (3-5 steps)
- [ ] Highlight key features
- [ ] Provide sample data option
- [ ] Allow skip option
- [ ] Remember completion status

## Acceptance Criteria
- Onboarding appears for new users
- Users can skip or complete
- Key features explained clearly
- Sample data option available
- Doesn't show again after completion

## Onboarding Steps
1. Welcome & overview
2. Create your first recipe
3. Plan your first meal
4. Generate grocery list
5. Explore browse recipes

$DESIGN_PRINCIPLES_REF" \
"enhancement,onboarding,help" \
"P2"

# P2-4: Inline Form Validation
create_issue \
"[UX] Add inline validation to forms" \
"## Problem
Form validation only occurs on submit, requiring users to fix all errors at once.

## Impact
- **Severity:** Medium
- **Users Affected:** All users filling forms
- **Efficiency:** Delayed feedback slows down form completion

## Requirements
- [ ] Validate fields on blur
- [ ] Show validation status inline
- [ ] Provide helpful error messages
- [ ] Don't validate on initial focus
- [ ] Accessible error announcements

## Acceptance Criteria
- Fields validate on blur
- Errors shown inline immediately
- Success indicators shown for valid fields
- Error messages are helpful
- Screen readers announce errors

## Forms to Update
- Recipe creation/editing
- Meal plan creation
- User registration
- Profile editing
- Import recipe

$DESIGN_PRINCIPLES_REF" \
"enhancement,forms,accessibility" \
"P2"

# P2-5: Empty State Improvements
create_issue \
"[UX] Create consistent empty state designs" \
"## Problem
Empty states vary in design and helpfulness across the application.

## Impact
- **Severity:** Medium
- **Users Affected:** New users, users with no data
- **Guidance:** Inconsistent guidance reduces usability

## Requirements
- [ ] Design standard empty state component
- [ ] Include helpful illustration/icon
- [ ] Provide clear call-to-action
- [ ] Explain why state is empty
- [ ] Suggest next steps

## Acceptance Criteria
- Consistent empty state design
- Clear, helpful messaging
- Prominent call-to-action
- Works on all pages
- Mobile-friendly

## Pages with Empty States
- My Recipes (no recipes)
- Meal Planner (no plans)
- Grocery List (no items)
- Pantry (no items)
- Search results (no matches)

$DESIGN_PRINCIPLES_REF" \
"enhancement,consistency,help" \
"P2"

# P2-6: Swipe Gestures for Mobile
create_issue \
"[UX] Add swipe gestures for common mobile actions" \
"## Problem
Mobile users must tap small buttons for common actions like delete.

## Impact
- **Severity:** Medium
- **Users Affected:** Mobile users
- **Efficiency:** Reduces mobile workflow efficiency

## Requirements
- [ ] Implement swipe-to-delete on lists
- [ ] Add swipe-to-favorite
- [ ] Provide visual feedback during swipe
- [ ] Allow swipe cancellation
- [ ] Make discoverable (hint animation)

## Acceptance Criteria
- Swipe left reveals delete button
- Swipe right reveals favorite button
- Visual feedback during swipe
- Can cancel by swiping back
- Hint animation on first use

## Lists to Update
- Recipe list
- Meal plan list
- Grocery list items
- Pantry items

$DESIGN_PRINCIPLES_REF" \
"enhancement,mobile,gestures" \
"P2"

echo ""
echo "Creating P3 (Low Priority) UX Issues..."
echo "---------------------------------------"

# P3-1: Recipe Templates
create_issue \
"[UX] Add recipe templates for quick creation" \
"## Problem
Creating recipes from scratch is time-consuming for common recipe types.

## Impact
- **Severity:** Low
- **Users Affected:** Users creating many recipes
- **Efficiency:** Could speed up recipe creation

## Requirements
- [ ] Create common recipe templates
- [ ] Allow template selection on create
- [ ] Pre-fill common fields
- [ ] Allow template customization
- [ ] Users can save custom templates

## Acceptance Criteria
- Template selection available on create
- Templates pre-fill appropriate fields
- Users can customize before saving
- Custom templates can be saved
- Templates are helpful, not restrictive

## Template Ideas
- Breakfast (eggs, pancakes, etc.)
- Salad
- Soup
- Pasta dish
- Baked goods
- Smoothie

$DESIGN_PRINCIPLES_REF" \
"enhancement,efficiency,templates" \
"P3"

# P3-2: Keyboard Shortcuts
create_issue \
"[UX] Implement keyboard shortcuts for power users" \
"## Problem
No keyboard shortcuts exist for common actions.

## Impact
- **Severity:** Low
- **Users Affected:** Power users
- **Efficiency:** Could improve workflow for frequent users

## Requirements
- [ ] Define keyboard shortcut scheme
- [ ] Implement shortcuts for common actions
- [ ] Create shortcut help modal (? key)
- [ ] Make shortcuts discoverable
- [ ] Ensure no conflicts with browser shortcuts

## Acceptance Criteria
- Shortcuts work for common actions
- Help modal shows all shortcuts
- Shortcuts are intuitive
- No browser conflicts
- Accessible (don't break screen readers)

## Suggested Shortcuts
- \`n\`: New recipe
- \`s\`: Search
- \`/\`: Focus search
- \`?\`: Show shortcuts
- \`Esc\`: Close modal
- \`Ctrl+S\`: Save

$DESIGN_PRINCIPLES_REF" \
"enhancement,efficiency,keyboard" \
"P3"

# P3-3: Skeleton Screens
create_issue \
"[UX] Implement skeleton screens for loading states" \
"## Problem
Loading states show generic spinners, providing no context about what's loading.

## Impact
- **Severity:** Low
- **Users Affected:** All users
- **Perceived Performance:** Could improve perceived performance

## Requirements
- [ ] Design skeleton screens for each page type
- [ ] Match skeleton to actual content layout
- [ ] Animate skeleton (shimmer effect)
- [ ] Replace spinners with skeletons
- [ ] Ensure accessibility

## Acceptance Criteria
- Skeleton screens match content layout
- Smooth transition to actual content
- Accessible (aria-busy, aria-live)
- Improves perceived performance
- Works on all pages

## Pages to Update
- Recipe list
- Recipe detail
- Meal planner
- Browse recipes
- Dashboard

$DESIGN_PRINCIPLES_REF" \
"enhancement,performance,loading" \
"P3"

# P3-4: Celebration Micro-interactions
create_issue \
"[UX] Add celebration micro-interactions for achievements" \
"## Problem
No positive reinforcement for user accomplishments.

## Impact
- **Severity:** Low
- **Users Affected:** All users
- **Delight:** Could increase user satisfaction

## Requirements
- [ ] Add confetti animation for first recipe
- [ ] Add success animations for milestones
- [ ] Celebrate meal plan completion
- [ ] Add subtle animations for saves
- [ ] Make animations optional (settings)

## Acceptance Criteria
- Celebrations appear at appropriate times
- Animations are delightful, not annoying
- Can be disabled in settings
- Accessible (respects prefers-reduced-motion)
- Performs well

## Celebration Moments
- First recipe created
- 10th recipe created
- First meal plan completed
- Week of meals planned
- Recipe successfully imported

$DESIGN_PRINCIPLES_REF" \
"enhancement,delight,animations" \
"P3"

# P3-5: Data Export
create_issue \
"[UX] Implement data export functionality" \
"## Problem
Users cannot export their data for backup or migration.

## Impact
- **Severity:** Low
- **Users Affected:** Users wanting data portability
- **Trust:** Data export increases user trust

## Requirements
- [ ] Export recipes as JSON
- [ ] Export recipes as CSV
- [ ] Export meal plans
- [ ] Export grocery lists
- [ ] Provide \"Export All\" option

## Acceptance Criteria
- Users can export individual recipes
- Users can export all data
- Multiple format options (JSON, CSV)
- Exported data is well-formatted
- Import functionality considered

## Export Formats
- **JSON:** Complete data with relationships
- **CSV:** Spreadsheet-compatible
- **PDF:** Printable recipes (future)

$DESIGN_PRINCIPLES_REF" \
"enhancement,data-portability,privacy" \
"P3"

echo ""
echo "Creating Documentation Issue..."
echo "-------------------------------"

# Documentation Issue
create_issue \
"[UX] Document Design Principles and UX Evaluation" \
"## Overview
Document the established design principles and UX evaluation findings for future reference.

## Completed Work
- ✅ Created comprehensive Design Principles document
- ✅ Conducted full UX evaluation by simulated expert team
- ✅ Identified 30+ UX issues across all priority levels
- ✅ Created action plan for improvements

## Documentation Files
- \`docs/DESIGN_PRINCIPLES.md\` - 20 core design principles
- \`docs/UX_EVALUATION_REPORT.md\` - Complete evaluation findings

## Purpose
These documents should be referenced for:
- All future UX/UI changes
- Feature design decisions
- Code review considerations
- User testing planning
- Accessibility compliance

## Next Steps
- [ ] Review documents with team
- [ ] Integrate into development workflow
- [ ] Reference in PR templates
- [ ] Schedule quarterly UX reviews
- [ ] Update based on user feedback

## Related Issues
All UX issues created from this evaluation should reference these documents.

$DESIGN_PRINCIPLES_REF" \
"documentation,ux,design" \
"P2"

echo ""
echo "=============================================="
echo "✅ UX Issues Created Successfully!"
echo ""
echo "Summary:"
echo "  - P0 (Critical): 4 issues"
echo "  - P1 (High): 7 issues"
echo "  - P2 (Medium): 6 issues"
echo "  - P3 (Low): 5 issues"
echo "  - Documentation: 1 issue"
echo "  - Total: 23 issues"
echo ""
echo "Next Steps:"
echo "  1. Review issues in GitHub"
echo "  2. Prioritize based on business needs"
echo "  3. Assign to team members"
echo "  4. Begin implementation"
echo ""
echo "Reference Documents:"
echo "  - docs/DESIGN_PRINCIPLES.md"
echo "  - docs/UX_EVALUATION_REPORT.md"
echo ""

# Made with Bob
