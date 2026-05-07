## Issue Title
[P2] Recipe Creation - Numeric Fields Append Instead of Replace on Input

## Labels
- P2-medium
- bug
- recipes
- ux

## Description

### Summary
When modifying numeric fields (Prep Time, Cook Time, Servings) in the recipe creation form, typing a new value appends to the existing value instead of replacing it, creating poor user experience.

### Impact
- **Severity:** Medium (P2)
- **User Impact:** Confusing UX when editing numeric fields
- **Workaround:** Users must manually clear field (Cmd+A, Delete) before typing

### Steps to Reproduce
1. Navigate to Create Recipe page
2. Focus on "Prep Time" field (default value: 15)
3. Type "10"
4. **Expected:** Field shows "10"
5. **Actual:** Field shows "1510"

### Example Scenarios
- Changing prep time from "15" to "10" results in "1510"
- Changing servings from "4" to "6" results in "46"
- Changing cook time from "30" to "20" results in "3020"

### Affected Fields
- ✅ Prep Time (minutes)
- ✅ Cook Time (minutes)
- ✅ Servings

### Current Workaround
Users must:
1. Click in the field
2. Select all text (Cmd+A or Ctrl+A)
3. Delete or start typing to replace

### Technical Details
- **Component:** CreateRecipe page
- **Field Type:** Numeric input fields
- **Expected Behavior:** First keypress should replace existing value (or select all on focus)
- **Actual Behavior:** New digits append to existing value

### Proposed Solutions

**Option 1: Select All on Focus (Recommended)**
```typescript
const handleNumericFieldFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.select();
};

<TextField
  type="number"
  onFocus={handleNumericFieldFocus}
  // ... other props
/>
```

**Option 2: Clear on First Keypress**
- Track if field has been modified
- Clear value on first keypress after focus
- More complex state management

**Option 3: Use Controlled Input with Better UX**
- Implement custom numeric input component
- Handle selection and replacement logic explicitly

### Environment
- **Browser:** Chrome/Safari
- **Test Date:** 2026-05-06
- **Test Account:** Smith Family (Quick Test Login)
- **URL:** http://localhost:5173/recipes/create

### Related Files
- `frontend/src/pages/CreateRecipe.tsx`
- Possibly shared numeric input components

### Acceptance Criteria
- [ ] Focusing a numeric field selects all existing text
- [ ] Typing immediately after focus replaces the value
- [ ] Behavior is consistent across all numeric fields
- [ ] Works on both desktop and mobile browsers
- [ ] No regression in other input field behaviors

### Priority Justification
This is a P2 medium priority issue because:
1. Affects user experience but doesn't block functionality
2. Workaround exists (manual selection)
3. Impacts all users creating/editing recipes
4. Common UX pattern that users expect
5. Quick fix with high user satisfaction impact

### Related Issues
- Part of UAT findings documented in `docs/usertesting/MEAL_PLANNER_SEARCH_UAT_FINDINGS.md`
- May affect other numeric input fields throughout the application

### Additional Notes
- This is a common UX pattern in form design
- Most applications select all text on focus for numeric fields
- Consider applying this fix to all numeric inputs app-wide
- Test on mobile devices where selection behavior may differ