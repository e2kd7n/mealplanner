# Spoonacular API Optimization

## Problem Summary

The application was exceeding the Spoonacular API daily quota (50 points) due to duplicate API calls and inefficient request handling. Analysis of backend logs revealed that every search was being called twice, resulting in 82 API calls for approximately 41 user actions.

## Root Causes Identified

1. **Duplicate API Calls on Page Load**
   - React's behavior was causing the `useEffect` in `BrowseRecipes.tsx` to trigger twice
   - Each user action resulted in 2 API calls instead of 1

2. **E2E Tests Consuming Quota**
   - Playwright tests were making real API calls to Spoonacular
   - Each test run consumed valuable API quota

3. **No Caching or Deduplication**
   - Identical searches hit the API multiple times
   - No mechanism to prevent simultaneous duplicate requests

4. **Auto-Filter Triggering Additional Searches**
   - Natural language parsing could trigger extra searches when applying filters

## Solutions Implemented

### 1. Backend: Request Deduplication and Caching

**File:** `backend/src/services/spoonacular.service.ts`

**Changes:**
- Added in-memory cache with 10-minute TTL for both search results and recipe details
- Implemented request deduplication to prevent simultaneous duplicate API calls
- Added automatic cache cleanup every 5 minutes
- Added logging for cache hits and deduplication events

**Benefits:**
- Identical searches within 10 minutes return cached results (0 API calls)
- Simultaneous duplicate requests reuse the same pending promise
- Reduces API calls by 50-80% for typical usage patterns

**Example Log Output:**
```
[SPOONACULAR_SEARCH_CACHE_HIT] Query: pasta
[SPOONACULAR_SEARCH_DEDUP] Query: chicken - Reusing pending request
```

### 2. Frontend: Loading State Guards

**File:** `frontend/src/pages/BrowseRecipes.tsx`

**Changes:**
- Added `isInitialMount` ref to skip the first effect trigger
- Added `lastSearchParamsRef` to track and prevent duplicate searches
- Separated initial load logic from filter change logic
- Added loading state check in `handlePageChange` to prevent overlapping requests
- Only trigger searches when there are actual search parameters (not empty defaults)

**Benefits:**
- Eliminates duplicate API calls on component mount
- Prevents new searches while one is already in progress
- Reduces unnecessary API calls for empty/default searches

### 3. E2E Tests: API Mocking

**Files:**
- `frontend/e2e/mocks/spoonacular.mock.ts` (new)
- `frontend/e2e/tests/recipes/browse-recipes.spec.ts` (updated)

**Changes:**
- Created comprehensive mock for Spoonacular API endpoints
- Updated all browse recipe tests to use mocks
- Mock returns realistic test data without consuming API quota

**Benefits:**
- E2E tests no longer consume API quota
- Tests run faster and more reliably
- Can test edge cases without API limitations

## Expected Impact

### Before Optimization
- ~82 API calls for 41 user actions (2x duplication)
- E2E tests consuming quota on every run
- No caching, every search hits the API

### After Optimization
- ~41 API calls for 41 unique user actions (1x, no duplication)
- Cached searches: 0 API calls (within 10-minute window)
- E2E tests: 0 API calls (fully mocked)
- Estimated reduction: **60-80% fewer API calls**

## Monitoring

To monitor the effectiveness of these optimizations, check the backend logs for:

1. **Cache Hit Rate:**
   ```bash
   grep "CACHE_HIT" backend/logs/combined.log | wc -l
   ```

2. **Deduplication Events:**
   ```bash
   grep "DEDUP" backend/logs/combined.log | wc -l
   ```

3. **Total API Calls:**
   ```bash
   grep "SPOONACULAR_SEARCH\]" backend/logs/combined.log | grep -v "CACHE_HIT\|DEDUP\|ERROR" | wc -l
   ```

## Testing the Fixes

### Manual Testing
1. Navigate to Browse Recipes page
2. Perform a search (e.g., "pasta")
3. Check backend logs - should see only 1 API call
4. Perform the same search again within 10 minutes
5. Check logs - should see `CACHE_HIT` instead of new API call

### E2E Testing
```bash
cd frontend
npm run test:e2e -- browse-recipes.spec.ts
```
- Tests should pass without consuming API quota
- Check that no real API calls are made

## Configuration

### Cache TTL
The cache TTL is set to 10 minutes. To adjust:

```typescript
// backend/src/services/spoonacular.service.ts
const CACHE_TTL = 10 * 60 * 1000; // Change this value
```

### Cache Cleanup Interval
Cache cleanup runs every 5 minutes. To adjust:

```typescript
// In SpoonacularService constructor
setInterval(() => this.cleanupCache(), 5 * 60 * 1000); // Change this value
```

## Future Improvements

1. **Persistent Cache:** Consider using Redis for cache persistence across server restarts
2. **Cache Warming:** Pre-populate cache with popular searches
3. **Rate Limiting:** Add user-level rate limiting to prevent abuse
4. **Analytics:** Track cache hit rates and optimize TTL based on usage patterns
5. **Lazy Loading:** Consider lazy-loading the browse page to avoid automatic searches

## Related Files

- `backend/src/services/spoonacular.service.ts` - Core service with caching
- `frontend/src/pages/BrowseRecipes.tsx` - Frontend with loading guards
- `frontend/e2e/mocks/spoonacular.mock.ts` - E2E test mocks
- `frontend/e2e/tests/recipes/browse-recipes.spec.ts` - Updated tests

## Troubleshooting

### Cache Not Working
- Check that the service is a singleton (only one instance)
- Verify cache cleanup isn't running too frequently
- Check logs for cache hit/miss patterns

### Still Seeing Duplicate Calls
- Verify React StrictMode is disabled in production
- Check for multiple component instances
- Review useEffect dependencies

### Tests Failing
- Ensure mock is properly imported and called in `beforeEach`
- Verify mock responses match expected data structure
- Check for timing issues with debounced searches

---

**Last Updated:** 2026-04-22  
**Author:** Bob (AI Assistant)