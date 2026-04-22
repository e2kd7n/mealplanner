# Keyboard Navigation Guide

**Last Updated:** 2026-04-22

This document describes the keyboard navigation features implemented in the Meal Planner application to ensure full accessibility compliance with WCAG 2.1 AA standards.

## Overview

The application provides comprehensive keyboard navigation support, allowing users to access all functionality without requiring a mouse. This includes:

- Full keyboard navigation for all interactive elements
- Visible focus indicators
- Skip navigation links
- Global keyboard shortcuts
- Logical tab order
- Escape key handling for dialogs

## Standard Keyboard Controls

### Basic Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus to next interactive element |
| `Shift + Tab` | Move focus to previous interactive element |
| `Enter` | Activate button, link, or submit form |
| `Space` | Toggle checkbox, activate button, or scroll page |
| `Escape` | Close dialog, cancel action, or clear focus |
| `Arrow Keys` | Navigate within lists, menus, and dropdowns |

### Form Controls

| Key | Action |
|-----|--------|
| `Tab` | Move between form fields |
| `Enter` | Submit form (when focused on submit button) |
| `Space` | Toggle checkbox or radio button |
| `Arrow Keys` | Select options in dropdown or radio group |
| `Home` | Move to first option in list |
| `End` | Move to last option in list |

## Application-Specific Shortcuts

### Global Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `/` | Focus search input | Any page with search |
| `Alt + D` | Navigate to Dashboard | Global |
| `Alt + R` | Navigate to Recipes | Global |
| `Alt + M` | Navigate to Meal Planner | Global |
| `Alt + G` | Navigate to Grocery List | Global |
| `Alt + P` | Navigate to Pantry | Global |

### Page-Specific Shortcuts

#### Recipe Pages
- `Enter` on recipe card: View recipe details
- `Space` on recipe card: View recipe details
- `Arrow Keys`: Navigate between recipe cards

#### Meal Planner
- `Arrow Keys`: Navigate between calendar days
- `Enter`: Add meal to selected day
- `Escape`: Close meal selection dialog

#### Grocery List
- `Space`: Toggle item as checked/unchecked
- `Delete`: Remove item from list
- `Enter`: Edit item details

## Skip Navigation Links

Skip links appear at the top of each page when focused (press `Tab` immediately after page load):

1. **Skip to main content** - Jumps directly to the main content area
2. **Skip to navigation** - Jumps to the navigation menu

These links are visually hidden until focused, ensuring they don't interfere with the visual design while remaining accessible to keyboard users.

## Focus Indicators

All interactive elements display a visible focus indicator when navigated to via keyboard:

- **Color**: Green (`#2E7D32`) - matches primary theme color
- **Style**: 3px solid outline with 2px offset
- **Visibility**: High contrast (4.5:1 minimum ratio)

### Focus Indicator Examples

```css
/* Buttons */
button:focus-visible {
  outline: 3px solid #2E7D32;
  outline-offset: 2px;
}

/* Links */
a:focus-visible {
  outline: 3px solid #2E7D32;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Form inputs */
input:focus {
  border-width: 3px;
  border-color: #2E7D32;
}
```

## Tab Order

The application maintains a logical tab order that follows the visual layout:

1. Skip navigation links (hidden until focused)
2. Header navigation
3. Main navigation menu
4. Main content area
5. Interactive elements within content (top to bottom, left to right)
6. Footer (if present)

### Tab Order Best Practices

- Tab order follows reading order (left-to-right, top-to-bottom)
- Hidden elements are excluded from tab order (`tabIndex={-1}`)
- Modal dialogs trap focus within the dialog
- Focus returns to trigger element when dialog closes

## Dialog and Modal Behavior

### Focus Management

When a dialog opens:
1. Focus moves to the first focusable element in the dialog
2. Tab key cycles through focusable elements within the dialog
3. Focus is trapped within the dialog (cannot tab outside)
4. `Escape` key closes the dialog
5. Focus returns to the element that triggered the dialog

### Example: Recipe Creation Dialog

```typescript
// Focus management in dialogs
useEffect(() => {
  if (dialogOpen) {
    // Focus first input when dialog opens
    const firstInput = dialogRef.current?.querySelector('input');
    firstInput?.focus();
  }
}, [dialogOpen]);

// Handle Escape key
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    handleClose();
  }
};
```

