# Recipe Import Analysis & Tracking

## Purpose
This document tracks recipe import failures to identify patterns and improve parser compatibility across different recipe websites.

## How to Use
1. When a recipe import fails, check the backend logs for entries tagged with `[RECIPE_SCRAPE_FAILED]`, `[RECIPE_NO_DATA]`, or `[RECIPE_PARSE_FAILED]`
2. Add the failure details to the appropriate section below
3. Look for patterns in error types and website structures
4. Use this data to enhance the parser

## Log Tags Reference
- `[RECIPE_IMPORT_START]` - Import attempt initiated
- `[RECIPE_SCRAPE_SUCCESS]` - Successfully scraped raw data from website
- `[RECIPE_SCRAPE_FAILED]` - Failed to scrape data (network, parsing, or access issues)
- `[RECIPE_NO_DATA]` - Scraped but no recipe data found
- `[RECIPE_NO_INGREDIENTS]` - Recipe found but no ingredients
- `[RECIPE_NO_INSTRUCTIONS]` - Recipe found but no instructions
- `[RECIPE_PARSE_FAILED]` - Failed to parse scraped data
- `[RECIPE_IMPORT_SUCCESS]` - Successfully imported and parsed
- `[RECIPE_IMPORT_FAILED]` - Overall import failed

## Known Failing Websites

### AllRecipes.com
**Status:** ❌ BLOCKED BY CLOUDFLARE
**Test URLs:**
- https://www.allrecipes.com/recipe/56927/delicious-ham-and-potato-soup/
- https://www.allrecipes.com/recipe/135383/berry-delicious/

**Error Pattern:**
- Library error: "No application/ld+json tags found"
- Direct access: Cloudflare challenge page requiring JavaScript

**Data Structure:**
- AllRecipes.com uses Cloudflare bot protection
- Requires JavaScript execution to access actual page content
- Cannot be scraped with simple HTTP requests

**Root Cause:**
1. **Primary Issue:** Cloudflare bot detection prevents automated access
2. **Secondary Issue:** Even if accessible, AllRecipes.com may not use schema.org JSON-LD markup

**Technical Barriers:**
- Cloudflare challenge requires browser-like behavior
- JavaScript execution needed to bypass protection
- May violate Cloudflare/AllRecipes Terms of Service to bypass

**Proposed Solutions:**

**Option 1: Headless Browser (Complex, Resource-Intensive)**
- Use Puppeteer or Playwright to render JavaScript
- Pros: Can bypass Cloudflare, access full page
- Cons: High resource usage, slower, may still be detected, potential ToS violation

**Option 2: Third-Party Recipe API (Recommended)**
- Use services like Spoonacular, Edamam, or Recipe Puppy
- Pros: Legal, reliable, no bot detection
- Cons: Requires API key, may have costs, limited to their database

**Option 3: Manual Entry (Current Fallback)**
- Users manually copy/paste recipe details
- Pros: Always works, no technical barriers
- Cons: More user effort, less convenient

**API Research:**
- AllRecipes.com does NOT provide an official public API
- Several unofficial scrapers exist (python-allrecipes, go-allrecipes) but all face the same Cloudflare issues
- These unofficial tools would violate AllRecipes' Terms of Service

**Recommendation:**
Mark AllRecipes.com as **not supported** due to Cloudflare protection. Recommend users:
1. Use the manual recipe creation form
2. Try alternative recipe sites that don't use bot protection (see list below)
3. Consider third-party recipe API integration for future enhancement (Spoonacular, Edamam)

**Alternative Recipe Sites (Known to Work):**
- budgetbytes.com
- cookieandkate.com
- minimalistbaker.com
- seriouseats.com
- thekitchn.com
- ciaoitalia.com (tested ✅)

**Status:** WILL NOT FIX - Technical and legal barriers make this impractical for MVP

**Future Enhancement Options:**
1. **Third-Party Recipe APIs** (Recommended for v2.0)
   - Spoonacular API: 150 free requests/day, then $0.004/request
   - Edamam Recipe Search API: 10,000 free requests/month
   - TheMealDB: Free for non-commercial use
   
2. **Browser Extension** (Alternative approach)
   - Create a browser extension that users can click while on AllRecipes
   - Extension extracts recipe data from the rendered page
   - Sends data to our app for import
   - Bypasses Cloudflare since user's browser is legitimate

### NotQuiteNigella.com
**Status:** ❌ FAILING  
**Test URLs:**
- https://www.notquitenigella.com/2022/03/28/beeramisu/

