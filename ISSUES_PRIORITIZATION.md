# Issues Prioritization

**Last Updated:** March 15, 2026

This document provides a quick overview of all open issues, organized by priority, to help with task planning and prioritization.

---

## 🔴 Critical Priority

No critical issues at this time.

---

## 🟠 High Priority

### Frontend Development

| # | Issue | Tags | Status | Link |
|---|-------|------|--------|------|
| 14 | Implement Profile Page UI | `frontend`, `ui`, `user-management` | Open | [View Details](#issue-14-implement-profile-page-ui) |
| 15 | Implement Create Recipe Page UI | `frontend`, `ui`, `recipes` | Open | [View Details](#issue-15-implement-create-recipe-page-ui) |

### Backend Features

| # | Issue | Tags | Status | Link |
|---|-------|------|--------|------|
| 17 | Implement AllRecipes.com Recipe Import | `backend`, `integration`, `recipes` | Open | [View Details](#issue-17-implement-allrecipescom-recipe-import) |
| 18 | Implement Recipe Card OCR Import | `backend`, `ai`, `ocr`, `recipes` | Open | [View Details](#issue-18-implement-recipe-card-ocr-import) |
| 19 | Implement URL-Based Recipe Import | `backend`, `integration`, `recipes`, `docling` | Open | [View Details](#issue-19-implement-url-based-recipe-import) |
| 20 | Integrate Nutrition Database | `backend`, `nutrition`, `api-integration` | Open | [View Details](#issue-20-integrate-nutrition-database-for-auto-population) |
| 21 | Implement Nutrition Dashboard | `frontend`, `nutrition`, `dashboard`, `charts` | Open | [View Details](#issue-21-implement-nutrition-dashboard) |
| 22 | Implement Nutrition Guideline Warnings | `frontend`, `backend`, `nutrition`, `health` | Open | [View Details](#issue-22-implement-nutrition-guideline-warnings) |

### Admin & Security

| # | Issue | Tags | Status | Link |
|---|-------|------|--------|------|
| 13 | Implement Admin Dashboard | `frontend`, `backend`, `admin`, `security` | Open | [View Details](#issue-13-implement-admin-dashboard-for-user-management) |

---

## 🟡 Medium Priority

### Features

| # | Issue | Tags | Status | Link |
|---|-------|------|--------|------|
| 10 | Recipe Search & Recommendations | `backend`, `search`, `ai`, `recommendations` | Open | [View Details](#issue-10-missing-recipe-search--recommendations) |
| 11 | Grocery List Optimization | `backend`, `optimization`, `grocery` | Open | [View Details](#issue-11-missing-grocery-list-optimization) |
| 16 | MyFitnessPal Integration | `backend`, `integration`, `nutrition`, `api` | Open | [View Details](#issue-16-implement-myfitnesspal-integration) |
| 23 | Create System Architecture Documentation | `documentation`, `architecture` | Open | [View Details](#issue-23-create-system-architecture-documentation) |

---

## 🟢 Low Priority

No low priority issues at this time.

---

## ✅ Recently Completed

| # | Issue | Completed | Tags |
|---|-------|-----------|------|
| 2 | Add copyright notices | Mar 15, 2026 | `legal`, `maintenance` |
| 5 | Refactor auth.controller.ts | Mar 15, 2026 | `backend`, `security`, `refactor` |
| 6 | Refactor groceryList.controller.ts | Mar 15, 2026 | `backend`, `performance`, `refactor` |
| 7 | Add recipe rating endpoints | Mar 15, 2026 | `backend`, `recipes`, `api` |
| 8 | Add user profile & preferences endpoints | Mar 15, 2026 | `backend`, `user-management`, `api` |
| 9 | Add family member management endpoints | Mar 15, 2026 | `backend`, `user-management`, `api` |
| 12 | Add input validation middleware | Mar 15, 2026 | `backend`, `security`, `validation` |
| 24 | Fix frontend console errors | Mar 15, 2026 | `frontend`, `bugfix` |

---

## 📊 Statistics

- **Total Open Issues:** 13
- **High Priority:** 9
- **Medium Priority:** 4
- **Low Priority:** 0
- **Recently Completed:** 8

---

## 🎯 Recommended Next Steps

Based on priority and dependencies:

1. **Issue #14** - Implement Profile Page UI
   - Backend APIs already complete (Issues #8, #9)
   - Quick win, high user value

2. **Issue #15** - Implement Create Recipe Page UI
   - Core functionality for recipe management
   - Backend API already exists

3. **Issue #20** - Integrate Nutrition Database
   - Enables Issues #21 and #22
   - Foundation for nutrition features

4. **Issue #19** - Implement URL-Based Recipe Import
   - High user value for building recipe collection
   - Uses Docling + multi-parser approach

5. **Issue #18** - Implement Recipe Card OCR Import
   - Unique feature, high value
   - Depends on multi-parser infrastructure from #19

---

## 📋 Issue Details

### Issue #14: Implement Profile Page UI
**Priority:** High | **Tags:** `frontend`, `ui`, `user-management`

Replace "coming soon" placeholder with full profile management interface.

**Key Features:**
- Profile information display and editing
- User preferences management
- Family member CRUD operations
- Password change functionality

**Backend Status:** ✅ Complete (APIs from Issues #8 and #9)

[Full Details in ISSUES.md](./ISSUES.md#issue-14-implement-profile-page-ui)

---

### Issue #15: Implement Create Recipe Page UI
**Priority:** High | **Tags:** `frontend`, `ui`, `recipes`

Replace "coming soon" placeholder with comprehensive recipe creation form.

**Key Features:**
- Multi-section form (basic info, ingredients, instructions, nutrition)
- Image upload with preview
- Ingredient autocomplete
- Drag-and-drop instruction reordering

**Backend Status:** ✅ Complete (POST /api/recipes exists)

[Full Details in ISSUES.md](./ISSUES.md#issue-15-implement-create-recipe-page-ui)

---

### Issue #13: Implement Admin Dashboard for User Management
**Priority:** High | **Tags:** `frontend`, `backend`, `admin`, `security`

Create administrative interface for managing users, security, and system operations.

**Key Features:**
- User account management (view, reset password, block, delete)
- Security monitoring (failed logins, active sessions)
- System configuration
- Audit logging

**Dependencies:** None

[Full Details in ISSUES.md](./ISSUES.md#issue-13-implement-admin-dashboard-for-user-management)

---

### Issue #10: Missing Recipe Search & Recommendations
**Priority:** Medium | **Tags:** `backend`, `search`, `ai`, `recommendations`

Advanced recipe search and personalized recommendations.

**Key Features:**
- Search with filters (ingredients, cuisine, difficulty, etc.)
- Personalized recommendations based on preferences
- Similar recipe finder
- Recipe import from URL

**Dependencies:** None

[Full Details in ISSUES.md](./ISSUES.md#issue-10-missing-recipe-search--recommendations)

---

### Issue #11: Missing Grocery List Optimization
**Priority:** Medium | **Tags:** `backend`, `optimization`, `grocery`

Optimize grocery lists by store layout and pricing.

**Key Features:**
- Store section grouping
- Multi-store price comparison
- Optimization algorithm

**Dependencies:** None

[Full Details in ISSUES.md](./ISSUES.md#issue-11-missing-grocery-list-optimization)

---

### Issue #16: Implement MyFitnessPal Integration
**Priority:** Medium | **Tags:** `backend`, `integration`, `nutrition`, `api`

Push recipe nutrition data to MyFitnessPal for meal tracking.

**Key Features:**
- OAuth authentication
- Nutrition export
- Meal logging
- Auto-log from meal plan

**Dependencies:** Issue #20 (Nutrition Database) recommended

[Full Details in ISSUES.md](./ISSUES.md#issue-16-implement-myfitnesspal-integration)

---

### Issue #17: Implement AllRecipes.com Recipe Import
**Priority:** High | **Tags:** `backend`, `integration`, `recipes`

Import recipes from user's AllRecipes.com recipe book.

**Key Features:**
- Authentication with AllRecipes.com
- Recipe book access
- Single and bulk import
- Duplicate detection

**Dependencies:** None

[Full Details in ISSUES.md](./ISSUES.md#issue-17-implement-allrecipescom-recipe-import)

---

### Issue #18: Implement Recipe Card OCR Import
**Priority:** High | **Tags:** `backend`, `ai`, `ocr`, `recipes`

Scan physical recipe cards using OCR and AI parsing.

**Key Features:**
- Camera/upload image capture
- Multi-parser OCR (Docling primary, Google Cloud Vision, AWS Textract, Tesseract.js)
- AI-powered recipe parsing with Docling document understanding
- Review and edit interface
- Batch processing

**Dependencies:** None (but benefits from #19 multi-parser infrastructure)

[Full Details in ISSUES.md](./ISSUES.md#issue-18-implement-recipe-card-ocr-import)

---

### Issue #19: Implement URL-Based Recipe Import
**Priority:** High | **Tags:** `backend`, `integration`, `recipes`, `docling`

Import recipes from any website URL with ad removal.

**Key Features:**
- Docling (primary parser) + recipe-scrapers + custom parsers
- Multi-parser consensus algorithm
- Ad and clutter removal
- Schema.org support
- Supports 100+ recipe sites

**Dependencies:** None

[Full Details in ISSUES.md](./ISSUES.md#issue-19-implement-url-based-recipe-import)

---

### Issue #20: Integrate Nutrition Database for Auto-Population
**Priority:** High | **Tags:** `backend`, `nutrition`, `api-integration`

Integrate USDA FoodData Central to auto-populate nutrition information.

**Key Features:**
- USDA FoodData Central API integration
- Ingredient-to-nutrition mapping
- Automatic calculation per serving
- Manual override capability
- Confidence scoring

**Dependencies:** None

[Full Details in ISSUES.md](./ISSUES.md#issue-20-integrate-nutrition-database-for-auto-population)

---

### Issue #21: Implement Nutrition Dashboard
**Priority:** High | **Tags:** `frontend`, `nutrition`, `dashboard`, `charts`

Comprehensive nutrition dashboard with visualizations and insights.

**Key Features:**
- Daily/weekly/monthly summaries
- Interactive charts and graphs
- Family member-specific views
- Goal setting and tracking
- Export and reporting

**Dependencies:** Issue #20 (Nutrition Database)

[Full Details in ISSUES.md](./ISSUES.md#issue-21-implement-nutrition-dashboard)

---

### Issue #22: Implement Nutrition Guideline Warnings
**Priority:** High | **Tags:** `frontend`, `backend`, `nutrition`, `health`

Smart warnings when nutrition guidelines are exceeded or insufficient.

**Key Features:**
- Gentle warnings (yellow) for exceeding guidelines
- Stern warnings (red) for insufficient nutrition
- No warnings when meal plan incomplete
- Actionable recommendations
- User preferences for sensitivity

**Dependencies:** Issues #20 (Nutrition Database) and #21 (Dashboard)

[Full Details in ISSUES.md](./ISSUES.md#issue-22-implement-nutrition-guideline-warnings)

---

### Issue #23: Create System Architecture Documentation
**Priority:** Medium | **Tags:** `documentation`, `architecture`

Create comprehensive architecture documentation with diagrams.

**Key Deliverables:**
- System architecture diagram (PNG)
- Detailed architecture document (Markdown)
- Technology stack rationale
- Deployment architecture

**Dependencies:** None

[Full Details in ISSUES.md](./ISSUES.md#issue-23-create-system-architecture-documentation)

---

## 🏷️ Tag Index

- **frontend** (5): #14, #15, #21, #22, #13
- **backend** (10): #13, #17, #18, #19, #20, #22, #10, #11, #16
- **ui** (2): #14, #15
- **recipes** (5): #15, #17, #18, #19, #10
- **nutrition** (4): #20, #21, #22, #16
- **integration** (4): #17, #19, #16, #20
- **ai** (2): #18, #10
- **ocr** (1): #18
- **admin** (1): #13
- **security** (1): #13
- **user-management** (2): #14, #13
- **dashboard** (1): #21
- **charts** (1): #21
- **health** (1): #22
- **search** (1): #10
- **recommendations** (1): #10
- **optimization** (1): #11
- **grocery** (1): #11
- **api** (2): #16, #20
- **api-integration** (1): #20
- **docling** (1): #19
- **documentation** (1): #23
- **architecture** (1): #23

---

**Note:** This document is auto-generated from ISSUES.md. For full issue details, implementation tasks, and technical specifications, refer to [ISSUES.md](./ISSUES.md).