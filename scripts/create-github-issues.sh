#!/bin/bash

# Script to create GitHub issues from feedback analysis
# Filters out test feedback and creates real issues

set -e

echo "Creating GitHub issues from feedback analysis..."
echo ""

# Issue 1: Critical - GroceryList React Hooks Error
echo "Creating Issue 1: Fix GroceryList React Hooks Error..."
gh issue create \
  --title "🐛 [P0] Fix React Hooks error in GroceryList component" \
  --label "bug,P0-critical,error-recovery,data-loss-prevention" \
  --body "## Problem
Users are experiencing a critical error when accessing the Grocery List page:

**Error:** \"Rendered more hooks than during the previous render\"

This error is caught by the ErrorBoundary and prevents users from accessing their grocery lists.

## User Impact
- **Severity:** Critical (P0)
- **Frequency:** Multiple reports (2 instances)
- **User Experience:** Complete page failure, users cannot access grocery lists

## Technical Details
**Component:** \`GroceryList\` (\`frontend/src/pages/GroceryList.tsx:99:30\`)

**Error Message:**
\`\`\`
Rendered more hooks than during the previous render.
\`\`\`

**Component Stack:**
\`\`\`
at GroceryList (http://localhost:5173/src/pages/GroceryList.tsx?t=1777170898882:99:30)
at RenderedRoute
at Outlet
...
\`\`\`

## Root Cause Analysis
This error typically occurs when:
1. Hooks are called conditionally
2. Hooks are called in loops
3. Hooks are called after early returns
4. Component state changes cause different hook execution paths

## Reproduction
1. Navigate to /grocery-list page
2. Error occurs on page load

## Acceptance Criteria
- [ ] Identify the conditional hook usage in GroceryList component
- [ ] Refactor to ensure hooks are called in consistent order
- [ ] Add tests to prevent regression
- [ ] Verify fix with users who reported the issue

## Related Feedback
- Feedback ID: 4fc45f28-d7f7-4dde-9250-05c3dc8d8ebb
- Feedback ID: c8791e56-8909-4375-9a3c-6456c6a1eef7
- User Rating: 1/5 (both reports)

## Priority Justification
P0 because this completely blocks a core feature (grocery list management) for all users."

echo "✓ Issue 1 created"
echo ""

# Issue 2: Recipe Import UX Improvements
echo "Creating Issue 2: Recipe Import UX Improvements..."
gh issue create \
  --title "💡 Improve Recipe Import/Create UX - Keep import button visible" \
  --label "enhancement,design,P2-medium" \
  --body "## User Feedback
**Source:** User question/feedback (Rating: 4/5)
**Page:** /recipes
**Date:** 2026-04-26

## Problem Statement
User reported confusion about the \"Import from URL\" button disappearing when clicking \"Browse Recipes\". This creates a poor user experience as users expect the import functionality to remain accessible.

## User Quote
> \"Why does the 'import from URL' button disappear when I click 'browse recipes'? Seems like it should stay there.\"

## Current Behavior
- Import from URL button is hidden when Browse Recipes is active
- Users must navigate away from Browse Recipes to import recipes

## Proposed Solution
1. Keep \"Import from URL\" button visible at all times
2. Consider making it a persistent action in the header or toolbar
3. Ensure it's accessible from all recipe-related views

## Additional Context
This is part of a broader UX improvement for recipe management. User also mentioned interest in:
- Photo capture for recipe cards (handwritten)
- PDF upload support

These could be separate feature requests.

## Acceptance Criteria
- [ ] Import from URL button remains visible when browsing recipes
- [ ] Button placement is intuitive and accessible
- [ ] No regression in existing import functionality
- [ ] User can import recipes from any recipe view

## Related Feedback
- Feedback ID: a1376c43-516b-4f36-8cf6-92d8579b7014"

echo "✓ Issue 2 created"
echo ""

# Issue 3: Recipe Photo/PDF Upload Feature
echo "Creating Issue 3: Recipe Photo/PDF Upload Feature..."
gh issue create \
  --title "✨ Add photo capture and PDF upload for recipe creation" \
  --label "enhancement,P3-low" \
  --body "## Feature Request
**Source:** User feedback (Rating: 4/5)
**Page:** /recipes
**Date:** 2026-04-26

## User Need
Users want to digitize physical recipe cards and documents by:
1. Taking photos of recipe cards (including handwritten ones)
2. Uploading PDF files containing recipes

## User Quote
> \"When I click 'create recipe' is there a way to just snap a photo of the recipe card, even if it's handwritten? It would be good to be able to upload a PDF also.\"

## Use Cases
1. **Photo Capture:**
   - User has physical recipe cards
   - User wants to preserve handwritten family recipes
   - Quick capture via mobile device camera

2. **PDF Upload:**
   - User has recipe PDFs from cookbooks or websites
   - User wants to import recipes from digital documents
   - Batch import multiple recipes

## Proposed Implementation

### Phase 1: Photo Upload
- [ ] Add camera/photo upload button to recipe creation
- [ ] Support image file uploads (JPG, PNG, HEIC)
- [ ] Store images with recipe
- [ ] Display uploaded images in recipe view

### Phase 2: OCR Integration (Optional)
- [ ] Integrate OCR service to extract text from images
- [ ] Parse ingredients and instructions
- [ ] Allow user to review and edit extracted data

### Phase 3: PDF Support
- [ ] Add PDF upload capability
- [ ] Extract text from PDFs
- [ ] Parse recipe structure
- [ ] Support multi-page PDFs

## Technical Considerations
- Image storage and optimization
- OCR service selection (Google Vision, Tesseract, AWS Textract)
- PDF parsing library
- Mobile camera access
- File size limits and validation

## Success Metrics
- Number of recipes created via photo/PDF
- User satisfaction with OCR accuracy
- Reduction in manual recipe entry time

## Related Feedback
- Feedback ID: a1376c43-516b-4f36-8cf6-92d8579b7014

## Priority
Medium - Nice to have feature that improves user experience but not blocking core functionality."

echo "✓ Issue 3 created"
echo ""

echo "=========================================="
echo "GitHub Issues Created Successfully!"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Issue 1: [P0] Fix GroceryList React Hooks Error (Critical Bug)"
echo "- Issue 2: Improve Recipe Import UX (Enhancement)"
echo "- Issue 3: Add Photo/PDF Upload for Recipes (Feature)"
echo ""
echo "Note: Test feedback entries were filtered out and not converted to issues."
echo ""

# Made with Bob
