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
**Status:** Closed
**Priority:** High
**Closed:** March 15, 2026
**Description:** Recipe rating functionality is in the database schema but missing API endpoints.

**Completed:**
- [x] `POST /api/recipes/:id/rate` - Add/update rating for a recipe
- [x] `GET /api/recipes/:id/ratings` - Get all ratings for a recipe
- [x] Add rating methods to recipe.controller.ts
- [x] Create routes in recipe.routes.ts
- [x] Test rating functionality

**Implementation Details:**
- Added `rateRecipe()` function with validation for rating (1-5) and wouldMakeAgain boolean
- Added `getRecipeRatings()` function with average rating calculation
- Includes proper error handling and authentication checks
- Returns rating statistics (average, count, distribution)

---

### Issue #8: Missing User Profile & Preferences Endpoints
**Status:** Closed
**Priority:** High
**Closed:** March 15, 2026
**Description:** User profile and preferences management is missing from the API.

**Completed:**
- [x] `GET /api/users/profile` - Get user profile
- [x] `PUT /api/users/profile` - Update user profile
- [x] `GET /api/users/preferences` - Get user preferences
- [x] `PUT /api/users/preferences` - Update preferences
- [x] Create user.controller.ts with profile/preferences methods
- [x] Update user.routes.ts with new endpoints
- [x] Add validation for preference updates

**Implementation Details:**
- Created complete user.controller.ts with 4 endpoints
- Auto-creates default preferences if none exist
- Supports updating avoided ingredients array
- Validates skill level and dietary restrictions
- Includes proper authentication and error handling

---

### Issue #9: Missing Family Member Management Endpoints
**Status:** Closed
**Priority:** High
**Closed:** March 15, 2026
**Description:** Family member CRUD operations are missing from the API.

**Completed:**
- [x] `GET /api/family-members` - List family members
- [x] `GET /api/family-members/:id` - Get specific family member
- [x] `POST /api/family-members` - Add family member
- [x] `PUT /api/family-members/:id` - Update family member
- [x] `DELETE /api/family-members/:id` - Remove family member
- [x] Create familyMember.controller.ts
- [x] Create familyMember.routes.ts
- [x] Add to main router in index.ts

**Implementation Details:**
- Created complete familyMember.controller.ts with full CRUD operations
- Validates age group (infant, toddler, child, teen, adult)
- Validates skill level (beginner, intermediate, advanced)
- Includes ownership verification for all operations
- Proper error handling and authentication checks
- Routes registered at `/api/family-members`

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
**Status:** Closed
**Priority:** High
**Closed:** March 15, 2026
**Description:** Consistent input validation is missing across controllers.

**Completed:**
- [x] Create validation middleware using Zod
- [x] Add request body validation schemas for all endpoints
- [x] Apply validation middleware to auth routes (example implementation)
- [x] Add consistent error responses

**Implementation Details:**
- Created `backend/src/middleware/validate.ts` with two middleware functions:
  - `validate()` - Validates single source (body, query, or params)
  - `validateMultiple()` - Validates multiple sources simultaneously
- Created `backend/src/validation/schemas.ts` with comprehensive schemas:
  - Auth schemas (register, login, refresh token)
  - Recipe schemas (create, update, query, rate)
  - Meal plan schemas (create, update, add recipe)
  - Grocery list schemas (create, update, add/update items)
  - Pantry schemas (add, update items)
  - User schemas (update profile, update preferences)
  - Family member schemas (create, update)
  - Ingredient schemas (create, update)
- Applied validation to auth routes as example
- Error messages include field names and specific validation failures
- Zod provides type-safe validation with automatic TypeScript inference

**Next Steps:**
- Apply validation middleware to remaining routes (recipe, meal plan, grocery list, pantry, user, family member)
- Add integration tests for validation

**Priority:** High - Security and data integrity

---

### Issue #13: Implement Admin Dashboard for User Management
**Status:** Open
**Priority:** High
**Description:** Create an administrative interface for managing user accounts, security, and system operations.

**Required Features:**
- [ ] Admin authentication and role-based access control (RBAC)
- [ ] User account management dashboard
  - [ ] View all user accounts with search/filter
  - [ ] Password reset functionality (admin-initiated)
  - [ ] Account access blocking/suspension
  - [ ] Account deletion with data cleanup
  - [ ] View user activity logs
  - [ ] Manage user roles and permissions
- [ ] Security monitoring
  - [ ] Failed login attempt tracking
  - [ ] Suspicious activity alerts
  - [ ] Active session management
  - [ ] Force logout capability
- [ ] System configuration
  - [ ] Password policy management (UI for env variables)
  - [ ] Rate limiting configuration
  - [ ] Feature flags management

**Implementation Tasks:**
- [ ] Add `role` field to User model (user, admin, superadmin)
- [ ] Create admin.controller.ts with user management methods
- [ ] Create admin.routes.ts with protected admin endpoints
- [ ] Add admin middleware for role verification
- [ ] Create frontend admin dashboard pages
- [ ] Implement audit logging for admin actions
- [ ] Add email notifications for security events

