# UX / Interaction Design perspective

*Input to the [#357](https://github.com/e2kd7n/mealplanner/issues/357) ad-hoc grocery item design
proposal. One of three parallel persona passes — see [`README.md`](README.md) for the synthesis
and status. Written against
[`DATA_MODEL.md`](DATA_MODEL.md) (resolved: every ad-hoc item becomes a real `household`-category
`Ingredient` row via the existing find-or-create pattern) and [`ACCESSIBILITY.md`](ACCESSIBILITY.md)
(header-row placement, `aria-live="polite"` feedback, a real text alternative for any "not from a
recipe" marker, focus-returns-to-input after add). This section resolves the one open item
accessibility left to me and covers the remaining shape questions.
**Revised post-2026-08-12:** standalone (non-meal-plan) grocery lists are now in scope for #357
(see `README.md`'s "Product decisions"). The original "no current list" edge case below assumed
standalone lists were out of scope for v1 — that assumption no longer holds, and this doc has been
revised accordingly (see "No current grocery list exists" in §4 and the new "Creating and
switching standalone lists" section).

## Recommendation: inline persistent row in the header action area, not a dialog

Adopting accessibility's preference outright — this isn't a close call once you look at the
actual use case. The scenario this feature exists for is "I'm looking at my list and I remember
two or three unrelated things" (paper towels, batteries, the dog's food) — a burst of short,
low-friction, non-sequential adds, not a single deliberate transaction. A dialog is built for the
opposite shape: `open → do one focused thing → close`. Every dialog convention that makes that
one thing feel safe (focus trap, `Escape` to abandon, `Enter` typically submits *and* closes)
actively fights a "add three things in ten seconds" flow — either the user re-opens the dialog
three times, or the dialog has to special-case `Enter` to not close it, which is a real, silently
inherited affordance until someone reads the dialog's own help text to learn it. An inline row
pinned in the header (next to Expand All / Collapse All / Refresh / Clear Checked, per
`GroceryList.tsx:330-369`) has none of this tension: `Enter` submits, the input stays mounted and
refocused, and the user just keeps typing. No modal lifecycle to reason about at all.

The concrete shape: a `TextField` (`freeSolo` `Autocomplete`, see §4) plus an "Add" button/icon,
living in the same `Stack` as the existing header buttons, always rendered (not a button that
reveals a field) so it's reachable in a constant number of tab stops regardless of list length or
scroll position — this is the same reachability property accessibility flagged, and it falls out
of the shape for free rather than needing separate enforcement. On submit: resolve the item,
append it to the appropriate category card without page navigation, fire the `aria-live` success
announcement accessibility specified, clear the input, and return focus to it. No route change,
no overlay, no focus trap.

**What I'm rejecting, and why the cost is real but acceptable:** a dialog would give slightly more
room for a richer add experience (the quick-add ingredient dialog's line-by-line paste-many-at-once
shape, discussed in §4) and reads as more "this is a deliberate action" to a first-time user. I'm
rejecting that in favor of low-friction repeatability — this is a many-small-adds feature, not a
recipe-authoring feature, and the interaction cost of re-opening a dialog per item is paid every
single time it's used, while the discoverability cost of an inline row is paid once. If usage data
later shows people habitually pasting multi-line shopping notes ("milk, eggs, paper towels") into
this field, that's a reason to add paste-splitting to the inline row (mirroring
`QuickIngredientEntryDialog.tsx:122-128`'s `handlePaste`), not a reason to switch back to a dialog.

---

## 1. Where the item lands: give `household` its own card

Recommend a dedicated "Household & Other" card (or just "Household," see below), rendered last in
`CATEGORY_CONFIG` order, following the exact same "only render if it has items" rule the other
nine cards already use (`GroceryList.tsx:419-420`) — so on a list with zero ad-hoc items, nothing
changes visually and there's no empty evergreen card to explain away.

**Why not merge into `other`:** `other` already exists as the catch-all for genuinely
uncategorized *food* — a recipe ingredient the category-mapper couldn't place. Dropping paper
towels into the same bucket as "some sauce we didn't have a category for" does two things wrong:
it makes `other` semantically muddier right when this feature is adding a cleaner path (the whole
point of the data-model pass adding `household` instead of reusing `other` was to avoid exactly
this), and it removes the one piece of information a shopper actually wants from the grouping —
"is this in the grocery aisles or is this the stuff I pick up on the way to the register." Produce
through spices are all "walk the store" categories; household goods are frequently a different
run entirely (or a different physical location in the same store). Keeping them visually distinct
preserves that at-a-glance planning value instead of degrading it.

**What I'm rejecting:** merging into `other` is simpler (nine cards instead of ten, no new icon/
color needed) and avoids the risk of a near-empty, rarely-populated eleventh card. I'm accepting
that cost because the grouping logic's entire reason to exist is "tell me where to find this in
the store," and silently violating that for the one category most likely to *not* be in the
grocery aisle undermines the feature it's attached to.

**Naming — resolved: "Household & Other."** Use "Household & Other," not "Household" alone —
it gives the card a single home for both genuinely-uncategorized food *and* non-food items rather
than needing an eleventh mapping target later, and doesn't change the recommendation to keep it
visually separate from the walk-the-store categories.

## 2. Interaction parity: full parity, nothing bespoke

Check-off and delete: identical to recipe-derived items, same `Checkbox`/`IconButton` affordances,
same list row (`GroceryList.tsx:485-536`), same `ListItemButton` toggle-on-row-click behavior. No
reason to special-case ad-hoc items here — the data model already made them real `GroceryListItem`
rows referencing a real `Ingredient`, so structurally there's nothing different for the UI to do.

Edit-quantity: **don't build it for ad-hoc items specifically.** Recipe-derived items don't have a
quantity-edit affordance today either (quantity/unit render as read-only secondary text,
`GroceryList.tsx:528`) — introducing edit-in-place only for ad-hoc items would be a worse
consistency violation than not having it at all, giving ad-hoc items *more* capability than the
items they're supposed to feel like peers of. If per-item quantity editing gets built, it should
land for both item types in the same change. For v1, ad-hoc items get a silent default
(`quantity: 1`, a neutral `unit` such as `"item"`) set server-side at creation and never surfaced
as a field the user has to fill in during add — asking "how many, what unit" for "paper towels"
mid-flow reintroduces exactly the friction the inline-row recommendation is trying to avoid, for a
value nobody is going to act on differently than "1."

**Price entry for ad-hoc items: never prompted, always silent.** Same reasoning as quantity —
asking "how much does this cost" mid-flow for "paper towels" fights the low-friction burst-entry
use case this whole feature is built around, and recipe-derived items don't surface a price-entry
affordance either. Resolves the open question in `DATA_MODEL.md` §2: `estimatedPrice` is never a
user-facing field at add-time. The newly-created `household`-category `Ingredient`'s
`averagePrice` seeds at `0` and simply stays `0` until/unless something else in the app (there is
no such flow today) updates it — same as any other ingredient created with no price data.

**The "not from a recipe" differentiator:** use a visible-text `Chip` reading "Custom," placed
where the existing category `Chip` pattern already lives in this file (`GroceryList.tsx:466-471`
uses the same component for the checked-count badge), not an icon-only badge — this satisfies
accessibility's requirement for a real text alternative without introducing a new visual language,
and keeps the accessible name folded into the item's row per their guidance rather than a separate
focus stop. Keep it subdued (default/outlined `Chip`, not a color implying warning or error) — this
is informational, not a status the user needs to act on.

## 3. Consistency with the #328 quick-add pattern — same backend shape, deliberately different shell

`QuickIngredientEntryDialog.tsx` and this feature both terminate in the same
find-or-create-ingredient resolution, and that shared plumbing is worth surfacing consistently:
reuse the `/ingredients/search/suggestions` `freeSolo` `Autocomplete` pattern
(`QuickIngredientEntryDialog.tsx:206-233`) so typing in the ad-hoc input offers the same live
matching-ingredient suggestions, and reuse its "Will create '{name}' as a new ingredient"
inline microcopy (`QuickIngredientEntryDialog.tsx:234-238`) verbatim or near-verbatim when the
typed name doesn't match anything — same signal, same wording, same place in the visual hierarchy
(a small caption under the field), so a user who's seen one has already learned the other.

Where I'm diverging is the shell, and deliberately: #328's dialog exists because adding recipe
ingredients is a *bounded editing session* the user explicitly navigates into from a recipe (open
recipe → "add ingredients" → do the batch edit → close, back to the recipe). It's multi-line by
design because recipes routinely have many ingredients at once, and a paste-many-lines flow earns
its keep there. Ad-hoc grocery entry is the opposite shape: an *ambient, page-resident* action
threaded through however long the user is looking at their list, one unrelated item at a time, with
no "session" to bound. Importing the dialog shell here would import its costs (§ above) without
its benefit — recipes really do have 8-15 ingredients entered in one sitting; a household grocery
run rarely has more than a handful of ad-hoc items, entered sporadically rather than in a batch.
So: shared backend contract and shared micro-interaction language (suggestions, "will create"
copy), different container. That's consistency where it matters to the user (the app "feels" the
same when resolving a typed name into an ingredient) without forcing a mismatched shell onto a
mismatched task.

## 4. Edge cases

**Typed name matches an existing ingredient (case-insensitively — confirmed in
`findOrCreateIngredient`, `recipe.controller.ts:385-387`).** Two sub-cases, and they need different
UI responses:
- *The matched ingredient isn't already on this list* → this is the common, unremarkable case:
  add it, no different from creating new. The "Will create..." caption simply doesn't show (since
  an Autocomplete suggestion matched), and the success announcement is the same as any add.
- *The matched ingredient is already an item row on the current list* → don't create a second row
  for the same ingredient. Instead: briefly highlight the existing row (a short background-color
  pulse, non-essential and skippable — the real signal is the live-region text) and fire the
  `aria-live` message accessibility already specified in their duplicate-handling note ("Milk is
  already on your list."), then return focus to the input exactly as on a normal add. I'm
  explicitly rejecting silently incrementing the existing row's quantity as the alternative — for
  ad-hoc items in particular, quantity is a near-meaningless placeholder (see §2), so "2 paper
  towels" resulting from a duplicate add would look like a real, intentional quantity decision the
  user never made. A no-op-plus-highlight is honest about the fact that nothing changed.

**Very long freeform names.** No DB column limit exists (`Ingredient.name` is unbounded `String`),
so this cap is a UX decision, not a schema one. Recommend a visible limit around 60-80 characters —
generous enough for "organic whole milk, the kind in the glass bottle" but short enough to stay
legible as a single list row. Enforce it the way accessibility specified in §2 of their doc:
character-count hint before the limit, inline validation at the limit, never silent truncation.
Once saved, let the name **wrap**, not truncate-with-ellipsis, inside `ListItemText` — an
ellipsis hides information from sighted users exactly as much as silent truncation hides it from
everyone, and there's no good reason to trade legibility of a rare long entry for one extra line
of card height.

**No current grocery list exists — revised now that standalone lists are in scope.** The header
add-item control no longer needs to stay disabled in this state, since there's now always a way to
give it something to attach an item to. Replace the single "Go to Meal Planner" empty-state CTA
(`GroceryList.tsx:404-411`) with two side-by-side actions:

- **"Generate from meal plan"** — the existing CTA, unchanged in behavior, just relabeled for
  symmetry with the new second option.
- **"Start a new list"** — creates a standalone `GroceryList` (`name` prompted for at creation,
  see below) and makes it `currentList` immediately. This is the standalone-list creation entry
  point; see "Creating and switching standalone lists" below for the full flow.

Once *either* action produces a list, the header ad-hoc-add control enables per the original
§"Recommendation" above — that part of the original design holds unchanged. The only thing that's
changed is that "no list exists" is no longer a dead end requiring a trip to the meal planner.

## 5. Creating and switching standalone lists

New section, added for the standalone-list product decision (`README.md`, 2026-08-12).

**Creating a standalone list.** Triggered from the empty-state "Start a new list" action above,
or from a persistent "New list" action (see placement below) once a switcher exists. Creation
prompts for a `name` (required — this is the one field standalone lists need that meal-plan-derived
lists don't, see `DATA_MODEL.md` §3) via a small inline text prompt, not a full dialog — consistent
with this doc's general bias against modal ceremony for a lightweight action. A sensible default
placeholder like "New list" or the current date reduces the odds of this becoming its own point of
friction; the field should still be required (an unnamed list is the exact ambiguity a switcher is
meant to resolve).

**One active standalone list at a time.** A user can have at most one non-`completed` standalone
list open, mirroring how meal-plan-derived lists implicitly work today (`status` starts at
`draft`). This keeps "New list" simple — it's an action for going from zero standalone lists to
one, not for maintaining several in parallel, which the app has no other surface (shopping-trip
organization, list merging) designed to support yet. If a user wants a fresh standalone list while
one is still open, they mark the current one `completed` first (existing status transition,
`updateGroceryList`) — no new lifecycle state needed for this.

**Switcher.** With multiple lists able to coexist (a standalone list and a freshly-generated
meal-plan list both `draft`/`shopping`), `GroceryList.tsx`'s current "most recent list wins, no
switcher" heuristic (`GroceryList.tsx:129-131`, `orderBy: createdAt desc`, first result becomes
`currentList`) would silently bury whichever list isn't newest — a user could lose track of an
in-progress standalone list the moment they generate a meal-plan list, with no error and no
indication anything happened. Resolve this with a compact list-select control in the page header,
next to the existing Expand All / Collapse All / Refresh / Clear Checked row
(`GroceryList.tsx:330-369`) — a `Select` populated from `GET /grocery-lists` filtered to
non-`completed` status, showing each list's `name` (standalone) or derived meal-plan label (e.g.
"Week of {weekStartDate}," meal-plan-derived) as its option text. Selecting a list sets
`currentList` client-side (no new endpoint needed — `getGroceryListById` already exists). Only
render the switcher when more than one non-`completed` list exists, so the common single-list case
looks exactly as it does today — no new chrome for the default path.
