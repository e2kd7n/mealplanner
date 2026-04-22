# ARIA Labels and Semantic HTML Implementation

## Overview

This document describes the ARIA labels and semantic HTML implementation for issue #122.

## Current Status

### ✅ Components with ARIA Labels

The following components already have proper ARIA labels:

1. **Layout.tsx**
   - ✅ Mobile menu toggle with aria-label and aria-expanded
   - ✅ User account menu with aria-label and aria-controls
   - ✅ Navigation drawer with aria-label

2. **GroceryList.tsx**
   - ✅ Expand/collapse all buttons
   - ✅ Refresh button
   - ✅ Clear checked items button
   - ✅ Delete item buttons

3. **RecipeDetail.tsx**
   - ✅ Servings adjustment buttons
   - ✅ Number input with aria-label

4. **Recipes.tsx**
   - ✅ Recipe cards with aria-label
   - ✅ Import and create buttons
   - ✅ Tab navigation with aria-label
   - ✅ Search input with aria-label

5. **Pantry.tsx**
   - ✅ Add item button
   - ✅ Edit and delete buttons with descriptive labels

6. **BackendStatusBanner.tsx**
   - ✅ Close button with aria-label

7. **OnboardingWizard.tsx**
   - ✅ Skip button with aria-label

8. **BrowseRecipes.tsx**
   - ✅ Search input with aria-label and aria-describedby

### ⚠️ Components Needing ARIA Labels

The following IconButtons need aria-labels added:

1. **GroceryList.tsx**
   - Line 491: Expand/collapse category button (missing aria-label)

2. **AdminDashboard.tsx**
   - Lines 371-419: All admin action buttons need aria-labels
     - Edit user button
     - Block/unblock user buttons
     - Reset password button
     - Delete user button

3. **Profile.tsx**
   - Lines 525-530: Family member edit/delete buttons need aria-labels

4. **CreateRecipe.tsx**
   - Line 722: Add ingredient button needs aria-label
   - Line 747: Remove ingredient buttons need aria-labels
   - Line 869: Remove instruction button needs aria-label

5. **BatchCookingDialog.tsx**
   - Line 127: Close dialog button needs aria-label

6. **MealPlanner.tsx**
   - Lines 914, 934: Week navigation buttons need aria-labels
   - Line 1034: Add meal button needs aria-label
   - Lines 1233, 1461: Close dialog buttons need aria-labels
   - Line 1512: Delete meal button needs aria-label

## Implementation Plan

### 1. Add Missing ARIA Labels

All IconButtons must have descriptive aria-labels:

```tsx
// Bad - no aria-label
<IconButton onClick={handleEdit}>
  <EditIcon />
</IconButton>

// Good - descriptive aria-label
<IconButton 
  onClick={handleEdit}
  aria-label="Edit user profile"
>
  <EditIcon />
</IconButton>
```

### 2. Semantic HTML Elements

Current usage:
- ✅ `<nav>` for navigation
- ✅ `<main>` for main content
- ✅ `<header>` in AppBar
- ✅ `<form>` for forms
- ✅ `<button>` for actions
- ✅ `<article>` for recipe cards
- ✅ `<section>` for content sections

### 3. ARIA Live Regions

Needed for:
- Form validation errors
- Success messages
- Loading states
- Dynamic content updates

```tsx
// Example implementation
<Alert 
  severity="error"
  role="alert"
  aria-live="polite"
>
  {errorMessage}
</Alert>
```

### 4. Form Accessibility

Current implementation:
- ✅ Label associations via Material-UI
- ✅ Error messages displayed
- ✅ Required field indicators
- ⚠️ Need aria-describedby for help text

### 5. Navigation Landmarks

Current implementation:
- ✅ Navigation drawer with role
- ✅ Main content area
- ⚠️ Need aria-current for active page

## WCAG 2.1 AA Compliance

### 1.3.1 Info and Relationships (Level A)
- Status: ✅ COMPLIANT
- Implementation: Semantic HTML, proper heading hierarchy

### 1.3.5 Identify Input Purpose (Level AA)
- Status: ✅ COMPLIANT
- Implementation: Autocomplete attributes on forms

### 2.4.6 Headings and Labels (Level AA)
- Status: ⚠️ PARTIAL
- Action: Add missing aria-labels to IconButtons

