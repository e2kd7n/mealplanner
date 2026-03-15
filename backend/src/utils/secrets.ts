/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */


import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from './logger';

/**
 * Secrets Management Utility - Enhanced Security Edition
 * 
 * This module provides secure access to secrets stored in Docker secrets files
 * or environment variables. It follows the principle of least privilege and
 * provides fallback mechanisms for different deployment scenarios.
 * 
 * Security Features:
 * - Path traversal protection (CWE-22 mitigation)
 * - Secret strength validation
 * - Secret rotation support with versioning
 * - Integrity verification with checksums
 * - Expiration tracking and warnings
 * - Secure audit logging
 * - Memory-safe caching with TTL
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface SecretConfig {
  name: string;
  envVar?: string;
  required?: boolean;
  defaultValue?: string;
}

interface VersionedSecret {
  current: string;
  previous?: string;
  version: number;
  rotatedAt?: Date;
}

interface SecretMetadata {
  createdAt: Date;
  expiresAt?: Date;
  rotationDue?: Date;
  algorithm?: string;
  length?: number;
}

interface SecretValidationRules {
  minLength?: number;
  maxLength?: number;
  requireAlphanumeric?: boolean;
  entropyThreshold?: number;
}

interface SecretAccessLog {
  secretName: string;
  timestamp: Date;
  source: 'docker' | 'file' | 'env' | 'default';
  success: boolean;
  error?: string;
}

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  toString(): string;
}

interface RedisConfig {
  host: string;
  port: number;
  password: string;
  toString(): string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Allowed secret file locations (regex patterns)
 * These patterns define where secret files can be read from
 */
const ALLOWED_SECRET_PATTERNS = [
  /^\/run\/secrets\//,           // Docker secrets (standard location)
  /^\/app\/secrets\//,            // Application secrets directory
  new RegExp(`^${path.resolve(process.cwd(), 'secrets').replace(/\\/g, '\\\\')}/`), // Local secrets directory
];

/**
 * Allow environment variable fallback (disabled in production by default)
 */
const ALLOW_ENV_FALLBACK = process.env.ALLOW_SECRET_ENV_FALLBACK === 'true' || 
                           process.env.NODE_ENV === 'development';

/**
 * Secret expiration settings
 */
const SECRET_ROTATION_WARNING = 75 * 24 * 60 * 60 * 1000; // 75 days

/**
 * Cache TTL for secrets (5 minutes)
 */
const SECRET_CACHE_TTL = 5 * 60 * 1000;

/**
 * Enable audit logging
 */
const ENABLE_AUDIT_LOG = process.env.ENABLE_SECRET_AUDIT_LOG === 'true';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Secret cache with TTL
 */
const secretCache = new Map<string, { value: string; timestamp: number }>();

/**
 * Versioned secret cache
 */
const versionedSecretCache = new Map<string, VersionedSecret>();

/**
 * Access logs for audit trail
 */
const accessLogs: SecretAccessLog[] = [];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate Shannon entropy of a string
 */
function calculateEntropy(str: string): number {
  const freq: Record<string, number> = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  
  let entropy = 0;
  const len = str.length;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
}

/**
 * Validate secret strength
 */
function validateSecretStrength(
  secret: string,
  secretName: string,
  rules: SecretValidationRules = {}
): void {
  const {
    minLength = 32,
    maxLength = 256,
    requireAlphanumeric = true,
    entropyThreshold = 3.5
  } = rules;

  // Length check
  if (secret.length < minLength) {
    throw new Error(
      `Secret '${secretName}' is too short (${secret.length} chars, minimum ${minLength})`
    );
  }

  if (secret.length > maxLength) {
    throw new Error(
      `Secret '${secretName}' is too long (${secret.length} chars, maximum ${maxLength})`
    );
  }

  // Alphanumeric check
  if (requireAlphanumeric && !/[a-zA-Z]/.test(secret) && !/[0-9]/.test(secret)) {
    throw new Error(`Secret '${secretName}' must contain alphanumeric characters`);
  }

  // Shannon entropy check
  const entropy = calculateEntropy(secret);
  if (entropy < entropyThreshold) {
    logger.warn(
      `Secret '${secretName}' has low entropy (${entropy.toFixed(2)}), consider regenerating`
    );
  }

  // Check against common weak secrets
  const weakSecrets = ['password', 'secret', '12345', 'admin', 'changeme', 'test', 'demo'];
  const lowerSecret = secret.toLowerCase();
  if (weakSecrets.some(weak => lowerSecret.includes(weak))) {
    throw new Error(`Secret '${secretName}' contains common weak patterns`);
  }
}

