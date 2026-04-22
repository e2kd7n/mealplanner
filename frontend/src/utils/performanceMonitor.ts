/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

/**
 * Lightweight performance monitoring utilities
 * Tracks key metrics without impacting app performance
 */

import logger from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: string;
}

interface ResourceTiming {
  name: string;
  duration: number;
  size?: number;
  type?: string;
}

class PerformanceMonitor {
  private readonly SAMPLE_RATE = 0.1; // 10% sampling for performance metrics
  private enabled: boolean;

  constructor() {
    this.enabled = import.meta.env.PROD;
    
    if (this.enabled && typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    // Only sample a percentage of users for performance monitoring
    if (Math.random() > this.SAMPLE_RATE) return;

    try {
      // Observe long tasks (> 50ms)
      if ('PerformanceObserver' in window) {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              this.recordMetric('long-task', entry.duration, entry.name);
            }
          }
        });

        try {
          longTaskObserver.observe({ entryTypes: ['longtask'] });
        } catch {
          // longtask not supported in all browsers
        }

        // Observe layout shifts
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ((entry as any).hadRecentInput) continue;
            const value = (entry as any).value;
            if (value > 0.1) {
              this.recordMetric('layout-shift', value);
            }
          }
        });

        try {
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch {
          // layout-shift not supported in all browsers
        }
      }
    } catch (error) {
      // Silently fail - performance monitoring shouldn't break the app
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(name: string, value: number, context?: string): void {
    if (!this.enabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context,
    };

    // Log significant performance issues
    if (name === 'long-task' && value > 100) {
      logger.warn('Long task detected', 'Performance', metric);
    } else if (name === 'layout-shift' && value > 0.25) {
      logger.warn('Significant layout shift', 'Performance', metric);
    }
  }

  /**
   * Measure function execution time
   */
  measure<T>(name: string, fn: () => T, context?: string): T {
    if (!this.enabled) return fn();

    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      if (duration > 16) { // Only log if > 1 frame (16ms)
        this.recordMetric(name, duration, context);
      }
    }
  }

  /**
   * Measure async function execution time
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    if (!this.enabled) return fn();

    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      if (duration > 100) { // Only log slow async operations
        this.recordMetric(name, duration, context);
      }
    }
  }

  /**
   * Start a performance mark
   */
  mark(name: string): void {
    if (!this.enabled) return;
    try {
      performance.mark(name);
    } catch {
      // Silently fail
    }
  }

  /**
   * Measure between two marks
   */
  measureBetween(name: string, startMark: string, endMark: string): void {
    if (!this.enabled) return;
    
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      if (measure && measure.duration > 100) {
        this.recordMetric(name, measure.duration);
      }
      
      // Clean up marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(name);
    } catch {
      // Silently fail
    }
  }

  /**
   * Get Core Web Vitals
   */
  getCoreWebVitals(): void {
    if (!this.enabled || typeof window === 'undefined') return;

    try {
      // LCP - Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcp = lastEntry.startTime;
        
        if (lcp > 2500) {
          logger.warn('Poor LCP', 'Performance', { lcp });
        }
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch {
        // Not supported
      }

      // FID - First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = (entry as any).processingStart - entry.startTime;
          if (fid > 100) {
            logger.warn('Poor FID', 'Performance', { fid });
          }
        }
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch {
        // Not supported
      }
    } catch {
      // Silently fail
    }
  }

  /**
   * Get resource timing information
   */
  getResourceTimings(): ResourceTiming[] {
    if (!this.enabled || typeof window === 'undefined') return [];

    try {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return resources
        .filter(r => r.duration > 1000) // Only slow resources
        .map(r => ({
          name: r.name,
          duration: r.duration,
          size: r.transferSize,
          type: r.initiatorType,
        }));
    } catch {
      return [];
    }
  }

  /**
   * Log slow resources
   */
  logSlowResources(): void {
    const slowResources = this.getResourceTimings();
    if (slowResources.length > 0) {
      logger.warn('Slow resources detected', 'Performance', {
        count: slowResources.length,
        resources: slowResources.slice(0, 5), // Only log top 5
      });
    }
  }

  /**
   * Get navigation timing
   */
  getNavigationTiming(): any {
    if (!this.enabled || typeof window === 'undefined') return null;

    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (!nav) return null;

      return {
        dns: nav.domainLookupEnd - nav.domainLookupStart,
        tcp: nav.connectEnd - nav.connectStart,
        request: nav.responseStart - nav.requestStart,
        response: nav.responseEnd - nav.responseStart,
        dom: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
        load: nav.loadEventEnd - nav.loadEventStart,
        total: nav.loadEventEnd - nav.fetchStart,
      };
    } catch {
      return null;
    }
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

// Initialize Core Web Vitals monitoring
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    performanceMonitor.getCoreWebVitals();
    
    // Log slow resources after page load
    setTimeout(() => {
      performanceMonitor.logSlowResources();
    }, 5000);
  });
}

export default performanceMonitor;

// Made with Bob