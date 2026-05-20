# Frontend Logging System

## Overview

The frontend now includes a comprehensive, performance-focused logging system designed to capture errors and diagnostics for product improvement without impacting user experience.

## Key Features

### 1. **Performance-First Design**
- **Batching**: Logs are batched and sent in groups (default: 10 logs or 30 seconds)
- **Throttling**: Prevents log spam with error throttling (5 second cooldown)
- **Sampling**: Configurable sampling rate for non-error logs (default: 100% for errors)
- **Session Limits**: Maximum 50 errors per session to prevent abuse
- **Async Sending**: Uses `navigator.sendBeacon` for non-blocking transmission

### 2. **Structured Logging**
Each log entry includes:
- Log level (ERROR, WARN, INFO, DEBUG)
- Message and context
- Timestamp
- Session ID for tracking user sessions
- User agent and URL (configurable)
- Stack traces for errors
- Sanitized data (sensitive fields redacted)

### 3. **Security**
- Automatic sanitization of sensitive data (passwords, tokens, secrets)
- No PII logged by default
- Configurable data inclusion

## Components

### Logger (`frontend/src/utils/logger.ts`)

Main logging service with methods:

```typescript
import logger from './utils/logger';

// Log an error
logger.error('Failed to load recipe', 'RecipeAPI', { recipeId: 123 }, error);

// Log a warning
logger.warn('Slow API response', 'Performance', { duration: 5000 });

// Log info (only if configured)
logger.info('User action', 'Analytics', { action: 'recipe_saved' });

// Force flush pending logs
logger.forceFlush();

// Configure logger
logger.configure({
  enabled: true,
  minLevel: LogLevel.ERROR,
  batchSize: 20,
  sampleRate: 0.5, // 50% sampling for non-errors
});
```

### Performance Monitor (`frontend/src/utils/performanceMonitor.ts`)

Tracks performance metrics with minimal overhead:

```typescript
import performanceMonitor from './utils/performanceMonitor';

// Measure function execution
const result = performanceMonitor.measure('processData', () => {
  return processData();
});

// Measure async operations
const data = await performanceMonitor.measureAsync('fetchData', async () => {
  return await fetchData();
});

// Use performance marks
performanceMonitor.mark('operation-start');
// ... do work ...
performanceMonitor.mark('operation-end');
performanceMonitor.measureBetween('operation', 'operation-start', 'operation-end');
```

**Automatic Monitoring:**
- Long tasks (>50ms)
- Layout shifts (CLS)
- Core Web Vitals (LCP, FID)
- Slow resources (>1s load time)
- Navigation timing

### Error Handler Integration

The existing error handler now uses the centralized logger:

```typescript
import { logError } from './utils/errorHandler';

try {
  // risky operation
} catch (error) {
  logError(error, 'ComponentName');
}
```

### Error Boundary

The `ErrorBoundary` component automatically logs all uncaught React errors:

```typescript
// Automatically logs errors with:
// - Error message and stack
// - Component stack
// - Session context
```

## Configuration

### Production Settings (Default)
```typescript
{
  enabled: true,              // Only in production
  minLevel: LogLevel.ERROR,   // Only errors logged
  batchSize: 10,              // Batch every 10 logs
  batchInterval: 30000,       // Or every 30 seconds
  maxBatchSize: 50,           // Max queue size
  sampleRate: 1.0,            // 100% for errors
  endpoint: '/api/logs/client',
  includeUserAgent: true,
  includeUrl: true,
}
```

### Development Settings
- Logs also output to console
- All log levels visible
- Immediate feedback

## Backend Integration

The logger sends logs to `/api/logs/client` endpoint. The backend should implement this endpoint to:

1. Receive batched log entries
2. Store in database or logging service
3. Aggregate for analysis
4. Alert on critical errors

**Expected Request Format:**
```json
{
  "logs": [
    {
      "level": "error",
      "message": "Failed to load recipe",
      "timestamp": 1234567890,
      "context": "RecipeAPI",
      "data": { "recipeId": 123 },
      "stack": "Error: ...",
      "userAgent": "Mozilla/5.0...",
      "url": "https://app.example.com/recipes",
      "sessionId": "1234567890-abc123"
    }
  ]
}
```

