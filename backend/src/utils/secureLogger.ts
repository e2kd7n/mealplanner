/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { logger } from './logger';

/**
 * Secure Logging Utility
 * 
 * This module provides secure logging functions that automatically redact
 * sensitive information from log messages and metadata.
 * 
 * Features:
 * - Automatic redaction of common secret patterns
 * - Deep object sanitization
 * - Configurable sensitive key patterns
 * - Performance optimized for production use
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Patterns to match sensitive keys in objects
 */
const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /key/i,
  /auth/i,
  /credential/i,
  /api[_-]?key/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /session/i,
  /cookie/i,
  /authorization/i,
  /bearer/i,
];

/**
 * Patterns to match and redact in strings
 */
const SENSITIVE_STRING_PATTERNS = [
  { pattern: /password[=:]\s*\S+/gi, replacement: 'password=****' },
  { pattern: /secret[=:]\s*\S+/gi, replacement: 'secret=****' },
  { pattern: /token[=:]\s*\S+/gi, replacement: 'token=****' },
  { pattern: /key[=:]\s*\S+/gi, replacement: 'key=****' },
  { pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, replacement: 'Bearer ****' },
  { pattern: /Basic\s+[A-Za-z0-9+/]+=*/gi, replacement: 'Basic ****' },
];

/**
 * Redaction placeholder
 */
const REDACTED = '****';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a key name is sensitive
 */
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Redact sensitive patterns from a string
 */
function redactString(str: string): string {
  let redacted = str;
  
  for (const { pattern, replacement } of SENSITIVE_STRING_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }
  
  return redacted;
}

/**
 * Sanitize an object by redacting sensitive values
 * Handles nested objects and arrays recursively
 */
function sanitizeObject(obj: any, depth: number = 0): any {
  // Prevent infinite recursion
  if (depth > 10) {
    return '[Max depth reached]';
  }

  // Handle null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return redactString(obj);
    }
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  // Handle objects
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      // Redact sensitive keys
      sanitized[key] = REDACTED;
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(value, depth + 1);
    } else if (typeof value === 'string') {
      // Redact sensitive patterns in strings
      sanitized[key] = redactString(value);
    } else {
      // Keep other values as-is
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Sanitize error objects for logging
 */
function sanitizeError(error: any): any {
  if (!(error instanceof Error)) {
    return sanitizeObject(error);
  }

  return {
    name: error.name,
    message: redactString(error.message),
    stack: error.stack ? redactString(error.stack) : undefined,
    ...sanitizeObject(error),
  };
}

// ============================================================================
// SECURE LOGGING FUNCTIONS
// ============================================================================

/**
 * Log debug message with automatic redaction
 */
export function secureDebug(message: string, meta?: any): void {
  const redactedMessage = redactString(message);
  const sanitizedMeta = meta ? sanitizeObject(meta) : undefined;
  
  logger.debug(redactedMessage, sanitizedMeta);
}

/**
 * Log info message with automatic redaction
 */
export function secureInfo(message: string, meta?: any): void {
  const redactedMessage = redactString(message);
  const sanitizedMeta = meta ? sanitizeObject(meta) : undefined;
  
  logger.info(redactedMessage, sanitizedMeta);
}

/**
 * Log warning message with automatic redaction
 */
export function secureWarn(message: string, meta?: any): void {
  const redactedMessage = redactString(message);
  const sanitizedMeta = meta ? sanitizeObject(meta) : undefined;
  
  logger.warn(redactedMessage, sanitizedMeta);
}

/**
 * Log error message with automatic redaction
 */
export function secureError(message: string, error?: any, meta?: any): void {
  const redactedMessage = redactString(message);
  const sanitizedError = error ? sanitizeError(error) : undefined;
  const sanitizedMeta = meta ? sanitizeObject(meta) : undefined;
  
  if (sanitizedError && sanitizedMeta) {
    logger.error(redactedMessage, { error: sanitizedError, ...sanitizedMeta });
  } else if (sanitizedError) {
    logger.error(redactedMessage, sanitizedError);
  } else if (sanitizedMeta) {
    logger.error(redactedMessage, sanitizedMeta);
  } else {
    logger.error(redactedMessage);
  }
}

/**
 * Generic secure log function
 */
export function secureLog(
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  meta?: any
): void {
  switch (level) {
    case 'debug':
      secureDebug(message, meta);
      break;
    case 'info':
      secureInfo(message, meta);
      break;
    case 'warn':
      secureWarn(message, meta);
      break;
    case 'error':
      secureError(message, undefined, meta);
      break;
  }
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Export sanitization functions for use in other modules
 */
export const sanitize = {
  object: sanitizeObject,
  string: redactString,
  error: sanitizeError,
};

/**
 * Add custom sensitive key pattern
 */
export function addSensitiveKeyPattern(pattern: RegExp): void {
  SENSITIVE_KEY_PATTERNS.push(pattern);
}

/**
 * Add custom sensitive string pattern
 */
export function addSensitiveStringPattern(pattern: RegExp, replacement: string): void {
  SENSITIVE_STRING_PATTERNS.push({ pattern, replacement });
}

// Export default object with all functions
export default {
  debug: secureDebug,
  info: secureInfo,
  warn: secureWarn,
  error: secureError,
  log: secureLog,
  sanitize,
  addSensitiveKeyPattern,
  addSensitiveStringPattern,
};

// Made with Bob