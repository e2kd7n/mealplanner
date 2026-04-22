# E2E Designer Testing Instructions

## Overview

This document provides comprehensive manual testing instructions for two senior designers to validate the meal planner application following recent architectural changes and feature implementations.

**Application URL:** http://localhost:5173/meal-planner

**Testing Date:** [To be filled by testers]

---

## Testing Context

### Issue #31: Post-Phase 2 Architecture Validation
**Focus:** Frontend consolidation and SPA routing implementation

**Key Changes:**
- Consolidated frontend architecture with single-page application (SPA) routing
- Removed Nginx reverse proxy in favor of direct Vite dev server
- Implemented client-side routing with React Router
- Unified API communication patterns
- Enhanced error handling and logging

**Validation Goals:**
- Verify SPA routing works correctly across all pages
- Confirm API endpoints function properly
- Validate navigation and browser history behavior
- Ensure no broken links or routing issues

### Issue #32: Post-Phase 3 Final Validation
**Focus:** Recent v1.1 features and overall application quality

**Key Features to Validate:**
- Recipe scaling functionality (adjust servings)
- Recipe sorting and filtering improvements
- Back navigation consistency
- Recipe import quality and error handling
- Overall user experience and polish

**Validation Goals:**
- Verify all v1.1 features work as expected
- Test error handling across the application
- Validate imported recipe content quality
- Assess overall UX consistency and intuitiveness

---

## Pre-Testing Setup

### 1. Access the Application
- Open your browser (Chrome, Firefox, or Safari recommended)
- Navigate to: **http://localhost:5173/meal-planner**
- Bookmark this URL for easy access

### 2. Create Test Account
If you don't have credentials:
1. Click "Register" or "Sign Up"
2. Use test credentials:
   - **Username:** designer1 (or designer2)
   - **Email:** designer1@test.com (or designer2@test.com)
   - **Password:** TestPass123!
3. Complete registration

### 3. Testing Tools
- Keep browser DevTools open (F12 or Cmd+Option+I)
- Monitor Console tab for errors
- Use Network tab to observe API calls
- Take screenshots of any issues found

---

## Designer 1 Test Plan: Issue #31 Architecture Validation

### A. SPA Routing Validation

#### Test 1: Direct URL Navigation
**Objective:** Verify all routes load correctly when accessed directly

**Steps:**
1. Test each URL by entering directly in address bar:
   - `http://localhost:5173/meal-planner/` (Home/Dashboard)
   - `http://localhost:5173/meal-planner/recipes` (Recipes List)
   - `http://localhost:5173/meal-planner/recipes/browse` (Browse Recipes)
   - `http://localhost:5173/meal-planner/meal-plans` (Meal Plans)
   - `http://localhost:5173/meal-planner/grocery-lists` (Grocery Lists)
   - `http://localhost:5173/meal-planner/pantry` (Pantry)
   - `http://localhost:5173/meal-planner/profile` (Profile)

**Expected Results:**
- Each page loads without errors
- Correct content displays for each route
- Navigation menu highlights active page
- No 404 errors or blank pages

**Document:**
- [ ] All routes load successfully
- [ ] Any routes that fail to load
- [ ] Console errors (if any)

#### Test 2: Navigation Menu Functionality
**Objective:** Verify navigation works without page reloads

**Steps:**
1. Start at home page
2. Click each navigation menu item in sequence
3. Observe browser behavior (should NOT see page refresh)
4. Check browser address bar updates correctly
5. Verify content changes appropriately

**Expected Results:**
- Navigation is instant (no page reload)
- URL updates in address bar
- Content changes smoothly
- No flash of white screen
- Browser back/forward buttons work

**Document:**
- [ ] Navigation is smooth and instant
- [ ] Any navigation items that cause page reload
- [ ] Any visual glitches during navigation

#### Test 3: Browser History Navigation
**Objective:** Verify back/forward buttons work correctly

