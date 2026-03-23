/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */

import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import { logger } from './logger';

/**
 * XSS Sanitization Utility
 * 
 * Provides comprehensive HTML sanitization to prevent Cross-Site Scripting (XSS) attacks.
 * Uses DOMPurify with a server-side DOM implementation.
 * 
 * Security Features:
 * - Removes all potentially dangerous HTML/JavaScript
 * - Configurable allowed tags and attributes
 * - Handles nested objects and arrays
 * - Logs sanitization events for security monitoring
 */

// Create a DOMPurify instance with jsdom
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

/**
 * Sanitization profiles for different use cases
 */
export const SanitizationProfiles = {
  // Strict: No HTML allowed at all (plain text only)
  STRICT: {
    ALLOWED_TAGS: [] as string[],
    ALLOWED_ATTR: [] as string[],
  },
  
  // Basic: Only safe formatting tags
  BASIC: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
    ALLOWED_ATTR: [] as string[],
  },
  
  // Rich: More formatting options for descriptions
  RICH: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: [] as string[],
  },
};

/**
 * Sanitize a single string value
 */
export function sanitizeString(
  value: string,
  profile: typeof SanitizationProfiles[keyof typeof SanitizationProfiles] = SanitizationProfiles.STRICT
): string {
  if (typeof value !== 'string') {
    return value;
  }
  
  const sanitized = purify.sanitize(value, profile);
  
  // Log if content was modified (potential XSS attempt)
  if (sanitized !== value) {
    logger.warn('Content sanitized (potential XSS attempt)', {
      original: value.substring(0, 100),
      sanitized: sanitized.substring(0, 100),
    });
  }
  
  return sanitized;
}

/**
 * Recursively sanitize an object
 */
export function sanitizeObject(
  obj: any,
  profile: typeof SanitizationProfiles[keyof typeof SanitizationProfiles] = SanitizationProfiles.STRICT
): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj, profile);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, profile));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key], profile);
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Sanitize recipe data from external sources
 * Uses appropriate profiles for different fields
 */
export function sanitizeRecipeData(recipe: any): any {
  return {
    ...recipe,
    // Strict sanitization for titles and names
    title: sanitizeString(recipe.title, SanitizationProfiles.STRICT),
    cuisineType: recipe.cuisineType ? sanitizeString(recipe.cuisineType, SanitizationProfiles.STRICT) : undefined,
    
    // Basic formatting allowed for descriptions
    description: recipe.description ? sanitizeString(recipe.description, SanitizationProfiles.BASIC) : undefined,
    
    // Strict for instructions (array of strings)
    instructions: Array.isArray(recipe.instructions)
      ? recipe.instructions.map((inst: string) => sanitizeString(inst, SanitizationProfiles.STRICT))
      : recipe.instructions,
    
    // Sanitize ingredients
    ingredients: Array.isArray(recipe.ingredients)
      ? recipe.ingredients.map((ing: any) => ({
          ...ing,
          name: sanitizeString(ing.name, SanitizationProfiles.STRICT),
          unit: sanitizeString(ing.unit, SanitizationProfiles.STRICT),
          notes: ing.notes ? sanitizeString(ing.notes, SanitizationProfiles.STRICT) : undefined,
        }))
      : recipe.ingredients,
    
    // Sanitize nutrition info if present
    nutritionInfo: recipe.nutritionInfo ? sanitizeObject(recipe.nutritionInfo, SanitizationProfiles.STRICT) : undefined,
    
    // URL validation (not sanitization, but important)
    sourceUrl: recipe.sourceUrl ? sanitizeUrl(recipe.sourceUrl) : undefined,
    imageUrl: recipe.imageUrl ? sanitizeUrl(recipe.imageUrl) : undefined,
  };
}

/**
 * Validate and sanitize URLs
 * Ensures URLs are safe and use allowed protocols
 */
export function sanitizeUrl(url: string): string | undefined {
  if (!url || typeof url !== 'string') {
    return undefined;
  }
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      logger.warn('Blocked non-HTTP(S) URL', { url: url.substring(0, 100) });
      return undefined;
    }
    
    // Block localhost and private IPs (SSRF protection)
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.20.') ||
      hostname.startsWith('172.21.') ||
      hostname.startsWith('172.22.') ||
      hostname.startsWith('172.23.') ||
      hostname.startsWith('172.24.') ||
      hostname.startsWith('172.25.') ||
      hostname.startsWith('172.26.') ||
      hostname.startsWith('172.27.') ||
      hostname.startsWith('172.28.') ||
      hostname.startsWith('172.29.') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.')
    ) {
      logger.warn('Blocked private/local URL (SSRF protection)', { url: url.substring(0, 100) });
      return undefined;
    }
    
    return parsed.toString();
  } catch (error) {
    logger.warn('Invalid URL format', { url: url.substring(0, 100) });
    return undefined;
  }
}

/**
 * Middleware to sanitize request body
 */
export function sanitizeRequestBody(profile: typeof SanitizationProfiles[keyof typeof SanitizationProfiles] = SanitizationProfiles.STRICT) {
  return (req: any, _res: any, next: any) => {
    if (req.body) {
      req.body = sanitizeObject(req.body, profile);
    }
    next();
  };
}

export default {
  sanitizeString,
  sanitizeObject,
  sanitizeRecipeData,
  sanitizeUrl,
  sanitizeRequestBody,
  SanitizationProfiles,
};

// Made with Bob