/**
 * Verify secret integrity using checksum
 */
function verifySecretIntegrity(secretName: string, secret: string, secretPath: string): boolean {
  const checksumPath = `${secretPath}.sha256`;
  
  if (!fs.existsSync(checksumPath)) {
    logger.debug(`No checksum found for secret '${secretName}'`);
    return true; // Assume valid if no checksum
  }

  try {
    const expectedChecksum = fs.readFileSync(checksumPath, 'utf8').trim();
    const actualChecksum = crypto
      .createHash('sha256')
      .update(secret)
      .digest('hex');
    
    if (expectedChecksum !== actualChecksum) {
      logger.error(`Secret '${secretName}' failed integrity check!`);
      return false;
    }
    
    logger.debug(`Secret '${secretName}' integrity verified`);
    return true;
  } catch (error) {
    logger.error(`Failed to verify integrity of secret '${secretName}':`, error);
    return false;
  }
}

/**
 * Check secret expiration and rotation status
 */
function checkSecretExpiration(secretName: string, secretPath: string): void {
  const metadataPath = `${secretPath}.metadata`;
  
  if (!fs.existsSync(metadataPath)) {
    logger.debug(`No metadata found for secret '${secretName}'`);
    return;
  }

  try {
    const metadata: SecretMetadata = JSON.parse(
      fs.readFileSync(metadataPath, 'utf8')
    );
    
    const age = Date.now() - new Date(metadata.createdAt).getTime();
    
    if (metadata.expiresAt && Date.now() > new Date(metadata.expiresAt).getTime()) {
      logger.error(`Secret '${secretName}' has EXPIRED and must be rotated immediately!`);
      throw new Error(`Secret '${secretName}' has expired`);
    }
    
    if (metadata.rotationDue && Date.now() > new Date(metadata.rotationDue).getTime()) {
      logger.warn(`Secret '${secretName}' rotation is OVERDUE`);
    } else if (age > SECRET_ROTATION_WARNING) {
      logger.warn(
        `Secret '${secretName}' is ${Math.floor(age / (24 * 60 * 60 * 1000))} days old and should be rotated soon`
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('expired')) {
      throw error;
    }
    logger.error(`Failed to check expiration for secret '${secretName}':`, error);
  }
}

/**
 * Validate and canonicalize a secret file path
 * 
 * This function provides security against path traversal attacks (CWE-22) by:
 * 1. Resolving the canonical path (follows symlinks)
 * 2. Validating against allowed directory patterns
 * 3. Preventing access to unauthorized files
 * 
 * @param filePath - The file path to validate
 * @returns Canonical path if valid
 * @throws Error if path is invalid or not in allowed locations
 */
function validateSecretPath(filePath: string): string {
  try {
    // Check if file exists before resolving (realpathSync throws if not)
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    // Resolve to canonical path (follows symlinks, resolves .., etc.)
    const canonicalPath = fs.realpathSync(filePath);
    
    // Check against allowed patterns
    const isAllowed = ALLOWED_SECRET_PATTERNS.some(pattern => 
      pattern.test(canonicalPath)
    );
    
    if (!isAllowed) {
      logger.error(`Security: Attempted to read secret from unauthorized location: ${canonicalPath}`);
      throw new Error(`Secret path not in allowed locations: ${maskSecret(canonicalPath)}`);
    }
    
    logger.debug(`Secret path validated: ${maskSecret(canonicalPath)}`);
    return canonicalPath;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid secret path '${maskSecret(filePath)}': ${error.message}`);
    }
    throw error;
  }
}

/**
 * Log secret access for audit trail
 */
function logSecretAccess(log: SecretAccessLog): void {
  accessLogs.push(log);
  
  // Keep only last 1000 entries in memory
  if (accessLogs.length > 1000) {
    accessLogs.shift();
  }
  
  // Optionally write to secure audit log file
  if (ENABLE_AUDIT_LOG) {
    try {
      const auditLogPath = '/var/log/secrets-audit.log';
      const logEntry = JSON.stringify({
        ...log,
        timestamp: log.timestamp.toISOString(),
      }) + '\n';
      
      fs.appendFileSync(auditLogPath, logEntry, { mode: 0o600 });
    } catch (error) {
      logger.error('Failed to write to audit log:', error);
    }
  }
}

/**
 * Mask secret for logging (shows first and last 4 characters)
 * 
 * @param secret - Secret to mask
 * @returns Masked secret string
 */
export function maskSecret(secret: string): string {
  if (!secret || secret.length < 8) {
    return '****';
  }
  return `${secret.substring(0, 4)}...${secret.substring(secret.length - 4)}`;
}

// ============================================================================
// CORE SECRET LOADING FUNCTIONS
// ============================================================================

/**
 * Read a secret from Docker secrets file or environment variable
 * 
 * Priority order:
 * 1. Docker secret file at /run/secrets/{secretName}
 * 2. Environment variable {SECRET_NAME}_FILE pointing to a file
 * 3. Environment variable {SECRET_NAME} (only if ALLOW_ENV_FALLBACK is true)
 * 4. Default value (if provided and not required)
 * 
 * @param secretName - Name of the secret (e.g., 'postgres_password')
 * @param envVar - Optional environment variable name override
 * @param required - Whether the secret is required (throws if missing)
 * @param defaultValue - Default value if secret not found (only used if not required)
 * @returns The secret value
 * @throws Error if required secret is not found
 */
export function getSecret(
  secretName: string,
  envVar?: string,
  required: boolean = true,
  defaultValue?: string
): string {
  const envVarName = envVar || secretName.toUpperCase();
  let secret: string | null = null;
  let source: SecretAccessLog['source'] = 'docker';
  let secretPath: string | null = null;
  
  try {
    // 1. Try Docker secrets file (standard location)
    const dockerSecretPath = `/run/secrets/${secretName}`;
    if (fs.existsSync(dockerSecretPath)) {
      try {
        secret = fs.readFileSync(dockerSecretPath, 'utf8').trim();
        if (secret) {
          secretPath = dockerSecretPath;
          source = 'docker';
          logger.debug(`Secret '${secretName}' loaded from Docker secrets`);
        }
      } catch (error) {
        logger.warn(`Failed to read Docker secret '${secretName}':`, error);
      }
    }

    // 2. Try environment variable pointing to a file (with path validation)
    if (!secret) {
      const filePathFromEnv = process.env[`${envVarName}_FILE`];
      if (filePathFromEnv) {
        try {
          // Validate path to prevent path traversal attacks (CWE-22)
          const validatedPath = validateSecretPath(filePathFromEnv);
          secret = fs.readFileSync(validatedPath, 'utf8').trim();
          if (secret) {
            secretPath = validatedPath;
            source = 'file';
            logger.debug(`Secret '${secretName}' loaded from file: ${maskSecret(validatedPath)}`);
          }
        } catch (error) {
          logger.warn(`Failed to read secret from file '${maskSecret(filePathFromEnv)}':`, error);
        }
      }
    }

    // 3. Try direct environment variable (only if allowed)
    if (!secret && ALLOW_ENV_FALLBACK) {
      const envValue = process.env[envVarName];
      if (envValue) {
        secret = envValue;
        source = 'env';
        logger.warn(`Secret '${secretName}' loaded from environment variable (not recommended for production)`);
      }
    }

    // 4. Use default value if provided and not required
    if (!secret && !required && defaultValue !== undefined) {
      secret = defaultValue;
      source = 'default';
      logger.debug(`Secret '${secretName}' using default value`);
    }

    // If we have a secret, validate and verify it
    if (secret) {
      // Validate secret strength
      try {
        validateSecretStrength(secret, secretName);
      } catch (error) {
        logger.warn(`Secret validation warning for '${secretName}':`, error);
        // Don't throw, just warn
      }

      // Verify integrity if checksum exists
      if (secretPath) {
        if (!verifySecretIntegrity(secretName, secret, secretPath)) {
          throw new Error(`Secret '${secretName}' failed integrity verification`);
        }

        // Check expiration
        checkSecretExpiration(secretName, secretPath);
      }

      // Log successful access
      logSecretAccess({
        secretName,
        timestamp: new Date(),
        source,
        success: true,
      });

      return secret;
    }

    // Secret not found and is required
    const error = `Required secret '${secretName}' not found. Checked: Docker secrets, ${envVarName}_FILE${ALLOW_ENV_FALLBACK ? `, ${envVarName}` : ''}`;
    logger.error(error);
    
    // Log failed access
    logSecretAccess({
      secretName,
      timestamp: new Date(),
      source: 'docker',
      success: false,
      error,
    });
    
    throw new Error(error);
  } catch (error) {
    // Log failed access
    logSecretAccess({
      secretName,
      timestamp: new Date(),
      source,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Get secret with caching and TTL
 */
export function getSecretCached(
  secretName: string,
  envVar?: string,
  required: boolean = true,
  defaultValue?: string
): string {
  const cacheKey = `${secretName}:${envVar || ''}`;
  const cached = secretCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < SECRET_CACHE_TTL) {
    logger.debug(`Secret '${secretName}' loaded from cache`);
    return cached.value;
  }

  const secret = getSecret(secretName, envVar, required, defaultValue);
  secretCache.set(cacheKey, { value: secret, timestamp: now });
  
  return secret;
}

/**
 * Get versioned secret with rotation support
 */
export function getSecretVersioned(secretName: string): VersionedSecret {
  // Check cache first
  const cached = versionedSecretCache.get(secretName);
  if (cached) {
    return cached;
  }

  const current = getSecret(secretName);
  
  // Try to load previous version for rotation support
  const previousPath = `/run/secrets/${secretName}.previous`;
  let previous: string | undefined;
  if (fs.existsSync(previousPath)) {
    try {
      previous = fs.readFileSync(previousPath, 'utf8').trim();
      logger.info(`Secret '${secretName}' has previous version available for rotation`);
    } catch (error) {
      logger.warn(`Could not load previous version of '${secretName}'`);
    }
  }

  const versioned: VersionedSecret = {
    current,
    previous,
    version: Date.now(),
  };

  versionedSecretCache.set(secretName, versioned);
  return versioned;
}

/**
 * Load multiple secrets at once
 * 
 * @param configs - Array of secret configurations
 * @returns Object with secret names as keys and values
 */
export function loadSecrets(configs: SecretConfig[]): Record<string, string> {
  const secrets: Record<string, string> = {};
  
  for (const config of configs) {
    secrets[config.name] = getSecret(
      config.name,
      config.envVar,
      config.required,
      config.defaultValue
    );
  }
  
  return secrets;
}

/**
 * Validate that all required secrets are available
 * Should be called during application startup
 * 
 * @param secretNames - Array of required secret names
 * @throws Error if any required secret is missing
 */
export function validateSecrets(secretNames: string[]): void {
  const missing: string[] = [];
  
  for (const secretName of secretNames) {
    try {
      getSecret(secretName);
    } catch (error) {
      missing.push(secretName);
    }
  }
  
  if (missing.length > 0) {
    const error = `Missing required secrets: ${missing.join(', ')}`;
    logger.error(error);
    throw new Error(error);
  }
  
  logger.info(`All ${secretNames.length} required secrets validated successfully`);
}

/**
 * Clear secret cache (useful for testing or forced refresh)
 */
export function clearSecretCache(): void {
  secretCache.clear();
  versionedSecretCache.clear();
  logger.info('Secret cache cleared');
}

/**
 * Get secret access logs for audit
 */
export function getSecretAccessLogs(): SecretAccessLog[] {
  return [...accessLogs]; // Return copy
}

// ============================================================================
// DATABASE AND SERVICE CONFIGURATION
// ============================================================================

/**
 * Build database configuration from secrets
 * Returns object instead of URL to prevent password exposure in logs
 * 
 * @returns PostgreSQL connection configuration
 */
export function getDatabaseConfig(): DatabaseConfig {
  const password = getSecretCached('postgres_password', 'POSTGRES_PASSWORD');
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = parseInt(process.env.POSTGRES_PORT || '5432', 10);
  const database = process.env.POSTGRES_DB || 'meal_planner';
  const user = process.env.POSTGRES_USER || 'mealplanner';
  
  return {
    host,
    port,
    database,
    user,
    password,
    // Safe toString that masks password
    toString() {
      return `postgresql://${this.user}:****@${this.host}:${this.port}/${this.database}`;
    }
  };
}