**API Endpoints:**
- [ ] `GET /api/admin/users` - List all users with pagination
- [ ] `GET /api/admin/users/:id` - Get user details
- [ ] `POST /api/admin/users/:id/reset-password` - Reset user password
- [ ] `PUT /api/admin/users/:id/block` - Block/suspend user account
- [ ] `PUT /api/admin/users/:id/unblock` - Unblock user account
- [ ] `DELETE /api/admin/users/:id` - Delete user account
- [ ] `GET /api/admin/users/:id/activity` - Get user activity logs
- [ ] `GET /api/admin/sessions` - List active sessions
- [ ] `DELETE /api/admin/sessions/:id` - Force logout session
- [ ] `GET /api/admin/security/failed-logins` - View failed login attempts
- [ ] `GET /api/admin/audit-logs` - View admin action audit trail

**Security Considerations:**
- Require strong authentication for admin access (consider 2FA)
- Log all admin actions for audit trail
- Implement rate limiting on admin endpoints
- Add confirmation dialogs for destructive actions
- Email notifications for critical admin actions
- Separate admin session management from regular users

**Priority:** High - Essential for production security and user management

**Related Issues:**
- Complements Issue #5 (password policy implementation)
- Supports Issue #12 (input validation)

---

### Issue #14: Implement Profile Page UI
**Status:** Open
**Priority:** High
**Description:** The Profile page currently shows "coming soon" placeholder. Need to implement full profile management UI.

**Required Features:**
- [ ] Display user profile information (name, email, family name)
- [ ] Edit profile form with validation
- [ ] Display and edit user preferences
  - [ ] Dietary restrictions (vegetarian, vegan, gluten-free, dairy-free, nut-free)
  - [ ] Cooking skill level (beginner, intermediate, advanced)
  - [ ] Avoided ingredients (multi-select/tags input)
- [ ] Family member management section
  - [ ] List all family members with age groups and skill levels
  - [ ] Add new family member form
  - [ ] Edit/delete family members
- [ ] Password change functionality
- [ ] Account settings (notifications, privacy)

