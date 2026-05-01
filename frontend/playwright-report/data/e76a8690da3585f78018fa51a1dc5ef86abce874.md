# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recipes/edit.spec.ts >> Edit Recipe >> should edit an existing recipe
- Location: e2e/tests/recipes/edit.spec.ts:4:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: /view recipe/i }).first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: Recipes
      - button "account of current user" [ref=e7] [cursor=pointer]:
        - generic [ref=e8]: U
  - navigation [ref=e9]:
    - generic [ref=e11]:
      - generic [ref=e13]: Meal Planner
      - list [ref=e14]:
        - listitem [ref=e15]:
          - button "Dashboard" [ref=e16] [cursor=pointer]:
            - img [ref=e18]
            - generic [ref=e21]: Dashboard
        - listitem [ref=e22]:
          - button "Recipes" [ref=e23] [cursor=pointer]:
            - img [ref=e25]
            - generic [ref=e28]: Recipes
        - listitem [ref=e29]:
          - button "Meal Planner" [ref=e30] [cursor=pointer]:
            - img [ref=e32]
            - generic [ref=e35]: Meal Planner
        - listitem [ref=e36]:
          - button "Grocery List" [ref=e37] [cursor=pointer]:
            - img [ref=e39]
            - generic [ref=e42]: Grocery List
        - listitem [ref=e43]:
          - button "Pantry" [ref=e44] [cursor=pointer]:
            - img [ref=e46]
            - generic [ref=e49]: Pantry
  - main [ref=e50]:
    - generic [ref=e52]:
      - generic [ref=e53]:
        - heading "Recipes" [level=4] [ref=e54]
        - generic [ref=e55]:
          - button "Import from URL" [ref=e56] [cursor=pointer]:
            - img [ref=e58]
            - text: Import from URL
          - button "Create Recipe" [ref=e60] [cursor=pointer]:
            - img [ref=e62]
            - text: Create Recipe
      - generic [ref=e64]:
        - generic [ref=e66]:
          - img [ref=e68]
          - textbox "Search recipes..." [ref=e70]
          - group
        - generic [ref=e71]:
          - generic: Difficulty
          - generic [ref=e72]:
            - combobox [ref=e73] [cursor=pointer]
            - textbox
            - img
            - group:
              - generic: Difficulty
        - generic [ref=e74]:
          - generic: Meal Type
          - generic [ref=e75]:
            - combobox [ref=e76] [cursor=pointer]
            - textbox
            - img
            - group:
              - generic: Meal Type
        - generic [ref=e77]:
          - generic: Cleanup
          - generic [ref=e78]:
            - combobox [ref=e79] [cursor=pointer]
            - textbox
            - img
            - group:
              - generic: Cleanup
        - generic [ref=e80]:
          - generic [ref=e81]: Sort By
          - generic [ref=e82]:
            - combobox [ref=e83] [cursor=pointer]: Title (A-Z)
            - textbox: title
            - img
            - group:
              - generic: Sort By
      - generic [ref=e84]:
        - generic [ref=e85]:
          - img "Apple Pie" [ref=e87]
          - generic [ref=e88]:
            - heading "Apple Pie" [level=6] [ref=e89]
            - paragraph [ref=e90]: Classic homemade apple pie
            - generic [ref=e91]:
              - 'generic "Difficulty: hard" [ref=e92]':
                - generic [ref=e93]: hard
              - 'generic "Prep: 30 min | Cook: 50 min" [ref=e94]':
                - img [ref=e95]
                - generic [ref=e98]: 80 min
              - 'generic "Meal type: undefined" [ref=e99]'
          - button "View Recipe" [ref=e101] [cursor=pointer]
        - generic [ref=e102]:
          - img "Avocado Toast" [ref=e104]
          - generic [ref=e105]:
            - heading "Avocado Toast" [level=6] [ref=e106]
            - paragraph [ref=e107]: Simple avocado toast with eggs
            - generic [ref=e108]:
              - 'generic "Difficulty: easy" [ref=e109]':
                - generic [ref=e110]: easy
              - 'generic "Prep: 5 min | Cook: 5 min" [ref=e111]':
                - img [ref=e112]
                - generic [ref=e115]: 10 min
              - 'generic "Meal type: undefined" [ref=e116]'
          - button "View Recipe" [ref=e118] [cursor=pointer]
        - generic [ref=e119]:
          - img "BBQ Ribs" [ref=e121]
          - generic [ref=e122]:
            - heading "BBQ Ribs" [level=6] [ref=e123]
            - paragraph [ref=e124]: Slow-cooked BBQ pork ribs
            - generic [ref=e125]:
              - 'generic "Difficulty: medium" [ref=e126]':
                - generic [ref=e127]: medium
              - 'generic "Prep: 15 min | Cook: 180 min" [ref=e128]':
                - img [ref=e129]
                - generic [ref=e132]: 195 min
              - 'generic "Meal type: undefined" [ref=e133]'
          - button "View Recipe" [ref=e135] [cursor=pointer]
        - generic [ref=e136]:
          - img "BLT Sandwich" [ref=e138]
          - generic [ref=e139]:
            - heading "BLT Sandwich" [level=6] [ref=e140]
            - paragraph [ref=e141]: Classic bacon, lettuce, and tomato sandwich
            - generic [ref=e142]:
              - 'generic "Difficulty: easy" [ref=e143]':
                - generic [ref=e144]: easy
              - 'generic "Prep: 10 min | Cook: 10 min" [ref=e145]':
                - img [ref=e146]
                - generic [ref=e149]: 20 min
              - 'generic "Meal type: undefined" [ref=e150]'
          - button "View Recipe" [ref=e152] [cursor=pointer]
        - generic [ref=e153]:
          - img "Beef Stir Fry" [ref=e155]
          - generic [ref=e156]:
            - heading "Beef Stir Fry" [level=6] [ref=e157]
            - paragraph [ref=e158]: Quick beef and vegetable stir fry
            - generic [ref=e159]:
              - 'generic "Difficulty: medium" [ref=e160]':
                - generic [ref=e161]: medium
              - 'generic "Prep: 15 min | Cook: 15 min" [ref=e162]':
                - img [ref=e163]
                - generic [ref=e166]: 30 min
              - 'generic "Meal type: undefined" [ref=e167]'
          - button "View Recipe" [ref=e169] [cursor=pointer]
        - generic [ref=e170]:
          - img "Beef Tacos" [ref=e172]
          - generic [ref=e173]:
            - heading "Beef Tacos" [level=6] [ref=e174]
            - paragraph [ref=e175]: Seasoned ground beef tacos
            - generic [ref=e176]:
              - 'generic "Difficulty: easy" [ref=e177]':
                - generic [ref=e178]: easy
              - 'generic "Prep: 10 min | Cook: 15 min" [ref=e179]':
                - img [ref=e180]
                - generic [ref=e183]: 25 min
              - 'generic "Meal type: undefined" [ref=e184]'
          - button "View Recipe" [ref=e186] [cursor=pointer]
        - generic [ref=e187]:
          - img "Breakfast Burrito" [ref=e189]
          - generic [ref=e190]:
            - heading "Breakfast Burrito" [level=6] [ref=e191]
            - paragraph [ref=e192]: Hearty breakfast burrito with eggs and cheese
            - generic [ref=e193]:
              - 'generic "Difficulty: easy" [ref=e194]':
                - generic [ref=e195]: easy
              - 'generic "Prep: 10 min | Cook: 15 min" [ref=e196]':
                - img [ref=e197]
                - generic [ref=e200]: 25 min
              - 'generic "Meal type: undefined" [ref=e201]'
          - button "View Recipe" [ref=e203] [cursor=pointer]
        - generic [ref=e204]:
          - img "Breakfast Hash" [ref=e206]
          - generic [ref=e207]:
            - heading "Breakfast Hash" [level=6] [ref=e208]
            - paragraph [ref=e209]: Crispy potato and vegetable hash
            - generic [ref=e210]:
              - 'generic "Difficulty: medium" [ref=e211]':
                - generic [ref=e212]: medium
              - 'generic "Prep: 10 min | Cook: 20 min" [ref=e213]':
                - img [ref=e214]
                - generic [ref=e217]: 30 min
              - 'generic "Meal type: undefined" [ref=e218]'
          - button "View Recipe" [ref=e220] [cursor=pointer]
        - generic [ref=e221]:
          - img "Breakfast Smoothie" [ref=e223]
          - generic [ref=e224]:
            - heading "Breakfast Smoothie" [level=6] [ref=e225]
            - paragraph [ref=e226]: Protein-packed fruit smoothie
            - generic [ref=e227]:
              - 'generic "Difficulty: easy" [ref=e228]':
                - generic [ref=e229]: easy
              - 'generic "Prep: 5 min | Cook: 0 min" [ref=e230]':
                - img [ref=e231]
                - generic [ref=e234]: 5 min
              - 'generic "Meal type: undefined" [ref=e235]'
          - button "View Recipe" [ref=e237] [cursor=pointer]
        - generic [ref=e238]:
          - img "Brownies" [ref=e240]
          - generic [ref=e241]:
            - heading "Brownies" [level=6] [ref=e242]
            - paragraph [ref=e243]: Fudgy chocolate brownies
            - generic [ref=e244]:
              - 'generic "Difficulty: easy" [ref=e245]':
                - generic [ref=e246]: easy
              - 'generic "Prep: 15 min | Cook: 30 min" [ref=e247]':
                - img [ref=e248]
                - generic [ref=e251]: 45 min
              - 'generic "Meal type: undefined" [ref=e252]'
          - button "View Recipe" [ref=e254] [cursor=pointer]
        - generic [ref=e255]:
          - img "Caesar Salad" [ref=e257]
          - generic [ref=e258]:
            - heading "Caesar Salad" [level=6] [ref=e259]
            - paragraph [ref=e260]: Classic Caesar salad with homemade dressing
            - generic [ref=e261]:
              - 'generic "Difficulty: easy" [ref=e262]':
                - generic [ref=e263]: easy
              - 'generic "Prep: 15 min | Cook: 0 min" [ref=e264]':
                - img [ref=e265]
                - generic [ref=e268]: 15 min
              - 'generic "Meal type: undefined" [ref=e269]'
          - button "View Recipe" [ref=e271] [cursor=pointer]
        - generic [ref=e272]:
          - img "Caprese Sandwich" [ref=e274]
          - generic [ref=e275]:
            - heading "Caprese Sandwich" [level=6] [ref=e276]
            - paragraph [ref=e277]: Fresh mozzarella, tomato, and basil sandwich
            - generic [ref=e278]:
              - 'generic "Difficulty: easy" [ref=e279]':
                - generic [ref=e280]: easy
              - 'generic "Prep: 10 min | Cook: 0 min" [ref=e281]':
                - img [ref=e282]
                - generic [ref=e285]: 10 min
              - 'generic "Meal type: undefined" [ref=e286]'
          - button "View Recipe" [ref=e288] [cursor=pointer]
      - navigation "pagination navigation" [ref=e290]:
        - list [ref=e291]:
          - listitem [ref=e292]:
            - button "Go to previous page" [disabled]:
              - img
          - listitem [ref=e293]:
            - button "page 1" [ref=e294] [cursor=pointer]: "1"
          - listitem [ref=e295]:
            - button "Go to page 2" [ref=e296] [cursor=pointer]: "2"
          - listitem [ref=e297]:
            - button "Go to page 3" [ref=e298] [cursor=pointer]: "3"
          - listitem [ref=e299]:
            - button "Go to page 4" [ref=e300] [cursor=pointer]: "4"
          - listitem [ref=e301]:
            - button "Go to next page" [ref=e302] [cursor=pointer]:
              - img [ref=e303]
