# Epic: Visual Refresh & Feature Discovery Overhaul

**Status:** Ready for GitHub  
**Priority:** P1-High  
**Labels:** `epic`, `design`, `ux`, `P1-high`, `visual-refresh`  
**Created:** 2026-05-15  
**Informed by:** Senior design review (2026-05-15), internal UX evaluation (2026-04-20, grade B-), external consultancy review (Jakob & Associates, 2026-04-21, grade C+)

---

## Prior Design Work — What Was Already Documented

This epic does not start from a blank slate. Three prior design reviews had already identified the core problems; they are resolved here. This section credits that work explicitly so child issues can reference documented findings rather than re-arguing them.

**`docs/DESIGN_PRINCIPLES.md` (v1.0, 2026-04-20)** established 20 design principles and flagged known violations against each. Violations directly addressed by this epic:
- Principle 2 (Progressive Disclosure): *"❌ Missing: Collapsible filters on browse recipes page"* → Child #6
- Principle 9 (Contextual Help): *"❌ Missing: Tooltips on icon buttons"* → Child #7
- Principle 12 (Task-Oriented Organization): *"❌ Grocery list generation is buried in meal plan"* → Child #4
- Principle 13 (Visual Hierarchy): Visual hierarchy gaps — addressed by Child #2 (color) and Child #3 (typography)
- Principle 14 (Aesthetic Integrity): *"Purposeful use of color"* — addressed by Child #2

**`docs/UX_EVALUATION_REPORT.md` (internal team, B-, 2026-04-20)** identified as high-priority issues:
- Progressive Disclosure score 3/5: *"Browse Recipes shows all filters at once (overwhelming)"* → Child #6
- Consistency: *"Confusing navigation between 'Search' and 'Browse' recipes"* → partially addressed in Child #6
- Missing bulk operations and efficiency features → not in scope of this epic (tracked separately)

**`docs/DESIGN_CONSULTANCY_REVIEW.md` (Jakob & Associates, C+, 2026-04-21)** flagged more severely:
- Information Architecture D grade: *"Grocery list generation buried 3 levels deep — users can't find core features"* → Child #4
- *"Navigation reflects how developers think about the system, not how users think about their tasks"* → Child #4, #6
- The consultancy recommended unifying the Recipes section with tabs (My Collection / Discover / Import) — partially achieved by the existing tab structure; Child #6 addresses the UX friction within it

**`docs/DESIGN_REVIEW_COMPARISON.md` (reconciliation, 2026-04-21)** resolved disagreements between the two reviews. Both teams agreed on: navigation confusion, visual hierarchy gaps, and accessibility. The comparison concluded: *"Proceed with phased improvements focusing on navigation consolidation, accessibility compliance, and workflow efficiency."* This epic is that phased improvement.

**`docs/DESIGN_EVALUATION_CHECKLIST.md` (beta launch review, 2026-04-22)** included unchecked items directly addressed here:
- *"Color palette matches brand guidelines"* → Child #2
- *"Typography is consistent across all pages"* → Child #3
- *"Content hierarchy is clear"* → Child #3
- *"Interactive elements have hover/focus states"* → Child #5 (nav badges), Child #4 (drag handle)

---

## Problem Statement

The application is functionally sound but suffers from two compounding problems: **aesthetic flatness** that makes it feel like an internal tool rather than a family product, and **poor feature discovery** that leaves significant capabilities invisible to users.

Specific failures:
- The dashboard shows zero live data — a placeholder "Recent Activity" box has sat empty since launch
- The color system has a semantic collision: `secondary`, `warning`, and `error` are all variants of the same red, training users to associate red with "danger" even on secondary action buttons (flagged in the beta launch checklist as unchecked)
- Five high-value features (grocery list auto-generation, drag-and-drop scheduling, batch cooking, pantry expiry alerts, `Import from URL`) are functionally invisible to new users (flagged by both prior reviews and Design Principle 12)
- Typography is a flat landscape of `fontWeight: 600` from h1 to h6 — no visual hierarchy exists above the size dimension (flagged in beta launch checklist)
- Navigation provides no ambient awareness of application state (no badges, no alerts)
- The app presents itself as "Meal Planner" — a description, not an identity

