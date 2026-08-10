# Accessibility perspective

*Input to the [#357](https://github.com/e2kd7n/mealplanner/issues/357) ad-hoc grocery item design
proposal. Written against the standards already codified in
[`docs/design/ARIA_ACCESSIBILITY.md`](../../ARIA_ACCESSIBILITY.md),
[`WCAG_COMPLIANCE.md`](../../WCAG_COMPLIANCE.md),
[`KEYBOARD_NAVIGATION.md`](../../KEYBOARD_NAVIGATION.md), and
[`DESIGN_PRINCIPLES.md`](../../DESIGN_PRINCIPLES.md) — this section assumes those baselines and
calls out only what's specific to this feature. One of three parallel persona passes — see
[`README.md`](README.md) for the synthesis and status.*

## 1. Add-item entry flow

**Reachability without scrolling.** `GroceryList.tsx` currently renders the header action row (Expand All / Collapse All / Refresh / Clear Checked) before the progress card and the category cards. The add-item control must sit in that same header region, not inside or below the category list. If it's placed after the 10 category cards (or worse, inside one of them), a keyboard user has to tab through the entire checked/unchecked list of an in-progress shop to reach it every time — that's the opposite of what the "odds and ends" use case needs. Recommend the control anchor in the header Stack alongside the existing buttons, so it's reachable in a small, constant number of tab stops from page load regardless of list length.

**Keyboard shortcut.** Given `KEYBOARD_NAVIGATION.md` already reserves `Alt+G` for *navigating to* the Grocery List page, an additional in-page shortcut (e.g. a bare `/` or `a` binding scoped to this page for "focus add-item input") is reasonable and consistent with the existing `/`-for-search pattern elsewhere in the app, but it is not a substitute for the input being tab-reachable — treat it as an accelerator, not the only path. If added, document it in `KEYBOARD_NAVIGATION.md`'s Grocery List section alongside the existing `Space` / `Delete` / `Enter` entries.

**Screen-reader announcement on success.** Adding an item is a dynamic content change that isn't adjacent to the trigger control once focus moves elsewhere, so it needs a live region — this directly follows the pattern already in the codebase (`role="status" aria-live="polite" aria-atomic="true"`, per `ARIA_ACCESSIBILITY.md`). Announce something like "Paper towels added to Other" — include the resolved category, since ad-hoc items likely default into an "Other" bucket and the user should know where to find it later without hunting. Use `polite`, not `assertive`: this is a confirmation, not an error, and shouldn't interrupt an in-progress screen-reader announcement of the next field.

## 2. Input validation

Per `DESIGN_PRINCIPLES.md`'s "inline validation on blur" + "clear actionable error messages," apply the same pattern here rather than inventing a new one:

- **Empty name on submit:** validate on blur/submit attempt (not on every keystroke). On a failed submit, keep focus in the input, set `aria-invalid="true"`, and associate the error text via `aria-describedby` pointing at an element with `role="alert"` — e.g. "Enter an item name before adding." Do not silently no-op on empty submit; that is invisible to a screen-reader user who gets no feedback that nothing happened.
- **Excessively long name:** show a character-count-remaining hint via `aria-describedby` before the limit is hit, and on exceeding it, same `aria-invalid` + `role="alert"` treatment. Don't silently truncate — a screen-reader user may not visually scan the saved list to catch a mismatch between what they typed and what was saved.
- **Likely-duplicate name:** UX's call on block vs. flag, but either way don't rely on a color-only or icon-only duplicate indicator (see §3). If blocking, same pattern as above. If a soft warning that still allows adding, use `aria-live="polite"` — e.g. "Milk is already on your list. Added again." — routed through the same or a clearly distinct live region as the success announcement, never a visual-only toast.

## 3. Rendering alongside existing items (the "not from a recipe" differentiator)

If ad-hoc items get a visual badge/chip, it must have a text alternative, not just color or an icon — a color-only or icon-only-with-no-label badge fails WCAG 1.4.1 (Use of Color) and 4.1.2 (Name, Role, Value), the same failure mode the existing per-item `Checkbox` already correctly avoids via its explicit `aria-label`. Two acceptable options: a `Chip` with visible text ("Custom"), or an icon-only badge with `aria-label="Custom item, not from a recipe"` plus the state folded into the item's own accessible name/`aria-describedby` so it surfaces in normal list-reading flow, not only on direct focus of the badge. This extends the existing per-item `aria-label` pattern at `GroceryList.tsx:517` rather than layering a new visual-only cue on top.

## 4. Touch targets on mobile

The 44×44px minimum applies fully here — likely a one-handed, in-aisle interaction. The add-item trigger must meet 44×44px; flag that this file already has several `IconButton size="small"` instances (delete button, category chevron) whose MUI default often falls under 44px and needs an explicit `sx` min-width/min-height override if reused for add-related actions. Ad-hoc items must not get smaller checkboxes/delete controls than recipe-derived items. If the flow is a dialog, its Cancel/Add buttons both need 44×44px with WCAG 2.5.8-compliant spacing so a shaky one-handed tap doesn't misfire.

## 5. Focus management after adding an item

Focus should return to the input, not move to the newly-added item, to support rapid multi-item entry — the live-region announcement from §1 carries the confirmation instead. This is where the recommendation constrains the UX shape: **if the entry point becomes a modal dialog**, the documented dialog behavior (focus trap, Enter submits and typically closes, focus returns to trigger on close) works for a single add but is costly for "add several then close" — Enter must not auto-close the dialog, only Escape/an explicit Done button should. **If the entry point is an inline row** (persistent input pinned in the header), no focus-trap complexity is needed and submit-and-refocus is the natural default — mild accessibility-effort preference for this shape, but either is compliant if focus-retention is implemented correctly. Flagging for reconciliation with the UX persona's section.
