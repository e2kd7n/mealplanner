# MUI 9 Visual Testing Guide

**For PR #269** — `@mui/material` + `@mui/icons-material` 7 → 9.1.2

MUI 9 changed how slot props and system props work. The upgrade touches 26 files across every major page. This guide gives a page-by-page checklist for confirming nothing regressed visually or interactively.

---

## What changed and what can break

| Change | Risk |
|---|---|
| `InputProps`/`inputProps` → `slotProps` on TextField | Password show/hide toggles, search adornments, input constraints (`min`/`max`) |
| `InputLabelProps={{ shrink }}` → `slotProps.inputLabel` | Date field labels overlapping the value |
| Checkbox `inputProps` → `slotProps.input` | `aria-label` missing (screen readers); checked state still works |
| `primaryTypographyProps` → `slotProps.primary` on ListItemText | Text variant/weight in search suggestions and lists |
| Typography/Stack/Box system props → `sx` | Any layout shift or missing spacing/font weight |
| `ChatBubbleOutline` → `ChatBubbleOutlined` | Feedback FAB icon missing entirely |

---

## Checklist

### Auth pages

**`/login`**
- [ ] Email and password fields render with labels
- [ ] Password show/hide eye icon appears and toggles visibility
- [ ] Disabled state (during submit) greys out correctly

**`/register`**
- [ ] All three fields (email, password, confirm password) render
- [ ] Password and confirm-password show/hide toggles work independently
- [ ] Error state (mismatched passwords) shows helper text

**`/welcome`** (admin first-run setup)
- [ ] Family name, email, password, confirm-password all render
- [ ] Password show/hide toggles work
- [ ] Password strength helper text appears below the field

---

### FTUE / member login

**`/login`** → Classic sign-in link → **LocalLogin**
- [ ] "Family Meal Planner" heading has correct weight
- [ ] Member tiles render

**`/member-welcome`**
- [ ] Slide headings (`Hey, [name]!` etc.) display at the right size/weight
- [ ] Slide body text is readable
- [ ] Back/Next/Let's go buttons render correctly

**`/setup`** (wizard)
- [ ] Step labels render on the stepper
- [ ] Family member name fields accept input
- [ ] Spoonacular API key field shows show/hide toggle
- [ ] Stock image picker renders (Step 1b)

---

### Main app

**`/dashboard`**
- [ ] Pantry alert text (`Alert.name — Alert.status`) lines stack correctly (one per line)
- [ ] Empty-state text and quick-action buttons render

**`/recipes`**
- [ ] Search bar shows magnifying-glass adornment on the left
- [ ] Clear (×) adornment appears when search has text
- [ ] Recipe cards render with correct spacing

**`/browse-recipes`** (Spoonacular)
- [ ] Search bar renders with adornment and helper text below
- [ ] Filter chips row wraps correctly on mobile
- [ ] Filter section header (`Filters (N active)`) text weight is correct

**`/create-recipe`**
- [ ] Prep time, cook time, servings number fields accept `min`/`max` (try entering 0 or negatives — should be constrained)
- [ ] Nutrition info fields (calories, protein, etc.) accept numbers
- [ ] Instructions list: each step row lays out correctly (text field + delete button)
- [ ] Review step: chip row (difficulty, meal types, etc.) wraps on mobile

**`/import-recipe`**
- [ ] URL field renders with paste/loading adornment
- [ ] Error/success helper text appears below the field

**`/recipes/[id]`** (Recipe Detail)
- [ ] Servings number field in scaling section has correct `min`/`max`
- [ ] "Add to meal plan" date picker: label does not overlap the date value
- [ ] Servings number field in the plan dialog has correct constraints

**`/meal-planner`**
- [ ] Recipe search Autocomplete shows options; adornment renders
- [ ] Servings number field in add-meal dialog respects `min: 1`
- [ ] Date field in custom-date dialog: label shrinks correctly above the date value

**`/grocery-list`**
- [ ] Checkboxes check/uncheck correctly
- [ ] Checked items show strikethrough
- [ ] Item row layout (checkbox + text + actions) is correct

**`/pantry`**
- [ ] Expiry date field: label shrinks above the date value (not overlapping)
- [ ] Add/edit pantry item dialog fields render

**`/admin`**
- [ ] Password reset field shows show/hide toggle
- [ ] Stats cards lay out with correct spacing
- [ ] User table and action buttons render

---

### Components

**Feedback FAB** (bottom-right button on all pages)
- [ ] Chat bubble icon is visible (was `ChatBubbleOutline`, now `ChatBubbleOutlined`)

**Search suggestions dropdown** (`/browse-recipes`, `/recipes`)
- [ ] Suggestion text uses `body2` size (smaller than default)
- [ ] Emoji icons in suggestions render at `1.2rem`

**Batch cooking dialog** (`/meal-planner` → batch cook option)
- [ ] Header row (title + close button) lays out side by side
- [ ] Day-selector chips wrap to multiple rows on narrow screens
- [ ] Servings multiplier field accepts decimals

---

## Mobile-specific checks

Run these on a phone or with DevTools set to a 390px viewport:

- [ ] `/member-welcome` — swipe left/right between slides works
- [ ] `/browse-recipes` — filter chips wrap (don't overflow)
- [ ] `/create-recipe` — ingredient rows don't overflow horizontally
- [ ] `/grocery-list` — MobileGroceryList checkboxes have sufficient tap target

---

## Automated coverage

The E2E suite in `frontend/e2e/` covers login, FTUE, and core recipe flows. Run it against the Pi before merging:

```bash
BASE_URL=http://192.168.4.110 npm run test:e2e
```

Known pre-existing lint warnings (not regressions from this PR) are tracked in the open lint issues.
