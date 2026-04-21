# GitHub Issues Update Plan

**Date:** 2026-04-21  
**Purpose:** Document all GitHub issue updates and creations based on unified design review

---

## Summary

Based on the VP decisions in the Design Review Comparison, we need to:
1. Update existing issue #79 priority from P2 to P0
2. Update existing UX issues with VP decisions
3. Create new issues for items not yet tracked
4. Cross-reference all issues with design documents

---

## Existing Issues to Update

### Issue #79: Navigation Consolidation

**Current State:**
- Title: "[P2][UX] Confusing navigation - consolidate 'Search Recipes' and 'Browse Recipes'"
- Priority: P2 (Medium)
- Status: Open

**Required Updates:**
- **Priority:** Change from P2 to P0-critical
- **Labels:** Add "blocking-launch"
- **Description:** Add reference to design review documents
- **Milestone:** Add to "Beta Launch" milestone

**Updated Description:**
```markdown
## Problem
Users are confused by "Search Recipes" vs "Browse Recipes" distinction. This reflects developer thinking, not user mental models.

## Impact
- **Severity:** CRITICAL (upgraded from P2 to P0 per VP decision)
- **User Impact:** 40-60% of users will click wrong option (per external consultancy)
- **Business Impact:** Poor first impression, high support burden

## VP Decision
Upgraded to P0 based on external consultancy review. Must fix before beta launch.

## Solution
Consolidate into single "Recipes" section with clear organization:
```
Recipes
├── My Collection (default)
│   ├── All Recipes
│   ├── Favorites
│   └── Recent
├── Discover
│   ├── Search External
│   └── Browse Categories
└── Add Recipe
    ├── Create New
    └── Import from URL
```

## Acceptance Criteria
- [ ] Single "Recipes" navigation item
- [ ] Clear tabs/sections for different recipe sources
- [ ] User testing shows <10% confusion rate
- [ ] No duplicate navigation items

## References
- Design Principles: docs/DESIGN_PRINCIPLES.md
- Internal UX Review: docs/UX_EVALUATION_REPORT.md
- External Consultancy: docs/DESIGN_CONSULTANCY_REVIEW.md
- VP Decisions: docs/DESIGN_REVIEW_COMPARISON.md

## Timeline
- **Target:** Week 1-2 of Beta Sprint
- **Blocking:** Beta launch
```

---

## New Issues to Create

### P0 Issues (Beta Launch Blockers)

#### Issue: [P0][A11y] Add ARIA labels to all interactive elements

**Labels:** P0-critical, accessibility, a11y, blocking-launch, vp-decision  
**Milestone:** Beta Launch  
**Assignee:** Frontend Team

**Description:**
```markdown
## Problem
Interactive elements lack ARIA labels, making the application unusable with screen readers.

## Impact
- **Severity:** CRITICAL
- **Legal Risk:** ADA lawsuit potential
- **User Impact:** Blind users cannot use application
- **WCAG:** Fails 4.1.2 (Name, Role, Value)

## Requirements
- [ ] Audit all buttons, links, and interactive elements
- [ ] Add aria-label or aria-labelledby to all icon buttons
- [ ] Add aria-describedby for complex interactions
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)

## Example
```typescript
// WRONG
<IconButton onClick={handleDelete}>
  <DeleteIcon />
</IconButton>

// CORRECT
<IconButton 
  onClick={handleDelete}
  aria-label="Delete recipe"
  title="Delete recipe"
>
  <DeleteIcon />
</IconButton>
```

## Acceptance Criteria
- All interactive elements have descriptive ARIA labels
- Screen reader announces all actions clearly
- Passes automated accessibility testing (axe, WAVE)
- Manual testing with screen reader successful

## References
- Design Principles: docs/DESIGN_PRINCIPLES.md (Principle #7: Accessibility First)
- External Consultancy: docs/DESIGN_CONSULTANCY_REVIEW.md (Section 2)
- VP Decisions: docs/DESIGN_REVIEW_COMPARISON.md

## Timeline
- **Target:** Week 1-2 of Beta Sprint
- **Effort:** 2-3 days
- **Blocking:** Beta launch
```

---

#### Issue: [P0][A11y] Implement 2px focus indicators throughout application

**Labels:** P0-critical, accessibility, a11y, blocking-launch, vp-decision  
**Milestone:** Beta Launch  
**Assignee:** Frontend Team

