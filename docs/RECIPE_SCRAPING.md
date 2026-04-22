# Recipe Scraping Guide

## Overview

The meal planner supports importing recipes from external websites using structured data (JSON-LD schema.org format). The scraper looks for `application/ld+json` tags containing recipe information.

## Supported Recipe Sites

The following sites have been tested and work well with our recipe scraper:

### ✅ Fully Supported
- **AllRecipes.com** - Most recipes work, some may require manual entry
- **Food Network** - Full support for recipe pages
- **Bon Appétit** - Full support
- **Serious Eats** - Full support
- **NYT Cooking** - Full support (may require subscription)
- **Epicurious** - Full support
- **Tasty** - Full support
- **BBC Good Food** - Full support

### ⚠️ Partial Support
- **Pinterest** - Links to original sources, scrape the original recipe page instead
- **Instagram** - Not supported, use the linked recipe if available
- **YouTube** - Not supported directly, check video description for recipe links

## How Recipe Scraping Works

1. **Structured Data Detection**: The scraper looks for JSON-LD structured data in the HTML
2. **Fallback Parsing**: If structured data is not found, the scraper attempts to parse HTML content
3. **Data Normalization**: Ingredients and instructions are parsed and normalized
4. **Manual Entry**: If scraping fails, you can always enter recipes manually

## Troubleshooting

### "No application/ld+json tags found"

This error means the website doesn't provide structured recipe data. Solutions:

1. **Try a different recipe page** from the same site
2. **Use manual entry** - Copy and paste the recipe information
3. **Check for alternative sources** - Search for the same recipe on a supported site

### Recipe Data is Incomplete

Some sites may have partial data. You can:

1. **Edit the imported recipe** to add missing information
2. **Try importing from a different source**
3. **Report the issue** so we can improve scraping for that site

## Best Practices

1. **Use recipe-specific URLs** - Avoid blog posts or article pages
2. **Check the preview** before saving imported recipes
3. **Verify ingredient quantities** - Some sites use non-standard formats
4. **Add your own notes** - Customize imported recipes to your preferences

## Adding Support for New Sites

If you'd like to request support for a specific recipe website:

1. Check if the site uses schema.org structured data (JSON-LD)
2. Open an issue with example recipe URLs
3. Include any error messages you receive

## Technical Details

### Supported Data Formats

- **JSON-LD** (schema.org Recipe format)
- **Microdata** (limited support)
- **HTML parsing** (fallback for simple recipes)

### Parsed Fields

- Title
- Description
- Prep time / Cook time
- Servings
- Ingredients (with quantities and units)
- Instructions (step-by-step)
- Nutrition information (when available)
- Images
- Cuisine type
- Difficulty level (calculated)

## Connection Pool Configuration

To optimize database performance and prevent connection errors, you can configure the connection pool via the `DATABASE_URL`:

```bash
# Example with connection pool settings
DATABASE_URL="postgresql://user:password@localhost:5432/mealplanner?connection_limit=10&pool_timeout=30"
```

### Recommended Settings

- **connection_limit**: 10 (for development), 20-50 (for production)
- **pool_timeout**: 30 seconds (time to wait for an available connection)

These settings help prevent "Server has closed the connection" errors during high load.