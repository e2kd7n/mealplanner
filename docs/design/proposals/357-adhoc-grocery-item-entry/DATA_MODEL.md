# Data Model / Information Architecture perspective

*Input to the [#357](https://github.com/e2kd7n/mealplanner/issues/357) ad-hoc grocery item design
proposal. One of three parallel persona passes — see [`README.md`](README.md) for the synthesis
and status.*

## Recommendation: Option A (extend the catalog), not Option B

Add `household` to `IngredientCategory` and route ad-hoc entry through the existing find-or-create-ingredient pattern. Reject freeform `itemName`/nullable `ingredientId`.

**Why, explicitly:**

1. **The "always resolve to a real row" convention isn't incidental — it's structural.** `Ingredient` isn't just a grocery-list concern: `PantryInventory`, `RecipeIngredient`, and grocery-search trigram indexing all assume every purchasable thing is an `Ingredient` row. A bare `itemName String?` on `GroceryListItem` opts ad-hoc items out of all of that for no real gain — a household item typed once still deserves dedup ("paper towels" said twice shouldn't become two catalog entries), still benefits from name-search, and plausibly wants pantry tracking later ("we're out of paper towels" is exactly a pantry-depletion event). Option B forecloses that future for a feature that's currently *only* asking for grocery-list entry.
2. **`relationMode = "prisma"` makes Option B's core invariant unsafe.** Option B needs "exactly one of `ingredientId` / `itemName` is set" to hold at all times, but there's no DB-level FK and no CHECK constraint doing that enforcement — it'd live entirely in controller code, silently violable by a seed script, a future raw query, or a second code path nobody remembers to update. Option A has no such invariant to maintain; a `household`-category `Ingredient` is just an `Ingredient`.
3. **The UX difference between the two options is basically nil.** The user still types "paper towels" and hits add either way — Option A's resolution step is server-side and invisible. So this isn't really a UX tradeoff, it's an implementation-shape tradeoff, and the shape that reuses existing infrastructure (search index, dedup-by-name, pantry FK surface) wins.

**What I'm rejecting, and the honest cost of doing so:** Option B's genuine advantage — not force-fitting non-food semantics onto `averagePrice`/`seasonalMonths`/`allergens` — is real but cheap to absorb with sensible defaults (below). The catalog-pollution cost of Option A (one-off items like "printer ink cartridge XL-4400" living in the `Ingredient` table forever) is also real, but the table is small by nature on this deployment; a few thousand rows is nothing against a `shared_buffers=64MB` Postgres, and it's a much smaller ongoing cost than maintaining a second, unenforced data path.

I'd also reject the fallback of just reusing the existing `other` enum value instead of adding `household` — it would dump non-food items into whatever bucket already holds genuinely-uncategorized food, defeating the store-section grouping this exists to support.

---

### 1. Schema change

```prisma
enum IngredientCategory { produce protein dairy grains pantry spices household other }
```

That's the entire schema diff for this feature. `GroceryListItem`/`GroceryList` are untouched.

### 2. `addItemToList`, the dead Zod schemas, and the `purchased`/`isChecked` mismatch

- Extract `findOrCreateIngredient` out of `recipe.controller.ts` into a shared service (e.g. `ingredient.service.ts`) — it's currently private to recipes; `groceryList.controller.ts` needs the same resolution logic, not a reimplementation of it.
- `addItemToList` should drop its hand-rolled `if (!ingredientId...)` check and call this shared resolver, passing through an optional `ingredientName`/`category` alongside the existing optional `ingredientId` — mirroring how the recipe controller already calls it.
- `addGroceryItemSchema` should be **extended, not replaced**: today it hard-requires `ingredientId: z.string().uuid()`, which is exactly the constraint blocking ad-hoc entry. Add optional `ingredientName` and `category`, plus a `.refine()` requiring at least one of `ingredientId`/`ingredientName`, then wire it into the route (currently unwired). Also add an optional `estimatedPrice` to seed the new `Ingredient.averagePrice` on first creation (default to `0` only if the caller omits it too).
- `updateGroceryItemSchema`'s `purchased` field is a pre-existing bug (model field is `isChecked`), independent of this feature — but since the schema is being wired up anyway, fix the field name in the same change rather than leaving a second stale schema live. Confirm the actual toggle-endpoint's field name before renaming, in case the controller itself also has a mismatched key.
- `addItemToList`'s lack of an ownership/scoping check on `ingredientId` is **not a bug to fix here** — the `Ingredient` catalog is global-by-design (shared across the household's users, per the existing recipe-authoring flow), so any authenticated user being able to reference any catalog ingredient is intentional. Worth a one-line comment in the code so a future pass doesn't "fix" it into per-user ingredient scoping.
- Defaults for the food-shaped fields on a `household`-category `Ingredient`: `seasonalMonths = [1..12]` (never reads as "out of season"), `allergens = []`, `averagePrice` seeded from the first `estimatedPrice` entered (falls back to `0` if that's left blank — a UX-pass decision on whether price is required).
- Filter `category = household` out of recipe-ingredient autocomplete/search results — otherwise ad-hoc items surface as suggestions while authoring recipes. Small `WHERE` addition, negligible cost.

### 3. Ad-hoc-only lists (no meal plan) — flagging this as a product call, not resolving it here

`GroceryList.mealPlanId` is currently required, so today every list is meal-plan-derived. Whether a *standalone* running household list should exist independent of any meal plan is a scope decision (new list-creation entry point, lifecycle when there's no plan to derive from, whether it's one perpetual list vs. many) — that's UX/product surface, not a data-model constraint I should resolve unilaterally. **Data-model note for whoever does decide:** if the answer is yes, `mealPlanId` becomes nullable and the `MealPlan` relation becomes optional — a cheap, non-breaking column change (all existing rows already have it populated, no backfill needed). If the answer is no for v1 (ad-hoc items only get added *into* an existing meal-plan-derived list), zero additional schema change is needed beyond the enum value above. Recommendation: default to "no" for v1 and treat standalone lists as a separate, later product decision.

### 4. Migration/deployment risk

Low, and lower than Option B's. `ALTER TYPE "IngredientCategory" ADD VALUE 'household'` is metadata-only in Postgres — no table rewrite, no lock contention, negligible cost on the Pi's tuned instance; Prisma Migrate runs it as its own non-transactional step automatically. No new indexes needed — don't add one on `category` at this scale (a sequential scan over a small ingredient table is cheaper than the storage/write overhead of another index, consistent with the Pi's conservative-write posture). Contrast with Option B: its `ADD COLUMN` calls are also cheap DDL, but if it goes on to nullify `mealPlanId` as well, the real cost isn't the migration — it's every query and UI surface that currently assumes `groceryList.mealPlan` is non-null needing a null-check, which is a materially wider blast radius than this recommendation touches.