**Description:**
```markdown
## Problem
Focus indicators are insufficient or missing, making keyboard navigation difficult.

## Impact
- **Severity:** CRITICAL
- **User Impact:** Keyboard-only users cannot navigate
- **WCAG:** Fails 2.4.7 (Focus Visible)

## Requirements
- [ ] Add 2px minimum focus outline to all interactive elements
- [ ] Ensure focus indicators have 3:1 contrast ratio
- [ ] Test keyboard navigation through entire application
- [ ] Ensure focus order is logical

## Implementation
```css
/* Global focus style */
*:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
```

## Acceptance Criteria
- All focusable elements have visible 2px+ outline
- Focus indicators meet contrast requirements
- Keyboard navigation works for all features
- Focus order follows visual layout

## References
- Design Principles: docs/DESIGN_PRINCIPLES.md (Principle #7)
- External Consultancy: docs/DESIGN_CONSULTANCY_REVIEW.md (Section 2)
- VP Decisions: docs/DESIGN_REVIEW_COMPARISON.md

## Timeline
- **Target:** Week 1-2 of Beta Sprint
- **Effort:** 1-2 days
- **Blocking:** Beta launch
```

---

#### Issue: [P0][A11y] Add skip navigation links

**Labels:** P0-critical, accessibility, a11y, blocking-launch, vp-decision  
**Milestone:** Beta Launch  
**Assignee:** Frontend Team

**Description:**
```markdown
## Problem
No skip navigation links exist, forcing keyboard users to tab through entire navigation on every page.

## Impact
- **Severity:** CRITICAL
- **User Impact:** Keyboard users waste time on every page
- **WCAG:** Fails 2.4.1 (Bypass Blocks)

## Requirements
- [ ] Add "Skip to main content" link at page top
- [ ] Add "Skip to navigation" link
- [ ] Ensure links are visible on focus
- [ ] Test with keyboard navigation

## Implementation
```tsx
// Add to Layout.tsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
<a href="#navigation" className="skip-link">
  Skip to navigation
</a>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
</style>
```

## Acceptance Criteria
- Skip links appear on Tab key press
- Links jump to correct page sections
- Works on all pages
- Passes WCAG 2.1 AA 2.4.1

## References
- Design Principles: docs/DESIGN_PRINCIPLES.md (Principle #7)
- External Consultancy: docs/DESIGN_CONSULTANCY_REVIEW.md (Section 2)
- VP Decisions: docs/DESIGN_REVIEW_COMPARISON.md

## Timeline
- **Target:** Week 1-2 of Beta Sprint
- **Effort:** 1 day
- **Blocking:** Beta launch
```

---

#### Issue: [P0][UX] Implement auto-save for recipe creation/editing

**Labels:** P0-critical, enhancement, data-loss-prevention, blocking-launch, vp-decision  
**Milestone:** Beta Launch  
**Assignee:** Frontend + Backend Team

**Description:**
```markdown
## Problem
Users lose all work if they navigate away or encounter an error during recipe creation/editing.

## Impact
- **Severity:** CRITICAL
- **User Impact:** Data loss is extremely frustrating
- **Business Impact:** Users will abandon the application

## Requirements
- [ ] Auto-save recipe drafts every 30 seconds
- [ ] Store drafts in localStorage or IndexedDB
- [ ] Restore drafts on page return
- [ ] Show "Draft saved" indicator
- [ ] Allow manual save
- [ ] Clear drafts after successful save

## Implementation Notes
- Use localStorage for simple implementation
- Consider IndexedDB for larger recipes
- Implement debounced save (30s after last change)
- Handle offline scenarios

## Acceptance Criteria
- Recipe data persists across page refreshes
- Users can resume editing after navigation
- Draft indicator shows save status
- Drafts cleared after successful save
- Works offline

## References
- Design Principles: docs/DESIGN_PRINCIPLES.md (Principle #5: Error Prevention)
- Internal UX Review: docs/UX_EVALUATION_REPORT.md
- External Consultancy: docs/DESIGN_CONSULTANCY_REVIEW.md (Section 3)
- VP Decisions: docs/DESIGN_REVIEW_COMPARISON.md

## Timeline
- **Target:** Week 3-4 of Beta Sprint
- **Effort:** 3-4 days
- **Blocking:** Beta launch
```

---

#### Issue: [P0][UX] Add undo functionality for destructive actions

