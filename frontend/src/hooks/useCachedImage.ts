import { useState, useEffect } from 'react';
import { imageCache } from '../utils/imageCache';

/**
 * Default placeholder image as SVG data URI
 */
const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';

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
  
  const [src, setSrc] = useState<string>(placeholder);
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
      setIsLoading(true);
      
      try {
        const cachedUrl = await imageCache.getOrFetch(url);
        
        if (isMounted) {
          objectUrl = cachedUrl;
          setSrc(cachedUrl);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load image:', err);
        
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
          console.error('Failed to preload image:', url, err);
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
        console.error('Failed to load cache stats:', err);
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
      console.error('Failed to clear cache:', err);
    }
  };

  return { stats, isLoading, clearCache };
}

// Made with Bob
