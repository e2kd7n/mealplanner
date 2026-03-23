/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */

import { logger } from './logger';

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  defaultValue?: string;
}

const ENV_VARS: EnvVar[] = [
  // Critical - Application will not function without these
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL database connection string',
  },
  {
    name: 'JWT_SECRET',
    required: true,
    description: 'Secret key for signing JWT access tokens',
  },
  {
    name: 'JWT_REFRESH_SECRET',
    required: true,
    description: 'Secret key for signing JWT refresh tokens',
  },
  {
    name: 'SESSION_SECRET',
    required: true,
    description: 'Secret key for session management',
  },
  
  // Important - Application will use defaults but should be configured
  {
    name: 'NODE_ENV',
    required: false,
    description: 'Node environment (development, production, test)',
    defaultValue: 'development',
  },
  {
    name: 'PORT',
    required: false,
    description: 'HTTP port for the server',
    defaultValue: '3000',
  },
  {
    name: 'HOST',
    required: false,
    description: 'Host address to bind to',
    defaultValue: '0.0.0.0',
  },
  {
    name: 'CORS_ORIGIN',
    required: false,
    description: 'Allowed CORS origins (comma-separated)',
    defaultValue: 'http://localhost:5173',
  },
  
  // Optional - Features will be disabled if not provided
  {
    name: 'HTTPS_PORT',
    required: false,
    description: 'HTTPS port for the server (if USE_HTTPS is true)',
    defaultValue: '443',
  },
  {
    name: 'USE_HTTPS',
    required: false,
    description: 'Enable HTTPS server',
    defaultValue: 'false',
  },
  {
    name: 'SSL_KEY_PATH',
    required: false,
    description: 'Path to SSL private key file',
    defaultValue: '/app/certs/key.pem',
  },
  {
    name: 'SSL_CERT_PATH',
    required: false,
    description: 'Path to SSL certificate file',
    defaultValue: '/app/certs/cert.pem',
  },
];

/**
 * Validates that all required environment variables are set
 * Exits the process with error code 1 if validation fails
 */
export function validateEnvironment(): void {
  logger.info('Validating environment variables...');
  
  const missing: EnvVar[] = [];
  const warnings: EnvVar[] = [];
  
  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];
    
    if (!value || value.trim() === '') {
      if (envVar.required) {
        missing.push(envVar);
      } else if (!envVar.defaultValue) {
        warnings.push(envVar);
      }
    }
  }
  
  // Log warnings for optional variables
  if (warnings.length > 0) {
    logger.warn('Optional environment variables not set:');
    warnings.forEach(envVar => {
      logger.warn(`  - ${envVar.name}: ${envVar.description}`);
    });
  }
  
  // Exit if required variables are missing
  if (missing.length > 0) {
    logger.error('❌ ENVIRONMENT VALIDATION FAILED');
    logger.error('');
    logger.error('The following required environment variables are missing:');
    logger.error('');
    
    missing.forEach(envVar => {
      logger.error(`  ❌ ${envVar.name}`);
      logger.error(`     ${envVar.description}`);
      logger.error('');
    });
    
    logger.error('Please set these environment variables and restart the application.');
    logger.error('');
    logger.error('For Docker/Podman deployments:');
    logger.error('  - Ensure secrets are properly mounted');
    logger.error('  - Check docker-entrypoint.sh constructs DATABASE_URL correctly');
    logger.error('  - Verify secret files exist in ./secrets/ directory');
    logger.error('');
    logger.error('For local development:');
    logger.error('  - Copy .env.example to .env');
    logger.error('  - Fill in all required values');
    logger.error('  - Run: npm run dev');
    logger.error('');
    
    process.exit(1);
  }
  
  // Log success
  logger.info('✅ Environment validation passed');
  
  // Log configuration summary
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = process.env.PORT || '3000';
  const useHttps = process.env.USE_HTTPS === 'true';
  
  logger.info('Configuration:');
  logger.info(`  - Environment: ${nodeEnv}`);
  logger.info(`  - Port: ${port}`);
  logger.info(`  - HTTPS: ${useHttps ? 'enabled' : 'disabled'}`);
  logger.info(`  - CORS Origins: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
}

/**
 * Gets an environment variable value with a default fallback
 */
export function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value;
}

/**
 * Gets an environment variable as a boolean
 */
export function getEnvBoolean(name: string, defaultValue: boolean = false): boolean {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    return defaultValue;
  }
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Gets an environment variable as a number
 */
export function getEnvNumber(name: string, defaultValue?: number): number {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${name} must be a valid number, got: ${value}`);
  }
  return num;
}

// Made with Bob