**Steps:**
1. Navigate through several pages: Home → Recipes → Browse → Meal Plans
2. Click browser back button 3 times
3. Verify you return through: Meal Plans → Browse → Recipes
4. Click browser forward button 2 times
5. Verify you advance through: Browse → Meal Plans

**Expected Results:**
- Back button returns to previous pages in correct order
- Forward button advances through history
- Page state is preserved (scroll position, form data)
- No duplicate history entries

**Document:**
- [ ] Back/forward navigation works correctly
- [ ] Any issues with history state
- [ ] Any lost page state

#### Test 4: Deep Link Navigation
**Objective:** Verify links to specific items work correctly

**Steps:**
1. Go to Recipes page
2. Click on a specific recipe to view details
3. Copy the URL from address bar
4. Open a new browser tab
5. Paste the URL and navigate to it
6. Verify the specific recipe loads

**Expected Results:**
- Recipe detail page loads correctly
- Correct recipe information displays
- Navigation menu still works
- Can navigate back to recipes list

**Document:**
- [ ] Deep links work correctly
- [ ] Recipe details load properly
- [ ] Any routing issues with specific items

### B. API Functionality Verification

#### Test 5: Recipe Operations
**Objective:** Verify CRUD operations work correctly

**Steps:**
1. **Create:** Add a new recipe with all fields
2. **Read:** View the recipe details
3. **Update:** Edit the recipe (change title, ingredients)
4. **Delete:** Remove the recipe

**Expected Results:**
- All operations complete successfully
- Success messages display appropriately
- Data persists correctly
- No API errors in console

**Document:**
- [ ] Create recipe works
- [ ] View recipe works
- [ ] Edit recipe works
- [ ] Delete recipe works
- [ ] Any API errors encountered

#### Test 6: Meal Plan Operations
**Objective:** Verify meal planning functionality

**Steps:**
1. Create a new meal plan
2. Add recipes to different days/meals
3. View the meal plan
4. Edit meal assignments
5. Delete the meal plan

**Expected Results:**
- Meal plan creation succeeds
- Recipes can be assigned to meals
- Changes save correctly
- Deletion works properly

**Document:**
- [ ] Meal plan operations work
- [ ] Any issues with recipe assignment
- [ ] Any data persistence issues

#### Test 7: Grocery List Operations
**Objective:** Verify grocery list functionality

**Steps:**
1. Generate grocery list from a meal plan
2. View the grocery list
3. Check/uncheck items
4. Add custom items
5. Delete items

**Expected Results:**
- Grocery list generates correctly
- Items can be checked/unchecked
- Custom items can be added
- Changes persist

**Document:**
- [ ] Grocery list generation works
- [ ] Item management works
- [ ] Any synchronization issues

### C. Error Handling Validation

#### Test 8: Network Error Handling
**Objective:** Verify graceful error handling

**Steps:**
1. Open DevTools Network tab
2. Set network throttling to "Offline"
3. Try to load recipes page
4. Try to create a new recipe
5. Restore network connection

**Expected Results:**
- Appropriate error messages display
- No application crashes
- User can retry operations
- Application recovers when network restored

**Document:**
- [ ] Error messages are user-friendly
- [ ] Application handles offline state
- [ ] Any crashes or unhandled errors

#### Test 9: Invalid Data Handling
**Objective:** Verify validation works correctly

**Steps:**
1. Try to create recipe with empty title
2. Try to create recipe with invalid data
3. Try to access non-existent recipe ID
4. Try to submit forms with missing required fields

**Expected Results:**
- Validation errors display clearly
- Form submission is prevented
- 404 pages display for invalid IDs
- No console errors

**Document:**
- [ ] Validation works correctly
- [ ] Error messages are clear
- [ ] Any validation bypasses

### D. Designer 1 Test Report Template

