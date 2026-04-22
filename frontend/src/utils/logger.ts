/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

/**
 * Performance-focused logging service for frontend error tracking and diagnostics
 * Prioritizes performance over verbosity with batching, throttling, and sampling
 */

export const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: string;
  data?: any;
  stack?: string;
  userAgent?: string;
  url?: string;
  sessionId?: string;
}

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  batchSize: number;
  batchInterval: number;
  maxBatchSize: number;
  sampleRate: number; // 0-1, percentage of logs to capture
  endpoint: string;
  includeUserAgent: boolean;
  includeUrl: boolean;
}

class Logger {
  private config: LoggerConfig;
  private logQueue: LogEntry[] = [];
  private batchTimer: number | null = null;
  private sessionId: string;
  private errorCount: number = 0;
  private lastErrorTime: number = 0;
  private readonly ERROR_THROTTLE_MS = 5000; // Throttle duplicate errors
  private readonly MAX_ERRORS_PER_SESSION = 50; // Prevent log spam

  constructor() {
    this.sessionId = this.generateSessionId();
    
    // Default config - performance-focused
    this.config = {
      enabled: import.meta.env.PROD, // Only in production
      minLevel: LogLevel.ERROR, // Only log errors by default
      batchSize: 10,
      batchInterval: 30000, // 30 seconds
      maxBatchSize: 50,
      sampleRate: 1.0, // 100% for errors, can be reduced for other levels
      endpoint: '/api/logs/client',
      includeUserAgent: true,
      includeUrl: true,
    };
  }

  /**
   * Generate a unique session ID for tracking user sessions
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if we should sample this log entry
   */
  private shouldSample(level: LogLevel): boolean {
    if (level === LogLevel.ERROR) return true; // Always log errors
    return Math.random() < this.config.sampleRate;
  }

  /**
   * Check if logging is throttled
   */
  private isThrottled(): boolean {
    const now = Date.now();
    if (now - this.lastErrorTime < this.ERROR_THROTTLE_MS) {
      return true;
    }
    if (this.errorCount >= this.MAX_ERRORS_PER_SESSION) {
      return true;
    }
    return false;
  }

  /**
   * Create a log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    if (context) entry.context = context;
    if (data) entry.data = this.sanitizeData(data);
    if (error?.stack) entry.stack = error.stack;
    if (this.config.includeUserAgent) entry.userAgent = navigator.userAgent;
    if (this.config.includeUrl) entry.url = window.location.href;

    return entry;
  }

  /**
   * Sanitize data to prevent logging sensitive information
   */
  private sanitizeData(data: any): any {
    if (!data) return data;

    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization'];
    
    if (typeof data === 'object') {
      const sanitized = Array.isArray(data) ? [...data] : { ...data };
      
      for (const key in sanitized) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitizeData(sanitized[key]);
        }
      }
      
      return sanitized;
    }
    
    return data;
  }

  /**
   * Add log entry to queue
   */
  private enqueue(entry: LogEntry): void {
    if (!this.config.enabled) return;
    if (!this.shouldSample(entry.level)) return;

    // Prevent queue overflow
    if (this.logQueue.length >= this.config.maxBatchSize) {
      this.flush();
    }

    this.logQueue.push(entry);

    // Start batch timer if not already running
    if (!this.batchTimer && this.logQueue.length >= this.config.batchSize) {
      this.scheduleBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = window.setTimeout(() => {
        this.flush();
      }, this.config.batchInterval);
    }
  }

  /**
   * Schedule immediate batch send
   */
  private scheduleBatch(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    this.batchTimer = window.setTimeout(() => {
      this.flush();
    }, 100); // Small delay to batch rapid errors
  }

  /**
   * Flush log queue to server
   */
  private async flush(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.logQueue.length === 0) return;

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      // Use sendBeacon for better performance and reliability
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ logs: logsToSend })], {
          type: 'application/json',
        });
        navigator.sendBeacon(this.config.endpoint, blob);
      } else {
        // Fallback to fetch with keepalive
        await fetch(this.config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: logsToSend }),
          keepalive: true,
        }).catch(() => {
          // Silently fail - don't want logging to break the app
        });
      }
    } catch (error) {
      // Silently fail - logging errors shouldn't break the app
      if (import.meta.env.DEV) {
        console.warn('Failed to send logs:', error);
      }
    }
  }

  /**
   * Log an error
   */
  error(message: string, context?: string, data?: any, error?: Error): void {
    if (this.isThrottled()) return;

    this.errorCount++;
    this.lastErrorTime = Date.now();

    const entry = this.createLogEntry(LogLevel.ERROR, message, context, data, error);
    this.enqueue(entry);

    // Also log to console in development
    if (import.meta.env.DEV) {
      console.error(`[${context || 'Error'}]`, message, data, error);
    }
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: string, data?: any): void {
    if (this.config.minLevel === LogLevel.ERROR) return;

    const entry = this.createLogEntry(LogLevel.WARN, message, context, data);
    this.enqueue(entry);

    if (import.meta.env.DEV) {
      console.warn(`[${context || 'Warning'}]`, message, data);
    }
  }

  /**
   * Log info
   */
  info(message: string, context?: string, data?: any): void {
    if (this.config.minLevel === LogLevel.ERROR || this.config.minLevel === LogLevel.WARN) {
      return;
    }

    const entry = this.createLogEntry(LogLevel.INFO, message, context, data);
    this.enqueue(entry);

    if (import.meta.env.DEV) {
      console.info(`[${context || 'Info'}]`, message, data);
    }
  }

  /**
   * Log debug information
   */
  debug(message: string, context?: string, data?: any): void {
    if (this.config.minLevel !== LogLevel.DEBUG) return;

    const entry = this.createLogEntry(LogLevel.DEBUG, message, context, data);
    this.enqueue(entry);

    if (import.meta.env.DEV) {
      console.debug(`[${context || 'Debug'}]`, message, data);
    }
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Force flush all pending logs
   */
  forceFlush(): void {
    this.flush();
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

// Singleton instance
const logger = new Logger();

// Flush logs before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    logger.forceFlush();
  });

  // Also flush on visibility change (mobile/tab switching)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      logger.forceFlush();
    }
  });
}

export default logger;

// Made with Bob