/**
 * Image Cache Utility
 * Uses IndexedDB to cache images for offline access and faster loading
 */

const DB_NAME = 'MealPlannerImageCache';
const STORE_NAME = 'images';
const DB_VERSION = 1;
const CACHE_EXPIRY_DAYS = 7; // Cache images for 7 days

interface CachedImage {
  url: string;
  blob: Blob;
  timestamp: number;
}

class ImageCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open image cache database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Get a cached image by URL
   */
  async get(url: string): Promise<string | null> {
    if (!url || url.startsWith('data:')) return url; // Return data URIs as-is

    try {
      await this.init();
      if (!this.db) return null;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(url);

        request.onsuccess = () => {
          const result = request.result as CachedImage | undefined;
          
          if (!result) {
            resolve(null);
            return;
          }

          // Check if cache has expired
          const expiryTime = result.timestamp + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
          if (Date.now() > expiryTime) {
            // Cache expired, delete it
            this.delete(url);
            resolve(null);
            return;
          }

          // Convert blob to object URL
          const objectUrl = URL.createObjectURL(result.blob);
          resolve(objectUrl);
        };

        request.onerror = () => {
          console.error('Failed to get cached image:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error getting cached image:', error);
      return null;
    }
  }

  /**
   * Check if URL is external (cross-origin)
   */
  private isExternalUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.origin !== window.location.origin;
    } catch {
      return false;
    }
  }

  /**
   * Get proxy URL for external images
   */
  private getProxyUrl(url: string): string {
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    return `${apiBase}/images/proxy?url=${encodeURIComponent(url)}`;
  }

  /**
   * Cache an image from a URL
   */
  async set(url: string): Promise<string | null> {
    if (!url || url.startsWith('data:')) return url; // Don't cache data URIs

    try {
      await this.init();
      if (!this.db) return null;

      // Use proxy for external URLs to avoid CORS issues
      const fetchUrl = this.isExternalUrl(url) ? this.getProxyUrl(url) : url;

      // Fetch the image with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        const response = await fetch(fetchUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'image/*',
          },
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          // Log specific error for debugging but don't throw
          console.warn(`Failed to fetch image (${response.status}): ${url.substring(0, 100)}`);
          return null;
        }

        const blob = await response.blob();
        
        // Validate it's actually an image
        if (!blob.type.startsWith('image/')) {
          console.warn('Fetched content is not an image:', blob.type);
          return null;
        }
        
        // Store in IndexedDB
        return new Promise((resolve, reject) => {
          const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          
          const cachedImage: CachedImage = {
            url,
            blob,
            timestamp: Date.now(),
          };

          const request = store.put(cachedImage);

          request.onsuccess = () => {
            const objectUrl = URL.createObjectURL(blob);
            resolve(objectUrl);
          };

          request.onerror = () => {
            console.error('Failed to cache image:', request.error);
            reject(request.error);
          };
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('Image fetch timeout:', url.substring(0, 100));
        } else {
          console.warn('Image fetch error:', fetchError.message);
        }
        return null;
      }
    } catch (error) {
      console.error('Error caching image:', error);
      return null;
    }
  }

  /**
   * Get or fetch and cache an image
   */
  async getOrFetch(url: string): Promise<string> {
    if (!url || url.startsWith('data:')) return url;

    try {
      // Try to get from cache first
      const cachedUrl = await this.get(url);
      if (cachedUrl) return cachedUrl;

      // Not in cache, fetch and cache it
      const newUrl = await this.set(url);
      return newUrl || url; // Fallback to original URL if caching fails
    } catch (error) {
      console.error('Error in getOrFetch:', error);
      return url; // Fallback to original URL
    }
  }

  /**
   * Delete a cached image
   */
  async delete(url: string): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(url);

        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('Failed to delete cached image:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error deleting cached image:', error);
    }
  }

  /**
   * Clear all cached images
   */
  async clear(): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('Failed to clear image cache:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error clearing image cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ count: number; size: number }> {
    try {
      await this.init();
      if (!this.db) return { count: 0, size: 0 };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const images = request.result as CachedImage[];
          const count = images.length;
          const size = images.reduce((total, img) => total + img.blob.size, 0);
          resolve({ count, size });
        };

        request.onerror = () => {
          console.error('Failed to get cache stats:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { count: 0, size: 0 };
    }
  }
}

// Export singleton instance
export const imageCache = new ImageCache();

// Made with Bob
