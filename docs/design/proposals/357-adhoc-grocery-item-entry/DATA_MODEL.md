# Data Model / Information Architecture perspective

*Input to the [#357](https://github.com/e2kd7n/mealplanner/issues/357) ad-hoc grocery item design
proposal. One of three parallel persona passes — see [`README.md`](README.md) for the synthesis
and status.*

## Recommendation: Option A (extend the catalog), not Option B

Add `household` to `IngredientCategory` and route ad-hoc entry through the existing find-or-create-ingredient pattern. Reject freeform `itemName`/nullable `ingredientId`.

**Why, explicitly:**

1. **The "always resolve to a real row" convention isn't incidental — it's structural.** `Ingredient` isn't just a grocery-list concern: `PantryInventory`, `RecipeIngredient`, and grocery-search trigram indexing all assume every purchasable thing is an `Ingredient` row. A bare `itemName String?` on `GroceryListItem` opts ad-hoc items out of all of that for no real gain — a household item typed once still deserves dedup ("paper towels" said twice shouldn't become two catalog entries) and still benefits from name-search. (A nice-to-have on top, not part of the justification: this also leaves the door open for pantry tracking to pick up ad-hoc items later, since "we're out of paper towels" reads as a pantry-depletion event — but that's speculative and #357 isn't asking for it, so it isn't load-bearing for this recommendation.) Option B forecloses that future for a feature that's currently *only* asking for grocery-list entry.
2. **`relationMode = "prisma"` makes Option B's core invariant unsafe.** Option B needs "exactly one of `ingredientId` / `itemName` is set" to hold at all times, but there's no DB-level FK and no CHECK constraint doing that enforcement — it'd live entirely in controller code, silently violable by a seed script, a future raw query, or a second code path nobody remembers to update. Option A has no such invariant to maintain; a `household`-category `Ingredient` is just an `Ingredient`. This point alone is sufficient to prefer Option A regardless of the other two.
3. **The UX difference between the two options is basically nil.** The user still types "paper towels" and hits add either way — Option A's resolution step is server-side and invisible. So this isn't really a UX tradeoff, it's an implementation-shape tradeoff, and the shape that reuses existing infrastructure (search index, dedup-by-name, pantry FK surface) wins.

**A third option, considered and rejected:** an `itemName`-style display-label override on an existing `Ingredient` row (i.e., keep `ingredientId` always set, but let it point at a generic/placeholder ingredient with a per-`GroceryListItem` label override for display). This sidesteps the nullable-FK invariant problem entirely, so it doesn't have Option B's `relationMode = "prisma"` issue — but it trades that for a different kind of mess (what does the placeholder `Ingredient` row look like, how does search/dedup work against a label that lives on the list item instead of the catalog) for no benefit over just creating a real `household`-category `Ingredient`, which already gives every ad-hoc item a first-class catalog identity for free. Not worth the added complexity; noted here for completeness, not pursued further.

**What I'm rejecting, and the honest cost of doing so:** Option B's genuine advantage — not force-fitting non-food semantics onto `averagePrice`/`seasonalMonths`/`allergens` — is real but cheap to absorb with sensible defaults (below). The catalog-pollution cost of Option A (one-off items like "printer ink cartridge XL-4400" living in the `Ingredient` table forever) is also real, but the table is small by nature on this deployment. The sharper way to state the Pi constraint: the cost that actually matters isn't raw table size against `shared_buffers`, it's write-amplification on the `pg_trgm` GIN index over `Ingredient.name` (recipe title/cuisineType/description have their own trigram indexes, and name-search on ingredients works the same way) — every new row is an index write, and GIN index updates are more expensive per-write than a plain btree. At a few thousand rows added over the life of the deployment, that's still negligible on the Pi's tuned instance, but "small table" was the wrong mechanism to cite; "occasional GIN writes on a low-churn table" is the accurate one, and the conclusion (fine at this scale) holds either way.

I'd also reject the fallback of just reusing the existing `other` enum value instead of adding `household` — it would dump non-food items into whatever bucket already holds genuinely-uncategorized food, defeating the store-section grouping this exists to support.

**Catalog-pollution friction, revisited:** the estimate above was calibrated against recipe-authoring friction, where ingredient entry happens once per recipe and typically points at inputs a user already recognizes from a list. Ad-hoc grocery entry is a single field and an Enter keystroke, always visible in the header, with no near-duplicate detection beyond exact case-insensitive match (see the race-condition note in §2 — "Paper Towels" and "paper towels" typed from two devices don't currently collide reliably either). That's a meaningfully lower-friction path to catalog growth than recipe authoring. Still probably fine at this scale/household size, but the doc should own that the friction profile changed rather than importing the recipe-authoring estimate unexamined.

---

### 1. Schema change

```prisma
enum IngredientCategory { produce protein dairy grains pantry spices household other }
```

That's the entire schema diff for this feature. `GroceryListItem`/`GroceryList` are untouched.

### 2. `addItemToList`, the dead Zod schemas, and the `checked`/`isChecked`/`purchased` mismatch

- Extract `findOrCreateIngredient` out of `recipe.controller.ts` into a shared service (e.g. `ingredient.service.ts`) — it's currently private to recipes; `groceryList.controller.ts` needs the same resolution logic, not a reimplementation of it. **This is a signature change to protect, not a pure extraction**: the function needs two new optional params (`category`, `estimatedPrice`) to support ad-hoc entry, and it has two existing call sites — `createRecipe` (`recipe.controller.ts:483`) and `updateRecipe` (`recipe.controller.ts:607`) — that must keep resolving to their current implicit defaults (`category: 'other'`, `averagePrice: 0`) completely unchanged. Implementation plan should call out explicit default values at both call sites (not just rely on the new params being optional) so a future refactor can't silently drift recipe-authoring behavior.
- `addItemToList` should drop its hand-rolled `if (!ingredientId...)` check and call this shared resolver, passing through an optional `ingredientName`/`category` alongside the existing optional `ingredientId` — mirroring how the recipe controller already calls it.
- `addGroceryItemSchema` should be **extended, not replaced**: today it hard-requires `ingredientId: z.string().uuid()`, which is exactly the constraint blocking ad-hoc entry. Add optional `ingredientName` and `category`, plus a `.refine()` requiring at least one of `ingredientId`/`ingredientName`, then wire it into the route (currently unwired). Also add an optional `estimatedPrice` to seed the new `Ingredient.averagePrice` on first creation (default to `0` only if the caller omits it too).
- **`updateGroceryItemSchema` should also be extended, not replaced** — same guidance as `addGroceryItemSchema` above. It currently doesn't validate the `quantity`/`unit`/`checked`/`notes` update path at all (unwired, same as the add schema); extend it to cover those fields rather than writing a parallel schema.
- **Field-name correction:** the checked-state mismatch is three names deep, not two. The Prisma model field is `isChecked`, the DB column follows the model, but `groceryList.controller.ts:576` destructures **`checked`** from `req.body` — that's the actual wire contract the frontend already sends and expects. `checked` is canonical for the API surface; `updateGroceryItemSchema` needs a `checked` field (not `isChecked`, not `purchased`), and any schema/controller code should map `checked` → `isChecked` at the Prisma call boundary, not rename the wire field to match the model. Confirm the controller's current behavior before touching it, since it's already accepting `checked` correctly today — the schema is what's missing, not a rename.
- **Duplicate-item-on-list check — resolved: applies to every caller, backed by a DB constraint, at (`groceryListId`, `ingredientId`, `unit`) granularity, not just (`groceryListId`, `ingredientId`).** `GroceryListItem` has no unique constraint or index at all today. The naive `@@unique([groceryListId, ingredientId])` this doc originally implied would be **unsafe**: `generateFromMealPlan`'s aggregation (`getIngredientKey`, `groceryList.controller.ts:243-260`) already keys on `ingredientId` *and* `unit` together, and deliberately creates two separate `GroceryListItem` rows for the same ingredient when two recipes in the plan call for it in different units (e.g. flour in `cups` from one recipe, flour in `grams` from another) — a flat `ingredientId`-only constraint would make that existing, legitimate case throw a `P2002` on `createMany`. The constraint has to match the granularity the app already depends on: add `@@unique([groceryListId, ingredientId, unit])`, and have both `addItemToList` and `generateFromMealPlan`'s batch insert honor it (a `findFirst`/upsert-style guard before insert, or catch-and-merge on `P2002`).
  This is *not* the same check as `UX_INTERACTION.md`'s ad-hoc "matched ingredient already on this list → highlight, no new row" UX, which is about ingredient identity regardless of unit (ad-hoc items always resolve to a fixed default unit per `UX_INTERACTION.md` §2, so they won't naturally collide with a recipe-derived row in a different unit at the DB level). That UX-facing check stays a separate, ad-hoc-path-only `findFirst({ where: { groceryListId, ingredientId } })` (unit-agnostic) run before resolving the item, purely to drive the live-region "already on your list" messaging — it is not what the DB constraint enforces, and doesn't block the insert if it doesn't fire (the DB constraint is the real backstop; this lookup is UX only). Don't try to collapse these into one check — they answer different questions (“is this a database-level duplicate row?” vs. “should the user be told this ingredient is already something they're tracking?”).
