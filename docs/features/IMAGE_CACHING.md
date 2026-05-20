# Image Caching System

## Overview

The Meal Planner application implements a robust image caching system using IndexedDB to store recipe images locally. This provides several benefits:

- **Faster Loading**: Images are loaded from local cache instead of network
- **Offline Support**: Cached images are available even without internet connection
- **Reduced Bandwidth**: Images are only downloaded once
- **Better UX**: Loading indicators show when images are being fetched

## Architecture

### Components

1. **imageCache.ts** - Core caching utility using IndexedDB
2. **useCachedImage.ts** - React hooks for components
3. **Recipe Components** - Updated to use cached images

### How It Works

1. When a recipe image is first requested, the system:
   - Checks IndexedDB cache for the image
   - If not found, fetches from the network
   - Stores the image blob in IndexedDB
   - Returns an object URL for display

2. On subsequent requests:
   - Image is retrieved from IndexedDB cache
   - No network request is made
   - Object URL is created and returned immediately

3. Cache expiration:
   - Images are cached for 7 days by default
   - Expired images are automatically removed
   - Fresh images are fetched when needed

## Usage

### Basic Usage in Components

```typescript
import { useCachedImage } from '../hooks/useCachedImage';

function MyComponent({ imageUrl }) {
  const { src, isLoading, error } = useCachedImage(imageUrl);
  
  return (
    <div>
      <img src={src} alt="Recipe" />
      {isLoading && <CircularProgress />}
      {error && <Alert>Failed to load image</Alert>}
    </div>
  );
}
```

### Preloading Multiple Images

```typescript
import { usePreloadImages } from '../hooks/useCachedImage';

function MyComponent({ imageUrls }) {
  const { isPreloading, progress, errors } = usePreloadImages(imageUrls);
  
  return (
    <div>
      {isPreloading && <LinearProgress value={progress} />}
    </div>
  );
}
```

### Cache Management

```typescript
import { useCacheStats } from '../hooks/useCachedImage';

function CacheManager() {
  const { stats, isLoading, clearCache } = useCacheStats();
  
  return (
    <div>
      <p>Cached Images: {stats.count}</p>
      <p>Cache Size: {(stats.size / 1024 / 1024).toFixed(2)} MB</p>
      <Button onClick={clearCache}>Clear Cache</Button>
    </div>
  );
}
```

## API Reference

### imageCache

Core utility class for managing the image cache.

#### Methods

- `get(url: string): Promise<string | null>` - Get cached image
- `set(url: string): Promise<string | null>` - Cache an image
- `getOrFetch(url: string): Promise<string>` - Get from cache or fetch
- `delete(url: string): Promise<void>` - Remove from cache
- `clear(): Promise<void>` - Clear all cached images
- `getStats(): Promise<{ count: number; size: number }>` - Get cache statistics

### useCachedImage Hook

React hook for loading and caching images.

#### Parameters

- `url: string | null | undefined` - Image URL to load
- `options?: UseCachedImageOptions`
  - `placeholder?: string` - Placeholder image (default: SVG placeholder)
  - `fallback?: string` - Fallback image on error

#### Returns

- `src: string` - Image source URL (cached or placeholder)
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error if loading failed

### usePreloadImages Hook

React hook for preloading multiple images.

#### Parameters

- `urls: string[]` - Array of image URLs to preload

#### Returns

- `isPreloading: boolean` - Preloading state
- `progress: number` - Progress percentage (0-100)
- `errors: Error[]` - Array of errors encountered

### useCacheStats Hook

React hook for cache statistics and management.

#### Returns

- `stats: { count: number; size: number }` - Cache statistics
- `isLoading: boolean` - Loading state
- `clearCache: () => Promise<void>` - Function to clear cache

## Configuration

### Cache Expiry

Default cache expiry is 7 days. To modify:

```typescript
// In imageCache.ts
const CACHE_EXPIRY_DAYS = 7; // Change this value
```

### Database Settings

```typescript
const DB_NAME = 'MealPlannerImageCache';
const STORE_NAME = 'images';
const DB_VERSION = 1;
```

## Browser Support

The image caching system uses IndexedDB, which is supported in:

- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+
- Opera 15+

## Performance Considerations

1. **Memory Management**: Object URLs are automatically revoked when components unmount
2. **Storage Limits**: IndexedDB typically allows 50MB+ per origin
3. **Cache Size**: Monitor cache size and clear periodically if needed
4. **Network Fallback**: Original URLs are used if caching fails

## Troubleshooting

### Images Not Caching

1. Check browser console for IndexedDB errors
2. Verify browser supports IndexedDB
3. Check available storage space
4. Ensure CORS headers allow image fetching

### Cache Not Clearing

1. Use browser DevTools > Application > IndexedDB
2. Manually delete the database if needed
3. Check for errors in console

### Performance Issues

1. Monitor cache size with `useCacheStats`
2. Clear cache periodically
3. Reduce cache expiry time if needed

## Future Enhancements

Potential improvements:

- [ ] Service Worker integration for true offline support
- [ ] Automatic cache size management
- [ ] Image compression before caching
- [ ] Progressive image loading
- [ ] Cache warming on app startup
- [ ] Background sync for cache updates