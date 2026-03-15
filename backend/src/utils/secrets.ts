import fs from 'fs';
import path from 'path';
import { logger } from './logger';

/**
 * Secrets Management Utility
 * 
 * This module provides secure access to secrets stored in Docker secrets files
 * or environment variables. It follows the principle of least privilege and
 * provides fallback mechanisms for different deployment scenarios.
 */

interface SecretConfig {
  name: string;
  envVar?: string;
  required?: boolean;
  defaultValue?: string;
}

/**
 * Read a secret from Docker secrets file or environment variable
 * 
 * Priority order:
 * 1. Docker secret file at /run/secrets/{secretName}
 * 2. Environment variable {SECRET_NAME}_FILE pointing to a file
 * 3. Environment variable {SECRET_NAME}
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
  
  // 1. Try Docker secrets file (standard location)
  const dockerSecretPath = `/run/secrets/${secretName}`;
  if (fs.existsSync(dockerSecretPath)) {
    try {
      const secret = fs.readFileSync(dockerSecretPath, 'utf8').trim();
      if (secret) {
        logger.debug(`Secret '${secretName}' loaded from Docker secrets`);
        return secret;
      }
    } catch (error) {
      logger.warn(`Failed to read Docker secret '${secretName}':`, error);
    }
  }

  // 2. Try environment variable pointing to a file
  const filePathFromEnv = process.env[`${envVarName}_FILE`];
  if (filePathFromEnv && fs.existsSync(filePathFromEnv)) {
    try {
      const secret = fs.readFileSync(filePathFromEnv, 'utf8').trim();
      if (secret) {
        logger.debug(`Secret '${secretName}' loaded from file: ${filePathFromEnv}`);
        return secret;
      }
    } catch (error) {
      logger.warn(`Failed to read secret from file '${filePathFromEnv}':`, error);
    }
  }

  // 3. Try direct environment variable
  const envValue = process.env[envVarName];
  if (envValue) {
    logger.debug(`Secret '${secretName}' loaded from environment variable`);
    return envValue;
  }

  // 4. Use default value if provided and not required
  if (!required && defaultValue !== undefined) {
    logger.debug(`Secret '${secretName}' using default value`);
    return defaultValue;
  }

  // Secret not found and is required
  const error = `Required secret '${secretName}' not found. Checked: Docker secrets, ${envVarName}_FILE, ${envVarName}`;
  logger.error(error);
  throw new Error(error);
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
 * Build database URL from secrets
 * 
 * @returns PostgreSQL connection URL
 */
export function getDatabaseUrl(): string {
  const password = getSecret('postgres_password', 'POSTGRES_PASSWORD');
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = process.env.POSTGRES_PORT || '5432';
  const database = process.env.POSTGRES_DB || 'meal_planner';
  const user = process.env.POSTGRES_USER || 'mealplanner';
  
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

/**
 * Build Redis URL from secrets
 * 
 * @returns Redis connection URL
 */
export function getRedisUrl(): string {
  const password = getSecret('redis_password', 'REDIS_PASSWORD');
  const host = process.env.REDIS_HOST || 'localhost';
  const port = process.env.REDIS_PORT || '6379';
  
  return `redis://:${password}@${host}:${port}`;
}

/**
 * Get JWT configuration from secrets
 * 
 * @returns JWT configuration object
 */
export function getJwtConfig() {
  return {
    secret: getSecret('jwt_secret', 'JWT_SECRET'),
    refreshSecret: getSecret('jwt_refresh_secret', 'JWT_REFRESH_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  };
}

/**
 * Get session secret
 * 
 * @returns Session secret string
 */
export function getSessionSecret(): string {
  return getSecret('session_secret', 'SESSION_SECRET');
}

/**
 * Check if running in Docker environment
 * 
 * @returns true if running in Docker
 */
export function isDockerEnvironment(): boolean {
  return fs.existsSync('/.dockerenv') || fs.existsSync('/run/secrets');
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

// Export a default configuration loader
export default {
  getSecret,
  loadSecrets,
  validateSecrets,
  getDatabaseUrl,
  getRedisUrl,
  getJwtConfig,
  getSessionSecret,
  isDockerEnvironment,
  maskSecret,
};

// Made with Bob