- `addItemToList`'s lack of an ownership/scoping check on `ingredientId` is **not a bug to fix here** — the `Ingredient` catalog is global-by-design (shared across the household's users, per the existing recipe-authoring flow), so any authenticated user being able to reference any catalog ingredient is intentional. Worth a one-line comment in the code so a future pass doesn't "fix" it into per-user ingredient scoping.
- Defaults for the food-shaped fields on a `household`-category `Ingredient`: `seasonalMonths = [1..12]` (never reads as "out of season"), `allergens = []`, `averagePrice` seeded from the first `estimatedPrice` entered (falls back to `0` if that's left blank — resolved in `UX_INTERACTION.md`'s "Price entry for ad-hoc items": price is never prompted for at add-time, so this always falls back to `0` on first creation of a given ad-hoc ingredient).
- **Search-suggestions filtering — corrected, this is not a small `WHERE` addition.** `GET /api/ingredients/search/suggestions` is proposed for reuse by the ad-hoc entry `Autocomplete` itself (per `UX_INTERACTION.md`). Unconditionally filtering `category = household` out of that endpoint — which is what's needed for the *recipe-authoring* Autocomplete, so ad-hoc items don't surface as recipe-ingredient suggestions — would also blind the *ad-hoc* Autocomplete to existing ad-hoc ingredients, since it hits the same endpoint. That breaks the dedup UX `UX_INTERACTION.md` promises (typing "paper towels" a second time should surface the existing one, not silently offer to create a duplicate) and produces an incorrect "will create as a new ingredient" caption. Needs a conditional filter — e.g. a new query param on the endpoint distinguishing recipe-context vs. grocery-context callers (`context=recipe` filters `household` out, `context=grocery` doesn't) — plus a corresponding cache-key change on the frontend/API layer so the two contexts don't share a stale cached result set for the same search string.
- **Concurrent find-or-create race — pre-existing gap, this feature makes it more likely to bite.** `findOrCreateIngredient` has no transaction wrapping and no `catch` around a unique-constraint violation on `Ingredient.name`. Two concurrent requests for the same exact-cased name can both pass the initial lookup and then race on `create`, producing an unhandled 500 for one of them; two concurrent requests with different casing ("Paper Towels" vs. "paper towels") can both succeed and create two rows, silently defeating the dedup guarantee this whole recommendation rests on. This bug already exists in recipe authoring today, but recipe authoring is single-user-editing-one-recipe in practice, so it rarely triggers. Ad-hoc grocery entry is explicitly pitched as multi-device/household-of-4/low-friction (§ "Catalog-pollution friction, revisited" above) — two family members adding "paper towels" from their phones within the same minute is a realistic, not theoretical, trigger here. Recommend fixing as part of this work: wrap find-then-create in a transaction and add explicit handling for the unique-constraint-violation error path (treat it as "someone else just created this — re-fetch and use that row" rather than surfacing a 500). **Whether this fix is in scope for #357 or a separate tracked follow-up is a product/timeline call — see "Product decisions needed" in `README.md`. This document is not making that call, only surfacing the gap and a recommended technical fix if it's taken on.**

### 3. Ad-hoc-only lists (no meal plan) — resolved: standalone lists are in scope for #357

Product decision, 2026-08-12 (see `README.md`): standalone, non-meal-plan-derived grocery lists
are in scope for #357, overriding this doc's original "default to no for v1" recommendation.

**Schema change:** `GroceryList.mealPlanId` becomes nullable (`String?`), and the `mealPlan`
relation becomes optional (`MealPlan?`, `schema.prisma:202-209`). This is the same cheap,
non-breaking column change flagged as the contingent case originally — no backfill needed, since
every existing row already has `mealPlanId` populated. `onDelete: Cascade` on the `mealPlan`
relation needs no change: it simply never fires for a standalone list, since there's no `MealPlan`
FK value for a deletion to cascade from.

**New field needed: `GroceryList.name String?`.** `createGroceryList`
(`groceryList.controller.ts:194-238`) already requires a `name` in its request body today, but the
`GroceryList` model has no such column — the value is silently dropped before
`prisma.groceryList.create` (tracked separately as
[#407](https://github.com/e2kd7n/mealplanner/issues/407), a pre-existing bug unrelated to this
decision, since `createGroceryList` predates standalone-list scope). Meal-plan-derived lists have
never needed an explicit name — they're implicitly identified by their source plan's
`weekStartDate` — but a standalone list has no such implicit label and needs a real one. Resolve
both gaps together rather than fixing #407 in isolation and re-deriving this requirement later:
add `name String?` to `GroceryList`, and have `createGroceryList` persist it instead of dropping
it. Keep it nullable so meal-plan-derived list creation is unaffected (it can keep omitting `name`
and rely on `mealPlan` for identity, exactly as today).

**Duplicate-list-row risk on `generateFromMealPlan`:** no change needed. That path always sets
`mealPlanId` (never null), so it's unaffected by the nullable column.

**List-switcher implication** (see `UX_INTERACTION.md`'s "Creating and switching standalone
lists"): no additional schema is needed to support a switcher — it's a query (all
non-`completed`-status `GroceryList` rows for `userId`, ordered by `updatedAt` desc), not a new
column or relation. `GroceryList` already has a `status` field (`draft | shopping | completed`)
and `@@index([userId])`/`@@index([status])`, which is exactly what that query needs — no index
changes required here either.

### 4. Migration/deployment risk

Low, and lower than Option B's. `ALTER TYPE "IngredientCategory" ADD VALUE 'household'` is metadata-only in Postgres — no table rewrite, no lock contention, negligible cost on the Pi's tuned instance; Prisma Migrate runs it as its own non-transactional step automatically. No new indexes needed for the enum change — don't add one on `category` at this scale (a sequential scan over a small ingredient table is cheaper than the storage/write overhead of another index, consistent with the Pi's conservative-write posture).

**`mealPlanId` nullability — audited, blast radius is small.** This doc previously flagged
"every query and UI surface that currently assumes `groceryList.mealPlan` is non-null" as a
hypothetical cost of nullifying `mealPlanId`; now that it's non-hypothetical (§3), here's the
actual audit: `groceryList.controller.ts` has three `include: { mealPlan: ... }` call sites
(`getGroceryLists:101`, `getGroceryListById:160`, `updateGroceryList:435`) — all standard Prisma
`include`s on an optional relation, which simply serialize to `mealPlan: null` in the JSON
response when `mealPlanId` is null; none of them dereference a field on the result server-side, so
none can throw. On the frontend, a full-repo search for `.mealPlan.` / `mealPlan?.` /
`mealPlan &&` access on a grocery-list object returns **zero matches** — `GroceryList.tsx` and the
Redux slice's `GroceryList` interface reference `mealPlanId` as a bare field (for typing/display
logic) but never drill into a `mealPlan` object's own fields. Net: no known null-check is actually
missing anywhere in the current codebase. The one required change is in the TypeScript types —
`mealPlanId: string` is declared as required in three places (`groceryListsSlice.ts`'s
`GroceryList` interface, `GroceryList.tsx`'s local `GroceryList` interface, and
`groceryListAPI.create`'s parameter type in `api.ts`) — all three need `mealPlanId?: string` (or
`string | null`, matching whatever the API actually serializes a null Prisma field as) once
standalone lists exist, or `tsc` won't catch a future access that assumes non-null.
