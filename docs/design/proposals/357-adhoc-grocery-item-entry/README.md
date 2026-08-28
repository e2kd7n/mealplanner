# Design proposal: ad-hoc/custom grocery item entry

**Status:** ✅ Design collective drafting complete. ✅ Simulated engineering review received and
addressed — see "Engineering review" below and the revised implementation plan in
[`DATA_MODEL.md`](DATA_MODEL.md) §2. ✅ Standalone-list product decision (2026-08-12) now fully
folded into [`DATA_MODEL.md`](DATA_MODEL.md) §3 and [`UX_INTERACTION.md`](UX_INTERACTION.md) §5 —
see "Product decisions" below. Still awaiting real human/engineering review.

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
VALUE` — no table rewrite, no new index. Ad-hoc items can be added into an existing meal-plan-derived
list *or* a standalone list — see "Product decisions" below.

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
  message, not a silent quantity increment) and for the no-current-list case (empty state now
  offers "Generate from meal plan" *or* "Start a new list," instead of a dead end pointing only at
  the meal planner).
- A list switcher for when a standalone list and a meal-plan-derived list coexist, so neither one
  silently drops out of view under the page's existing "most recent list wins" logic.

## Engineering review

A simulated engineering-review pass evaluated this proposal against the actual codebase and
posted its findings as a PR comment on [#367](https://github.com/e2kd7n/mealplanner/pull/367)
(see the engineering-review comment on PR #367 for the full text). Summary:

- **Core direction confirmed.** The review agrees with `DATA_MODEL.md`'s Option A recommendation
  (extend the catalog with a `household` category) — it found the `relationMode = "prisma"`
  reasoning sufficient on its own to settle the question, independent of the other supporting
  points.
- **Two fact-check corrections and one implementation-plan gap** were required before treating
  the proposal as ready to build: the checked-state field name was wrong (`isChecked` should have
  been `checked`, matching the actual controller and frontend), the "pantry tracking might want
  this later" point was overstated as a justification rather than a nice-to-have, and the
  duplicate-item-on-list dedup behavior described in `UX_INTERACTION.md` had no corresponding
  technical plan — as written, it wasn't implementable.
- **Several implementation-risk gaps** in `DATA_MODEL.md` §2's technical plan were identified:
  a `findOrCreateIngredient` signature change that needs to protect two existing recipe-authoring
  call sites, a search-suggestions-endpoint reuse conflict between the recipe and ad-hoc
  Autocompletes, and an unhandled concurrent find-or-create race condition that pre-exists in
  recipe authoring but is more likely to surface in ad-hoc grocery entry's multi-device context.

All of the above have been folded into the revised `DATA_MODEL.md` §2. One item raised by the
review is a genuine product/scope call rather than something either design or engineering should
resolve — see the new item below.

## Product decisions (resolved 2026-08-12, folded into the docs 2026-08-28)

- **Standalone, non-meal-plan-derived grocery list: IN SCOPE for #357.** Overriding the
  data-model pass's "default to no for v1" recommendation — the user wants standalone list
  support built now rather than deferred to a later feature. `GroceryList.mealPlanId` is now
  nullable, a new list-creation entry point exists ("Start a new list" in the empty state), and a
  lifecycle without a source meal plan is defined (one active standalone list at a time; a list
  switcher covers the case where a standalone and a meal-plan-derived list coexist). Full design:
  [`DATA_MODEL.md`](DATA_MODEL.md) §3 and [`UX_INTERACTION.md`](UX_INTERACTION.md) §5.

- **Concurrent find-or-create race condition: tracked as a follow-up, not fixed in this PR.**
  Ships #357 on the existing plan; the race is a pre-existing bug in `findOrCreateIngredient`
  (recipe authoring shares the same code path), not something #357 introduces. Filed as
  [#369](https://github.com/e2kd7n/mealplanner/issues/369), which points back here for the
  technical detail already captured in `DATA_MODEL.md` §2.

- **Duplicate-item-on-list guard: applies to every caller, backed by a DB constraint.** Resolved
  the open question `DATA_MODEL.md` §2 originally left unanswered. See that section for why the
  constraint is `@@unique([groceryListId, ingredientId, unit])`, not just
  `[groceryListId, ingredientId]` — a flatter constraint would have broken
  `generateFromMealPlan`'s existing legitimate same-ingredient-different-unit rows.

**Pre-existing bugs surfaced while researching this revision — filed separately, not part of
#357's scope:**
- [#406](https://github.com/e2kd7n/mealplanner/issues/406) — frontend/backend route mismatch on
  the primary "generate grocery list from meal plan" flow (likely 404s today).
- [#407](https://github.com/e2kd7n/mealplanner/issues/407) — `createGroceryList` requires a `name`
  the schema doesn't have (silently dropped); resolved *within* this revision by giving
  `GroceryList` a real `name` column (`DATA_MODEL.md` §3) rather than fixing #407 in isolation.
- [#408](https://github.com/e2kd7n/mealplanner/issues/408) — `POST /grocery-lists`'s Zod schema is
  defined but never wired to the route.
- [#409](https://github.com/e2kd7n/mealplanner/issues/409) — `MobileGroceryList.tsx` appears fully
  orphaned.

**Remaining before implementation:**
- [x] Revise `DATA_MODEL.md` §3 and `UX_INTERACTION.md` to cover standalone list creation/lifecycle
- [ ] Race condition fix tracked separately in [#369](https://github.com/e2kd7n/mealplanner/issues/369)
- [ ] Pre-existing bugs [#406](https://github.com/e2kd7n/mealplanner/issues/406),
      [#408](https://github.com/e2kd7n/mealplanner/issues/408),
      [#409](https://github.com/e2kd7n/mealplanner/issues/409) — tracked separately, not blocking
      (#407 is resolved as part of this revision's schema change, see above)
- [ ] Real human/engineering review (see "Process" below)

*(This section reflects the state after the simulated engineering-review pass, the user's
2026-08-12 scope decisions, and the 2026-08-28 follow-up revision that actually implements those
decisions in `DATA_MODEL.md`/`UX_INTERACTION.md`. It will be revised again if a real
human/engineering review surfaces further product calls.)*

## Process (design → engineering → design)

1. ~~Design collective drafts this proposal~~ ✅ done — all three passes complete
2. ~~File as a PR for engineering comment and review~~ ✅ [#367](https://github.com/e2kd7n/mealplanner/pull/367)
3. ~~A simulated engineering-review pass responds, clearly labeled as an AI-generated first pass~~
   ✅ done — see "Engineering review" above
4. ~~Design revises in response; anything that surfaces as a genuine product call gets added to
   "Product decisions needed" above, for the user's real decision — never resolved by
   simulation~~ ✅ done — `DATA_MODEL.md` §2 revised, one new product decision added above
5. PR stays open for real human/engineering review; nothing here is merged or acted on
   automatically