```markdown
# Designer 1 Test Report: Issue #31 Architecture Validation

**Tester:** [Your Name]
**Date:** [Test Date]
**Application URL:** http://localhost:5173/meal-planner
**Browser:** [Browser Name & Version]

## Executive Summary
[Brief overview of testing results - 2-3 sentences]

## Test Results Summary
- Total Tests: 9
- Passed: [X]
- Failed: [X]
- Blocked: [X]

## Detailed Findings

### SPA Routing (Tests 1-4)
**Status:** [Pass/Fail/Partial]

**Issues Found:**
1. [Issue description]
   - **Severity:** [Critical/High/Medium/Low]
   - **Steps to Reproduce:**
     1. [Step 1]
     2. [Step 2]
   - **Expected:** [What should happen]
   - **Actual:** [What actually happened]
   - **Screenshot:** [Attach if available]

### API Functionality (Tests 5-7)
**Status:** [Pass/Fail/Partial]

**Issues Found:**
[Same format as above]

### Error Handling (Tests 8-9)
**Status:** [Pass/Fail/Partial]

**Issues Found:**
[Same format as above]

## Browser Console Errors
[List any console errors observed]

## Performance Observations
[Note any slow loading, lag, or performance issues]

## Recommendations
[Suggestions for improvements]

## Sign-off
- [ ] All critical issues documented
- [ ] Screenshots attached for visual issues
- [ ] Ready for developer review

**Tester Signature:** _______________
**Date:** _______________
```

---

## Designer 2 Test Plan: Issue #32 Feature Validation

### A. Recipe Scaling Feature

#### Test 10: Basic Recipe Scaling
**Objective:** Verify recipe scaling works correctly

**Steps:**
1. Navigate to a recipe detail page
2. Locate the servings adjustment control
3. Increase servings (e.g., from 4 to 6)
4. Observe ingredient quantities update
5. Decrease servings (e.g., from 6 to 2)
6. Verify quantities adjust proportionally

**Expected Results:**
- Servings control is visible and intuitive
- Ingredient quantities scale correctly
- Fractional amounts display properly (e.g., 1/2 cup, 1.5 cups)
- Scaling is instant (no page reload)

**Document:**
- [ ] Scaling control is easy to find and use
- [ ] Quantities calculate correctly
- [ ] Fractional display is readable
- [ ] Any calculation errors

#### Test 11: Edge Cases in Scaling
**Objective:** Test scaling with various ingredient formats

**Steps:**
1. Find recipes with different ingredient formats:
   - Whole numbers (2 cups)
   - Fractions (1/2 teaspoon)
   - Decimals (1.5 pounds)
   - Ranges (2-3 cloves)
   - Non-scalable items (salt to taste)
2. Scale each recipe up and down
3. Verify all formats handle correctly

**Expected Results:**
- All numeric quantities scale appropriately
- Non-numeric items remain unchanged
- No broken formatting
- Reasonable precision (not too many decimals)

**Document:**
- [ ] All ingredient formats scale correctly
- [ ] Non-scalable items handled properly
- [ ] Any formatting issues

### B. Recipe Sorting and Filtering

#### Test 12: Recipe Sorting
**Objective:** Verify sorting functionality works

**Steps:**
1. Go to Recipes page
2. Test each sort option:
   - Sort by Name (A-Z)
   - Sort by Name (Z-A)
   - Sort by Date Added (Newest)
   - Sort by Date Added (Oldest)
   - Sort by Cook Time (if available)
3. Verify recipes reorder correctly

**Expected Results:**
- Sort dropdown is visible and accessible
- Recipes reorder immediately
- Sort order is correct
- Selection persists during session

**Document:**
- [ ] All sort options work correctly
- [ ] Sort order is accurate
- [ ] Any sorting bugs

#### Test 13: Recipe Filtering
**Objective:** Verify filtering functionality

**Steps:**
1. Test category filters (if available)
2. Test dietary restriction filters
3. Test search functionality
4. Combine multiple filters
5. Clear filters

**Expected Results:**
- Filters apply immediately
- Results match filter criteria
- Multiple filters work together (AND logic)
- Clear filters restores full list
- No results message displays when appropriate

