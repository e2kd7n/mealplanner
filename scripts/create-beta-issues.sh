#!/bin/bash

# Beta Testing & Design Review - GitHub Issues Creation Script
# Generated: 2026-04-22
# Priority Framework: Rapid time-to-value, user retention, robust FTUE & day-n experience

set -e

echo "🚀 Creating GitHub Issues for Beta Launch..."
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub. Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is ready"
echo ""

# Create missing labels
echo "📋 Creating missing labels..."

gh label create "beta-testing" --description "Issues from beta testing" --color "E99695" --force 2>/dev/null || true
gh label create "ftue" --description "First Time User Experience" --color "0E8A16" --force 2>/dev/null || true
gh label create "collaboration" --description "Collaboration features" --color "1D76DB" --force 2>/dev/null || true
gh label create "ux" --description "User experience improvements" --color "FBCA04" --force 2>/dev/null || true
gh label create "quick-win" --description "Quick win - high impact, low effort" --color "0E8A16" --force 2>/dev/null || true
gh label create "user-retention" --description "Critical for user retention" --color "B60205" --force 2>/dev/null || true
gh label create "safety" --description "Safety-critical feature" --color "B60205" --force 2>/dev/null || true
gh label create "frontend" --description "Frontend changes" --color "1D76DB" --force 2>/dev/null || true
gh label create "backend" --description "Backend changes" --color "1D76DB" --force 2>/dev/null || true
gh label create "fullstack" --description "Full-stack changes" --color "1D76DB" --force 2>/dev/null || true

echo "✅ Labels ready"
echo ""

# Bundle 1: Critical Pre-Launch Fixes (P0)
echo "📦 Bundle 1: Critical Pre-Launch Fixes (P0)"
echo "============================================"

gh issue create \
  --title "[P0][CRITICAL] Fix Recipe Image Loading Failures" \
  --label "P0-critical,bug,blocking-launch,beta-testing,frontend,design-review" \
  --body "## Problem
Recipe images are failing to load with 404 errors, degrading user experience and making the app appear unfinished.

