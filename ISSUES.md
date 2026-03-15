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
**Status:** Closed
**Priority:** High
**Closed:** March 15, 2026
**Description:** Add proper copyright notices to all source code files to establish ownership and legal protections.

**Completed:**
- [x] Create standard copyright header template
- [x] Add copyright notices to all 47 source files (backend and frontend)
- [x] Created automated script (`scripts/add-copyright.sh`) for adding copyright notices
- [ ] Set up pre-commit hook to ensure new files include copyright (optional future enhancement)

**Template Used:**
```
/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */
```

**Files Updated:**
- All TypeScript (.ts) and TSX (.tsx) files in `backend/src/` and `frontend/src/`
- Total: 47 files with copyright notices added

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
**Status:** Closed
**Priority:** Medium
**File:** `backend/src/controllers/auth.controller.ts`
**Closed:** March 15, 2026
**Description:** Improve security, code quality, and maintainability of the user registration function.

**Completed:**
- [x] Added copyright notice to file
- [x] Mask email in logs - Now logs only email domain for PII protection
- [x] Add email format validation with regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- [x] Add password strength requirements (minimum 8 characters, configurable)
- [x] Extract input validation into `validateRegistrationInput()` function
- [x] Extract user response formatter into `formatUserResponse()` helper
- [x] Add TypeScript interfaces for request bodies (`RegisterRequestBody`, `LoginRequestBody`, `RefreshTokenRequestBody`)
- [x] Normalize email to lowercase before storage
- [x] Applied same improvements to `login` and `refreshToken` functions

**Benefits Achieved:**
- Enhanced security through PII protection and input validation
- Improved code maintainability and reusability
- Better type safety and developer experience
- Consistent email handling across the application
- No breaking changes to API contracts

---

### Issue #6: Refactor groceryList.controller.ts createGroceryList function
**Status:** Closed
**Priority:** Medium
**File:** `backend/src/controllers/groceryList.controller.ts`
**Closed:** March 15, 2026
**Description:** Improve performance, code quality, and maintainability of the createGroceryList function.

**Completed:**
- [x] Added copyright notice to file
- [x] Use `findUnique` instead of `findFirst` for meal plan lookup with separate ownership check
- [x] Remove unnecessary `include` from create operation (reduces database overhead)
- [x] Extract authentication check to reusable `getUserId(req: Request): string` helper function
- [x] Applied `getUserId` helper to all 9 controller functions in the file
- [x] Simplify validation logic with `.trim()` for more robust name validation

**Benefits Achieved:**
- Improved query performance through proper Prisma method usage (findUnique uses primary key index)
- Reduced database overhead and response payload size
- Better code maintainability through DRY principle (getUserId helper)
- Enhanced type safety and error handling consistency
- More robust input validation
- No breaking changes to API contracts

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

---

## Open Issues (New - Identified from Plan Review)

### Issue #7: Missing Recipe Rating Endpoints
**Status:** Open
**Priority:** High
**Description:** Recipe rating functionality is in the database schema but missing API endpoints.

**Missing Endpoints:**
- [ ] `POST /api/recipes/:id/rate` - Add/update rating for a recipe
- [ ] `GET /api/recipes/:id/ratings` - Get all ratings for a recipe

**Implementation Tasks:**
- [ ] Add rating methods to recipe.controller.ts
- [ ] Create routes in recipe.routes.ts
- [ ] Test rating functionality

**Priority:** High - Core MVP feature per plan

---

### Issue #8: Missing User Profile & Preferences Endpoints
**Status:** Open
**Priority:** High
**Description:** User profile and preferences management is missing from the API.

**Missing Endpoints:**
- [ ] `GET /api/users/profile` - Get user profile
- [ ] `PUT /api/users/profile` - Update user profile
- [ ] `GET /api/users/preferences` - Get user preferences
- [ ] `PUT /api/users/preferences` - Update preferences

**Implementation Tasks:**
- [ ] Create user.controller.ts with profile/preferences methods
- [ ] Update user.routes.ts with new endpoints
- [ ] Add validation for preference updates

**Priority:** High - Required for personalization features

---

### Issue #9: Missing Family Member Management Endpoints
**Status:** Open
**Priority:** High
**Description:** Family member CRUD operations are missing from the API.

**Missing Endpoints:**
- [ ] `GET /api/family-members` - List family members
- [ ] `POST /api/family-members` - Add family member
- [ ] `PUT /api/family-members/:id` - Update family member
- [ ] `DELETE /api/family-members/:id` - Remove family member

**Implementation Tasks:**
- [ ] Create familyMember.controller.ts
- [ ] Create familyMember.routes.ts
- [ ] Add to main router in index.ts

**Priority:** High - Core MVP feature for family management

---

### Issue #10: Missing Recipe Search & Recommendations
**Status:** Open
**Priority:** Medium
**Description:** Advanced recipe features are missing from the API.

**Missing Endpoints:**
- [ ] `GET /api/recipes/search` - Search recipes with filters
- [ ] `GET /api/recipes/recommendations` - Get personalized recommendations
- [ ] `POST /api/recipes/import` - Import recipe from URL
- [ ] `GET /api/recipes/:id/similar` - Get similar recipes

**Implementation Tasks:**
- [ ] Implement search functionality in recipe.controller.ts
- [ ] Create recommendation algorithm based on plan (Section 5)
- [ ] Add recipe import functionality
- [ ] Implement similar recipe finder

**Priority:** Medium - Enhanced features per plan

---

### Issue #11: Missing Grocery List Optimization
**Status:** Open
**Priority:** Medium
**Description:** Grocery list optimization features are missing.

**Missing Endpoints:**
- [ ] `POST /api/grocery-lists/:id/optimize` - Optimize list by store/price
- [ ] Store section grouping functionality
- [ ] Multi-store price comparison

**Implementation Tasks:**
- [ ] Implement optimization algorithm from plan (Section 8)
- [ ] Add store section grouping
- [ ] Create price comparison logic

**Priority:** Medium - Enhanced feature per plan

---

### Issue #12: Add Input Validation Middleware
**Status:** Open
**Priority:** High
**Description:** Consistent input validation is missing across controllers.

**Implementation Tasks:**
- [ ] Create validation middleware using express-validator or zod
- [ ] Add request body validation schemas for all endpoints
- [ ] Apply validation middleware to all routes
- [ ] Add consistent error responses

**Priority:** High - Security and data integrity

---
- Terms of service only needed if application is shared with other families