```

# Test source

```ts
  1  | import { test, expect } from '../../fixtures/auth.fixture';
  2  | 
  3  | test.describe('Edit Recipe', () => {
  4  |   test('should edit an existing recipe', async ({ authenticatedPage }) => {
  5  |     // Navigate to recipes page
  6  |     await authenticatedPage.goto('/recipes');
  7  |     
  8  |     // Click on first recipe
> 9  |     await authenticatedPage.getByRole('link', { name: /view recipe/i }).first().click();
     |                                                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
  10 |     
  11 |     // Click edit button
  12 |     await authenticatedPage.getByRole('button', { name: /edit/i }).click();
  13 |     
  14 |     // Should navigate to edit page
  15 |     await expect(authenticatedPage).toHaveURL(/\/recipes\/\d+\/edit/);
  16 |     
  17 |     // Update title
  18 |     const titleInput = authenticatedPage.getByLabel(/title/i);
  19 |     await titleInput.clear();
  20 |     await titleInput.fill('Updated Recipe Title');
  21 |     
  22 |     // Update description
  23 |     const descInput = authenticatedPage.getByLabel(/description/i);
  24 |     await descInput.clear();
  25 |     await descInput.fill('Updated description');
  26 |     
  27 |     // Save changes
  28 |     await authenticatedPage.getByRole('button', { name: /save changes/i }).click();
  29 |     
  30 |     // Should redirect back to recipe detail
  31 |     await expect(authenticatedPage).toHaveURL(/\/recipes\/\d+$/);
  32 |     
  33 |     // Should show success message
  34 |     await expect(authenticatedPage.getByText(/recipe updated successfully/i)).toBeVisible();
  35 |     
  36 |     // Should display updated title
  37 |     await expect(authenticatedPage.getByRole('heading', { name: /updated recipe title/i })).toBeVisible();
  38 |   });
  39 | 
  40 |   test('should cancel editing', async ({ authenticatedPage }) => {
  41 |     await authenticatedPage.goto('/recipes');
  42 |     
  43 |     // Click on first recipe
  44 |     await authenticatedPage.getByRole('link', { name: /view recipe/i }).first().click();
  45 |     const recipeUrl = authenticatedPage.url();
  46 |     
  47 |     // Click edit button
  48 |     await authenticatedPage.getByRole('button', { name: /edit/i }).click();
  49 |     
  50 |     // Make some changes
  51 |     await authenticatedPage.getByLabel(/title/i).fill('Changed Title');
  52 |     
  53 |     // Click cancel
  54 |     await authenticatedPage.getByRole('button', { name: /cancel/i }).click();
  55 |     
  56 |     // Should navigate back to recipe detail
  57 |     await expect(authenticatedPage).toHaveURL(recipeUrl);
  58 |     
  59 |     // Changes should not be saved
  60 |     await expect(authenticatedPage.getByRole('heading', { name: /changed title/i })).not.toBeVisible();
  61 |   });
  62 | 
  63 |   test('should show validation errors when clearing required fields', async ({ authenticatedPage }) => {
  64 |     await authenticatedPage.goto('/recipes');
  65 |     
  66 |     // Click on first recipe
  67 |     await authenticatedPage.getByRole('link', { name: /view recipe/i }).first().click();
  68 |     
  69 |     // Click edit button
  70 |     await authenticatedPage.getByRole('button', { name: /edit/i }).click();
  71 |     
  72 |     // Clear required fields
  73 |     await authenticatedPage.getByLabel(/title/i).clear();
  74 |     await authenticatedPage.getByLabel(/description/i).clear();
  75 |     
  76 |     // Try to save
  77 |     await authenticatedPage.getByRole('button', { name: /save changes/i }).click();
  78 |     
  79 |     // Should show validation errors
  80 |     await expect(authenticatedPage.getByText(/title is required/i)).toBeVisible();
  81 |     await expect(authenticatedPage.getByText(/description is required/i)).toBeVisible();
  82 |   });
  83 | });
  84 | 
  85 | // Made with Bob
  86 | 
```