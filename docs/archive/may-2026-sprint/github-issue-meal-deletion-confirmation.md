## Issue Title
[P2] Meal Deletion - Missing Confirmation Dialog

## Labels
- P2-medium
- enhancement
- ux
- safety
- meal-planning

## Description

### Summary
Meals can be deleted from the meal planner with a single click without any confirmation dialog, creating a safety concern where users may accidentally delete meals.

### Impact
- **Severity:** Medium (P2)
- **User Impact:** Users may accidentally delete meals without warning
- **Workaround:** Be careful when clicking Delete button
- **Safety Concern:** No undo functionality available

### Current Behavior
1. User clicks on a meal in the calendar
2. Meal Details dialog opens
3. User clicks red "Delete" button
4. **Meal is immediately deleted** - no confirmation
5. Calendar updates, meal is gone permanently

### Expected Behavior
1. User clicks on a meal in the calendar
2. Meal Details dialog opens
3. User clicks red "Delete" button
4. **Confirmation dialog appears** asking "Are you sure?"
5. User confirms or cancels
6. If confirmed, meal is deleted
7. Calendar updates

### User Scenarios Affected
1. User accidentally clicks Delete instead of Edit
2. User clicks Delete to see what it does (exploratory behavior)
3. User's hand slips on mobile device
4. User wants to review meal details before confirming deletion
5. User clicks Delete by mistake while scrolling

### Technical Details
- **Component:** MealPlanner page, Meal Details dialog
- **Current Implementation:** Direct deletion on button click
- **Missing:** Confirmation dialog before destructive action

### Proposed Solution

Add confirmation dialog before meal deletion:

```typescript
const handleDelete = async () => {
  const confirmed = await showConfirmDialog({
    title: 'Delete Meal?',
    message: 'Are you sure you want to delete this meal from your plan?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    severity: 'warning'
  });
  
  if (confirmed) {
    // Proceed with deletion
    await deleteMeal(mealId);
    // Update calendar
    // Close dialog
  }
};
```

### Design Principles Alignment

**Current Issues:**
- ❌ **Error Prevention:** No safeguard against accidental deletion
- ⚠️ **User Control:** Users can delete but cannot undo

**After Fix:**
- ✅ **Error Prevention:** Confirmation prevents accidental deletion
- ✅ **User Control:** Users have chance to cancel
- ✅ **Consistency:** Matches industry standards

### Industry Standards Comparison

Most applications require confirmation for destructive actions:
- **Meal Planning Apps:** MyFitnessPal, Mealime, etc. all use confirmation
- **General Apps:** Gmail, Trello, Notion use confirmation dialogs
- **Platform Guidelines:** iOS/Android recommend confirmation for irreversible actions
- **Web Standards:** Destructive actions should have confirmation

### Environment
- **Test Date:** 2026-05-06
- **Test Account:** Smith Family (Quick Test Login)
- **URL:** http://localhost:5173/meal-planner

### Related Files
- `frontend/src/pages/MealPlanner.tsx`
- Meal Details dialog component
- Possibly shared confirmation dialog component

### Acceptance Criteria
- [ ] Clicking Delete button shows confirmation dialog
- [ ] Confirmation dialog has clear message
- [ ] Dialog has "Cancel" and "Delete" buttons
- [ ] Cancel button closes dialog without deleting
- [ ] Delete button (after confirmation) deletes the meal
- [ ] Dialog styling matches app design system
- [ ] Works on both desktop and mobile
- [ ] Keyboard accessible (Esc to cancel, Enter to confirm)

### Priority Justification
This is a P2 medium priority issue because:
1. Affects user safety and data integrity
2. Common UX pattern that users expect
3. No undo functionality available (makes this more critical)
4. Easy to implement with high user satisfaction impact
5. Doesn't block functionality but improves user confidence
6. Prevents accidental data loss

### Future Enhancements
Consider also implementing:
- Undo functionality for meal deletion
- Bulk delete with confirmation
- "Recently deleted" temporary storage
- Keyboard shortcut for delete with confirmation

### Related Issues
- Part of UAT findings documented in `docs/usertesting/COMPREHENSIVE_UAT_SUMMARY_REPORT.md`
- Related to overall UX consistency across the application

### Additional Notes
- This is a standard UX pattern for destructive actions
- Users expect confirmation before permanent deletion
- Especially important since there's no undo functionality
- Consider applying confirmation pattern to other destructive actions (recipe deletion, etc.)