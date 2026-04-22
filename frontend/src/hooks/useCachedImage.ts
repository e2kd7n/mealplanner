import { useState, useEffect } from 'react';
import { imageCache } from '../utils/imageCache';

/**
 * Default placeholder image as SVG data URI - professional food-themed design
 */
const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0%25" y1="0%25" x2="0%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23f5f5f5;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23e0e0e0;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="300" fill="url(%23grad)"/%3E%3Cg transform="translate(200,130)"%3E%3Ccircle cx="0" cy="0" r="40" fill="%23bdbdbd" opacity="0.3"/%3E%3Cpath d="M-15,-10 Q-15,-20 -5,-20 Q5,-20 5,-10 L5,10 Q5,15 0,15 Q-5,15 -5,10 Z M5,-10 Q15,-10 15,0 L15,10 Q15,15 10,15 L5,10 Z" fill="%23999" opacity="0.5"/%3E%3C/g%3E%3Ctext x="200" y="200" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="%23757575" font-weight="500"%3ERecipe Image%3C/text%3E%3C/svg%3E';

/**
 * Loading placeholder with subtle animation effect
 */
const LOADING_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f5f5f5"/%3E%3Crect width="400" height="300" fill="%23e0e0e0" opacity="0.5"%3E%3Canimate attributeName="opacity" values="0.5;0.8;0.5" dur="1.5s" repeatCount="indefinite"/%3E%3C/rect%3E%3C/svg%3E';

interface UseCachedImageOptions {
  placeholder?: string;
  fallback?: string;
}

interface UseCachedImageResult {
  src: string;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to load and cache images
 * @param url - The image URL to load
 * @param options - Configuration options
 * @returns Object containing the image source, loading state, and error
 */
export function useCachedImage(
  url: string | null | undefined,
  options: UseCachedImageOptions = {}
): UseCachedImageResult {
  const { placeholder = DEFAULT_PLACEHOLDER, fallback = DEFAULT_PLACEHOLDER } = options;
  
  const [src, setSrc] = useState<string>(LOADING_PLACEHOLDER);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Reset state when URL changes
    setError(null);
    
    // If no URL provided, use placeholder
    if (!url) {
      setSrc(placeholder);
      setIsLoading(false);
      return;
    }

    // If it's a data URI, use it directly
    if (url.startsWith('data:')) {
      setSrc(url);
      setIsLoading(false);
      return;
    }

    // Load the image from cache or fetch it
    let isMounted = true;
    let objectUrl: string | null = null;

    const loadImage = async () => {
      // Show loading placeholder
      setSrc(LOADING_PLACEHOLDER);
      setIsLoading(true);
      
      try {
        const cachedUrl = await imageCache.getOrFetch(url);
        
        if (isMounted) {
          // If getOrFetch returns null, it means the image failed to load
          if (!cachedUrl || cachedUrl === url) {
            // Image fetch failed, use fallback
            if (import.meta.env.DEV) console.warn('Image failed to load, using fallback:', url.substring(0, 100));
            setSrc(fallback);
            setError(new Error('Failed to load image'));
          } else {
            // Successfully loaded
            objectUrl = cachedUrl;
            setSrc(cachedUrl);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Image load error:', err);
        
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load image'));
          setSrc(fallback);
          setIsLoading(false);
        }
      }
    };

    loadImage();

    // Cleanup function
    return () => {
      isMounted = false;
      // Revoke object URL if it was created
      if (objectUrl && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [url, placeholder, fallback]);

  return { src, isLoading, error };
}

/**
 * Hook to preload multiple images into cache
 * @param urls - Array of image URLs to preload
 */
export function usePreloadImages(urls: string[]): {
  isPreloading: boolean;
  progress: number;
  errors: Error[];
} {
  const [isPreloading, setIsPreloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<Error[]>([]);

  useEffect(() => {
    if (!urls || urls.length === 0) {
      setProgress(100);
      return;
    }

    let isMounted = true;
    const preloadErrors: Error[] = [];

    const preload = async () => {
      setIsPreloading(true);
      setProgress(0);
      setErrors([]);

      let completed = 0;

      for (const url of urls) {
        if (!isMounted) break;

        try {
          await imageCache.getOrFetch(url);
        } catch (err) {
          if (import.meta.env.DEV) console.error('Failed to preload image:', url, err);
          preloadErrors.push(err instanceof Error ? err : new Error(`Failed to preload ${url}`));
        }

        completed++;
        if (isMounted) {
          setProgress(Math.round((completed / urls.length) * 100));
        }
      }

      if (isMounted) {
        setIsPreloading(false);
        setErrors(preloadErrors);
      }
    };

    preload();

    return () => {
      isMounted = false;
    };
  }, [urls]);

  return { isPreloading, progress, errors };
}

/**
 * Hook to get cache statistics
 */
export function useCacheStats() {
  const [stats, setStats] = useState<{ count: number; size: number }>({ count: 0, size: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const cacheStats = await imageCache.getStats();
        if (isMounted) {
          setStats(cacheStats);
          setIsLoading(false);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('Failed to load cache stats:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const clearCache = async () => {
    try {
      await imageCache.clear();
      setStats({ count: 0, size: 0 });
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to clear cache:', err);
    }
  };

  return { stats, isLoading, clearCache };
}

// Made with Bob
