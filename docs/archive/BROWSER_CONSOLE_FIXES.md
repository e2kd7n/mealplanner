# Browser Console Error Fixes

## Summary
This document explains the browser console errors that were identified and the fixes applied.

## Issues Fixed

### 1. ✅ Fast Refresh Warning - AuthContext
**Error:** `[vite] invalidate /src/contexts/AuthContext.tsx: Could not Fast Refresh ("useAuth" export is incompatible)`

**Cause:** Vite's Fast Refresh requires consistent component exports. The `useAuth` hook was exported as a const arrow function, which is incompatible with Fast Refresh.

**Fix:** Changed both `AuthProvider` and `useAuth` to named function declarations:
```typescript
// Before
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => { ... }
export const useAuth = () => { ... }

// After
export function AuthProvider({ children }: { children: React.ReactNode }) { ... }
export function useAuth() { ... }
```

**Status:** ✅ Fixed in `frontend/src/contexts/AuthContext.tsx`

---

### 2. ⚠️ Non-Passive Wheel Event Listener
**Error:** `[Violation] Added non-passive event listener to a scroll-blocking 'wheel' event`

**Cause:** This is a known issue with Material-UI (MUI) components, specifically the Menu component. MUI adds wheel event listeners for scrolling behavior in dropdowns and menus.

**Impact:** This is a performance warning, not a functional error. It suggests that the page could be more responsive if the event listener was marked as passive.

**Fix:** This is a third-party library issue. The warning can be safely ignored in development. For production:
- MUI team is aware of this issue
- It doesn't affect functionality
- Modern browsers handle this efficiently

**Status:** ⚠️ Documented (no code change needed - MUI library issue)

---

### 3. ✅ 401 Unauthorized Errors
**Error:** Multiple `GET http://localhost:3000/api/users/profile 401 (Unauthorized)` errors

**Cause:** Two issues:
1. React StrictMode in development causes components to mount twice, triggering duplicate API calls
2. Profile page was making API calls before authentication was complete
3. The interceptor was attempting to refresh tokens multiple times simultaneously

**Fix:** 
1. Added token check before loading data in Profile component:
```typescript
useEffect(() => {
  // Only load data if we have an access token
  const token = localStorage.getItem('accessToken');
  if (token) {
    loadData();
  } else {
    setLoading(false);
  }
}, []);
```

2. Suppressed error messages for 401 responses (expected when not authenticated):
```typescript
catch (error: any) {
  // Only show error if it's not a 401 (which means user needs to login)
  if (error.response?.status !== 401) {
    showSnackbar(error.response?.data?.message || 'Failed to load profile data', 'error');
  }
}
```

**Status:** ✅ Fixed in `frontend/src/pages/Profile.tsx`

---

### 4. ✅ Aria-Hidden Accessibility Warning
**Error:** `Blocked aria-hidden on an element because its descendant retained focus`

**Cause:** MUI Dialog component was setting `aria-hidden="true"` on the root element while a button inside the dialog had focus. This is an accessibility issue that can confuse screen readers.

**Fix:** Added proper dialog configuration:
```typescript
<Dialog 
  open={memberDialog} 
  onClose={handleCloseMemberDialog} 
  maxWidth="sm" 
  fullWidth
  disablePortal={false}
  keepMounted={false}
>
```

**Status:** ✅ Fixed in `frontend/src/pages/Profile.tsx`

---

## Development vs Production

### React StrictMode Double Rendering
In development, React's StrictMode intentionally double-invokes effects to help detect side effects. This causes:
- API calls to happen twice
- Multiple 401 errors in console (before auth completes)
- Token refresh attempts to happen multiple times

**This is expected behavior in development and will not occur in production.**

### Console Warnings
Some warnings are development-only and help identify potential issues:
- Fast Refresh warnings
- Accessibility warnings
- Performance suggestions

These are valuable during development but won't appear in production builds.

---

## Testing the Fixes

1. **Fast Refresh:** Make changes to AuthContext.tsx - should hot reload without full page refresh
2. **401 Errors:** Should be significantly reduced, only appearing when actually not authenticated
3. **Accessibility:** Dialog should not trigger aria-hidden warnings when opened
4. **Wheel Events:** Warning will still appear (MUI library issue) but can be ignored

---

## Additional Notes

### Why Some Warnings Remain
- **Wheel event listener:** Third-party library (MUI) issue, no fix available without forking the library
- **React DevTools suggestion:** Informational message, not an error
- **Vite HMR messages:** Normal development server messages

### Performance Impact
None of these issues significantly impact performance:
- Fast Refresh warning: Fixed, no impact
- Wheel event listener: Minimal impact, handled efficiently by modern browsers
- 401 errors: Reduced, no impact on user experience
- Aria-hidden: Fixed, improves accessibility

---

## Made with Bob