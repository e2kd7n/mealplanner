# Recipe Search & Discovery Improvements Plan

**Issue:** #120 - [P2][SEARCH] Improve Recipe Search & Discovery  
**Status:** Planned  
**Estimate:** 3-4 days  
**Priority:** Medium

## Current Implementation

### Existing Features ✅

The application currently has robust search functionality:

#### BrowseRecipes Page ([`frontend/src/pages/BrowseRecipes.tsx`](frontend/src/pages/BrowseRecipes.tsx:1))
- **Text Search**: Full-text search with debouncing (500ms)
- **Filters**:
  - Cuisine type (Italian, Mexican, Asian, etc.)
  - Diet type (Vegetarian, Vegan, Gluten-Free, etc.)
  - Meal type (Breakfast, Lunch, Dinner, Snack)
  - Max cooking time (slider)
  - Sort options (Popularity, Time, Calories)
- **Active Filter Indicators**: Badge showing count of active filters
- **Clear Filters**: One-click to reset all filters
- **URL Persistence**: Search params saved in URL for sharing/bookmarking
- **Keyboard Shortcuts**: Ctrl+K to focus search, Escape to clear
- **Responsive Design**: Mobile-optimized filter layout

#### Recipes Page ([`frontend/src/pages/Recipes.tsx`](frontend/src/pages/Recipes.tsx:1))
- **My Recipes Search**: Search personal recipe collection
- **Filters**: Difficulty, Meal Type, Cleanup Score
- **Sort Options**: Title, Date, Prep Time
- **Pagination**: Efficient loading of large recipe collections

### Technical Implementation

**Search Debouncing:**
```typescript
const debouncedSearch = useDebounce(searchQuery, 500);
```

**Filter State Management:**
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [cuisine, setCuisine] = useState('');
const [diet, setDiet] = useState('');
const [mealType, setMealType] = useState('');
const [maxTime, setMaxTime] = useState(0);
const [sortBy, setSortBy] = useState('popularity');
```

**API Integration:**
- Spoonacular API for external recipes
- Internal API for user recipes
- Efficient caching with Redux

## Required Improvements

### 1. Natural Language Search 🔄

**Goal**: Understand queries like "quick dinner for two" or "healthy breakfast under 30 minutes"

**Implementation Plan:**
- Parse natural language queries to extract:
  - Time constraints ("quick", "under 30 minutes")
  - Serving size ("for two", "for 4 people")
  - Dietary preferences ("healthy", "vegetarian")
  - Meal type ("dinner", "breakfast")
- Map keywords to filters automatically
- Show "interpreted as" message to user

**Example Parsing:**
```typescript
interface ParsedQuery {
  keywords: string[];
  maxTime?: number;
  servings?: number;
  diet?: string;
  mealType?: string;
}

function parseNaturalLanguage(query: string): ParsedQuery {
  // Extract time: "quick" = 30min, "under X minutes" = X
  // Extract servings: "for two" = 2, "for 4 people" = 4
  // Extract diet: "healthy", "vegetarian", "vegan"
  // Extract meal: "dinner", "breakfast", "lunch"
}
```

**Files to Modify:**
- Create: `frontend/src/utils/searchParser.ts`
- Modify: `frontend/src/pages/BrowseRecipes.tsx`
- Modify: `frontend/src/store/slices/recipeBrowseSlice.ts`

**Estimated Time:** 1 day

---

### 2. Ingredient-Based Search 🔄

**Goal**: Search by ingredients ("recipes with chicken and rice", "what can I make with tomatoes")

**Implementation Plan:**
- Add ingredient input field with autocomplete
- Support multiple ingredient selection
- Filter recipes that contain ALL selected ingredients
- Show "missing ingredients" count for partial matches
- Integration with pantry for "use what I have" feature

**UI Components:**
```typescript
<Autocomplete
  multiple
  options={commonIngredients}
  value={selectedIngredients}
  onChange={handleIngredientChange}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Search by ingredients"
      placeholder="Add ingredients..."
    />
  )}
