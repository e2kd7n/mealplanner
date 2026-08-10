# Design proposal: ad-hoc/custom grocery item entry

**Status:** ✅ Design collective drafting complete. Filed for engineering review — not yet reviewed by engineering.

**Tracks:** [#357](https://github.com/e2kd7n/mealplanner/issues/357) (this proposal) ·
[#316](https://github.com/e2kd7n/mealplanner/issues/316) (original product decision) ·
[#310](https://github.com/e2kd7n/mealplanner/issues/310) (removed dead-code dialog, PR #352)

## What this is

A user should be able to add a freeform item to a grocery list that isn't derived from a
recipe/meal-plan ingredient — e.g. "we're also out of paper towels." Confirmed as a real, wanted
feature (#316), but flagged as needing real UX design before implementation. The previous stubbed
"Add Grocery Item" dialog was removed as dead code in PR #352 — this starts from a clean slate.

## How this proposal was produced

This is a first-pass design proposal drafted by a simulated **design collective** — three
independent AI-agent passes, each taking a distinct professional lens, briefed with the same
codebase research and then left to reach their own conclusions independently:

- [`UX_INTERACTION.md`](UX_INTERACTION.md) — entry point, list placement, interaction parity
- [`DATA_MODEL.md`](DATA_MODEL.md) — schema/API resolution of the core "freeform vs. catalog" fork
- [`ACCESSIBILITY.md`](ACCESSIBILITY.md) — keyboard, screen-reader, and touch-target requirements

**This is explicitly a first pass to accelerate real review, not a substitute for it.** No part of
this proposal was written or approved by a human designer or engineer yet. Treat every
recommendation here as a starting point for actual team review, not a decision.

## Where things stand so far

All three passes are complete and converge on one coherent proposal — no unresolved
contradictions between them.

### Data model: extend the catalog, don't go freeform

[`DATA_MODEL.md`](DATA_MODEL.md) recommends extending the `Ingredient` catalog with a new
`household` `IngredientCategory` value and routing ad-hoc entry through the existing
find-or-create-ingredient pattern (used today by recipe authoring and the #328 quick-add-staples
flow), rather than adding a genuinely freeform `itemName` column. Reasoning: the codebase's
"always resolve to a real `Ingredient` row" convention is structural (pantry tracking, search
indexing, dedup-by-name all depend on it), and `relationMode = "prisma"` (no DB-level FK/CHECK
constraints) makes a freeform column's "exactly one of ingredientId/itemName" invariant unsafe to
maintain in application code alone. Migration cost is a single metadata-only `ALTER TYPE ... ADD
VALUE` — no table rewrite, no new index. For v1, ad-hoc items can only be added into an *existing*
meal-plan-derived list — see "Product decisions needed" below.

### Accessibility: header-row control, live-region feedback, real text alternatives

[`ACCESSIBILITY.md`](ACCESSIBILITY.md) requires the add-item control live in the page's existing
header action row (not buried after 10 category cards), success/duplicate feedback via an
`aria-live="polite"` region (not a color/icon-only toast), any "not from a recipe" indicator to
have a real text alternative, and focus to return to the input after each add (not to the new
item) to support rapid multi-item entry. It flagged a mild preference for an inline persistent
entry row over a modal dialog, and left the final shape call to the UX pass.

### UX/interaction: inline row, own category card, full interaction parity

[`UX_INTERACTION.md`](UX_INTERACTION.md) resolves the shape question accessibility left open —
**inline persistent row in the header**, not a dialog — because the actual use case (a burst of
a few unrelated, low-friction adds) is exactly the shape a dialog's focus-trap/Enter-submits
conventions fight against. It also recommends:

- A dedicated **"Household & Other" card**, rendered last, only when non-empty — not merged into
  the existing `other` bucket, since merging would erase the one signal ("is this in the grocery
  aisles") the category grouping exists to provide.
- **Full interaction parity** with recipe-derived items (check-off, delete) and deliberately *no*
  bespoke quantity-edit for ad-hoc items, since recipe-derived items don't have that either today —
  a silent server-side `quantity: 1` default instead.
- A visible-text **"Custom" `Chip`** (not an icon-only badge) as the "not from a recipe" marker,
  satisfying accessibility's text-alternative requirement.
- Reusing #328's ingredient-suggestion `Autocomplete` and "will create as a new ingredient"
  microcopy for a consistent resolution experience, while deliberately using a different container
  shell than that feature's dialog, since the two features have different interaction shapes
  (bounded batch edit vs. ambient single-item drip).
- Explicit handling for typed names that match an item already on the list (highlight + live-region
  message, not a silent quantity increment) and for the no-current-list case (disabled input with
  an inline caption matching the existing empty-state CTA copy, rather than a control guaranteed to
  fail on submit).

## Product decisions needed (not resolved by this proposal)

Flagged explicitly rather than decided by any persona — these are genuine product/scope calls:

- **Should a standalone, non-meal-plan-derived grocery list be supported?** Today
  `GroceryList.mealPlanId` is required — every list is meal-plan-derived. The data-model pass
  recommends **defaulting to "no" for v1** (ad-hoc items only get added into an existing
  meal-plan-derived list) and treating a fully standalone "running household list" as a separate,
  later decision, since it's a materially bigger scope increase (new list-creation entry point,
  lifecycle without a source meal plan) than what #357 originally asked for.

*(This section will be revised again after the simulated engineering-review pass, per the process
described below.)*

## Process (design → engineering → design)

1. ~~Design collective drafts this proposal~~ ✅ done — all three passes complete
2. ~~File as a PR for engineering comment and review~~ ✅ [#367](https://github.com/e2kd7n/mealplanner/pull/367)
3. A simulated engineering-review pass responds, clearly labeled as an AI-generated first pass
4. Design revises in response; anything that surfaces as a genuine product call gets added to
   "Product decisions needed" above, for the user's real decision — never resolved by simulation
5. PR stays open for real human/engineering review; nothing here is merged or acted on
   automatically
