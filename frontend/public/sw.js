// Service Worker for Meal Planner PWA
// Optimized for Raspberry Pi deployment with aggressive caching

const CACHE_NAME = 'mealplanner-v1';
const RUNTIME_CACHE = 'mealplanner-runtime-v1';
const IMAGE_CACHE = 'mealplanner-images-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Cache size limits (important for Pi with limited storage)
const MAX_IMAGE_CACHE_SIZE = 50; // Max 50 images
const MAX_RUNTIME_CACHE_SIZE = 100; // Max 100 runtime requests
const CACHE_EXPIRY_DAYS = 7;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete old versions
              return name.startsWith('mealplanner-') && 
                     name !== CACHE_NAME && 
                     name !== RUNTIME_CACHE &&
                     name !== IMAGE_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests (always fetch fresh)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Handle different types of requests
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handleRuntimeRequest(request));
  }
});

// Check if request is for an image
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(request.url);
}

// Check if request is for a static asset
function isStaticAsset(request) {
  return request.destination === 'script' ||
         request.destination === 'style' ||
         /\.(js|css|woff|woff2|ttf|eot)$/i.test(request.url);
}

// Handle image requests with size-limited cache
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Limit cache size
      await limitCacheSize(IMAGE_CACHE, MAX_IMAGE_CACHE_SIZE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Image fetch failed:', error);
    // Return a placeholder image or cached version
    return cached || new Response('Image not available', { status: 404 });
  }
}

// Handle static assets - cache first, network fallback
async function handleStaticAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    return cached || new Response('Asset not available', { status: 404 });
  }
}

// Handle runtime requests - network first, cache fallback
async function handleRuntimeRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Limit cache size
      await limitCacheSize(RUNTIME_CACHE, MAX_RUNTIME_CACHE_SIZE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Runtime fetch failed:', error);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Return offline page or error
    return new Response('Offline - content not available', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Limit cache size to prevent storage issues on Pi
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Delete oldest entries (FIFO)
    const deleteCount = keys.length - maxSize;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});

// Made with Bob