/>
```

**API Enhancement:**
```typescript
// Backend: Add ingredient search endpoint
GET /api/recipes/search/by-ingredients
Query params: ingredients[]=chicken&ingredients[]=rice
```

**Files to Modify:**
- Create: `backend/src/routes/recipes/searchByIngredients.ts`
- Modify: `frontend/src/pages/BrowseRecipes.tsx`
- Modify: `frontend/src/store/slices/recipeBrowseSlice.ts`

**Estimated Time:** 1.5 days

---

### 3. Search Suggestions & Autocomplete 🔄

**Goal**: Provide helpful suggestions as user types

**Implementation Plan:**
- **Autocomplete Dropdown**:
  - Recent searches (from localStorage)
  - Popular searches (from analytics)
  - Trending recipes (from API)
  - Ingredient suggestions
- **Debounced Suggestions**: Load after 300ms of typing
- **Keyboard Navigation**: Arrow keys to navigate, Enter to select
- **Click to Apply**: Click suggestion to populate search

**Data Structure:**
```typescript
interface SearchSuggestion {
  type: 'recent' | 'popular' | 'ingredient' | 'recipe';
  text: string;
  count?: number; // For popular searches
  icon?: React.ReactNode;
}
```

**Storage:**
```typescript
// localStorage for recent searches
const recentSearches = JSON.parse(
  localStorage.getItem('recentSearches') || '[]'
);

// Limit to 10 most recent
const addRecentSearch = (query: string) => {
  const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
  localStorage.setItem('recentSearches', JSON.stringify(updated));
};
```

**Files to Modify:**
- Create: `frontend/src/components/SearchSuggestions.tsx`
- Create: `frontend/src/hooks/useSearchSuggestions.ts`
- Modify: `frontend/src/pages/BrowseRecipes.tsx`
- Create: `backend/src/routes/search/suggestions.ts`

**Estimated Time:** 1 day

---

### 4. Typo Tolerance & Synonyms 🔄

**Goal**: Handle misspellings and understand synonyms

**Implementation Plan:**
- **Fuzzy Matching**: Use Levenshtein distance for typo tolerance
- **Synonym Mapping**: Map common synonyms
  - "pasta" → "noodles", "spaghetti", "penne"
  - "chicken" → "poultry"
  - "quick" → "fast", "easy", "simple"
- **Did You Mean**: Suggest corrections for likely typos
- **Backend Implementation**: Use PostgreSQL full-text search with trigrams

**Synonym Dictionary:**
```typescript
const synonyms: Record<string, string[]> = {
  pasta: ['noodles', 'spaghetti', 'penne', 'linguine'],
  chicken: ['poultry', 'hen'],
  quick: ['fast', 'easy', 'simple', 'rapid'],
  healthy: ['nutritious', 'wholesome', 'light'],
  // ... more synonyms
};
```

**PostgreSQL Setup:**
```sql
-- Enable trigram extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index for full-text search
CREATE INDEX recipes_search_idx ON recipes 
USING GIN (to_tsvector('english', title || ' ' || description));