**Error Pattern:** TBD - Check logs after testing  
**Data Structure:** TBD  
**Root Cause:** TBD  
**Proposed Fix:** TBD

### VeryEatItalian.com
**Status:** ❌ FAILING  
**Test URLs:**
- https://www.veryeatalian.com/beeramisu-tiramisu-with-beer/

**Error Pattern:** TBD - Check logs after testing  
**Data Structure:** TBD  
**Root Cause:** TBD  
**Proposed Fix:** TBD

## Known Working Websites

### CiaoItalia.com
**Status:** ✅ WORKING  
**Test URLs:**
- https://www.ciaoitalia.com/recipes/chicken-marsala-with-mushrooms-chicken-marsala-ai-funghi

**Notes:** Fixed by handling nested `itemListElement` structures and filtering empty instruction objects

### LauraFuentes.com
**Status:** ✅ WORKING  
**Test URLs:**
- (Add successful test URL here)

**Notes:** Fixed by handling nested `itemListElement` structures in instructions

## Common Error Patterns

### Pattern 1: Missing Schema.org Markup
**Symptoms:** `[RECIPE_NO_DATA]` - No recipe data found  
**Websites:** TBD  
**Solution:** Website doesn't use schema.org Recipe markup. May need alternative scraping method.

### Pattern 2: Nested Instruction Structures
**Symptoms:** `[RECIPE_NO_INSTRUCTIONS]` - Instructions field exists but parser can't extract  
**Websites:** ciaoitalia.com, laurafuentes.com (FIXED)  
**Solution:** Enhanced parser to handle `itemListElement` arrays

### Pattern 3: Empty Objects in Arrays
**Symptoms:** Parser crashes on null/empty objects  
**Websites:** ciaoitalia.com (FIXED)  
**Solution:** Added filtering for null/empty objects before processing

### Pattern 4: Access Blocked
**Symptoms:** `[RECIPE_SCRAPE_FAILED]` with timeout or 403 errors  
**Websites:** TBD  
**Solution:** Website may be blocking automated access. May need user-agent headers or rate limiting.

## Testing Checklist

When testing a new recipe URL:
1. ✅ Check backend logs for tagged entries
2. ✅ Note the hostname and error type
3. ✅ Record the data structure if available
4. ✅ Add to this document
5. ✅ Look for similar patterns in other failures
6. ✅ Propose and test fixes

## Next Steps

1. **Immediate:** Test the three failing URLs and capture detailed logs
2. **Analysis:** Identify common patterns across failures
3. **Enhancement:** Update parser to handle identified patterns
4. **Validation:** Re-test all URLs to confirm fixes
5. **Documentation:** Update this document with findings

## Parser Enhancement Ideas

- [x] Implement retry logic with exponential backoff (2026-04-19)
- [x] Add support for HowToStep and HowToSection instruction formats (2026-04-19)
- [x] Enhanced ingredient parsing for fractions, ranges, and decimals (2026-04-19)
- [x] Better error messages with 403 Forbidden handling (2026-04-19)
- [ ] Add support for alternative recipe markup formats (JSON-LD variations)
- [ ] Implement fallback HTML scraping for sites without schema.org markup
- [ ] Add user-agent rotation to avoid blocking
- [ ] Add support for recipe plugins (WordPress recipe plugins, etc.)
- [ ] Create website-specific parsers for popular sites

## Recent Enhancements (2026-04-19)

### Retry Logic with Exponential Backoff
- Automatically retries transient errors (timeouts, connection resets, 502/503 errors)
- Up to 3 attempts with exponential backoff (1s, 2s, 4s delays)
- Improves reliability for slow or temporarily unavailable websites

### Enhanced Instruction Parsing
- Added support for `HowToStep` objects (common in schema.org)
- Added support for `HowToSection` objects (grouped instructions)
- Handles nested `itemListElement` structures at multiple levels
- Better handling of single HowToSection objects

### Enhanced Ingredient Parsing
- Supports fractions (e.g., "1/2 cup", "1 1/2 cups")
- Supports ranges (e.g., "2-3 cups" - uses average)
- Supports decimal quantities (e.g., "2.5 cups")
- Handles ingredients without quantities (e.g., "salt to taste")
- HTML entity decoding for all ingredient strings

### Improved Error Handling
- Added specific error message for 403 Forbidden responses
- Better logging with retry attempt numbers
- More helpful error messages for different failure scenarios