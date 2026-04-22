# Issue Prioritization

**Last Updated:** 2026-04-22 14:43:52 UTC / 2026-04-22 09:43:52 CDT

This file reflects the current state of GitHub issues by priority. Issues are managed via GitHub labels (P0-critical, P1-high, P2-medium, P3-low, P4-future).

## 🔴 P0 - CRITICAL (Drop Everything)
Issues that make the application unusable or cause data loss.

- #94 - family members in profile not showing in chef assignment dropdown when scheduling meal
- #93 - Add backend connection error banner for local development
- #92 - Improve Recipe Scraping and Database Connection Monitoring

## 🔴 P1 - HIGH (Current Sprint)
Issues that significantly impact core functionality or user experience.

- #114 - [P1][MEAL] Add Meal Prep & Batch Cooking Support
- #113 - [P1][GROCERY] Organize Grocery List by Store Aisle/Category
- #112 - [P1][COLLAB] Implement Real-Time Collaboration with WebSockets
- #111 - [P1][FTUE] Add Recipe Discovery on Empty State
- #110 - [P1][FTUE] Implement Guided Onboarding Wizard
- #107 - [P1][MEAL] Add Meal Prep & Batch Cooking Support
- #106 - [P1][GROCERY] Organize Grocery List by Store Aisle/Category
- #105 - [P1][COLLAB] Implement Real-Time Collaboration with WebSockets
- #104 - [P1][FTUE] Add Recipe Discovery on Empty State
- #103 - [P1][FTUE] Implement Guided Onboarding Wizard
- #100 - [P1][GROCERY] Organize Grocery List by Store Aisle/Category
- #99 - [P1][COLLAB] Implement Real-Time Collaboration with WebSockets
- #98 - [P1][FTUE] Add Recipe Discovery on Empty State
- #97 - [P1][FTUE] Implement Guided Onboarding Wizard

## 🟡 P2 - MEDIUM (Next Sprint)
Important improvements that enhance functionality but don't block core workflows.

- #125 - [P2][PERF] Optimize Image Loading and Caching
- #124 - [P2][PERF] Optimize Initial Page Load Performance
- #123 - [P2][A11Y] Verify Color Contrast and WCAG Compliance
- #122 - [P2][A11Y] Add ARIA Labels and Semantic HTML
- #121 - [P2][A11Y] Implement Full Keyboard Navigation
- #120 - [P2][SEARCH] Improve Recipe Search & Discovery
- #119 - [P2][MOBILE] Optimize Mobile Experience for Key Workflows
- #118 - [P2][UX] Integrate Pantry with Meal Planning
- #117 - [P2][UX] Enhance Dietary Restriction Support & Safety
- #116 - [P2][UX] Add Cost Tracking for Budget-Conscious Users
- #115 - [P2][UX] Improve Error Messages with Actionable Details
- #83 - [Testing] Add automated accessibility and performance tests
- #82 - [P2][Feature] Add automatic nutrition calculation from ingredients

## 🟢 P3 - LOW (Backlog)
Nice-to-have improvements and minor UX enhancements.

- #84 - [P3][Feature] Add recipe document upload (PDF, images, DOCX)
- #54 - Performance Optimization
- #46 - Implement CI/CD Pipeline
- #45 - Achieve 70%+ Test Coverage
- #43 - Implement Logging Aggregation
- #42 - Add Monitoring and Alerting
- #41 - No Automated Testing

## 📋 P4 - FUTURE ENHANCEMENTS
Feature requests and enhancements for future releases.

- #66 - Publish Meals to ICS Calendar feed
- #65 - Mobile App Development
- #64 - Implement Advanced Features (Nutrition Tracking, etc.)
- #63 - Evaluate Scaling Strategy
- #25 - Implement Dashboard Recent Activity Feed
- #20 - Implement Pantry Integration with Grocery Lists
- #19 - Implement Grocery List Regeneration and Sync Detection
- #18 - Implement Ingredient Normalization and Variant System

## ⚠️ Unprioritized Issues
Issues without priority labels that need to be triaged.

- #14 - Implement Nutrition Guideline Warnings
- #13 - Implement Nutrition Dashboard
- #12 - Integrate Nutrition Database for Auto-Population
- #11 - Recipe Card OCR Import
- #9 - MyFitnessPal Integration
- #8 - Grocery List Optimization

## 📝 Workspace TODOs & Tasks
Code comments and inline tasks found in the workspace that may need attention.

**No TODO/FIXME comments found in code** ✅

## Priority Guidelines

### P0 - CRITICAL
- Application is down or unusable
- Data loss or corruption
- Security vulnerabilities
- **Action:** Drop everything and fix immediately

### P1 - HIGH
- Core features broken or severely degraded
- Significant user pain points
- Blocks important workflows
- **Action:** Fix in current sprint (1-2 weeks)

### P2 - MEDIUM
- Feature improvements
- Moderate user pain points
- Quality of life enhancements
- **Action:** Plan for next sprint (2-4 weeks)

### P3 - LOW
- Minor UX improvements
- Edge cases
- Nice-to-have features
- **Action:** Backlog, address when time permits

### P4 - FUTURE
- New features
- Major enhancements
- Long-term improvements
- **Action:** Plan for future releases

## How to Update Priorities

1. Use GitHub labels to set priority (P0-critical, P1-high, P2-medium, P3-low, P4-future)
2. Run `./scripts/update-issue-priorities.sh` to regenerate this file
3. Commit changes with descriptive message
4. Communicate priority changes to team

## Managing Workspace TODOs

- Review code comments regularly and convert important ones to GitHub issues
- Use `TODO:` for tasks that should become issues
- Use `FIXME:` for bugs that need attention
- Use `HACK:` for temporary solutions that need proper fixes
- Use `NOTE:` for important information or context