**Document:**
- [ ] Filters work correctly
- [ ] Search is accurate
- [ ] Combined filters work
- [ ] Any filter bugs

### C. Navigation Consistency

#### Test 14: Back Navigation Flow
**Objective:** Verify consistent back navigation behavior

**Steps:**
1. **From Recipe Detail:**
   - Browse recipes → Select recipe → Click back
   - Verify returns to browse page with filters intact
2. **From Edit Recipe:**
   - View recipe → Click edit → Click back
   - Verify returns to recipe detail
3. **From Meal Plan:**
   - Meal plans → View plan → Click back
   - Verify returns to meal plans list

**Expected Results:**
- Back buttons/links are consistently placed
- Navigation returns to expected previous page
- Page state is preserved (scroll position, filters)
- No unexpected redirects

**Document:**
- [ ] Back navigation is consistent
- [ ] Page state preserved
- [ ] Any navigation confusion

#### Test 15: Breadcrumb Navigation
**Objective:** Verify breadcrumb trails (if implemented)

**Steps:**
1. Navigate deep into the app (e.g., Home → Recipes → Recipe Detail → Edit)
2. Check for breadcrumb trail
3. Click breadcrumb links to navigate back
4. Verify each level works correctly

**Expected Results:**
- Breadcrumbs display current location
- All breadcrumb links work
- Visual hierarchy is clear

**Document:**
- [ ] Breadcrumbs present and functional
- [ ] Visual design is clear
- [ ] Any breadcrumb issues

### D. Recipe Import Quality

#### Test 16: Import from URL
**Objective:** Verify recipe import functionality and quality

**Steps:**
1. Navigate to recipe import feature
2. Test importing from popular recipe sites:
   - AllRecipes.com
   - FoodNetwork.com
   - NYTimes Cooking
   - Other sites
3. Review imported data quality:
   - Title accuracy
   - Ingredient parsing
   - Instructions formatting
   - Image import
   - Metadata (servings, time, etc.)

**Expected Results:**
- Import completes successfully
- Data is accurately extracted
- Formatting is clean and readable
- Images load correctly
- User can edit imported data

**Document:**
- [ ] Import functionality works
- [ ] Data quality is good
- [ ] Which sites work well
- [ ] Which sites have issues
- [ ] Any parsing errors

#### Test 17: Import Error Handling
**Objective:** Verify error handling for failed imports

**Steps:**
1. Try importing from invalid URL
2. Try importing from non-recipe page
3. Try importing from unsupported site
4. Test with network issues

**Expected Results:**
- Clear error messages display
- User understands what went wrong
- Suggestions for resolution provided
- No application crashes

**Document:**
- [ ] Error messages are helpful
- [ ] Application handles errors gracefully
- [ ] Any crashes or confusing errors

### E. Overall UX Assessment

#### Test 18: Visual Consistency
**Objective:** Assess visual design consistency

**Steps:**
1. Review all major pages for:
   - Color scheme consistency
   - Typography consistency
   - Button styles
   - Form field styles
   - Spacing and alignment
   - Icon usage
2. Check responsive behavior (resize browser)
3. Test on different screen sizes if possible

**Expected Results:**
- Consistent visual language throughout
- Professional appearance
- Responsive design works
- No broken layouts

**Document:**
- [ ] Visual design is consistent
- [ ] Responsive design works
- [ ] Any visual inconsistencies
- [ ] Any layout issues

#### Test 19: User Flow Assessment
**Objective:** Evaluate overall user experience

**Steps:**
1. Complete common user tasks:
   - Find and view a recipe
   - Create a meal plan
   - Generate grocery list
   - Add a new recipe
2. Note any friction points
3. Assess intuitiveness of features
4. Evaluate information architecture

**Expected Results:**
- Tasks are intuitive to complete
- Minimal clicks to accomplish goals
- Clear labels and instructions
- Logical information organization

**Document:**
- [ ] User flows are intuitive
- [ ] Any confusing interactions
- [ ] Suggestions for improvement

