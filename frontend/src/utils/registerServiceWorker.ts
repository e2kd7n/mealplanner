/**
 * Service Worker Registration
 * Optimized for Raspberry Pi deployment with PWA capabilities
 */

export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      const swUrl = '/sw.js';

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('[SW] Service Worker registered:', registration);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log('[SW] New version available');
                  
                  // Optionally notify user
                  if (confirm('New version available! Reload to update?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error);
        });

      // Handle controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Controller changed, reloading page');
        window.location.reload();
      });
    });
  }
}

export function unregisterServiceWorker(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        const promises = registrations.map((registration) => registration.unregister());
        return Promise.all(promises);
      })
      .then(() => true)
      .catch((error) => {
        console.error('[SW] Service Worker unregistration failed:', error);
        return false;
      });
  }
  return Promise.resolve(false);
}

export function clearServiceWorkerCache(): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
  }
}

// Made with Bob
