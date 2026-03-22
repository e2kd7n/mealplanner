# Issue Prioritization

**Last Updated:** 2026-03-22

This file defines which GitHub issues belong to each priority class. Update this file as priorities change.

## 🔴 P0 - CRITICAL (Drop Everything)
Issues that make the application unusable or cause data loss.

**Current Issues - v1.1 Architecture Migration (SEQUENCED):**

**Sequence 1: Phase 1 Implementation**
- #27 - Phase 1: Remove Redis and replace with node-cache

**Sequence 2: Phase 1 Validation**
- #30 - User Testing Cycle: Post-Phase 1 Architecture Changes

**Sequence 3: Phase 2 Implementation**
- #28 - Phase 2: Consolidate frontend into backend container

**Sequence 4: Phase 2 Validation**
- #31 - User Testing Cycle: Post-Phase 2 Architecture Changes

**Sequence 5: Phase 3 Implementation**
- #29 - Phase 3: Remove Nginx and use Node.js HTTPS module

**Sequence 6: Final Validation**
- #32 - User Testing Cycle: Post-Phase 3 Final Validation

**Dependencies:**
- Each phase must complete successfully before next phase begins
- User testing must pass before proceeding to next implementation phase
- Any critical issues found during testing block progression

## 🔴 P1 - HIGH (Current Sprint)
Issues that significantly impact core functionality or user experience.

**Current Issues:**
- #1 - Multiple recipe websites failing to import
- #6 - Grocery list not populated from meal plan recipes

## 🟡 P2 - MEDIUM (Next Sprint)
Important improvements that enhance functionality but don't block core workflows.

**Current Issues:**
- #3 - HTML tags appearing in recipe descriptions
- #5 - No image upload/change capability when editing recipes

## 🟢 P3 - LOW (Backlog)
Nice-to-have improvements and minor UX enhancements.

**Current Issues:**
- #4 - No back button above the fold on Create Recipe page

## 📋 P4 - FUTURE ENHANCEMENTS (v1.1+)
Feature requests and enhancements for future releases.

**Architecture Evaluation (COMPLETE):**
- #26 - Evaluate architecture for small-scale deployment (4 users, Raspberry Pi) ✅ COMPLETE

**High Value Features:**
- #8 - Grocery List Optimization
- #12 - Integrate Nutrition Database for Auto-Population
- #13 - Implement Nutrition Dashboard
- #14 - Implement Nutrition Guideline Warnings

**Medium Value Features:**
- #9 - MyFitnessPal Integration
- #10 - AllRecipes.com Recipe Import Enhancement
- #11 - Recipe Card OCR Import
- #15 - Create System Architecture Documentation
- #16 - Fix Frontend Console Errors
- #17 - Add Sortable and Filterable Tables/Lists
- #18 - Implement Ingredient Normalization and Variant System
- #19 - Implement Grocery List Regeneration and Sync Detection
- #20 - Implement Pantry Integration with Grocery Lists
- #21 - Implement Recipe Scaling
- #22 - Implement Drag-and-Drop for Meal Planner
- #23 - Implement Meal Date Editing and Recurrence Patterns
- #24 - Implement Copy/Paste for Meal Planner
- #25 - Implement Dashboard Recent Activity Feed

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

1. Edit this file to move issues between priority levels
2. Update issue labels in GitHub to match
3. Commit changes with descriptive message
4. Communicate priority changes to team

## Sprint Planning

Use this file during sprint planning to:
1. Identify which issues to work on next
2. Balance bug fixes vs features
3. Ensure critical issues are addressed first
4. Plan realistic sprint goals