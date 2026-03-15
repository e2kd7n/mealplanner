# Project Issues

## Open Issues

### Issue #1: Implement anti-piracy features
**Status:** Resolved - Not Applicable
**Priority:** High
**Resolution:** For a self-hosted, private family application, extensive anti-piracy measures are unnecessary. Basic access control through family-based authentication and invite-only system (already planned) provides sufficient protection. If sharing with other families in the future, can implement additional measures as needed.

**Completed:**
- [x] Assessed anti-piracy needs for private use case
- [x] Documented approach in plan (access control via authentication)
- [x] Noted optional measures for future multi-family sharing

---

### Issue #2: Add copyright notices to all source files
**Status:** In Progress
**Priority:** High
**Description:** Add proper copyright notices to all source code files to establish ownership and legal protections.

**Tasks:**
- [x] Create standard copyright header template (in plan document)
- [ ] Add copyright notices to all source files (during implementation)
- [ ] Set up pre-commit hook to ensure new files include copyright

**Template Created:**
```
Copyright (c) 2026 Erik Didriksen
All rights reserved.
```

---

### Issue #3: Create and add appropriate license file
**Status:** Closed
**Priority:** High
**Resolution:** LICENSE file created with proprietary license for personal/family use.

**Completed:**
- [x] Chose appropriate license type (Proprietary for private use)
- [x] Created LICENSE file
- [x] Documented license in plan
- [ ] Update README with license information (when README is created)

---

### Issue #4: Ensure proper attribution and legal protections
**Status:** Closed
**Priority:** Medium
**Resolution:** ATTRIBUTION.md created with comprehensive list of third-party dependencies and their licenses. All dependencies are compatible with proprietary use.

**Completed:**
- [x] Documented all planned dependencies
- [x] Verified license compatibility (all MIT, Apache 2.0, BSD, PostgreSQL License)
- [x] Created ATTRIBUTION.md file
- [x] Documented external API attribution requirements
- [x] Reviewed patent considerations (none applicable)
- [ ] Terms of service (optional, only if sharing with other families)

---

### Issue #5: Refactor auth.controller.ts register function
**Status:** Open
**Priority:** Medium
**File:** `backend/src/controllers/auth.controller.ts` (lines 10-65)
**Description:** Improve security, code quality, and maintainability of the user registration function.

**Security Improvements (High Priority):**
- [ ] Mask email in logs (line 52) - Currently logs full email which is PII
  - Change to log only email domain: `emailDomain: user.email.split('@')[1]`
- [ ] Add email format validation before database operations
  - Implement regex validation: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- [ ] Add password strength requirements
  - Minimum 8 characters (configurable)
  - Consider additional complexity requirements

**Code Quality Improvements (Medium Priority):**
- [ ] Extract input validation into separate function `validateRegistrationInput()`
  - Improves readability and reusability
  - Can be shared with other auth functions
- [ ] Extract user response formatter into helper function `formatUserResponse()`
  - Eliminates duplication across register, login, and refreshToken
- [ ] Add TypeScript interfaces for request bodies
  - Create `RegisterRequestBody` interface
  - Improves type safety and IDE support

**Optional Enhancements (Low Priority):**
- [ ] Normalize email to lowercase before storage
  - Prevents case-sensitivity issues (user@example.com vs User@Example.com)
  - Ensure database schema supports this
- [ ] Consider transaction wrapper for atomic operations
  - Only if token generation failure after user creation is a concern
  - Current synchronous approach is acceptable

**Benefits:**
- Enhanced security through PII protection and input validation
- Improved code maintainability and reusability
- Better type safety and developer experience
- Consistent email handling across the application

**Notes:**
- All changes maintain backward compatibility
- No breaking changes to API contracts
- Similar patterns should be applied to `login` function (lines 71-121)

---

### Issue #6: Refactor groceryList.controller.ts createGroceryList function
**Status:** Open
**Priority:** Medium
**File:** `backend/src/controllers/groceryList.controller.ts` (lines 130-184)
**Description:** Improve performance, code quality, and maintainability of the createGroceryList function.

**High Priority Refactorings:**
- [ ] Use `findUnique` instead of `findFirst` for meal plan lookup (line 150)
  - Current: `prisma.mealPlan.findFirst({ where: { id: mealPlanId, userId } })`
  - Recommended: `prisma.mealPlan.findUnique({ where: { id: mealPlanId } })` with separate ownership check
  - Benefits: More efficient query (uses primary key index), semantically clearer, follows Prisma best practices
  - Risk: Low - requires separate ownership check but negligible performance impact
  
- [ ] Remove unnecessary `include` from create operation (lines 169-172)
  - Current: `include: { items: true, mealPlan: true }`
  - Recommended: Remove entirely unless response actually needs this data
  - Benefits: Reduces database query overhead, smaller payload, faster response time
  - Risk: Medium - verify frontend/API consumers don't rely on this data
  - Note: Newly created list will have no items anyway (`items: []`)

**Medium Priority Refactorings:**
- [ ] Extract authentication check to reusable helper function
  - Pattern repeated in all 11 controller functions:
    ```typescript
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }
    ```
  - Recommended: Create `getUserId(req: Request): string` helper
  - Benefits: DRY principle, consistent error handling, type safety (returns string not string | undefined)
  - Scope: Apply file-wide to all controller functions
  
- [ ] Simplify validation logic (lines 143-146)
  - Current: `if (!name)`
  - Recommended: `if (!name?.trim())`
  - Benefits: Catches empty strings and whitespace-only names, more robust validation
  - Risk: Low

**Low Priority / Optional Refactorings:**
- [ ] Consolidate meal plan validation into reusable function
  - Extract validation (lines 149-160) to `validateMealPlanOwnership(mealPlanId, userId)`
  - Benefits: Reusable across controllers (also used in `generateFromMealPlan`), testable in isolation
  - Risk: Low

**Implementation Order:**
1. Use `findUnique` for meal plan lookup (performance gain)
2. Remove unnecessary `include` (after verifying consumers)
3. Extract `getUserId` helper (apply file-wide)
4. Add `.trim()` to name validation
5. Consider meal plan validation extraction if needed elsewhere

**Benefits:**
- Improved query performance through proper Prisma method usage
- Reduced database overhead and response payload size
- Better code maintainability through DRY principle
- Enhanced type safety and error handling consistency
- More robust input validation

**Notes:**
- All refactorings maintain current functionality and error handling
- No breaking changes to API contracts
- Similar patterns apply to other controller functions in this file

---

## Closed Issues

### Issue #3: Create and add appropriate license file
**Closed:** March 14, 2026
**Resolution:** LICENSE file created with proprietary license suitable for personal/family use.

### Issue #4: Ensure proper attribution and legal protections
**Closed:** March 14, 2026
**Resolution:** ATTRIBUTION.md created with comprehensive third-party license documentation.

## Notes

- Anti-piracy measures deemed unnecessary for private, self-hosted use
- Copyright headers will be added to source files during implementation phase
- Pre-commit hook for copyright enforcement will be set up during development
- Terms of service only needed if application is shared with other families