## Evidence
- Design Evaluation identified multiple 404 errors
- All beta testing profiles reported broken images
- Specific failures:
  - \`/images/recipe-1776692950205-7fvpppj1qbn.webp\` - 404
  - External Unsplash URLs failing through proxy

## User Impact
**Severity:** Critical  
**User Quote:** \"Broken images make the app look unfinished\" - All profiles

## Affected Files
- \`frontend/src/hooks/useCachedImage.ts\`
- \`frontend/src/utils/imageCache.ts\`
- Backend image proxy configuration

## Acceptance Criteria
- [ ] All recipe images load successfully
- [ ] Image proxy handles external URLs correctly
- [ ] Fallback images display for missing images
- [ ] No 404 errors in console
- [ ] Image validation during recipe import
- [ ] Better default placeholder images

## Technical Requirements
1. Verify all recipe image URLs in database
2. Fix image proxy for external URLs
3. Improve fallback handling
4. Add image validation on import
5. Test with various image sources

## Timeline
**Estimate:** 4-6 hours  
**Deadline:** Before beta launch (tomorrow)

## Related Issues
- Part of Bundle 1: Critical Pre-Launch Fixes
- Blocks beta launch

## Testing
- [ ] Test with local images
- [ ] Test with external URLs (Unsplash, etc.)
- [ ] Test with missing images
- [ ] Test fallback behavior
- [ ] Verify no console errors"

gh issue create \
  --title "[P0][CRITICAL] Remove Production Console Logging" \
  --label "P0-critical,bug,blocking-launch,beta-testing,frontend,design-review" \
  --body "## Problem
Excessive debug logging in production mode causes performance overhead, exposes internal logic, and appears unprofessional.

## Evidence
- Design Evaluation identified verbose console output
- Logs include:
  - \`📅 All meal plans: JSHandle@array\`
  - \`🔍 Looking for week starting: 2026-04-19\`
  - Recipe API response logs
  - Date transformation logs

## User Impact
**Severity:** High  
**Impact:** Performance, security, professionalism

## Affected Files
- \`frontend/src/pages/MealPlanner.tsx\`
- \`frontend/src/pages/Recipes.tsx\`
- \`frontend/src/utils/logger.ts\`
- Other components with console.log statements

## Acceptance Criteria
- [ ] Remove all debug console.log statements
- [ ] Implement environment-based logging
- [ ] Keep only error and warning logs in production
- [ ] Add logging level configuration
- [ ] Clean console in production mode

## Technical Requirements
1. Audit all console.log usage
2. Replace with logger utility
3. Add LOG_LEVEL environment variable
4. Configure production logging
5. Test in production mode

## Timeline
**Estimate:** 2-4 hours  
**Deadline:** Before beta launch (tomorrow)

## Related Issues
- Part of Bundle 1: Critical Pre-Launch Fixes
- Blocks beta launch

## Testing
- [ ] Verify clean console in production
- [ ] Test error logging still works
- [ ] Verify development logging works
- [ ] Check all pages for console output"

echo "✅ Created 2 critical issues"
echo ""

# Bundle 2: FTUE & Onboarding (P1)
echo "📦 Bundle 2: FTUE & Onboarding (P1)"
echo "===================================="

gh issue create \
  --title "[P1][FTUE] Implement Guided Onboarding Wizard" \
  --label "P1-high,enhancement,ftue,frontend,user-retention,beta-testing" \
  --body "## Problem
No guided onboarding flow for new users, leading to confusion and poor activation rates.

## Evidence
**User Quotes:**
- \"I had no idea where to start\" - Profile 2 (Multi-Gen Family)
- \"Would be nice to have a quick tour\" - Profile 6 (Retired Couple)
- \"Felt lost at first\" - Profile 5 (Single Parent)

**Impact:** All beta testing profiles reported onboarding confusion

## User Impact
**Severity:** High  
**Impact:** First-time user experience, activation rate, user retention

## Requirements
- [ ] Welcome wizard (3-5 steps)
- [ ] Feature highlights with screenshots
- [ ] Quick setup guide
- [ ] Optional skip for power users
- [ ] Progress indicators
- [ ] Personalization questions (dietary needs, household size)
- [ ] Sample data option

## User Flow
1. Welcome screen with value proposition
2. Account setup (already done)
3. Add family members (optional)
4. Set dietary preferences
5. Choose recipe interests
6. Quick tour of main features
7. \"Create your first meal plan\" CTA

## Acceptance Criteria
- [ ] Wizard completes in < 5 minutes
- [ ] Can skip at any step
- [ ] Progress saved between steps
- [ ] Mobile-responsive design
- [ ] Accessible (keyboard navigation)
- [ ] Analytics tracking for completion rate

## Timeline
**Estimate:** 1 week  
**Priority:** High - Critical for user retention

## Related Issues
- Part of Bundle 2: FTUE & Onboarding
- Supports rapid time-to-value goal

## Success Metrics
- 90%+ users complete onboarding
- < 5 minutes average completion time
- Improved activation rate"

gh issue create \
  --title "[P1][FTUE] Add Recipe Discovery on Empty State" \
  --label "P1-high,enhancement,ftue,frontend,quick-win,beta-testing" \
  --body "## Problem
Empty recipe page shows only a search box - users want inspiration, not a blank search field.

## Evidence
**User Quotes:**
- \"I don't know what to search for\" - Profile 5
- \"Show me trending recipes\" - Profile 1
- \"Need meal ideas, not a search box\" - Profile 3

**Impact:** 7 out of 10 beta profiles reported this issue

## User Impact
**Severity:** High  
**Impact:** User engagement, time-to-value, recipe adoption

## Requirements
- [ ] Trending/popular recipes section
- [ ] \"Quick Start\" recipe collections
- [ ] Seasonal suggestions
- [ ] Dietary preference-based recommendations
- [ ] Visual recipe cards on empty state
- [ ] \"Browse All\" CTA
- [ ] Personalized suggestions based on profile

## Design Mockup Needed
- Hero section with featured recipes
- Category cards (Quick Dinners, Healthy, Budget-Friendly)
- Trending recipes carousel
- Search bar remains but not primary focus

## Acceptance Criteria
- [ ] Empty state shows 12+ recipe suggestions
- [ ] Recipes load in < 2 seconds
- [ ] Mobile-responsive layout
- [ ] Click to view recipe details
- [ ] \"Add to My Recipes\" quick action
- [ ] Analytics tracking for engagement

## Timeline
**Estimate:** 2-3 days  
**Priority:** High - Quick win for time-to-value

## Related Issues
- Part of Bundle 2: FTUE & Onboarding
- Quick win for user engagement

## Success Metrics
- 80%+ users click on suggested recipes
- Reduced time to first recipe added
- Improved recipe discovery rate"

echo "✅ Created 2 FTUE issues"
echo ""

# Bundle 3: Core Collaboration Features (P1)
echo "📦 Bundle 3: Core Collaboration Features (P1)"
echo "=============================================="

gh issue create \
  --title "[P1][COLLAB] Implement Real-Time Collaboration with WebSockets" \
  --label "P1-high,enhancement,collaboration,fullstack,user-retention,beta-testing" \
  --body "## Problem
Changes don't sync in real-time between family members, causing confusion and coordination issues.

## Evidence
**User Quotes:**
- \"My partner can't see my updates until refresh\" - Profile 1
- \"Need instant sync for grocery shopping\" - Profile 4
- \"Causes confusion when planning together\" - Profile 7

**Impact:** 5 out of 10 profiles identified this as critical

## User Impact
**Severity:** High  
**Impact:** Core value proposition, household coordination, user retention

## Requirements
### Backend
- [ ] WebSocket server setup (Socket.io or native)
- [ ] Authentication for WebSocket connections
- [ ] Room-based channels (per household)
- [ ] Event broadcasting (meal plan updates, grocery list changes)
- [ ] Conflict resolution strategy
- [ ] Offline queue with sync on reconnect

### Frontend
- [ ] WebSocket client integration
- [ ] Real-time state updates
- [ ] Live cursor/presence indicators
- [ ] Visual feedback for updates (toast notifications)
- [ ] Optimistic UI updates
- [ ] Reconnection handling
- [ ] Offline mode support

## Technical Architecture
1. **WebSocket Events:**
   - \`meal_plan:updated\`
   - \`grocery_list:item_added\`
   - \`grocery_list:item_checked\`
   - \`recipe:created\`
   - \`user:presence\`

2. **Conflict Resolution:**
   - Last-write-wins for simple updates
   - Operational transformation for complex edits
   - Version tracking

3. **Performance:**
   - Debounce rapid updates
   - Batch similar events
   - Efficient state diffing

## Acceptance Criteria
- [ ] Changes appear within 1 second for all users
- [ ] Presence indicators show active users
- [ ] Conflicts resolved gracefully
- [ ] Works offline with sync on reconnect
- [ ] No data loss during disconnections
- [ ] Scalable to 10+ concurrent users per household

## Timeline
**Estimate:** 2 weeks  
**Priority:** High - Core feature for user retention

## Related Issues
- Part of Bundle 3: Core Collaboration Features
- Enables household coordination

## Success Metrics
- < 1 second sync latency
- 99.9% message delivery rate
- Zero data conflicts
- 50%+ households use collaboration features"

gh issue create \
  --title "[P1][GROCERY] Organize Grocery List by Store Aisle/Category" \
  --label "P1-high,enhancement,collaboration,frontend,quick-win,beta-testing" \
  --body "## Problem
Grocery list not organized by store aisle/category, forcing users to walk back and forth in the store.

## Evidence
**User Quotes:**
- \"I have to walk back and forth in the store\" - Profile 3
- \"Should group by produce, dairy, etc.\" - Profile 2
- \"Wastes so much time shopping\" - Profile 5

**Impact:** 6 out of 10 profiles reported this issue

## User Impact
**Severity:** High  
**Impact:** Shopping efficiency, user satisfaction, time savings

## Requirements
- [ ] Auto-categorization by aisle/category
- [ ] Default categories: Produce, Dairy, Meat, Bakery, Pantry, Frozen, Other
- [ ] Customizable store layouts
- [ ] Drag-and-drop reordering
- [ ] Check-off persistence
- [ ] Smart grouping algorithm
- [ ] Category icons for visual scanning

## Categories
1. **Produce** 🥬 - Fruits, vegetables
2. **Dairy** 🥛 - Milk, cheese, yogurt
3. **Meat & Seafood** 🥩 - Proteins
4. **Bakery** 🍞 - Bread, baked goods
5. **Pantry** 🥫 - Canned goods, dry goods
6. **Frozen** ❄️ - Frozen foods
7. **Beverages** 🥤 - Drinks
8. **Snacks** 🍿 - Chips, cookies
9. **Other** 📦 - Miscellaneous

## Acceptance Criteria
- [ ] Items auto-categorized on add
- [ ] Categories collapsible/expandable
- [ ] Drag items between categories
- [ ] Reorder categories
- [ ] Save custom store layout
- [ ] Mobile-optimized for in-store use
- [ ] Offline support

## Timeline
**Estimate:** 3-4 days  
**Priority:** High - Quick win for user satisfaction

## Related Issues
- Part of Bundle 3: Core Collaboration Features
- Quick win for shopping efficiency

## Success Metrics
- 90%+ items correctly categorized
- 50%+ users customize categories
- Reduced shopping time (user feedback)"

gh issue create \
  --title "[P1][MEAL] Add Meal Prep & Batch Cooking Support" \
  --label "P1-high,enhancement,collaboration,frontend,user-retention,beta-testing" \
  --body "## Problem
Can't duplicate meals or plan for batch cooking, forcing users to manually recreate meals.

## Evidence
**User Quotes:**
- \"I meal prep on Sundays for the week\" - Profile 8
- \"Need to copy Monday's lunch to other days\" - Profile 3
- \"Batch cooking is how we save time\" - Profile 1

**Impact:** 4 out of 10 profiles identified this as important

## User Impact
**Severity:** High  
**Impact:** Time efficiency, user workflow, meal prep users

## Requirements
- [ ] Duplicate meal to multiple days
- [ ] Batch cooking mode/view
- [ ] Leftover tracking
- [ ] Meal prep calendar view
- [ ] Portion multiplication
- [ ] \"Copy to next week\" action
- [ ] Bulk meal assignment

## User Flows
### 1. Duplicate Meal
- Right-click meal → \"Duplicate to...\"
- Select target days (multi-select)
- Confirm and duplicate

### 2. Batch Cooking Mode
- Toggle \"Batch Cooking View\"
- See all meals for the week
- Multiply portions for batch cooking
- Track leftovers across days

### 3. Leftover Tracking
- Mark meal as \"Leftovers from [Day]\"
- Link to original meal
- Adjust portions automatically

## Acceptance Criteria
- [ ] Duplicate meal to multiple days in < 3 clicks
- [ ] Batch cooking view shows all meals
- [ ] Portion multiplication works correctly
- [ ] Leftover tracking links meals
- [ ] Mobile-responsive
- [ ] Undo/redo support

## Timeline
**Estimate:** 1 week  
**Priority:** High - Important for meal prep users

## Related Issues
- Part of Bundle 3: Core Collaboration Features
- Supports time efficiency goal

## Success Metrics
- 40%+ users use duplicate feature
- 20%+ users use batch cooking mode
- Positive feedback from meal prep users"

echo "✅ Created 3 collaboration issues"
echo ""

# Bundle 4: User Experience Improvements (P2)
echo "📦 Bundle 4: User Experience Improvements (P2)"
echo "==============================================="

gh issue create \
  --title "[P2][UX] Improve Error Messages with Actionable Details" \
  --label "P2-medium,enhancement,frontend,quick-win" \
  --body "## Problem
Generic error messages don't help users understand what went wrong or how to recover.

## Evidence
**Impact:** All beta testing profiles reported confusing error messages

## User Impact
**Severity:** Medium  
**Impact:** User frustration, support burden, trust

## Requirements
- [ ] Specific error descriptions
- [ ] Actionable recovery steps
- [ ] Contextual help links
- [ ] Error categorization (network, validation, server, etc.)
- [ ] User-friendly language (no technical jargon)
- [ ] Error codes for support reference
- [ ] Retry mechanisms where appropriate

## Examples
### Before
❌ \"An error occurred\"

### After
✅ \"Unable to save recipe. Please check your internet connection and try again. [Retry]\"

### Before
❌ \"Failed to load\"

### After
✅ \"Recipe not found. It may have been deleted. [Browse Recipes]\"

## Error Categories
1. **Network Errors** - Connection issues, timeouts
2. **Validation Errors** - Form validation, data format
3. **Server Errors** - 500 errors, API failures
4. **Not Found** - 404 errors, missing resources
5. **Permission Errors** - 403 errors, unauthorized

## Acceptance Criteria
- [ ] All errors have specific messages
- [ ] Recovery actions provided
- [ ] Help links where appropriate
- [ ] Error tracking/logging
- [ ] User-friendly language
- [ ] Mobile-responsive error displays

## Timeline
**Estimate:** 1-2 days  
**Priority:** Medium - Quick win for UX

## Related Issues
- Part of Bundle 4: UX Improvements
- Quick win for user satisfaction

## Success Metrics
- Reduced support tickets
- Improved error recovery rate
- Positive user feedback"

gh issue create \
  --title "[P2][UX] Add Cost Tracking for Budget-Conscious Users" \
  --label "P2-medium,enhancement,fullstack" \
  --body "## Problem
No way to track meal costs or grocery budgets, critical for budget-conscious users.

## Evidence
**User Quotes:**
- \"Need to know if I'm staying in budget\" - Profile 5
- \"Would love cost per serving\" - Profile 4
- \"Budget tracking is essential for us\" - Profile 10

**Impact:** 3 out of 10 profiles (budget-conscious) identified this as critical

## User Impact
**Severity:** Medium  
**Impact:** Budget-conscious users, value proposition, competitive advantage

## Requirements
### Backend
- [ ] Ingredient cost database
- [ ] Cost calculation API
- [ ] Budget tracking storage
- [ ] Cost history/trends

### Frontend
- [ ] Meal cost calculation
- [ ] Budget tracking dashboard
- [ ] Cost per serving display
- [ ] Weekly/monthly budget reports
- [ ] Budget alerts/warnings
- [ ] Cost comparison (recipes)

## Features
1. **Ingredient Costs**
   - Default cost database
   - User-customizable prices
   - Store-specific pricing
   - Unit cost calculations

2. **Meal Costs**
   - Automatic calculation from ingredients
   - Cost per serving
   - Total meal cost
   - Cost breakdown

3. **Budget Tracking**
   - Set weekly/monthly budget
   - Track spending
   - Budget alerts
   - Spending trends

4. **Reports**
   - Weekly spending summary
   - Most expensive meals
   - Budget-friendly suggestions
   - Cost savings insights

## Acceptance Criteria
- [ ] Ingredient costs stored and editable
- [ ] Meal costs calculated automatically
- [ ] Budget tracking functional
- [ ] Reports generated correctly
- [ ] Mobile-responsive
- [ ] Privacy-conscious (optional feature)

## Timeline
**Estimate:** 1 week  
**Priority:** Medium - Important for target users

## Related Issues
- Part of Bundle 4: UX Improvements
- Competitive advantage

## Success Metrics
- 60%+ budget-conscious users enable feature
- Positive feedback on cost accuracy
- Increased user retention"

gh issue create \
  --title "[P2][UX] Enhance Dietary Restriction Support & Safety" \
  --label "P2-medium,enhancement,fullstack,safety" \
  --body "## Problem
Dietary restrictions not prominently displayed or enforced, raising safety concerns.

## Evidence
**User Quotes:**
- \"Worried about nut allergy for my child\" - Profile 2
- \"Need halal filtering\" - Profile 10
- \"Dairy allergy warnings not clear\" - Profile 7

**Impact:** 3 out of 10 profiles with dietary restrictions reported concerns

## User Impact
**Severity:** Medium (Safety-related)  
**Impact:** Safety, inclusivity, user trust, legal liability

## Requirements
### Safety Features
- [ ] Prominent allergy warnings on recipes
- [ ] Dietary filter enforcement (can't disable)
- [ ] Ingredient substitution suggestions
- [ ] Cross-contamination warnings
- [ ] \"Contains\" labels (nuts, dairy, gluten, etc.)

### Dietary Support
- [ ] Allergies (nuts, dairy, eggs, shellfish, soy, wheat, fish)
- [ ] Intolerances (lactose, gluten)
- [ ] Religious (halal, kosher, vegetarian, vegan)
- [ ] Health (low-sodium, diabetic-friendly, heart-healthy)
- [ ] Lifestyle (keto, paleo, whole30)

### UI/UX
- [ ] Dietary profile setup during onboarding
- [ ] Warning badges on recipe cards
- [ ] Filter recipes by dietary needs
- [ ] Substitution suggestions
- [ ] \"Safe for [Person]\" indicators

## Acceptance Criteria
- [ ] Dietary restrictions set during onboarding
- [ ] Warnings displayed prominently
- [ ] Filters enforce restrictions
- [ ] Substitutions suggested
- [ ] Mobile-responsive
- [ ] Accessible (screen readers)

## Timeline
**Estimate:** 1.5 weeks  
**Priority:** Medium - Safety and inclusivity

## Related Issues
- Part of Bundle 4: UX Improvements
- Safety-critical feature

## Success Metrics
- 100% dietary warnings displayed
- Zero safety incidents
- Positive feedback from users with restrictions"

gh issue create \
  --title "[P2][UX] Integrate Pantry with Meal Planning" \
  --label "P2-medium,enhancement,fullstack" \
  --body "## Problem
Pantry inventory not considered when planning meals, missing opportunity for waste reduction.

## Evidence
**User Quotes:**
- \"Should suggest recipes using what I have\" - Profile 1
- \"Pantry feels disconnected from planning\" - Profile 3
- \"Want to use up ingredients before they expire\" - Profile 4

**Impact:** 5 out of 10 profiles wanted pantry integration

## User Impact
**Severity:** Medium  
**Impact:** Waste reduction, cost savings, user satisfaction

## Requirements
- [ ] \"Use what you have\" recipe suggestions
- [ ] Expiration date tracking
- [ ] Pantry-based meal recommendations
- [ ] Ingredient substitution
- [ ] Waste reduction insights
- [ ] \"Expiring soon\" alerts
- [ ] Recipe matching algorithm

## Features
1. **Smart Suggestions**
   - Recipes using pantry ingredients
   - \"Use up\" recommendations
   - Expiring ingredient alerts

2. **Meal Planning Integration**
   - Show pantry items when planning
   - Highlight recipes using pantry
   - Reduce grocery list based on pantry

3. **Waste Reduction**
   - Track ingredient usage
   - Expiration warnings
   - Usage statistics
   - Waste reduction tips

## Acceptance Criteria
- [ ] Recipe suggestions based on pantry
- [ ] Expiration tracking functional
- [ ] Meal planning shows pantry items
- [ ] Grocery list reduced by pantry
- [ ] Mobile-responsive
- [ ] Analytics for waste reduction

## Timeline
**Estimate:** 1.5 weeks  
**Priority:** Medium - Value-added feature

## Related Issues
- Part of Bundle 4: UX Improvements
- Sustainability feature

## Success Metrics
- 40%+ users enable pantry integration
- Reduced grocery list items
- Positive feedback on waste reduction"

gh issue create \
  --title "[P2][MOBILE] Optimize Mobile Experience for Key Workflows" \
  --label "P2-medium,enhancement,frontend" \
  --body "## Problem
Mobile experience not optimized for key workflows, impacting mobile-first users.

## Evidence
**Impact:** 3 out of 10 profiles (mobile-first) reported mobile issues

## User Impact
**Severity:** Medium  
**Impact:** Mobile-first users, on-the-go usage, accessibility

## Requirements
- [ ] Swipe gestures for navigation
- [ ] Thumb-friendly UI elements
- [ ] Offline mode improvements
- [ ] Mobile-optimized forms
- [ ] Quick actions (add to list, check off)
- [ ] Bottom navigation for key actions
- [ ] Pull-to-refresh
- [ ] Haptic feedback

## Key Workflows to Optimize
1. **Grocery Shopping**
   - Large check-off buttons
   - Swipe to check off
   - Voice input for adding items
   - Offline support

2. **Recipe Browsing**
   - Swipe between recipes
   - Quick save action
   - Image-focused layout
   - Fast loading

3. **Meal Planning**
   - Drag-and-drop on mobile
   - Quick meal assignment
   - Calendar swipe navigation
   - Compact view

## Acceptance Criteria
- [ ] All key workflows mobile-optimized
- [ ] Touch targets ≥ 44x44px
- [ ] Swipe gestures implemented
- [ ] Offline mode functional
- [ ] Fast loading (< 3s)
- [ ] Tested on iOS and Android

## Timeline
**Estimate:** 1 week  
**Priority:** Medium - Important for mobile users

## Related Issues
- Part of Bundle 4: UX Improvements
- Mobile-first optimization

## Success Metrics
- 80%+ mobile user satisfaction
- Reduced mobile bounce rate
- Improved mobile engagement"

gh issue create \
  --title "[P2][SEARCH] Improve Recipe Search & Discovery" \
  --label "P2-medium,enhancement,fullstack" \
  --body "## Problem
Search doesn't understand natural language or context, limiting recipe discovery.

## Evidence
**User Quotes:**
- \"Search for 'quick dinner' returns nothing useful\" - Profile 3
- \"Can't search by ingredients I have\" - Profile 5
- \"Need better filters\" - Profile 8

**Impact:** 5 out of 10 profiles reported search issues

## User Impact
**Severity:** Medium  
**Impact:** User engagement, recipe adoption, satisfaction

## Requirements
### Search Improvements
- [ ] Natural language search
- [ ] Ingredient-based search
- [ ] Smart filters (time, difficulty, equipment)
- [ ] Search suggestions
- [ ] Recent searches
- [ ] Typo tolerance
- [ ] Synonym support

### Search Features
1. **Natural Language**
   - \"quick dinner for two\"
   - \"healthy breakfast under 30 minutes\"
   - \"vegetarian pasta\"

2. **Ingredient Search**
   - \"recipes with chicken and rice\"
   - \"what can I make with tomatoes\"
   - \"use up leftover pasta\"

3. **Smart Filters**
   - Time (< 30 min, 30-60 min, > 60 min)
   - Difficulty (easy, medium, hard)
   - Equipment (slow cooker, instant pot, etc.)
   - Servings
   - Cuisine

4. **Search Suggestions**
   - Autocomplete
   - Popular searches
   - Trending recipes
   - Personalized suggestions

## Acceptance Criteria
- [ ] Natural language search works
- [ ] Ingredient search functional
- [ ] Filters applied correctly
- [ ] Search suggestions helpful
- [ ] Fast results (< 1s)
- [ ] Mobile-responsive

## Timeline
**Estimate:** 1 week  
**Priority:** Medium - Important for discovery

## Related Issues
- Part of Bundle 4: UX Improvements
- Recipe discovery enhancement

## Success Metrics
- 80%+ search success rate
- Reduced \"no results\" searches
- Improved recipe discovery"

echo "✅ Created 6 UX improvement issues"
echo ""

# Bundle 5: Accessibility & Performance (P2)
echo "📦 Bundle 5: Accessibility & Performance (P2)"
echo "=============================================="

gh issue create \
  --title "[P2][A11Y] Implement Full Keyboard Navigation" \
  --label "P2-medium,accessibility,frontend" \
  --body "## Problem
Not all interactive elements are keyboard accessible, limiting accessibility.

## Evidence
**Source:** Design Evaluation  
**Impact:** Keyboard users, accessibility compliance

## User Impact
**Severity:** Medium  
**Impact:** Accessibility compliance, keyboard users, WCAG 2.1 AA

## Requirements
- [ ] Full keyboard navigation
- [ ] Visible focus indicators
- [ ] Skip navigation links
- [ ] Keyboard shortcuts
- [ ] Tab order optimization
- [ ] Focus management
- [ ] Escape key handling

## Keyboard Shortcuts
- \`Tab\` - Next element
- \`Shift+Tab\` - Previous element
- \`Enter\` - Activate
- \`Space\` - Toggle/Select
- \`Escape\` - Close/Cancel
- \`Arrow keys\` - Navigate lists
- \`/\` - Focus search

## Acceptance Criteria
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] Tab order logical
- [ ] Keyboard shortcuts documented
- [ ] Skip links functional
- [ ] WCAG 2.1 AA compliant

## Timeline
**Estimate:** 3-4 days  
**Priority:** Medium - Accessibility compliance

## Related Issues
- Part of Bundle 5: Accessibility & Performance
- WCAG compliance

## Success Metrics
- 100% keyboard accessibility
- Pass automated accessibility audit
- Positive feedback from keyboard users"

gh issue create \
  --title "[P2][A11Y] Add ARIA Labels and Semantic HTML" \
  --label "P2-medium,accessibility,frontend" \
  --body "## Problem
Icon-only buttons lack ARIA labels, limiting screen reader accessibility.

## Evidence
**Source:** Design Evaluation  
**Impact:** Screen reader users

## User Impact
**Severity:** Medium  
**Impact:** Screen reader users, accessibility compliance

## Requirements
- [ ] ARIA labels for all icons
- [ ] Descriptive alt text for images
- [ ] Semantic HTML elements
- [ ] ARIA live regions
- [ ] Role attributes
- [ ] ARIA expanded/collapsed states
- [ ] ARIA selected states

## Elements to Fix
1. **Icon Buttons**
   - Add aria-label
   - Add title attribute
   - Ensure button role

2. **Images**
   - Descriptive alt text
   - Empty alt for decorative images
   - Figure/figcaption for complex images

3. **Forms**
   - Label associations
   - Error announcements
   - Required field indicators
   - Help text associations

4. **Navigation**
   - Landmark roles
   - Current page indicator
   - Breadcrumb navigation

## Acceptance Criteria
- [ ] All icons have ARIA labels
- [ ] All images have alt text
- [ ] Semantic HTML used
- [ ] ARIA live regions functional
- [ ] Screen reader tested
- [ ] WCAG 2.1 AA compliant

## Timeline
**Estimate:** 3-4 days  
**Priority:** Medium - Accessibility compliance

## Related Issues
- Part of Bundle 5: Accessibility & Performance
- Screen reader support

## Success Metrics
- 100% ARIA coverage
- Pass screen reader testing
- WCAG 2.1 AA compliance"

gh issue create \
  --title "[P2][A11Y] Verify Color Contrast and WCAG Compliance" \
  --label "P2-medium,accessibility,frontend" \
  --body "## Problem
Need to verify WCAG 2.1 AA color contrast compliance.

## Evidence
**Source:** Design Evaluation  
**Impact:** Visual impairment, WCAG compliance

## User Impact
**Severity:** Medium  
**Impact:** Visual impairment, color blindness, WCAG compliance

## Requirements
- [ ] Run Lighthouse accessibility audit
- [ ] Fix contrast ratio issues
- [ ] Test with color blindness simulators
- [ ] Ensure text readability
- [ ] Provide high-contrast mode (optional)
- [ ] Test with various zoom levels

## WCAG 2.1 AA Requirements
- **Normal text:** 4.5:1 contrast ratio
- **Large text:** 3:1 contrast ratio
- **UI components:** 3:1 contrast ratio
- **Focus indicators:** 3:1 contrast ratio

## Testing Tools
- Lighthouse
- axe DevTools
- WAVE
- Color contrast analyzer
- Color blindness simulators

## Acceptance Criteria
- [ ] All text meets contrast requirements
- [ ] UI components meet contrast requirements
- [ ] Pass Lighthouse audit
- [ ] Pass axe audit
- [ ] Tested with color blindness simulators
- [ ] WCAG 2.1 AA compliant

## Timeline
**Estimate:** 2-3 days  
**Priority:** Medium - Accessibility compliance

## Related Issues
- Part of Bundle 5: Accessibility & Performance
- WCAG compliance

## Success Metrics
- 100% WCAG 2.1 AA compliance
- Pass all accessibility audits
- Positive feedback from users with visual impairments"

gh issue create \
  --title "[P2][PERF] Optimize Initial Page Load Performance" \
  --label "P2-medium,performance,frontend" \
  --body "## Problem
Initial page load takes 3-5 seconds on slow connections, impacting first impression.

## Evidence
**User Quotes:**
- Profiles 2, 6, 10 reported slow loading on mobile

## User Impact
**Severity:** Medium  
**Impact:** First impression, mobile users, bounce rate

## Requirements
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Image optimization
- [ ] Bundle size reduction
- [ ] Progressive loading
- [ ] Critical CSS inlining
- [ ] Preload key resources

## Optimization Strategies
1. **Code Splitting**
   - Route-based splitting
   - Component lazy loading
   - Vendor bundle optimization

2. **Image Optimization**
   - WebP format
   - Responsive images
   - Lazy loading
   - Progressive JPEGs

3. **Bundle Optimization**
   - Tree shaking
   - Minification
   - Compression (gzip/brotli)
   - Remove unused dependencies

4. **Loading Strategy**
   - Critical path optimization
   - Defer non-critical JS
   - Preload fonts
   - Resource hints

## Performance Targets
- **First Contentful Paint:** < 1.5s
- **Largest Contentful Paint:** < 2.5s
- **Time to Interactive:** < 3.5s
- **Total Bundle Size:** < 500KB (gzipped)

## Acceptance Criteria
- [ ] Initial load < 3s on 3G
- [ ] Bundle size reduced by 30%
- [ ] Code splitting implemented
- [ ] Images optimized
- [ ] Pass Lighthouse performance audit (90+)

## Timeline
**Estimate:** 1 week  
**Priority:** Medium - Performance optimization

## Related Issues
- Part of Bundle 5: Accessibility & Performance
- First impression optimization

## Success Metrics
- < 3s initial load on 3G
- 90+ Lighthouse performance score
- Reduced bounce rate"

gh issue create \
  --title "[P2][PERF] Optimize Image Loading and Caching" \
  --label "P2-medium,performance,frontend" \
  --body "## Problem
Images not optimized for web, causing slow loading and bandwidth waste.

## Evidence
**Source:** Design Evaluation  
**Impact:** Visual experience, bandwidth, mobile users

## User Impact
**Severity:** Medium  
**Impact:** Visual experience, bandwidth, mobile data usage

## Requirements
- [ ] WebP format support
- [ ] Responsive images (srcset)
- [ ] Lazy loading
- [ ] Progressive JPEGs
- [ ] CDN integration
- [ ] Image compression
- [ ] Placeholder images

## Optimization Strategies
1. **Format Optimization**
   - Convert to WebP
   - Fallback to JPEG/PNG
   - Progressive rendering

2. **Responsive Images**
   - Multiple sizes
   - srcset/sizes attributes
   - Art direction

3. **Loading Strategy**
   - Lazy loading
   - Intersection Observer
   - Placeholder images
   - Blur-up technique

4. **Caching**
   - Browser caching
   - Service worker caching
   - CDN caching
   - Cache invalidation

## Acceptance Criteria
- [ ] WebP format supported
- [ ] Responsive images implemented
- [ ] Lazy loading functional
- [ ] CDN integrated
- [ ] Images compressed
- [ ] Pass Lighthouse image audit

## Timeline
**Estimate:** 4-5 days  
**Priority:** Medium - Performance optimization

## Related Issues
- Part of Bundle 5: Accessibility & Performance
- Image performance

## Success Metrics
- 50% reduction in image size
- Faster image loading
- Improved Lighthouse score"

echo "✅ Created 5 accessibility & performance issues"
echo ""

# Summary
echo ""
echo "📊 Summary"
echo "=========="
echo "✅ Created 18 GitHub issues across 5 bundles"
echo ""
echo "Bundle 1: Critical Pre-Launch Fixes (P0) - 2 issues"
echo "Bundle 2: FTUE & Onboarding (P1) - 2 issues"
echo "Bundle 3: Core Collaboration Features (P1) - 3 issues"
echo "Bundle 4: User Experience Improvements (P2) - 6 issues"
echo "Bundle 5: Accessibility & Performance (P2) - 5 issues"
echo ""
echo "🎯 Next Steps:"
echo "1. Review issues on GitHub"
echo "2. Assign to team members"
echo "3. Start with Bundle 1 (Critical fixes)"
echo "4. Track progress in project board"
echo ""
echo "✨ Beta launch ready after Bundle 1 completion!"

# Made with Bob