## Accessibility Features

### ARIA Labels

All interactive elements without visible text labels include `aria-label` attributes:

```tsx
<IconButton aria-label="Add pantry item">
  <AddIcon />
</IconButton>

<IconButton aria-label="Delete recipe">
  <DeleteIcon />
</IconButton>
```

### ARIA Live Regions

Dynamic content updates are announced to screen readers:

```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

### Keyboard Shortcuts Hook

The `useKeyboardShortcuts` hook provides centralized keyboard shortcut management:

```typescript
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// In component
const MyComponent = () => {
  useKeyboardShortcuts(); // Enables global shortcuts
  
  return <div>...</div>;
};
```

## Testing Keyboard Navigation

### Manual Testing Checklist

- [ ] All interactive elements are reachable via Tab key
- [ ] Focus indicators are visible on all focused elements
- [ ] Tab order is logical and follows visual layout
- [ ] Skip links appear when focused
- [ ] All keyboard shortcuts work as expected
- [ ] Dialogs trap focus and close with Escape
- [ ] Forms can be submitted with Enter key
- [ ] Dropdowns can be navigated with arrow keys

### Automated Testing

The application includes automated accessibility tests using Playwright:

```bash
# Run accessibility tests
npm run test:e2e -- --grep "keyboard navigation"
```

### Browser Testing

Test keyboard navigation in multiple browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari

## WCAG 2.1 AA Compliance

The keyboard navigation implementation meets the following WCAG 2.1 AA success criteria:

- **2.1.1 Keyboard** (Level A): All functionality available via keyboard
- **2.1.2 No Keyboard Trap** (Level A): Focus can move away from all components
- **2.4.3 Focus Order** (Level A): Logical and meaningful focus order
- **2.4.7 Focus Visible** (Level AA): Visible focus indicators on all elements
- **3.2.1 On Focus** (Level A): No unexpected context changes on focus

## Implementation Details

### Theme Configuration

Focus indicators are configured in `frontend/src/theme.ts`:

```typescript
components: {
  MuiButton: {
    styleOverrides: {
      root: {
        '&:focus-visible': {
          outline: '3px solid #2E7D32',
          outlineOffset: '2px',
        },
      },
    },
  },
  // ... other components
}
```

### Keyboard Shortcuts Hook

Located in `frontend/src/hooks/useKeyboardShortcuts.ts`:

```typescript
export const useKeyboardShortcuts = () => {
  // Keyboard event handling
  // Shortcut registration
  // Focus management
};
```

### Skip Links

Implemented in `frontend/src/components/Layout.tsx`:

```tsx
<Link
  href="#main-content"
  sx={{
    position: 'absolute',
    left: '-9999px',
    '&:focus': {
      left: '0',
      top: '0',
    },
  }}
>
  Skip to main content
</Link>
```

## Troubleshooting

### Focus Not Visible

If focus indicators are not visible:
1. Check browser settings for focus visibility
2. Verify theme configuration includes focus styles
3. Test with `:focus-visible` pseudo-class support

### Keyboard Shortcuts Not Working

If shortcuts don't work:
1. Verify `useKeyboardShortcuts` hook is called in Layout
2. Check for conflicting browser shortcuts
3. Ensure focus is not trapped in an input field

### Tab Order Issues

If tab order seems incorrect:
1. Check for `tabIndex` attributes on elements
2. Verify elements are in correct DOM order
3. Look for CSS that might affect visual vs. DOM order

## Future Enhancements

Planned improvements for keyboard navigation:

1. **Custom Keyboard Shortcut Configuration**
   - Allow users to customize shortcuts
   - Persist preferences in user settings

2. **Keyboard Shortcut Help Dialog**
   - Display all available shortcuts
   - Accessible via `?` key

3. **Enhanced Focus Management**
   - Remember last focused element per page
   - Restore focus when returning to page

4. **Voice Control Integration**
   - Support for voice commands
   - Integration with browser voice APIs

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Material-UI Accessibility](https://mui.com/material-ui/guides/accessibility/)

## Support

For keyboard navigation issues or questions:
- Create an issue on GitHub with the `accessibility` label
- Include browser and operating system information
- Describe the expected vs. actual behavior

---

**Made with Bob**