#### Test 20: Accessibility Quick Check
**Objective:** Basic accessibility assessment

**Steps:**
1. Navigate using keyboard only (Tab, Enter, Escape)
2. Check for focus indicators
3. Verify form labels are present
4. Test with browser zoom (150%, 200%)
5. Check color contrast (text readability)

**Expected Results:**
- All interactive elements keyboard accessible
- Focus indicators visible
- Forms properly labeled
- Readable at high zoom levels
- Sufficient color contrast

**Document:**
- [ ] Keyboard navigation works
- [ ] Focus indicators present
- [ ] Forms are accessible
- [ ] Zoom works properly
- [ ] Any accessibility issues

### F. Designer 2 Test Report Template

```markdown
# Designer 2 Test Report: Issue #32 Feature Validation

**Tester:** [Your Name]
**Date:** [Test Date]
**Application URL:** http://localhost:5173/meal-planner
**Browser:** [Browser Name & Version]

## Executive Summary
[Brief overview of testing results - 2-3 sentences]

## Test Results Summary
- Total Tests: 11 (Tests 10-20)
- Passed: [X]
- Failed: [X]
- Blocked: [X]

## Detailed Findings

### Recipe Scaling (Tests 10-11)
**Status:** [Pass/Fail/Partial]

**Issues Found:**
1. [Issue description]
   - **Severity:** [Critical/High/Medium/Low]
   - **Steps to Reproduce:**
     1. [Step 1]
     2. [Step 2]
   - **Expected:** [What should happen]
   - **Actual:** [What actually happened]
   - **Screenshot:** [Attach if available]

### Sorting & Filtering (Tests 12-13)
**Status:** [Pass/Fail/Partial]

**Issues Found:**
[Same format as above]

### Navigation (Tests 14-15)
**Status:** [Pass/Fail/Partial]

**Issues Found:**
[Same format as above]

### Recipe Import (Tests 16-17)
**Status:** [Pass/Fail/Partial]

**Recipe Sites Tested:**
- [Site 1]: [Pass/Fail] - [Notes]
- [Site 2]: [Pass/Fail] - [Notes]

**Issues Found:**
[Same format as above]

### UX Assessment (Tests 18-20)
**Status:** [Pass/Fail/Partial]

**Issues Found:**
[Same format as above]

## UX Recommendations
[Detailed suggestions for improving user experience]

### High Priority
1. [Recommendation]
2. [Recommendation]

### Medium Priority
1. [Recommendation]
2. [Recommendation]

### Nice to Have
1. [Recommendation]
2. [Recommendation]

## Browser Console Errors
[List any console errors observed]

## Performance Observations
[Note any slow loading, lag, or performance issues]

## Overall Assessment
**Rating:** [Excellent/Good/Fair/Poor]

**Strengths:**
- [Strength 1]
- [Strength 2]

**Areas for Improvement:**
- [Area 1]
- [Area 2]

## Sign-off
- [ ] All critical issues documented
- [ ] Screenshots attached for visual issues
- [ ] UX recommendations provided
- [ ] Ready for developer review

**Tester Signature:** _______________
**Date:** _______________
```

---

## Shared Testing Protocol

### Bug/Issue Documentation Format

When documenting bugs or issues, use this format:

```markdown
## Issue #[Number]: [Brief Title]

**Severity:** [Critical/High/Medium/Low]

**Category:** [Routing/API/UI/UX/Performance/Other]

**Description:**
[Clear description of the issue]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Environment:**
- Browser: [Name & Version]
- OS: [Operating System]
- Screen Size: [Resolution]
- Date/Time: [When issue occurred]

**Screenshots/Videos:**
[Attach visual evidence]

**Console Errors:**
```
[Paste any console errors]
```

**Additional Notes:**
[Any other relevant information]
```

### Severity Definitions

