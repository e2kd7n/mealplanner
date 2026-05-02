import { lazy, Suspense } from 'react';
import type { ComponentType } from 'react';
import { CircularProgress, Box } from '@mui/material';

/**
 * Lazy load wrapper with loading fallback
 * Optimized for Raspberry Pi deployment to reduce initial bundle size
 */

interface LazyLoadOptions {
  fallback?: React.ReactNode;
  minLoadTime?: number; // Minimum time to show loading (prevents flash)
}

/**
 * Default loading fallback component
 */
const DefaultLoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="200px"
  >
    <CircularProgress />
  </Box>
);

/**
 * Lazy load a component with optional loading fallback
 * 
 * @param importFunc - Dynamic import function
 * @param options - Configuration options
 * @returns Lazy loaded component wrapped in Suspense
 * 
 * @example
 * const RecipeChart = lazyLoad(() => import('./components/RecipeChart'));
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): ComponentType<React.ComponentProps<T>> {
  const { fallback = <DefaultLoadingFallback />, minLoadTime = 0 } = options;

  // Add minimum load time to prevent loading flash
  const delayedImport = minLoadTime > 0
    ? () => Promise.all([
        importFunc(),
        new Promise(resolve => setTimeout(resolve, minLoadTime))
      ]).then(([module]) => module)
    : importFunc;

  const LazyComponent = lazy(delayedImport);

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Preload a lazy component
 * Useful for preloading on hover or route change
 * 
 * @example
 * const RecipeChart = lazyLoad(() => import('./components/RecipeChart'));
 * <button onMouseEnter={() => preload(RecipeChart)}>Show Chart</button>
 */
export function preload<T extends ComponentType<any>>(
  LazyComponent: ComponentType<T>
): void {
  // Access the _payload to trigger preload
  const component = LazyComponent as any;
  if (component._payload && component._payload._status === -1) {
    component._payload._result();
  }
}

/**
 * Create a lazy loaded route component
 * Optimized for React Router with better loading states
 */
export function lazyRoute<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): ComponentType<React.ComponentProps<T>> {
  return lazyLoad(importFunc, {
    fallback: (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress size={60} />
      </Box>
    ),
    minLoadTime: 200, // Prevent flash for fast loads
  });
}

// Made with Bob