## Performance Impact

### Minimal Overhead
- **Memory**: ~1KB per log entry, max 50 entries queued
- **Network**: Batched requests, uses `sendBeacon` (no blocking)
- **CPU**: Negligible - async processing, throttled
- **Sampling**: Only 10% of users monitored for performance metrics

### Automatic Cleanup
- Logs flushed on page unload
- Logs flushed on visibility change (mobile/tab switching)
- Queue cleared after successful send

## Best Practices

### 1. Use Appropriate Log Levels
```typescript
// ERROR - Something broke
logger.error('API request failed', 'API', { endpoint }, error);

// WARN - Something unexpected but handled
logger.warn('Slow response time', 'Performance', { duration: 3000 });

// INFO - Important events (if enabled)
logger.info('User completed onboarding', 'Analytics');

// DEBUG - Detailed debugging (rarely enabled)
logger.debug('State updated', 'Redux', { state });
```

### 2. Provide Context
```typescript
// Good - includes context
logger.error('Failed to save', 'RecipeForm', { recipeId: 123 }, error);

// Bad - no context
logger.error('Error occurred', undefined, undefined, error);
```

### 3. Sanitize Sensitive Data
The logger automatically sanitizes common sensitive fields, but be cautious:

```typescript
// Automatically sanitized
logger.error('Auth failed', 'Auth', {
  password: 'secret123',  // Will be [REDACTED]
  token: 'abc123',        // Will be [REDACTED]
});

// Still be careful with custom fields
logger.error('Error', 'API', {
  userSecret: 'sensitive',  // Not automatically caught
});
```

### 4. Don't Over-Log
```typescript
// Bad - logs on every render
useEffect(() => {
  logger.info('Component rendered');
});

// Good - logs significant events
const handleSave = async () => {
  try {
    await saveRecipe();
  } catch (error) {
    logger.error('Save failed', 'RecipeForm', { recipeId }, error);
  }
};
```

## Monitoring & Analysis

### Key Metrics to Track
1. **Error Rate**: Errors per session
2. **Error Types**: Most common error messages
3. **Error Contexts**: Which components/features fail most
4. **Performance**: Long tasks, layout shifts, slow resources
5. **User Impact**: Errors by user agent, geography

### Recommended Tools
- **Log Aggregation**: Elasticsearch, Splunk, Datadog
- **Error Tracking**: Sentry, Rollbar, Bugsnag
- **Performance**: New Relic, Datadog APM
- **Custom Dashboard**: Grafana, Kibana

## Future Enhancements

1. **User Feedback Integration**: Link errors to user reports
2. **Source Maps**: Decode minified stack traces
3. **Session Replay**: Capture user actions leading to errors
4. **A/B Testing**: Compare error rates across variants
5. **Predictive Alerts**: ML-based anomaly detection

## Troubleshooting

### Logs Not Appearing
1. Check `logger.configure({ enabled: true })`
2. Verify backend endpoint `/api/logs/client` exists
3. Check browser console for network errors
4. Verify not in development mode (logs only sent in production)

### Too Many Logs
1. Increase `minLevel` to reduce verbosity
2. Reduce `sampleRate` for non-error logs
3. Check for log loops (component re-rendering)
4. Verify throttling is working

### Performance Issues
1. Reduce `batchSize` to send more frequently
2. Increase `batchInterval` to batch longer
3. Disable performance monitoring: `performanceMonitor.setEnabled(false)`
4. Reduce sampling rate

## Summary

The frontend logging system provides:
- ✅ Comprehensive error tracking
- ✅ Performance monitoring
- ✅ Minimal performance impact
- ✅ Security-conscious design
- ✅ Production-ready configuration
- ✅ Easy integration with existing code

All errors are now automatically captured and can be used to diagnose issues and improve the product.

---

**Made with Bob**