- **Critical:** Application crashes, data loss, security issues, core functionality broken
- **High:** Major features don't work, significant UX problems, workaround is difficult
- **Medium:** Feature works but has issues, minor UX problems, workaround exists
- **Low:** Cosmetic issues, minor inconsistencies, nice-to-have improvements

### Screenshot Guidelines

1. **Capture Context:** Include enough of the screen to show context
2. **Highlight Issues:** Use arrows or circles to point out specific problems
3. **Include Browser Info:** Show address bar when relevant
4. **Console Errors:** Capture DevTools console when errors present
5. **File Naming:** Use descriptive names (e.g., `issue-31-routing-error.png`)

### Testing Best Practices

1. **Clear Browser Cache:** Start with a fresh cache to avoid cached issues
2. **Test Incrementally:** Complete one test before moving to the next
3. **Document Immediately:** Record findings right away while fresh
4. **Be Thorough:** Don't skip steps even if they seem to work
5. **Think Like a User:** Try unexpected actions and edge cases
6. **Note Positive Findings:** Document what works well, not just problems
7. **Ask Questions:** If something is unclear, note it for discussion

### Communication

- **Daily Check-ins:** Brief sync between testers to share findings
- **Immediate Critical Issues:** Report critical bugs immediately via Slack/email
- **Final Reports:** Submit completed reports within 24 hours of testing
- **Questions:** Contact [Developer Name] for technical questions

---

## Testing Timeline

### Recommended Schedule

**Day 1:**
- **Designer 1:** Tests 1-5 (SPA Routing & Basic API)
- **Designer 2:** Tests 10-13 (Recipe Scaling & Sorting)

**Day 2:**
- **Designer 1:** Tests 6-9 (API Operations & Error Handling)
- **Designer 2:** Tests 14-17 (Navigation & Import)

**Day 3:**
- **Designer 1:** Complete report, retest any issues
- **Designer 2:** Tests 18-20 (UX Assessment), complete report

**Day 4:**
- Both: Review each other's reports, final validation

---

## Post-Testing

### Report Submission

1. Save your completed report as:
   - `E2E_DESIGNER1_TEST_REPORT.md`
   - `E2E_DESIGNER2_TEST_REPORT.md`

2. Include all screenshots in a folder:
   - `test-screenshots/designer1/`
   - `test-screenshots/designer2/`

3. Submit via:
   - [Specify submission method: email, GitHub, shared drive, etc.]

### Follow-up

- Developers will review reports within 48 hours
- Testers may be asked to verify fixes
- Final sign-off meeting will be scheduled

---

## Quick Reference

### Application URL
**http://localhost:5173/meal-planner**

### Test Credentials
- **Username:** designer1 / designer2
- **Email:** designer1@test.com / designer2@test.com
- **Password:** TestPass123!

### Key Shortcuts
- **Open DevTools:** F12 (Windows/Linux) or Cmd+Option+I (Mac)
- **Refresh Page:** Ctrl+R (Windows/Linux) or Cmd+R (Mac)
- **Hard Refresh:** Ctrl+Shift+R or Cmd+Shift+R
- **Take Screenshot:** OS-specific screenshot tool

### Support Contacts
- **Technical Issues:** [Developer Contact]
- **Testing Questions:** [QA Lead Contact]
- **Urgent Issues:** [Emergency Contact]

---

## Appendix: Common Issues to Watch For

### Routing Issues
- 404 errors on valid routes
- Blank pages after navigation
- Incorrect URL in address bar
- Broken back button behavior
- Lost page state after navigation

### API Issues
- Failed requests (check Network tab)
- Timeout errors
- Incorrect data returned
- Missing error handling
- Slow response times

### UI/UX Issues
- Broken layouts on different screen sizes
- Inconsistent styling
- Missing loading indicators
- Confusing navigation
- Inaccessible features

### Performance Issues
- Slow page loads
- Laggy interactions
- Memory leaks (browser becomes slow over time)
- Large bundle sizes
- Unnecessary re-renders

---

**Good luck with testing! Your feedback is invaluable for improving the application.**