**Labels:** P0-critical, enhancement, error-recovery, blocking-launch, vp-decision  
**Milestone:** Beta Launch  
**Assignee:** Frontend + Backend Team

**Description:**
```markdown
## Problem
No way to undo deletions or other destructive actions.

## Impact
- **Severity:** CRITICAL (upgraded per VP decision)
- **User Impact:** Users afraid to delete anything
- **User Confidence:** Reduces trust in application

## Requirements
- [ ] Implement undo toast for deletions (5-second window)
- [ ] Store deleted items temporarily
- [ ] Add "Undo" button to success messages
- [ ] Implement for: recipe delete, meal plan delete, ingredient delete
- [ ] Clear undo queue after timeout

## Implementation Pattern
```typescript
interface DeletedItem {
  id: string;
  type: 'recipe' | 'mealPlan' | 'ingredient';
  data: any;
  deletedAt: Date;
}

// Show toast with undo button
showToast({
  message: 'Recipe deleted',
  action: {
    label: 'Undo',
    onClick: () => restoreItem(deletedItem)
  },
  duration: 5000
});
```

## Acceptance Criteria
- Undo toast appears after deletion
- Undo button restores deleted item
- Toast auto-dismisses after 5 seconds
- Permanent deletion occurs after timeout
- Works for all destructive actions

## References
- Design Principles: docs/DESIGN_PRINCIPLES.md (Principle #5)
- External Consultancy: docs/DESIGN_CONSULTANCY_REVIEW.md (Section 3)
- VP Decisions: docs/DESIGN_REVIEW_COMPARISON.md (Compromise: P0 for undo)

## Timeline
- **Target:** Week 3-4 of Beta Sprint
- **Effort:** 2-3 days
- **Blocking:** Beta launch
```

---

#### Issue: [P0][Mobile] Fix tap target sizes (44x44px minimum)

**Labels:** P0-critical, mobile, accessibility, blocking-launch, vp-decision  
**Milestone:** Beta Launch  
**Assignee:** Frontend Team

**Description:**
```markdown
## Problem
Many interactive elements are too small for comfortable mobile interaction.

## Impact
- **Severity:** CRITICAL (upgraded per VP decision)
- **User Impact:** 30-40% of mobile taps will miss target
- **WCAG:** Fails 2.5.5 (Target Size)
- **Business Impact:** 60% of users are mobile

## Requirements
- [ ] Audit all interactive elements
- [ ] Ensure minimum 44x44px tap targets
- [ ] Add adequate spacing between targets
- [ ] Test on actual mobile devices
- [ ] Document exceptions (if any)

## Areas to Check
- Icon buttons
- Checkbox/radio inputs
- Close buttons on modals
- Navigation menu items
- Card action buttons

## Acceptance Criteria
- All buttons/links are 44x44px minimum
- Adequate spacing between adjacent targets
- Comfortable to tap on mobile devices
- Passes mobile usability testing

## References
- Design Principles: docs/DESIGN_PRINCIPLES.md (Principle #6: Mobile-First)
- External Consultancy: docs/DESIGN_CONSULTANCY_REVIEW.md (Section 4)
- VP Decisions: docs/DESIGN_REVIEW_COMPARISON.md (Compromise: P0 for tap targets)

## Timeline
- **Target:** Week 3-4 of Beta Sprint
- **Effort:** 2-3 days
- **Blocking:** Beta launch
```

---

#### Issue: [P0][Mobile] Fix horizontal scrolling issues

**Labels:** P0-critical, mobile, bug, blocking-launch  
**Milestone:** Beta Launch  
**Assignee:** Frontend Team

**Description:**
```markdown
## Problem
Some views scroll horizontally on mobile, which is disorienting and feels broken.

## Impact
- **Severity:** CRITICAL
- **User Impact:** Feels like a broken website
- **Industry Standard:** Never horizontal scroll

## Requirements
- [ ] Audit all pages on mobile devices
- [ ] Fix any horizontal overflow
- [ ] Ensure all content fits viewport width
- [ ] Test on various screen sizes (320px to 768px)

## Common Causes
- Fixed-width elements
- Tables without responsive design
- Images without max-width
- Long unbreakable text

## Acceptance Criteria
- No horizontal scrolling on any page
- All content fits within viewport
- Tested on actual devices (iOS, Android)
- Works on screens from 320px to 768px

## References
- External Consultancy: docs/DESIGN_CONSULTANCY_REVIEW.md (Section 4)
- VP Decisions: docs/DESIGN_REVIEW_COMPARISON.md

## Timeline
- **Target:** Week 3-4 of Beta Sprint
- **Effort:** 1-2 days
- **Blocking:** Beta launch
```