-- Create trigram index for typo tolerance
CREATE INDEX recipes_title_trgm_idx ON recipes 
USING GIN (title gin_trgm_ops);
```

**Files to Modify:**
- Create: `backend/src/utils/searchSynonyms.ts`
- Create: `backend/src/utils/fuzzyMatch.ts`
- Modify: `backend/src/routes/recipes/search.ts`
- Create: `backend/prisma/migrations/add_search_indexes.sql`

**Estimated Time:** 1 day

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 days)
1. ✅ Search suggestions with recent searches (localStorage)
2. ✅ Popular searches display
3. ✅ Basic synonym support (client-side)

### Phase 2: Core Features (2-3 days)
1. Natural language parsing
2. Ingredient-based search
3. Backend fuzzy matching

### Phase 3: Polish (1 day)
1. Advanced typo tolerance
2. Personalized suggestions
3. Search analytics

## Success Metrics

### Target Metrics
- **Search Success Rate**: 80%+ (user finds what they're looking for)
- **Zero Results Rate**: <10% (reduce "no results" searches)
- **Search Speed**: <1 second response time
- **User Engagement**: 30%+ increase in recipe discovery

### Measurement
```typescript
// Track search metrics
interface SearchMetrics {
  query: string;
  resultsCount: number;
  filtersApplied: string[];
  timeToResults: number;
  userClickedResult: boolean;
  timestamp: Date;
}
```

## Testing Plan

### Unit Tests
- [ ] Natural language parser
- [ ] Synonym mapping
- [ ] Fuzzy matching algorithm
- [ ] Search suggestion generation

### Integration Tests
- [ ] Search API endpoints
- [ ] Filter combinations
- [ ] Pagination with search
- [ ] URL parameter persistence

### E2E Tests
```typescript
test('Natural language search works', async ({ page }) => {
  await page.goto('/recipes');
  await page.fill('input[placeholder*="Search"]', 'quick dinner for two');
  await page.waitForSelector('[data-testid="recipe-card"]');
  
  // Verify filters were applied
  expect(await page.locator('text=Max Time: 30 min').count()).toBe(1);
  expect(await page.locator('text=Servings: 2').count()).toBe(1);
});

test('Ingredient search finds recipes', async ({ page }) => {
  await page.goto('/recipes');
  await page.click('button:has-text("Search by Ingredients")');
  await page.fill('input[placeholder*="Add ingredients"]', 'chicken');
  await page.keyboard.press('Enter');
  await page.fill('input[placeholder*="Add ingredients"]', 'rice');
  await page.keyboard.press('Enter');
  
  // Verify results contain both ingredients
  const recipes = await page.locator('[data-testid="recipe-card"]').all();
  expect(recipes.length).toBeGreaterThan(0);
});
```

### Manual Testing
- [ ] Test various natural language queries
- [ ] Test ingredient combinations
- [ ] Test typo handling
- [ ] Test mobile responsiveness
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility

## User Feedback Integration

### Beta Testing Questions
1. "How easy was it to find recipes using search?"
2. "Did the search understand what you were looking for?"
3. "Were the suggestions helpful?"
4. "What search features would you like to see?"

### Iteration Plan
1. Release Phase 1 to beta users
2. Collect feedback and metrics
3. Adjust Phase 2 based on data
4. Iterate on Phase 3 features

## Dependencies

### Frontend
- `@mui/material` - Already installed
- `fuse.js` - For fuzzy search (optional, can use custom)
- No additional dependencies needed

### Backend
- PostgreSQL extensions: `pg_trgm` (for trigrams)
- No additional npm packages needed

## Rollout Plan

### Week 1
- Implement search suggestions
- Add recent searches
- Deploy to staging

### Week 2
- Implement natural language parsing
- Add ingredient search
- Beta testing

### Week 3
- Implement typo tolerance
- Add synonyms
- Performance optimization

### Week 4
- Final testing
- Documentation
- Production deployment

## Documentation

### User Documentation
- Create help article: "How to Search for Recipes"
- Add tooltips for search features
- Create video tutorial

### Developer Documentation
- API documentation for search endpoints
- Search algorithm explanation
- Performance optimization guide

## Future Enhancements

### Phase 4 (Future)
- **AI-Powered Search**: Use ML for better query understanding
- **Visual Search**: Search by uploading food images
- **Voice Search**: "Hey Meal Planner, find me a quick dinner"
- **Personalized Results**: Rank based on user preferences
- **Collaborative Filtering**: "Users who liked X also liked Y"

---

**Status**: Ready for implementation  
**Next Steps**: Begin Phase 1 implementation  
**Owner**: Development Team  
**Reviewers**: Product, UX, Engineering

---

**Made with Bob**