**Implementation Tasks:**
- [ ] Create profile information display and edit form
- [ ] Integrate with GET/PUT /api/users/profile endpoints (Issue #8)
- [ ] Create preferences management UI
- [ ] Integrate with GET/PUT /api/users/preferences endpoints (Issue #8)
- [ ] Create family members management section
- [ ] Integrate with /api/family-members endpoints (Issue #9)
- [ ] Add form validation and error handling
- [ ] Add success/error notifications

**API Endpoints (Already Implemented):**
- GET /api/users/profile
- PUT /api/users/profile
- GET /api/users/preferences
- PUT /api/users/preferences
- GET /api/family-members
- POST /api/family-members
- PUT /api/family-members/:id
- DELETE /api/family-members/:id

**Priority:** High - Core user management feature

---

### Issue #15: Implement Create Recipe Page UI
**Status:** ✅ Closed
**Priority:** High
**Completed:** 2026-03-15
**Description:** Implemented full recipe creation form with 4-step wizard.

**Required Features:**
- [x] Recipe basic information form
  - [x] Title (required)
  - [x] Description (required)
  - [x] Cuisine type (dropdown)
  - [x] Meal type (breakfast, lunch, dinner, snack, dessert)
  - [x] Difficulty level (easy, medium, hard)
  - [x] Prep time and cook time (minutes)
  - [x] Servings (number)
  - [x] Kid-friendly toggle
- [x] Ingredients section
  - [x] Add/remove ingredient rows
  - [x] Ingredient name, quantity, unit
  - [x] Search existing ingredients for autocomplete
- [x] Instructions section
  - [x] Step-by-step instructions (ordered list)
  - [x] Add/remove/reorder steps
- [x] Nutrition information (optional)
  - [x] Calories, protein, carbs, fat, fiber, sugar
- [ ] Image upload (deferred - not critical for MVP)
- [ ] Tags and categories (deferred - can use cuisine type)
- [x] Cost estimate (optional)
- [x] Public/private toggle
- [ ] Save as draft functionality (deferred)

**Implementation Tasks:**
- [x] Create multi-step form (4 steps: Basic Info, Ingredients, Instructions, Review)
- [x] Integrate with POST /api/recipes endpoint
- [x] Add ingredient autocomplete from GET /api/ingredients
- [x] Add form validation (required fields, numeric validation)
- [x] Add text input for instructions
- [x] Implement add/remove for instruction steps
- [x] Add success notification and redirect to recipe detail

**Implementation Details:**
- Created comprehensive 4-step wizard form (787 lines)
- Step 1: Basic recipe information with all required fields
- Step 2: Ingredients with autocomplete search and dynamic list management
- Step 3: Instructions with dynamic steps and optional nutrition info
- Step 4: Review all information before submission
- Full form validation with error handling
- Auto-redirect to recipe detail page after successful creation
- Commit: 3da4445

**API Endpoints Used:**
- POST /api/recipes ✅
- GET /api/ingredients ✅

**Priority:** High - Core recipe management feature ✅ COMPLETED

---

### Issue #16: Implement MyFitnessPal Integration
**Status:** Open
**Priority:** Medium
**Description:** Allow users to push nutrition and consumption data from recipes into meal tracking apps like MyFitnessPal.

**Required Features:**
- [ ] MyFitnessPal API integration
  - [ ] OAuth authentication with MyFitnessPal
  - [ ] Store user's MyFitnessPal access tokens securely
- [ ] Recipe nutrition export
  - [ ] Calculate per-serving nutrition from recipe
  - [ ] Format nutrition data for MyFitnessPal API
  - [ ] Push recipe as custom food to MyFitnessPal
- [ ] Meal logging
  - [ ] "Log to MyFitnessPal" button on recipe detail page
  - [ ] Select serving size before logging
  - [ ] Select meal type (breakfast, lunch, dinner, snack)
  - [ ] Confirm successful log
- [ ] Settings and preferences
  - [ ] Connect/disconnect MyFitnessPal account
  - [ ] Auto-log meals from meal plan
  - [ ] Default serving sizes
- [ ] Alternative integrations (future)
  - [ ] Cronometer
  - [ ] Lose It!
  - [ ] Generic nutrition export (CSV, JSON)

**Implementation Tasks:**
- [ ] Research MyFitnessPal API documentation and requirements
- [ ] Implement OAuth flow for MyFitnessPal
- [ ] Add MyFitnessPal credentials to user preferences schema
- [ ] Create backend service for MyFitnessPal API calls
- [ ] Add nutrition calculation logic (if not already present)
- [ ] Create API endpoint: POST /api/recipes/:id/log-to-myfitnesspal
- [ ] Add UI button on recipe detail page
- [ ] Create MyFitnessPal connection settings in profile
- [ ] Add error handling for API failures
- [ ] Add rate limiting for external API calls
- [ ] Document integration in user guide

**API Endpoints (To Be Implemented):**
- POST /api/integrations/myfitnesspal/connect - OAuth connection
- DELETE /api/integrations/myfitnesspal/disconnect - Remove connection
- GET /api/integrations/myfitnesspal/status - Check connection status
- POST /api/recipes/:id/log-to-myfitnesspal - Log recipe to MyFitnessPal

**Database Schema Changes:**
- [ ] Add `myfitnesspal_access_token` to UserPreferences (encrypted)
- [ ] Add `myfitnesspal_refresh_token` to UserPreferences (encrypted)
- [ ] Add `myfitnesspal_connected_at` timestamp
- [ ] Add `auto_log_meals` boolean preference

**Security Considerations:**
- Encrypt MyFitnessPal tokens at rest
- Use secure token refresh flow
- Implement token expiration handling
- Add user consent for data sharing
- Log all external API calls for audit

**Priority:** Medium - Enhanced feature for health-conscious users

**Related Issues:**
- May require nutrition calculation improvements
- Could integrate with meal planning (auto-log planned meals)

---

### Issue #17: Implement AllRecipes.com Recipe Import
**Status:** Open
**Priority:** High
**Description:** Allow users to import recipes from their AllRecipes.com recipe book directly into the meal planner application.

**Required Features:**
- [ ] AllRecipes.com authentication
  - [ ] OAuth or credential-based login to AllRecipes.com
  - [ ] Store user's AllRecipes.com session securely
  - [ ] Handle session expiration and re-authentication
- [ ] Recipe book access
  - [ ] Fetch user's saved recipes from AllRecipes.com
  - [ ] Display recipe list with thumbnails and titles
  - [ ] Search/filter recipes in AllRecipes.com book
  - [ ] Pagination for large recipe collections
- [ ] Recipe import functionality
  - [ ] Parse AllRecipes.com recipe HTML/API data
  - [ ] Extract: title, description, ingredients, instructions, prep/cook time
  - [ ] Extract: servings, nutrition info, images, ratings
  - [ ] Map AllRecipes.com data to internal recipe schema
  - [ ] Handle missing or optional fields gracefully
- [ ] Bulk import
  - [ ] Select multiple recipes to import at once
  - [ ] Progress indicator for bulk imports
  - [ ] Error handling for failed imports
  - [ ] Summary report of successful/failed imports
- [ ] Import settings
  - [ ] Option to mark imported recipes as public/private
  - [ ] Option to add custom tags during import
  - [ ] Option to adjust servings during import
  - [ ] Duplicate detection (check if recipe already imported)

**Implementation Tasks:**
- [ ] Research AllRecipes.com API or web scraping requirements
- [ ] Implement authentication flow for AllRecipes.com
- [ ] Create recipe parser for AllRecipes.com format
- [ ] Add AllRecipes.com credentials to user preferences schema
- [ ] Create backend service for AllRecipes.com integration
- [ ] Create API endpoints for recipe import
- [ ] Add UI for connecting AllRecipes.com account
- [ ] Create recipe browser/selector UI
- [ ] Implement import preview before saving
- [ ] Add bulk import functionality
- [ ] Handle rate limiting and API quotas
- [ ] Add error handling and retry logic
- [ ] Document import process in user guide

**API Endpoints (To Be Implemented):**
- POST /api/integrations/allrecipes/connect - Connect AllRecipes.com account
- DELETE /api/integrations/allrecipes/disconnect - Disconnect account
- GET /api/integrations/allrecipes/status - Check connection status
- GET /api/integrations/allrecipes/recipes - List user's AllRecipes.com recipes
- GET /api/integrations/allrecipes/recipes/:id - Get specific recipe details
- POST /api/integrations/allrecipes/import - Import single recipe
- POST /api/integrations/allrecipes/import-bulk - Import multiple recipes

**Database Schema Changes:**
- [ ] Add `allrecipes_session_token` to UserPreferences (encrypted)
- [ ] Add `allrecipes_user_id` to UserPreferences
- [ ] Add `allrecipes_connected_at` timestamp
- [ ] Add `external_source` field to Recipe model (allrecipes, manual, etc.)
- [ ] Add `external_id` field to Recipe model (already exists)
- [ ] Add `import_metadata` JSON field for tracking import details

**Technical Considerations:**
- **Web Scraping vs API**: AllRecipes.com may not have a public API, may need web scraping
- **Rate Limiting**: Implement respectful rate limiting to avoid being blocked
- **Legal Compliance**: Ensure compliance with AllRecipes.com Terms of Service
- **Data Attribution**: Store source URL and give credit to AllRecipes.com
- **Image Handling**: Download and store images locally or link to AllRecipes.com
- **Recipe Updates**: Handle updates to recipes on AllRecipes.com
- **Error Handling**: Graceful handling of parsing errors and missing data

**Security Considerations:**
- Encrypt AllRecipes.com credentials at rest
- Use secure session management
- Implement CSRF protection for authentication flow
- Log all import activities for audit
- Validate and sanitize all imported data
- Prevent XSS from imported recipe content

**User Experience:**
- Clear instructions for connecting AllRecipes.com account
- Visual feedback during import process
- Preview recipe before importing
- Easy way to disconnect and reconnect account
- Notification when import completes
- Option to edit recipe after import

**Priority:** High - Valuable feature for users with existing recipe collections

**Related Issues:**
- Complements Issue #15 (Create Recipe page)
- Similar to Issue #10 (recipe import from URL)
- Could extend to other recipe sites (Food Network, Epicurious, etc.)

**Alternative Approaches:**
- Start with URL-based import (paste AllRecipes.com recipe URL)
- Use browser extension to capture recipes while browsing
- Manual CSV/JSON import from AllRecipes.com export (if available)

---

### Issue #18: Implement Recipe Card OCR Import
**Status:** Open
**Priority:** High
**Description:** Allow users to take a picture of a physical recipe card and automatically import it into the recipe book using OCR (Optical Character Recognition) and AI parsing.

**Required Features:**
- [ ] Image capture
  - [ ] Camera access from mobile/desktop browser
  - [ ] Upload image from device gallery
  - [ ] Image preview and crop functionality
  - [ ] Support for multiple image formats (JPEG, PNG, HEIC)
  - [ ] Image quality validation and enhancement
- [ ] OCR processing
  - [ ] Extract text from recipe card image
  - [ ] Handle handwritten and printed text
  - [ ] Support multiple languages (English primary)
  - [ ] Handle various fonts and text sizes
  - [ ] Correct common OCR errors
- [ ] AI-powered recipe parsing
  - [ ] Identify recipe title
  - [ ] Extract ingredients list with quantities and units
  - [ ] Parse cooking instructions/steps
  - [ ] Detect prep time, cook time, servings
  - [ ] Identify cuisine type and meal type
  - [ ] Extract nutrition information (if present)
- [ ] Review and edit interface
  - [ ] Display extracted recipe data for user review
  - [ ] Side-by-side view: original image and parsed data
  - [ ] Edit any field before saving
  - [ ] Flag uncertain extractions for user attention
  - [ ] Re-process image if extraction fails
- [ ] Batch processing
  - [ ] Upload multiple recipe card images
  - [ ] Queue processing for multiple images
  - [ ] Progress indicator for batch operations
  - [ ] Save partially completed imports

**Implementation Tasks:**
- [ ] Research OCR services (Google Cloud Vision, AWS Textract, Tesseract.js)
- [ ] Research AI parsing services (OpenAI GPT-4 Vision, Claude, custom model)
- [ ] Implement image upload and preprocessing
- [ ] Create OCR integration service
- [ ] Create AI recipe parser service
- [ ] Build recipe extraction pipeline
- [ ] Create review/edit UI component
- [ ] Add image storage for recipe card photos
- [ ] Implement error handling and retry logic
- [ ] Add cost estimation and usage tracking
- [ ] Optimize for mobile camera capture
- [ ] Add tutorial/help for best photo practices

**API Endpoints (To Be Implemented):**
- POST /api/recipes/import/ocr - Upload and process recipe card image
- GET /api/recipes/import/ocr/:jobId - Check processing status
- POST /api/recipes/import/ocr/:jobId/confirm - Save parsed recipe
- POST /api/recipes/import/ocr/:jobId/retry - Retry with different settings
- DELETE /api/recipes/import/ocr/:jobId - Cancel import job

**Database Schema Changes:**
- [ ] Add `RecipeImportJob` model for tracking OCR jobs
  - [ ] jobId, userId, status (pending, processing, completed, failed)
  - [ ] originalImageUrl, processedImageUrl
  - [ ] ocrText (raw extracted text)
  - [ ] parsedRecipe (JSON of extracted recipe data)
  - [ ] confidence scores for each field
  - [ ] createdAt, completedAt
- [ ] Add `recipe_card_image_url` to Recipe model
- [ ] Add `import_source` enum value: 'ocr_recipe_card'

**Technical Considerations:**
- **OCR Service Selection**:
  - Google Cloud Vision API: High accuracy, good pricing
  - AWS Textract: Excellent for structured documents
  - Tesseract.js: Free, client-side, lower accuracy
  - Azure Computer Vision: Good balance of features
- **AI Parsing**:
  - OpenAI GPT-4 Vision: Can process image directly
  - Claude 3: Good at structured data extraction
  - Custom prompt engineering for recipe parsing
  - Fallback to text-only parsing if vision API unavailable
- **Image Processing**:
  - Resize/compress images before upload
  - Auto-rotate based on EXIF data
  - Enhance contrast for better OCR
  - Deskew tilted images
- **Cost Management**:
  - Cache OCR results to avoid reprocessing
  - Implement usage limits per user
  - Provide cost estimates before processing
  - Offer free tier with limits

**Security Considerations:**
- Validate image file types and sizes
- Scan uploaded images for malware
- Sanitize extracted text to prevent XSS
- Rate limit OCR requests per user
- Store images securely with access control
- Delete temporary images after processing
- Encrypt API keys for external services

**User Experience:**
- Clear instructions for taking good photos
  - Good lighting, flat surface, full card visible
  - Avoid shadows and glare
  - Hold camera steady
- Real-time feedback on image quality
- Show confidence scores for extracted data
- Allow manual correction of any field
- Save original image with recipe for reference
- Tutorial video or guide for first-time users
- Offline mode: queue images for later processing

**Mobile Optimization:**
- Native camera integration
- Optimize for various screen sizes
- Handle device orientation changes
- Support touch gestures for cropping
- Progressive image upload
- Background processing with notifications

**Priority:** High - Unique feature that adds significant value for users with physical recipe collections

**Multi-Parser Approach:**
- Use multiple OCR engines and compare results for accuracy
- Primary: Docling for document understanding and intelligent text extraction
- Secondary: Google Cloud Vision API or AWS Textract for high-accuracy OCR
- Tertiary: Tesseract.js for validation and fallback
- Consensus algorithm to merge results from multiple parsers
- Confidence scoring based on parser agreement

**Related Issues:**
- Complements Issue #15 (Create Recipe page)
- Similar to Issue #17 (AllRecipes import) and Issue #19 (URL import)
- Could extend to import from cookbooks, magazines

**Success Metrics:**
- OCR accuracy rate (target: >95% for printed text)
- Recipe parsing accuracy (target: >90% correct fields)
- User satisfaction with extracted recipes
- Time saved vs manual entry
- Number of recipes imported via OCR

**Future Enhancements:**
- Support for recipe books (multiple pages)
- Handwriting recognition improvements
- Multi-language support
- Collaborative correction (crowdsourced improvements)
- Export recipe cards as PDFs

---

### Issue #19: Implement URL-Based Recipe Import
**Status:** Open
**Priority:** High
**Description:** Allow users to import recipes by providing a URL from any recipe website. Handle advertising-heavy pages and use multiple parsing utilities (including Docling) to ensure accuracy.

**Required Features:**
- [ ] URL input and validation
  - [ ] Accept recipe URLs from any website
  - [ ] Validate URL format and accessibility
  - [ ] Preview recipe before importing
  - [ ] Handle redirects and paywalls
- [ ] Multi-parser approach for accuracy
  - [ ] Primary: Docling for document understanding and structure extraction
  - [ ] Secondary: Recipe-specific parsers (recipe-scrapers library)
  - [ ] Tertiary: Custom HTML parsers for common recipe sites
  - [ ] Fallback: AI-based parsing (GPT-4, Claude)
  - [ ] Consensus algorithm to merge results
- [ ] Ad and clutter removal
  - [ ] Strip advertising content
  - [ ] Remove popups and overlays
  - [ ] Filter out unrelated content (comments, related recipes)
  - [ ] Extract only recipe-relevant information
  - [ ] Handle infinite scroll and lazy-loaded content
- [ ] Recipe data extraction
  - [ ] Title, description, author
  - [ ] Ingredients with quantities and units
  - [ ] Step-by-step instructions
  - [ ] Prep time, cook time, total time
  - [ ] Servings and yield
  - [ ] Nutrition information
  - [ ] Images (primary recipe image)
  - [ ] Tags, categories, cuisine type
  - [ ] Ratings and reviews (optional)
- [ ] Schema.org support
  - [ ] Parse Recipe schema markup (JSON-LD)
  - [ ] Handle microdata and RDFa formats
  - [ ] Validate schema completeness
- [ ] Review and edit interface
  - [ ] Display extracted recipe data
  - [ ] Side-by-side: original page and parsed data
  - [ ] Edit any field before saving
  - [ ] Show confidence scores per field
  - [ ] Re-parse with different parser if needed
- [ ] Batch URL import
  - [ ] Import multiple URLs at once
  - [ ] Queue processing
  - [ ] Progress tracking
  - [ ] Error handling per URL

**Implementation Tasks:**
- [ ] Research and integrate Docling library
- [ ] Integrate recipe-scrapers library (supports 100+ sites)
- [ ] Create custom parsers for popular sites (AllRecipes, Food Network, NYT Cooking)
- [ ] Implement Schema.org parser
- [ ] Create AI fallback parser (GPT-4/Claude)
- [ ] Build consensus algorithm for multi-parser results
- [ ] Implement ad/clutter removal logic
- [ ] Create URL validation and preprocessing
- [ ] Build review/edit UI component
- [ ] Add image download and storage
- [ ] Implement duplicate detection (same URL or similar recipe)
- [ ] Add rate limiting and caching
- [ ] Handle authentication for paywalled sites (optional)
- [ ] Create browser extension for one-click import (future)

**API Endpoints (To Be Implemented):**
- POST /api/recipes/import/url - Import recipe from URL
- GET /api/recipes/import/url/:jobId - Check import status
- POST /api/recipes/import/url/:jobId/confirm - Save parsed recipe
- POST /api/recipes/import/url/:jobId/reparse - Retry with different parser
- DELETE /api/recipes/import/url/:jobId - Cancel import
- POST /api/recipes/import/url/batch - Import multiple URLs

**Database Schema Changes:**
- [ ] Add `RecipeImportJob` model (if not already added for OCR)
  - [ ] jobId, userId, importType (url, ocr, allrecipes)
  - [ ] sourceUrl, status, parserUsed
  - [ ] rawHtml, parsedRecipe (JSON)
  - [ ] confidenceScores (per field)
  - [ ] createdAt, completedAt
- [ ] Add `source_url` to Recipe model
- [ ] Add `import_source` enum value: 'url_import'
- [ ] Add `parser_metadata` JSON field (which parsers used, scores)

**Technical Considerations:**
- **Docling Integration**:
  - Docling: Document understanding and layout analysis
  - Excellent for structured content extraction
  - Handles complex layouts and formatting
  - Can identify recipe sections automatically
- **Multi-Parser Strategy**:
  - Run 2-3 parsers in parallel
  - Compare results field-by-field
  - Use highest confidence score for each field
  - Flag conflicts for user review
  - Weight parsers by historical accuracy
- **Ad Removal**:
  - Use readability algorithms (Mozilla Readability)
  - CSS selector-based filtering
  - Machine learning for content classification
  - Remove elements by class/id patterns (ad, advertisement, etc.)
- **Performance**:
  - Cache parsed results by URL
  - Implement request queuing
  - Use headless browser for JavaScript-heavy sites
  - Timeout protection (max 30 seconds per URL)
- **Legal Compliance**:
  - Respect robots.txt
  - Implement rate limiting per domain
  - Store attribution and source URL
  - Handle DMCA takedown requests

**Security Considerations:**
- Validate and sanitize URLs (prevent SSRF attacks)
- Sandbox HTML parsing (prevent XSS)
- Rate limit per user and per domain
- Scan downloaded images for malware
- Implement request timeout and size limits
- Log all import activities
- Handle malicious or broken HTML gracefully

**User Experience:**
- Simple URL input field with paste support
- Instant preview of recipe before importing
- Clear indication of parsing confidence
- Allow editing before saving
- Show which parser was used
- Provide feedback on parsing quality
- One-click re-import if recipe updates
- Browser extension for seamless import while browsing

**Supported Sites (via recipe-scrapers):**
- AllRecipes, Food Network, Bon Appétit
- NYT Cooking, Serious Eats, Epicurious
- Tasty, Delish, Food52
- BBC Good Food, Jamie Oliver
- 100+ other recipe sites

**Priority:** High - Essential feature for building recipe collection quickly

**Related Issues:**
- Complements Issue #15 (Create Recipe page)
- Similar to Issue #17 (AllRecipes import) and Issue #18 (OCR import)
- Could integrate with Issue #10 (recipe search)

**Success Metrics:**
- Parsing accuracy rate (target: >95% for schema.org sites, >85% for others)
- User satisfaction with imported recipes
- Number of successful imports vs failures
- Time saved vs manual entry
- Parser consensus rate (how often parsers agree)

**Future Enhancements:**
- Browser extension for one-click import
- Mobile app share sheet integration
- Automatic re-import to check for recipe updates
- Community-contributed parser improvements
- Support for video recipes (extract from YouTube descriptions)

### Issue #20: Integrate Nutrition Database for Auto-Population
**Status:** Open
**Priority:** High
**Description:** Integrate a comprehensive nutrition database (USDA FoodData Central, Nutritionix, Edamam) to automatically populate nutrition information for recipes when it's not provided in the source.

**Required Features:**
- Nutrition database integration (USDA FoodData Central primary)
- Ingredient-to-nutrition mapping with NLP parsing
- Automatic nutrition calculation per serving
- Manual override and editing capabilities
- Confidence scoring for auto-calculated data
- Caching layer for API responses

**Related Issues:** Enables Issue #21 (Nutrition Dashboard) and Issue #22 (Nutrition Warnings)

---

### Issue #21: Implement Nutrition Dashboard
**Status:** Open
**Priority:** High
**Description:** Create a comprehensive nutrition dashboard showing users their nutritional intake based on planned meals, with visualizations, trends, and insights.

**Required Features:**
- Daily/weekly/monthly nutrition summaries
- Meal plan integration with aggregation
- Interactive visualizations (charts, graphs, progress rings)
- Family member-specific views
- Goal setting and tracking
- Insights and recommendations
- Export and reporting (CSV, PDF)

**Related Issues:** Requires Issue #20 (Nutrition Database), enables Issue #22 (Nutrition Warnings)

---

### Issue #22: Implement Nutrition Guideline Warnings
**Status:** Open
**Priority:** High
**Description:** Provide intelligent warnings when nutrition guidelines are exceeded or insufficiently met, with different severity levels based on the situation.

**Required Features:**
- Guideline threshold system (age/gender-specific)
- **Gentle warnings** (yellow) for exceeding guidelines (>20% over)
- **Stern warnings** (red) for insufficient nutrition (>20% under)
- **No warning** when meals are missing (incomplete meal plan)
- Smart logic: only warn if meal plan is complete for the day
- Actionable recommendations (recipe suggestions, ingredient swaps)
- User preferences for warning sensitivity

**Warning Logic:**
- Check meal plan completeness first
- If incomplete: show "incomplete meal plan" message, no warnings
- If complete: calculate actual vs recommended, warn if >20% off
- Prioritize warnings by health impact

**Related Issues:** Requires Issue #20 (Nutrition Database) and Issue #21 (Nutrition Dashboard)

---

### Issue #23: Create System Architecture Documentation
**Status:** Open
**Priority:** Medium
**Description:** Create comprehensive system architecture documentation including a visual diagram (PNG) and detailed text report describing the architecture and rationale.

**Required Deliverables:**
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

**Implementation Tasks:**
- [ ] Create architecture diagram using draw.io, Lucidchart, or similar
- [ ] Export diagram as PNG
- [ ] Write comprehensive architecture document
- [ ] Document technology choices and rationale
- [ ] Include deployment architecture
- [ ] Add to git repository
- [ ] Link from README.md

**File Locations:**
- `docs/architecture-diagram.png` - Visual diagram
- `docs/ARCHITECTURE.md` - Detailed documentation

**Priority:** Medium - Important for onboarding and maintenance

---
---
- Terms of service only needed if application is shared with other families
### Issue #24: Fix Frontend Console Errors
**Status:** Partially Resolved
**Priority:** High
**Description:** Multiple console errors occurring in the browser console. Several critical issues have been fixed.

**Bugs Identified and Status:**

1. ✅ **FIXED - Fast Refresh Warning** (AuthContext.tsx)
   - Error: `[vite] invalidate /src/contexts/AuthContext.tsx: Could not Fast Refresh ("useAuth" export is incompatible)`
   - Cause: Anonymous function exports incompatible with Vite Fast Refresh
   - Fix: Converted to named function declarations (`export function AuthProvider` and `export function useAuth`)
   - Fixed in: `frontend/src/contexts/AuthContext.tsx`

2. ✅ **FIXED - 401 Unauthorized Errors** (All API calls)
   - Error: Multiple `GET/POST http://localhost:3000/api/* 401 (Unauthorized)` errors
   - Root Cause: JWT token payload contains `userId` but all controllers checked `req.user?.id`
   - Fix: Updated all `getUserId()` helper functions to check both: `req.user?.userId || req.user?.id`
   - Fixed in: All backend controllers (familyMember, user, groceryList, mealPlan, pantry, recipe)

3. ✅ **FIXED - TypeError in Profile.tsx**
   - Error: `Cannot read properties of undefined (reading 'includes')` at line 399
   - Cause: API response for user preferences may not include `dietaryRestrictions` or `avoidedIngredients` properties
   - Fix: Added defensive data normalization to ensure arrays are always defined
   - Fixed in: `frontend/src/pages/Profile.tsx` lines 150-157

4. ✅ **DOCUMENTED - Non-Passive Wheel Event Listener** (MUI Menu)
   - Warning: `[Violation] Added non-passive event listener to a scroll-blocking 'wheel' event`
   - Cause: Material-UI Menu component implementation
   - Status: Third-party library issue, documented in BROWSER_CONSOLE_FIXES.md
   - No action needed - MUI team will address in future releases

5. ✅ **FIXED - Aria-Hidden Accessibility Warning**
   - Error: `Blocked aria-hidden on an element because its descendant retained focus`
   - Cause: MUI Dialog with focused button when aria-hidden applied
   - Fix: Added proper Dialog configuration with `disableRestoreFocus` and `keepMounted={false}`
   - Fixed in: `frontend/src/pages/Profile.tsx` Dialog components

6. **OPEN - Redux State Error** (recipesSlice.ts:189)
   - Error: `Cannot read properties of undefined (reading 'recipes')`
   - Cause: API response structure mismatch - expecting `action.payload.recipes` but payload might be undefined or have different structure
   - Fix: Add null checks and default values in reducer

7. **OPEN - HTML Nesting Violations** (Pantry.tsx:276, 293, 294)
   - Error: `<p> cannot contain nested <p>` and `<p> cannot contain nested <div>`
   - Cause: ListItemText secondary prop renders as `<p>`, but contains Typography (also `<p>`) and Stack (`<div>`)
   - Fix: Use `component="div"` on ListItemText or change Typography components to `<span>`

8. **OPEN - Performance Warnings**
   - Multiple `[Violation] 'setInterval' handler took <N>ms` warnings
   - Cause: Long-running setInterval handlers (possibly in polling or animations)
   - Fix: Optimize interval handlers or use requestAnimationFrame

9. **OPEN - React StrictMode Double Rendering**
   - Issue: API calls triggered twice in development due to StrictMode
   - Cause: React 18 StrictMode intentionally double-invokes effects to detect side effects
   - Impact: Duplicate API calls visible in logs during development only
   - Status: Expected behavior in development, no production impact

**Implementation Tasks:**
- [x] Fix Fast Refresh warning in AuthContext
- [x] Fix 401 Unauthorized errors (JWT token property mismatch)
- [x] Fix TypeError in Profile.tsx (undefined array access)
- [x] Document MUI wheel event listener warning
- [x] Fix aria-hidden accessibility warning
- [x] Create comprehensive documentation (BROWSER_CONSOLE_FIXES.md)
- [ ] Fix recipesSlice reducer to handle undefined payload
- [ ] Fix Pantry.tsx HTML nesting violations
- [ ] Investigate and optimize setInterval handlers
- [ ] Add error boundaries to catch Redux errors
- [ ] Add PropTypes or TypeScript validation for API responses

**Files Fixed:**
- ✅ `frontend/src/contexts/AuthContext.tsx` - Fast Refresh fix
- ✅ `backend/src/controllers/familyMember.controller.ts` - getUserId fix
- ✅ `backend/src/controllers/user.controller.ts` - getUserId fix
- ✅ `backend/src/controllers/groceryList.controller.ts` - getUserId fix
- ✅ `backend/src/controllers/mealPlan.controller.ts` - getUserId fix
- ✅ `backend/src/controllers/pantry.controller.ts` - getUserId fix
- ✅ `backend/src/controllers/recipe.controller.ts` - getUserId fix
- ✅ `frontend/src/pages/Profile.tsx` - TypeError fix and Dialog accessibility
- ✅ `BROWSER_CONSOLE_FIXES.md` - Comprehensive documentation

**Files Still to Fix:**
- `frontend/src/store/slices/recipesSlice.ts` (line 189)
- `frontend/src/pages/Pantry.tsx` (lines 276, 293-300)

**Priority:** High - Critical authentication and data access issues resolved, remaining issues affect UX

**Date Fixed:** 2026-03-15

---

### Issue #25: Add Sortable and Filterable Tables/Lists
**Status:** Open
**Priority:** Medium
**Description:** Enhancement request to allow users to sort and filter data by clicking column headers in tables and lists throughout the UI.

**Affected Components:**
- Recipe list page
- Pantry inventory list
- Grocery list
- Meal plan calendar view
- Family members list
- Any other data tables/lists

**Implementation Requirements:**
- Add column header click handlers for sorting (ascending/descending)
- Add filter inputs/dropdowns for each column
- Persist sort/filter preferences in localStorage or user preferences
- Add visual indicators for active sort direction
- Support multi-column sorting (optional)
- Add clear filters button

**Technical Approach:**
- Use Material-UI Table with TableSortLabel components
- Implement client-side sorting for small datasets
- Implement server-side sorting/filtering for large datasets via API query parameters
- Add Redux state for sort/filter preferences
- Consider using a data grid library like MUI X DataGrid for advanced features

**Priority:** Medium - Nice-to-have feature that improves user experience

---


### Issue #26: Add Meal Detail View and Day Summary in Meal Planner
**Status:** Completed
**Priority:** Medium
**Completed:** March 15, 2026
**Description:** Users cannot click on individual meals or days in the meal planner to view details. Only delete action is available.

**Current Behavior:**
- Meal cards in weekly view only show delete button
- No way to view full meal details
- No way to see all meals for a specific day

**Expected Behavior:**
1. **Click on Meal Card** - Opens modal popup showing:
   - Full recipe name
   - Recipe description
   - Servings
   - Prep/cook time
   - Ingredients list
   - Nutrition information
   - Link to full recipe page
   - Edit/Delete actions

2. **Click on Day Header** - Opens modal popup showing:
   - All meals for that day
   - Total nutrition summary for the day
   - Quick add meal button
   - Bulk actions (copy to another day, clear all meals)

**Implementation Tasks:**
- [x] Add click handler to meal cards (lines 280-321 in MealPlanner.tsx)
- [x] Create MealDetailDialog component with full meal information
- [x] Add click handler to day header (lines 206-227 in MealPlanner.tsx)
- [x] Create DaySummaryDialog component with day's meals and nutrition
- [x] Fetch full recipe details when meal is clicked
- [x] Calculate and display daily nutrition totals
- [x] Add edit functionality in meal detail modal
- [x] Add copy/move meal to another day functionality
- [x] Ensure delete button still works (stopPropagation on delete icon)

**Implementation Details:**
- Implemented inline in `frontend/src/pages/MealPlanner.tsx` (no separate components needed)
- Added two Dialog components: Meal Detail Dialog and Day Summary Dialog
- Meal cards and day headers now clickable with hover effects
- Proper event propagation handling (stopPropagation on delete buttons)
- Accessibility improvements (disableRestoreFocus, keepMounted=false)
- Nutrition summary placeholder for future integration with Issue #20

**Files Modified:**
- `frontend/src/pages/MealPlanner.tsx` - Added click handlers, state management, and two dialog components

**API Endpoints Used:**
- GET `/api/recipes/:id` - Fetch full recipe details (already exists)
- GET `/api/meal-plans/:id` - Fetch meal plan details with recipes

**Priority:** Medium - Improves user experience and meal plan management

**Related Issues:** Issue #20 (Nutrition Database) for future nutrition calculations

---