/**
 * Build database URL from secrets (legacy support)
 * 
 * @returns PostgreSQL connection URL
 */
export function getDatabaseUrl(): string {
  const config = getDatabaseConfig();
  return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
}

/**
 * Build Redis configuration from secrets
 * Returns object instead of URL to prevent password exposure in logs
 *
 * @returns Redis connection configuration
 */
export function getRedisConfig(): RedisConfig {
  const password = getSecretCached('redis_password', 'REDIS_PASSWORD');
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  
  return {
    host,
    port,
    password,
    // Safe toString that masks password
    toString() {
      return `redis://:****@${this.host}:${this.port}`;
    }
  };
}

/**
 * Build Redis URL from secrets (legacy support)
 *
 * @returns Redis connection URL
 */
export function getRedisUrl(): string {
  const config = getRedisConfig();
  // URL-encode the password to handle special characters
  const encodedPassword = encodeURIComponent(config.password);
  return `redis://:${encodedPassword}@${config.host}:${config.port}`;
}

/**
 * Get JWT configuration from secrets with caching
 * 
 * @returns JWT configuration object
 */
export function getJwtConfig() {
  return {
    secret: getSecretCached('jwt_secret', 'JWT_SECRET'),
    refreshSecret: getSecretCached('jwt_refresh_secret', 'JWT_REFRESH_SECRET'),
    // Shorter token lifetimes for improved security
    expiresIn: process.env.JWT_EXPIRES_IN || '10m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '1d',
  };
}

/**
 * Get session secret with caching
 * 
 * @returns Session secret string
 */
export function getSessionSecret(): string {
  return getSecretCached('session_secret', 'SESSION_SECRET');
}

/**
 * Check if running in Docker environment
 * 
 * @returns true if running in Docker
 */
export function isDockerEnvironment(): boolean {
  return fs.existsSync('/.dockerenv') || fs.existsSync('/run/secrets');
}

// Export a default configuration loader
export default {
  getSecret,
  getSecretCached,
  getSecretVersioned,
  loadSecrets,
  validateSecrets,
  clearSecretCache,
  getSecretAccessLogs,
  getDatabaseConfig,
  getDatabaseUrl,
  getRedisConfig,
  getRedisUrl,
  getJwtConfig,
  getSessionSecret,
  isDockerEnvironment,
  maskSecret,
};

// Made with Bob