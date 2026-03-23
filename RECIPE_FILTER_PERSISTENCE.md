# Recipe Filter Persistence - UX Improvement

## Problem
When users applied filters on the Recipes page (search, difficulty, meal type, cleanup score) and then navigated to a recipe detail or meal planner, the filters would be lost when returning to the Recipes page. This created a poor user experience as users had to re-apply their filters repeatedly.

## Solution
Implemented URL query parameter persistence for all recipe filters. This approach provides multiple benefits:

### Benefits
1. **Filter Persistence**: Filters remain applied when navigating away and back
2. **Browser History**: Back/forward buttons work correctly with filter state
3. **Shareable URLs**: Users can share filtered recipe views via URL
4. **Bookmarkable**: Users can bookmark specific filtered views
5. **No Server State**: All state is client-side in the URL

## Implementation Details

### Changes Made to [`frontend/src/pages/Recipes.tsx`](frontend/src/pages/Recipes.tsx)

1. **Added `useSearchParams` hook**:
   ```typescript
   import { useNavigate, useSearchParams } from 'react-router-dom';
   const [searchParams, setSearchParams] = useSearchParams();
   ```

2. **Initialize state from URL parameters**:
   ```typescript
   const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
   const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
   const [mealType, setMealType] = useState(searchParams.get('mealType') || '');
   const [cleanupScore, setCleanupScore] = useState(searchParams.get('cleanup') || '');
   const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
   ```

3. **Sync URL with filter state**:
   ```typescript
   useEffect(() => {
     const params = new URLSearchParams();
     if (debouncedSearch) params.set('search', debouncedSearch);
     if (difficulty) params.set('difficulty', difficulty);
     if (mealType) params.set('mealType', mealType);
     if (cleanupScore) params.set('cleanup', cleanupScore);
     if (currentPage > 1) params.set('page', currentPage.toString());
     
     setSearchParams(params, { replace: true });
   }, [debouncedSearch, difficulty, mealType, cleanupScore, currentPage, setSearchParams]);
   ```

## URL Parameter Mapping

| Filter | URL Parameter | Example |
|--------|---------------|---------|
| Search | `search` | `?search=chicken` |
| Difficulty | `difficulty` | `?difficulty=easy` |
| Meal Type | `mealType` | `?mealType=dinner` |
| Cleanup Score | `cleanup` | `?cleanup=3` |
| Page | `page` | `?page=2` |

## Example URLs

- All breakfast recipes: `http://localhost:8080/recipes?mealType=breakfast`
- Easy dinner recipes: `http://localhost:8080/recipes?mealType=dinner&difficulty=easy`
- Search for "chicken" with minimal cleanup: `http://localhost:8080/recipes?search=chicken&cleanup=3`
- Page 2 of desserts: `http://localhost:8080/recipes?mealType=dessert&page=2`

## User Experience Flow

### Before Fix
1. User applies filters (e.g., "dinner" meal type)
2. User clicks on a recipe to view details
3. User clicks back to recipes
4. ❌ Filters are reset, showing all recipes again
5. User must re-apply filters

### After Fix
1. User applies filters (e.g., "dinner" meal type)
2. URL updates to `?mealType=dinner`
3. User clicks on a recipe to view details
4. User clicks back to recipes
5. ✅ Filters remain applied, still showing dinner recipes
6. URL still shows `?mealType=dinner`

## Technical Considerations

### Why URL Parameters Over Other Solutions?

1. **Redux Store**: Would persist across navigation but not shareable/bookmarkable
2. **sessionStorage**: Would persist but not shareable/bookmarkable
3. **localStorage**: Would persist too long and not shareable
4. **URL Parameters**: ✅ Best of all worlds - persistent, shareable, bookmarkable, and respects browser history

### Performance
- Uses `replace: true` to avoid cluttering browser history with every filter change
- Debounced search input (500ms) prevents excessive URL updates
- No additional API calls - existing fetch logic unchanged

## Testing

To test the fix:
1. Navigate to http://localhost:8080/recipes
2. Apply filters (e.g., select "Breakfast" meal type)
3. Click on any recipe to view details
4. Click browser back button or navigate back to recipes
5. ✅ Verify filters are still applied
6. ✅ Verify URL contains filter parameters
7. Copy URL and paste in new tab
8. ✅ Verify filters are applied in new tab

## Status
✅ **IMPLEMENTED** - Recipe filters now persist across navigation

---
*Made with Bob*