---

### P1 Issues (Pre-Public Launch)

#### Issue: [P1][UX] Implement bulk selection and operations

**Labels:** P1-high, enhancement, efficiency  
**Milestone:** Public Launch  
**Assignee:** Frontend Team

**Description:**
```markdown
## Problem
Users cannot select multiple recipes for batch operations (delete, tag, export).

## Impact
- **Severity:** High
- **User Impact:** Power users, users with many recipes
- **Efficiency:** Significantly impacts workflow

## Requirements
- [ ] Add checkbox selection to recipe lists
- [ ] Implement "Select All" functionality
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

## References
- Design Principles: docs/DESIGN_PRINCIPLES.md (Principle #8: Performance & Efficiency)
- Both reviews agree: P1 priority
- VP Decisions: docs/DESIGN_REVIEW_COMPARISON.md

## Timeline
- **Target:** Sprint 1 (Weeks 5-6)
- **Effort:** 3-4 days
```

---

#### Issue: [P1][UX] Add tooltips to all icon buttons

**Labels:** P1-high, enhancement, help, accessibility  
**Milestone:** Public Launch  
**Assignee:** Frontend Team

**Description:**
```markdown
## Problem
Icon buttons lack labels, making their purpose unclear.

## Impact
- **Severity:** High
- **User Impact:** All users, especially new users
- **Discoverability:** Features are hard to discover

## Requirements
- [ ] Add tooltips to all icon-only buttons
- [ ] Ensure tooltips are descriptive
- [ ] Show on hover (desktop) and long-press (mobile)
- [ ] Accessible (aria-describedby)
- [ ] Consistent positioning

## Icon Buttons to Label
- Edit button
- Delete button
- Share button
- Favorite button
- Filter buttons
- Sort buttons
- Navigation icons

## Acceptance Criteria
- All icon buttons have tooltips
- Tooltips appear on hover/long-press
- Tooltips are descriptive and helpful
- Accessible to screen readers
- Consistent styling

## References
- Design Principles: docs/DESIGN_PRINCIPLES.md (Principle #9: Contextual Help)
- Both reviews agree: P1 priority
- VP Decisions: docs/DESIGN_REVIEW_COMPARISON.md

## Timeline
- **Target:** Sprint 1 (Weeks 5-6)
- **Effort:** 2-3 days
```

---

#### Issue: [P1][UX] Create first-time user onboarding flow

**Labels:** P1-high, enhancement, onboarding, help  
**Milestone:** Public Launch  
**Assignee:** Frontend + UX Team

**Description:**
```markdown
## Problem
New users don't understand key features or how to get started.

## Impact
- **Severity:** High
- **User Impact:** New users
- **Adoption:** Poor onboarding reduces retention

## Requirements
- [ ] Design onboarding flow (3-5 steps)
- [ ] Highlight key features
- [ ] Provide sample data option
- [ ] Allow skip option
- [ ] Remember completion status

## Onboarding Steps
1. Welcome & overview
2. Create your first recipe
3. Plan your first meal
4. Generate grocery list
5. Explore browse recipes

## Acceptance Criteria
- Onboarding appears for new users
- Users can skip or complete
- Key features explained clearly
- Sample data option available
- Doesn't show again after completion

## References
- Design Principles: docs/DESIGN_PRINCIPLES.md (Principle #9)
- Both reviews agree: P1 priority
- VP Decisions: docs/DESIGN_REVIEW_COMPARISON.md

## Timeline
- **Target:** Sprint 1 (Weeks 5-6)
- **Effort:** 4-5 days
```

---

#### Issue: [P1][UX] Warn users before leaving pages with unsaved changes

**Labels:** P1-high, enhancement, data-loss-prevention  
**Milestone:** Public Launch  
**Assignee:** Frontend Team