Both prior design reviews (internal B-, external C+) identified visual consistency and feature discoverability as blocking issues. The review reconciliation document recommended a phased improvement plan. This epic executes that plan.

---

## Goals

1. Transform the dashboard from a navigation hub into a live information hub
2. Fix the secondary/warning/error color collision
3. Surface five hidden features through contextual hints, badges, and meaningful CTAs
4. Establish a real typographic hierarchy in the theme
5. Give the application a distinct, family-oriented identity
6. Resolve open design debt documented in `docs/DESIGN_PRINCIPLES.md` (principles 2, 12, 13, 14)

## Non-Goals (Explicit Out of Scope)

- New backend features or API endpoints
- New user-facing functionality (all work surfaces *existing* features)
- Performance optimization (separate concern — see #54)
- E2E test coverage (separate concern — see #160)

---

## Issues Superseded / To Close

The following existing issues are fully absorbed by this epic. They should be closed with a reference to this epic when the relevant child issue is completed.

| Issue | Title | Disposition |
|-------|-------|-------------|
| **#25** | Implement Dashboard Recent Activity Feed | **Close — superseded by Child #1.** The dashboard redesign is a full replacement, not an additive feature. A feed alone doesn't solve the problem. |

The following backlog item in `UIUX_ENHANCEMENTS.md` (Smart Recipe Sorting by Meal Occasion, logged 2026-03-23) is absorbed into Child #6 (Recipe Filter Bar). It should be converted to a child issue under this epic rather than tracked separately.

---

## Related Issues (Remain Open — Link to This Epic)

These issues contribute context or overlap with child issues here but are not superseded. Link them to this epic and note the relationship.

| Issue | Title | Relationship |
|-------|-------|--------------|
| #118 | [P2][UX] Integrate Pantry with Meal Planning | Overlaps with Child #5 (Nav Badges). Nav badge work is a prerequisite for fuller pantry/meal-plan integration. |
| #169 | Improve Recipe Import/Create UX | Overlaps with Child #4 (Feature Discovery) and Child #6 (Filter Bar). Import discoverability is addressed here. |
| #179 | Search Inconsistency Between Recipe Tabs | Addressed partially in Child #6 (Filter Bar). Full search parity may need additional scope. |
| #8 | Grocery List Optimization | Child #4 (Feature Discovery) surfaces grocery generation. Deeper optimization remains in #8. |
| #19 | Implement Grocery List Regeneration and Sync Detection | Child #4 makes generation discoverable. Sync detection logic remains in #19. |
| #20 | Implement Pantry Integration with Grocery Lists | Child #5 (Nav Badges) creates ambient awareness. Full integration remains in #20. |
| #134 | Revisit user authentication workflow — FTUE and n-login experiences | Child #10 (Profile/Onboarding) addresses onboarding data persistence. Full FTUE workflow remains in #134. |
| #117 | [P2][UX] Enhance Dietary Restriction Support & Safety | Child #10 surfaces profile/dietary settings. Full dietary restriction logic remains in #117. |

---

## Child Issues

Create each of the following as individual GitHub issues, labelled `visual-refresh` and linked to this epic. Suggested priority labels are included.

---

### Child #1 — Dashboard Redesign: Live Information Hub
**Labels:** `P1-high`, `frontend`, `ux`, `visual-refresh`  
**Closes:** #25  
**Relates to:** docs/DESIGN_PRINCIPLES.md principle 12 (Task-Oriented Organization)

**Problem:** The dashboard shows 4 navigation cards and an empty "Recent Activity" placeholder. It answers no user question. Every morning a family member opens this app wanting to know: *What are we eating tonight? Is there anything I need to buy? Is anything about to expire?*

**Acceptance Criteria:**

- [ ] **Today's Meals section** — compact row showing Breakfast / Lunch / Dinner for today's date, pulled from the active meal plan. Shows "Not planned" with an inline add button for empty slots. Shows the assigned cook name if set.
- [ ] **This Week at a Glance** — 7-day strip with a filled/empty dot per day indicating whether a meal is planned. Tapping a day navigates to that day in the Meal Planner.
- [ ] **Grocery List status** — visible only when a grocery list is in `shopping` status. Shows "X of Y items remaining" as a progress bar + link to open the list. Hidden when no active list.
- [ ] **Pantry Alerts** — visible only when items are expiring within 3 days or any item is `lowStock`. Shows up to 3 alert lines with item name and status. Links to Pantry page. Hidden when pantry is healthy.
- [ ] **Replace "Go" buttons with meaningful CTAs** — "Browse Recipes", "Plan This Week", "View List", "Check Pantry" (also addresses Child #8 below, can be done here)
- [ ] Remove the "Recent Activity" Paper entirely
- [ ] All sections show a skeleton loader state, not a spinner
- [ ] All data fetched in parallel on mount; individual section errors do not crash the whole dashboard

**Notes:** Uses existing Redux slices (mealPlansSlice, groceryListsSlice, pantrySlice). No new API endpoints needed. Dashboard should read from store state populated by those slices — trigger fetches on mount if data is stale.

---

### Child #2 — Fix Color System: Secondary/Error/Warning Semantic Collision
**Labels:** `P1-high`, `frontend`, `theme`, `visual-refresh`  
**Relates to:** docs/DESIGN_PRINCIPLES.md principle 13 (Visual Hierarchy), docs/DESIGN_EVALUATION_CHECKLIST.md

**Problem:** In `theme.ts`, `secondary.main` = `#C62828`, `warning.main` = `#C62828` (identical), and `error.main` = `#D32F2F` (visually indistinguishable). Users learn that red means danger; secondary action buttons then trigger a subconscious alarm. This erodes trust.

**Acceptance Criteria:**

- [ ] Replace the secondary color palette with a warm amber. Suggested: `main: '#D4880C'`, `light: '#E6A020'`, `dark: '#B36B00'`, `contrastText: '#fff'`. Verify WCAG AA contrast (target ≥ 4.5:1 on white).
- [ ] Set `warning.main` to `'#D4880C'` (matching the new secondary) — warning and secondary share semantic space and should reinforce each other, not multiply colors.
- [ ] Keep `error.main` at `#D32F2F` (red stays exclusively for errors).
- [ ] Fix `primary.light` — currently set to the same value as `primary.main` (`#2E7D32`). Set to a genuinely lighter value: `'#60A46A'`.
- [ ] Audit all hardcoded color strings in page components that bypass the theme (Dashboard.tsx quick-action cards use `#FF6F00`, `#7B1FA2`, `#1976D2`). Replace with theme tokens where possible (see also Child #11).
- [ ] Re-verify WCAG AA on all changed color pairs; document contrast ratios in theme comments as the existing colors are documented.

---

### Child #3 — Typography: Establish Weight Hierarchy in Theme
**Labels:** `P2-medium`, `frontend`, `theme`, `visual-refresh`  
**Relates to:** docs/DESIGN_PRINCIPLES.md principle 13 (Visual Hierarchy)

**Problem:** Every heading level h1–h6 has `fontWeight: 600`. Only font size differentiates them. On a page with an h4 page title and h6 card titles, the visual weight is nearly identical — the hierarchy exists only in size, not weight, making pages feel monotonous and scan-resistant.

**Acceptance Criteria:**

- [ ] Update `theme.ts` typography:
  - `h1`, `h2` → `fontWeight: 700` (display moments, page heroes)
  - `h3`, `h4` → `fontWeight: 600` (section titles — no change)
  - `h5`, `h6` → `fontWeight: 500` (card headers, labels — currently over-bold)
- [ ] Audit pages where h5/h6 are used as card-level headings to confirm they remain readable after weight reduction (they should; 500 is still medium weight)
- [ ] No visual regressions on Login, Register, or form pages where headings anchor the layout

---

### Child #4 — Feature Discovery: Surface Hidden Capabilities
**Labels:** `P1-high`, `frontend`, `ux`, `visual-refresh`  
**Relates to:** #8, #19, #169; docs/DESIGN_PRINCIPLES.md principles 2, 9, 12

**Problem:** Five high-value features are effectively invisible:

1. **Grocery list auto-generation from meal plan** — the core pipeline of the app. No prominent UI connects meal planning to shopping.
2. **Drag-and-drop in the Meal Planner** — completely undiscoverable without instruction. `DragIndicatorIcon` is already imported but not visually present.
3. **Batch Cooking** (`BatchCookingDialog`) — no entry point surfaced outside the meal planner itself.
4. **Import from URL** — buried behind an outlined secondary button with no value-prop copy.
5. **Spoonacular Browse** — tab label "Browse Recipes" doesn't communicate that it's 1000s of external recipes.

**Acceptance Criteria:**

- [ ] **Meal Planner — Grocery Generation CTA:** Add a prominent `Button` in the Meal Planner header: "Generate Grocery List" with a `ShoppingCartIcon`. Show it when the current week has ≥ 1 meal planned and no grocery list exists for this week. Pressing it calls the existing grocery list generation flow and shows a success snackbar with a link to the list.
- [ ] **Drag handle always visible:** The `DragIndicatorIcon` on meal cards in the Meal Planner should be visible at all times on desktop (not just on hover). On first use, add a one-time tooltip (localStorage-gated): "Drag meals to reschedule". Dismiss after first drag event.
- [ ] **Batch Cooking discoverability:** Add a contextual hint in the Meal Planner when ≥ 3 meals in a week share an ingredient category: "Planning multiple meals? Try Batch Cooking →" that opens `BatchCookingDialog`. Gate this hint with a localStorage flag so it appears at most once per week.
- [ ] **Import from URL copy:** Change the button label from "Import from URL" to "Import Recipe" and add `helperText` or a `Tooltip`: "Paste any recipe URL — we'll extract the ingredients and steps automatically."
- [ ] **Browse Recipes tab label:** Change from "Browse Recipes" to "Discover Recipes" and add a subtitle or badge: "Thousands of recipes from Spoonacular."

---

### Child #5 — Navigation Badges: Ambient State Awareness
**Labels:** `P2-medium`, `frontend`, `ux`, `visual-refresh`  
**Relates to:** #118, #20; docs/DESIGN_PRINCIPLES.md principle 4 (Immediate Feedback)

**Problem:** All 5 nav items look identical regardless of application state. A user with 3 expiring pantry items and 8 unchecked grocery items gets no ambient signal from the nav — they must navigate to each page to discover the state.

**Acceptance Criteria:**

- [ ] **Pantry badge:** Red dot badge on the Pantry nav item when `pantrySlice.expiringItems.length > 0` (items expiring within 3 days) or any item is flagged low stock. Badge disappears when those lists are empty. No count needed — dot is sufficient.
- [ ] **Grocery List badge:** Count badge on the Grocery List nav item showing the number of unchecked items while a list is in `shopping` status. Hidden when status is `completed` or no list exists.
- [ ] Badges appear in both the desktop sidebar `List` and the mobile `MobileBottomNav` component.
- [ ] Badge data is read from existing Redux store state — no new API calls.
- [ ] Badges are accessible: `aria-label` on the `ListItemButton` reflects the badge state (e.g., "Pantry — 2 items expiring soon").

---

### Child #6 — Recipe Filter Bar: Collapse to Chips Pattern
**Labels:** `P2-medium`, `frontend`, `ux`, `visual-refresh`  
**Absorbs:** UIUX_ENHANCEMENTS.md — Smart Recipe Sorting by Meal Occasion (2026-03-23)  
**Relates to:** #169, #179; docs/DESIGN_PRINCIPLES.md principle 2 (Progressive Disclosure)

**Problem:** The My Recipes tab exposes 5 controls inline (Search + Difficulty + Meal Type + Cleanup + Sort By) before any recipes appear. This is identified in the external consultancy review as a progressive disclosure failure. Additionally, the meal occasion modal opens with unsorted recipes regardless of the slot context (documented in UIUX_ENHANCEMENTS.md).

**Acceptance Criteria:**

- [ ] **Search field stays inline** — always visible, full width on mobile.
- [ ] **Filters collapsed behind "Filters" button** — `Button` variant `outlined` with a `TuneIcon`. Shows a `Badge` with the count of active filters when any are applied.
- [ ] **Active filters as dismissible chips** — when any filter is active, render chips below the search bar (e.g., `Difficulty: Easy ×`, `Meal Type: Dinner ×`). Dismissing a chip clears that filter.
- [ ] **Sort By** remains accessible from within the filter panel or as a standalone icon button.
- [ ] Filter panel: collapsible `Collapse` component, not a modal. Expands inline below the search bar.
- [ ] **Smart Recipe Sorting in Meal Occasion Modal:** When the "add meal" modal opens from a specific meal slot (Breakfast / Lunch / Dinner / Snack), pre-sort the recipe list so recipes matching that `mealType` appear first. Only apply this sort on initial modal open — do not re-sort when the user manually changes the meal type dropdown. Optionally: add a visual section separator "Breakfast Recipes" / "Other Recipes".

---

### Child #7 — Cleanup Filter: Explanation and Iconography
**Labels:** `P2-medium`, `frontend`, `ux`, `visual-refresh`  
**Relates to:** docs/DESIGN_PRINCIPLES.md principle 9 (Contextual Help & Guidance)

**Problem:** The "Cleanup" filter in Recipes is a genuinely differentiated feature for families — fewer dishes matters. But there is no explanation of what it measures, no icon to make it scannable, and the values ("Minimal (0-3)") are meaningless without context.

**Acceptance Criteria:**

- [ ] Add `CleaningServicesIcon` (or `SentimentSatisfiedAltIcon` as a proxy) next to the Cleanup filter label to make it visually distinct and scannable.
- [ ] Add a `Tooltip` on an `InfoIcon` adjacent to the label: "Cleanup score measures how many dishes and pans a recipe uses. Lower = less washing up."
- [ ] Rename the filter label from `"Cleanup"` to `"Cleanup Effort"` in the `InputLabel`.
- [ ] Update MenuItem values to be self-explanatory without the range numbers: "Minimal cleanup", "Easy cleanup", "Moderate cleanup", "Any". Keep the numeric values as the submitted filter values.

---

### Child #8 — Replace "Go" CTAs with Meaningful Action Labels
**Labels:** `P2-medium`, `frontend`, `ux`, `visual-refresh`

**Problem:** Dashboard quick-action cards all have a button labelled "Go". This is one of the weakest possible CTAs — it communicates nothing about the destination or action. *(Note: if Child #1 fully redesigns the Dashboard, this issue may be resolved implicitly. Close this if so.)*

**Acceptance Criteria:**

- [ ] Replace the 4 `"Go"` button labels with: `"Browse Recipes"`, `"Plan This Week"`, `"View List"`, `"Check Pantry"`.
- [ ] The `aria-label` on each button already describes the destination — update to match the new label text.
- [ ] Optionally: make the entire card the click target (the card already has hover-lift on the wrapper; a single `onClick` on the `Card` is preferable to a redundant button).

---

### Child #9 — App Identity: Family Name and Brand Mark
**Labels:** `P3-low`, `frontend`, `ux`, `visual-refresh`  
**Relates to:** #134 (FTUE/onboarding)

**Problem:** The app identifies itself as "Meal Planner" everywhere — in the drawer, in the AppBar title, in the Dashboard h4. This is a description, not a brand. Onboarding already collects the family name but the data is only `console.log`'d in dev mode and never used in the UI.

**Acceptance Criteria:**

- [ ] Read the family name from onboarding data (`localStorage.getItem('onboardingData')`) and use it in the sidebar drawer header: e.g., "The Didriksen Kitchen" instead of "Meal Planner".
- [ ] If no onboarding data exists, fall back to "Family Kitchen" (not "Meal Planner").
- [ ] Add a simple SVG icon/logomark next to the app name in the drawer — a fork + leaf or similar. 24×24px, uses `primary.main` color. (A simple inline SVG is fine; no external asset needed.)
- [ ] Update the Dashboard `h4` from "Welcome to Meal Planner" to "Good [morning/afternoon/evening], [Family Name]" using time-of-day greeting logic.
- [ ] AppBar title shows current page name (already does this correctly — no change needed).

---

### Child #10 — Profile Discoverability & Onboarding Data Persistence
**Labels:** `P2-medium`, `frontend`, `ux`, `visual-refresh`  
**Relates to:** #134, #117; docs/DESIGN_PRINCIPLES.md principle 10 (Data Transparency)

**Problem:** The profile page holds dietary restrictions, family member setup, and cooking preferences — data that makes the app intelligent. But: (1) the AppBar avatar gives no indication that "Profile & Family Settings" live there; (2) the onboarding wizard collects this data but the handler literally has a comment `// In a real app, you would save this to the backend` — the data never persists beyond localStorage.

**Acceptance Criteria:**

- [ ] Add `Tooltip` to the AppBar avatar button: "Profile & Family Settings".
- [ ] After onboarding completes, call the backend to persist the onboarding data (dietary preferences, family members, household size). Remove the `console.log` stub. Show a success snackbar: "Your preferences were saved — you can update them in Profile any time."
- [ ] If the backend call fails during onboarding, do not silently swallow it — show an error and offer a retry or a link to Profile to complete setup manually.
- [ ] Add a "Complete your profile" nudge on the Dashboard (dismissible, localStorage-gated) if `onboardingData` exists in localStorage but the user has no family members saved in the backend.

---

### Child #11 — Dashboard Quick-Action Colors: Migrate to Theme Tokens
**Labels:** `P3-low`, `frontend`, `theme`, `visual-refresh`

**Problem:** Dashboard.tsx hard-codes four hex colors (`#2E7D32`, `#1976D2`, `#FF6F00`, `#7B1FA2`) for the quick-action card icons and buttons. These bypass the theme entirely, meaning a theme change won't update them, and `#FF6F00` (orange) now conflicts with the new secondary/warning amber from Child #2.

**Acceptance Criteria:**

- [ ] Replace hard-coded hex values with theme references:
  - Recipes card: `theme.palette.primary.main`
  - Meal Planner card: `theme.palette.info.main`
  - Grocery List card: `theme.palette.secondary.main` (new amber from Child #2)
  - Pantry card: introduce a theme `palette.custom.pantry` token, or use a MUI extended palette entry
- [ ] If using a custom palette token, document it in `theme.ts` with a comment.
- [ ] This issue is a dependency of Child #2 (color system) — complete after Child #2 lands.

---

## Phasing

| Phase | Child Issues | Theme |
|-------|-------------|-------|
| **Phase 1 — Foundation** | #2 (Color System), #3 (Typography) | Fix the design system before building on it |
| **Phase 2 — Dashboard & Discovery** | #1 (Dashboard), #4 (Feature Discovery), #8 (CTAs) | Highest user impact per effort |
| **Phase 3 — Navigation & Context** | #5 (Nav Badges), #10 (Profile/Onboarding) | Ambient awareness and trust |
| **Phase 4 — Recipe UX** | #6 (Filter Bar), #7 (Cleanup Filter), #9 (Identity) | Polish and personality |
| **Phase 5 — Cleanup** | #11 (Theme Tokens) | Technical debt, depends on Phase 1 |

Phase 1 and 2 are the 80/20. The color fix and dashboard redesign alone will change the perceived quality of the app dramatically.

---

## Acceptance Criteria for Epic Completion

- [ ] All 11 child issues closed
- [ ] Issue #25 closed with reference to Child #1
- [ ] UIUX_ENHANCEMENTS.md smart-sorting item converted to a closed GitHub issue
- [ ] `docs/DESIGN_PRINCIPLES.md` updated: mark principles 2, 9, 12, 13, 14 gaps as resolved where applicable
- [ ] `docs/DESIGN_EVALUATION_CHECKLIST.md` re-evaluated against final state
- [ ] No WCAG AA regressions (run contrast audit on any changed palette values)
- [ ] `ISSUE_PRIORITIES.md` updated to reflect new child issues and closed #25

---

## References

- `docs/DESIGN_PRINCIPLES.md` — establishes the principles this epic addresses
- `docs/UX_EVALUATION_REPORT.md` — internal B- grade evaluation (2026-04-20)
- `docs/DESIGN_CONSULTANCY_REVIEW.md` — external C+ grade evaluation (2026-04-21)
- `docs/DESIGN_REVIEW_COMPARISON.md` — resolution of disagreements between the two reviews
- `docs/DESIGN_EVALUATION_CHECKLIST.md` — beta launch readiness checklist
- `UIUX_ENHANCEMENTS.md` — smart recipe sorting backlog item (absorbed into Child #6)
- `frontend/src/theme.ts` — MUI theme (target of Child #2, #3, #11)
- `frontend/src/pages/Dashboard.tsx` — target of Child #1, #8
- `frontend/src/pages/Recipes.tsx` — target of Child #6, #7
- `frontend/src/pages/MealPlanner.tsx` — target of Child #4
- `frontend/src/components/Layout.tsx` — target of Child #5, #9