### 2.5.3 Label in Name (Level A)
- Status: ✅ COMPLIANT
- Implementation: Visible labels match accessible names

### 4.1.2 Name, Role, Value (Level A)
- Status: ⚠️ PARTIAL
- Action: Add missing aria-labels

### 4.1.3 Status Messages (Level AA)
- Status: ⚠️ PARTIAL
- Action: Add aria-live regions for dynamic content

## Testing Checklist

### Screen Reader Testing

Test with:
- [ ] NVDA (Windows)
- [ ] JAWS (Windows)
- [ ] VoiceOver (macOS/iOS)
- [ ] TalkBack (Android)

Verify:
- [ ] All buttons are announced
- [ ] Form fields have labels
- [ ] Error messages are announced
- [ ] Navigation is clear
- [ ] Dynamic content updates announced

### Automated Testing

Tools:
- [ ] Lighthouse accessibility audit
- [ ] axe DevTools
- [ ] WAVE
- [ ] Pa11y

### Manual Testing

- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Tab order logical
- [ ] No keyboard traps
- [ ] Skip links functional

## Recommendations

### High Priority

1. **Add Missing ARIA Labels**
   - AdminDashboard action buttons
   - MealPlanner navigation buttons
   - CreateRecipe action buttons
   - Dialog close buttons

2. **Add ARIA Live Regions**
   - Form validation errors
   - Success/error toasts
   - Loading states

3. **Add aria-current**
   - Active navigation items
   - Current page indicator

### Medium Priority

1. **Enhance Form Accessibility**
   - Add aria-describedby for help text
   - Add aria-invalid for error states
   - Add aria-required for required fields

2. **Add ARIA Expanded States**
   - Collapsible sections
   - Dropdown menus
   - Accordions

3. **Add ARIA Selected States**
   - Tab navigation
   - List selections
   - Active filters

### Low Priority

1. **Add Landmark Roles**
   - Explicit role="main"
   - role="complementary" for sidebars
   - role="contentinfo" for footer

2. **Add Skip Links**
   - Skip to main content
   - Skip to navigation
   - Skip to search

## Implementation Examples

### IconButton with ARIA Label

```tsx
<IconButton
  onClick={handleDelete}
  aria-label={`Delete ${itemName}`}
  color="error"
>
  <DeleteIcon />
</IconButton>
```

### Form Field with Help Text

```tsx
<TextField
  label="Email"
  helperText="We'll never share your email"
  inputProps={{
    'aria-describedby': 'email-helper-text',
  }}
/>
<FormHelperText id="email-helper-text">
  We'll never share your email
</FormHelperText>
```

### Live Region for Errors

```tsx
<Alert
  severity="error"
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
>
  {errorMessage}
</Alert>
```

### Navigation with Current Page

```tsx
<ListItem
  button
  selected={isActive}
  aria-current={isActive ? 'page' : undefined}
>
  <ListItemText primary="Dashboard" />
</ListItem>
```

### Expandable Section

```tsx
<IconButton
  onClick={toggleExpanded}
  aria-expanded={isExpanded}
  aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
>
  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
</IconButton>
```

## Material-UI Accessibility Features

Material-UI provides built-in accessibility:
- ✅ Proper ARIA roles
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Screen reader support

However, developers must:
- Add aria-labels to IconButtons
- Provide descriptive alt text for images
- Add aria-live regions for dynamic content
- Ensure proper heading hierarchy

## Related Files

- `frontend/src/components/Layout.tsx` - Navigation with ARIA
- `frontend/src/pages/Recipes.tsx` - Search and tabs with ARIA
- `frontend/src/pages/GroceryList.tsx` - Action buttons with ARIA
- `frontend/src/components/OptimizedImage.tsx` - Images with alt text

## Issue Status

**Issue #122: [P2][A11Y] Add ARIA Labels and Semantic HTML**

Status: ⚠️ Partial - Needs completion

Completed:
- ✅ Many components have ARIA labels
- ✅ Semantic HTML used throughout
- ✅ Material-UI accessibility features
- ✅ Form labels and associations
- ✅ Navigation landmarks

Needs Work:
- ⚠️ Add missing aria-labels to IconButtons
- ⚠️ Add ARIA live regions
- ⚠️ Add aria-current for navigation
- ⚠️ Screen reader testing required

The application has good ARIA coverage but needs completion of missing labels and live regions for full WCAG 2.1 AA compliance.

## Made with Bob