**Description:**
```markdown
## Problem
Users can navigate away from forms with unsaved changes without warning.

## Impact
- **Severity:** High (downgraded from P0 per VP decision)
- **User Impact:** All users editing content
- **Data Loss:** Accidental data loss is frustrating

## Requirements
- [ ] Detect unsaved changes in forms
- [ ] Show confirmation dialog on navigation attempt
- [ ] Show confirmation on browser close/refresh
- [ ] Provide "Save and Continue" option
- [ ] Provide "Discard Changes" option

## Implementation
```typescript
// Use beforeunload event
window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = '';
  }
});
```

## Acceptance Criteria
- Dialog appears when navigating with unsaved changes
- Dialog shows on browser close/refresh
- Users can save or discard changes
- Works for all forms (recipe, meal plan, profile)
- No false positives

## References
- Design Principles: docs/DESIGN_PRINCIPLES.md (Principle #5)
- VP Decisions: docs/DESIGN_REVIEW_COMPARISON.md (Compromise: P1 instead of P0)

## Timeline
- **Target:** Sprint 1 (Weeks 5-6)
- **Effort:** 1-2 days
```

---

## Issue Update Summary

### Priority Changes
- **#79:** P2 → P0 (Navigation consolidation)

### New P0 Issues (8 total)
1. Add ARIA labels to all interactive elements
2. Implement 2px focus indicators
3. Add skip navigation links
4. Implement auto-save for forms
5. Add undo functionality
6. Fix tap target sizes (44x44px)
7. Fix horizontal scrolling on mobile
8. Navigation consolidation (#79 - upgraded)

### New P1 Issues (4 shown, more in original UX evaluation)
9. Implement bulk selection and operations
10. Add tooltips to all icon buttons
11. Create first-time user onboarding
12. Warn on unsaved changes

### Total Issues from Design Reviews
- **P0:** 8 issues (must fix for beta)
- **P1:** 12 issues (must fix for public launch)
- **P2:** 10 issues (post-launch improvements)
- **Total:** 30 issues identified

---

## Cross-Reference Matrix

| Issue | Design Principles | Internal Review | External Review | VP Decision |
|-------|------------------|-----------------|-----------------|-------------|
| Navigation (#79) | Principle #3 | Section 1 | Section 1 | Upgraded to P0 |
| ARIA Labels | Principle #7 | Section 7 | Section 2 | P0 |
| Focus Indicators | Principle #7 | Section 7 | Section 2 | P0 |
| Skip Links | Principle #7 | Section 7 | Section 2 | P0 |
| Auto-Save | Principle #5 | Section 5 | Section 3 | P0 |
| Undo | Principle #5 | Section 5 | Section 3 | P0 (upgraded) |
| Tap Targets | Principle #6 | Section 6 | Section 4 | P0 (upgraded) |
| Horizontal Scroll | Principle #6 | Section 6 | Section 4 | P0 |
| Bulk Operations | Principle #8 | Section 1 | Section 9 | P1 |
| Tooltips | Principle #9 | Section 9 | Section 8 | P1 |
| Onboarding | Principle #9 | Section 9 | Section 8 | P1 |
| Unsaved Warnings | Principle #5 | Section 5 | Section 3 | P1 (downgraded) |

---

## Implementation Notes

### For GitHub CLI Script
```bash
# Update existing issue
gh issue edit 79 \
  --add-label "P0-critical,blocking-launch,vp-decision" \
  --remove-label "P2-medium" \
  --milestone "Beta Launch"

# Create new issues
gh issue create \
  --title "[P0][A11y] Add ARIA labels to all interactive elements" \
  --body-file issue-templates/aria-labels.md \
  --label "P0-critical,accessibility,a11y,blocking-launch,vp-decision" \
  --milestone "Beta Launch"
```

### Labels to Create
- `P0-critical` - Blocking launch
- `blocking-launch` - Cannot launch without fixing
- `vp-decision` - Priority set by VP
- `design-review` - From design review process
- `a11y` - Accessibility
- `data-loss-prevention` - Prevents user data loss
- `error-recovery` - Error handling and recovery

### Milestones to Create
- `Beta Launch` - Target: Week 4
- `Public Launch` - Target: Week 10
- `Post-Launch Q1` - Target: 3 months post-launch

---

## Next Steps

1. **Create GitHub labels and milestones**
2. **Update issue #79** with new priority and details
3. **Create all P0 issues** (8 issues)
4. **Create all P1 issues** (12 issues)
5. **Link all issues** to design review documents
6. **Assign issues** to appropriate team members
7. **Add to project board** for sprint planning

---

**Document Status:** Ready for implementation  
**Approval Required:** VP of Product, Engineering Lead  
**Next Review:** After issue creation complete

---

*This document serves as the official GitHub issue update plan based on unified design review.*