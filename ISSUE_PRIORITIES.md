# Issue Prioritization

**Last Updated:** 2026-03-23

This file reflects the current state of GitHub issues by priority. Issues are managed via GitHub labels (P0-critical, P1-high, P2-medium, P3-low, P4-future).

## 🔴 P0 - CRITICAL (Drop Everything)
Issues that make the application unusable or cause data loss.

**No P0 issues currently open** ✅

## 🔴 P1 - HIGH (Current Sprint)
Issues that significantly impact core functionality or user experience.

- #3 - HTML tags appearing in recipe descriptions
- #6 - Grocery list not populated from meal plan recipes
- #5 - No image upload/change capability when editing recipes
- #4 - No back button above the fold on Create Recipe page
- #1 - Multiple recipe websites failing to import
- #32 - User Testing Cycle: Post-Phase 3 Final Validation
- #31 - User Testing Cycle: Post-Phase 2 Architecture Changes
- #44 - Add Performance Monitoring
- #43 - Implement Logging Aggregation
- #42 - Add Monitoring and Alerting
- #15 - Create System Architecture Documentation
- #39 - P2: Inconsistent Error Handling in Frontend
- #38 - P2: Missing Rate Limiting on Authentication Endpoints
- #37 - P2: No Environment Variable Validation on Startup


**No P1 issues currently open**

## 🟡 P2 - MEDIUM (Next Sprint)
Important improvements that enhance functionality but don't block core workflows.

- #47 - Add E2E Tests for Critical User Flows

## 🟢 P3 - LOW (Backlog)
Nice-to-have improvements and minor UX enhancements.

- #54 - Performance Optimization
- #45 - Achieve 70%+ Test Coverage
- #41 - P3: No Automated Testing
- #40 - P3: Documentation Out of Sync with Implementation

## 📋 P4 - FUTURE ENHANCEMENTS
Feature requests and enhancements for future releases.

- #46 - Implement CI/CD Pipeline
- #65 - Mobile App Development
- #63 - Evaluate Scaling Strategy
- #62 - Evaluate Architecture Simplification
- #25 - Implement Dashboard Recent Activity Feed
- #19 - Implement Grocery List Regeneration and Sync Detection
- #18 - Implement Ingredient Normalization and Variant System
- #17 - Add Sortable and Filterable Tables/Lists
- #64 - Implement Advanced Features (Nutrition Tracking, etc.)
- #14 - Implement Nutrition Guideline Warnings
- #13 - Implement Nutrition Dashboard
- #12 - Integrate Nutrition Database for Auto-Population
- #24 - Implement Copy/Paste for Meal Planner
- #22 - Implement Drag-and-Drop for Meal Planner
- #23 - Implement Meal Date Editing and Recurrence Patterns
- #21 - Implement Recipe Scaling
- #20 - Implement Pantry Integration with Grocery Lists

## ⚠️ Unprioritized Issues
Issues without priority labels that need to be triaged.

- #11 - Recipe Card OCR Import
- #10 - AllRecipes.com Recipe Import Enhancement
- #9 - MyFitnessPal Integration
- #8 - Grocery List Optimization

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
